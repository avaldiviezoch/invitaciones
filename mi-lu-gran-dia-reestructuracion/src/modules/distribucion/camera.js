export function setupDistributionCamera(root, world, worldSize) {
  const viewport = root.querySelector('[data-distribution-viewport]');
  const MOBILE_QUERY = '(max-width: 700px)';
  const MAX_PINCH_MULTIPLIER = 4;
  const touchPoints = new Map();
  let scale = 1;
  let fitScale = 1;
  let x = 0;
  let y = 0;
  let resizeFrame = 0;
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  const centerWorld = () => {
    const rect = viewport.getBoundingClientRect();
    x = Math.round((rect.width - worldSize.width * scale) / 2);
    y = Math.round((rect.height - worldSize.height * scale) / 2);
  };

  const apply = () => {
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  };

  const fit = () => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / Math.max(1, worldSize.width);
    const scaleY = rect.height / Math.max(1, worldSize.height);
    fitScale = Math.max(scaleX, scaleY);
    scale = fitScale;
    centerWorld();
    apply();
  };

  const scheduleFit = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      fit();
    });
  };

  const touchDistance = () => {
    const points = [...touchPoints.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const beginPinch = () => {
    if (!isMobile() || touchPoints.size !== 2) return;
    pinchStartDistance = touchDistance();
    pinchStartScale = scale;
  };

  const handlePointerDown = (event) => {
    if (!isMobile() || event.pointerType !== 'touch') return;
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPoints.size === 2) beginPinch();
  };

  const handlePointerMove = (event) => {
    if (!isMobile() || event.pointerType !== 'touch' || !touchPoints.has(event.pointerId)) return;
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPoints.size !== 2 || !pinchStartDistance) return;

    event.preventDefault();
    const distance = touchDistance();
    if (!distance) return;

    const nextScale = pinchStartScale * (distance / pinchStartDistance);
    scale = Math.max(fitScale, Math.min(fitScale * MAX_PINCH_MULTIPLIER, nextScale));
    centerWorld();
    apply();
  };

  const handlePointerEnd = (event) => {
    if (event.pointerType !== 'touch') return;
    touchPoints.delete(event.pointerId);
    if (touchPoints.size < 2) {
      pinchStartDistance = 0;
      pinchStartScale = scale;
    }
  };

  viewport.addEventListener('pointerdown', handlePointerDown);
  viewport.addEventListener('pointermove', handlePointerMove, { passive: false });
  viewport.addEventListener('pointerup', handlePointerEnd);
  viewport.addEventListener('pointercancel', handlePointerEnd);

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(scheduleFit)
    : null;

  resizeObserver?.observe(viewport);
  window.addEventListener('resize', scheduleFit);
  scheduleFit();

  return {
    fit,
    destroy: () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleFit);
      viewport.removeEventListener('pointerdown', handlePointerDown);
      viewport.removeEventListener('pointermove', handlePointerMove);
      viewport.removeEventListener('pointerup', handlePointerEnd);
      viewport.removeEventListener('pointercancel', handlePointerEnd);
      touchPoints.clear();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
    },
    clientDeltaToWorld: (delta) => delta / scale,
    clientPointToWorld: (clientX, clientY) => {
      const rect = viewport.getBoundingClientRect();
      return {
        x: (clientX - rect.left - x) / scale,
        y: (clientY - rect.top - y) / scale
      };
    },
    focusNode: () => {}
  };
}

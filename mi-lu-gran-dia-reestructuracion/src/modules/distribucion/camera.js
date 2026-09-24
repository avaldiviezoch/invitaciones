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
  let panGesture = null;
  let pinchGesture = null;

  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
  const isInteractiveTarget = (target) => Boolean(target?.closest?.('.distribution-table,.distribution-element'));

  const viewportRect = () => viewport.getBoundingClientRect();

  const clampCamera = () => {
    const rect = viewportRect();
    const scaledWidth = worldSize.width * scale;
    const scaledHeight = worldSize.height * scale;

    if (scaledWidth <= rect.width) x = Math.round((rect.width - scaledWidth) / 2);
    else x = Math.min(0, Math.max(rect.width - scaledWidth, x));

    if (scaledHeight <= rect.height) y = Math.round((rect.height - scaledHeight) / 2);
    else y = Math.min(0, Math.max(rect.height - scaledHeight, y));
  };

  const apply = () => {
    clampCamera();
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  };

  const fit = () => {
    const rect = viewportRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / Math.max(1, worldSize.width);
    const scaleY = rect.height / Math.max(1, worldSize.height);
    fitScale = Math.max(scaleX, scaleY);
    scale = fitScale;
    x = Math.round((rect.width - worldSize.width * scale) / 2);
    y = Math.round((rect.height - worldSize.height * scale) / 2);
    apply();
  };

  const scheduleFit = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      fit();
    });
  };

  const localPoint = (clientX, clientY) => {
    const rect = viewportRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const touchDistance = () => {
    const points = [...touchPoints.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const touchMidpoint = () => {
    const points = [...touchPoints.values()];
    if (points.length < 2) return null;
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2
    };
  };

  const beginPinch = () => {
    if (!isMobile() || touchPoints.size !== 2) return;
    const midpointClient = touchMidpoint();
    const midpoint = localPoint(midpointClient.x, midpointClient.y);
    const distance = touchDistance();
    if (!distance) return;

    pinchGesture = {
      distance,
      scale,
      anchorWorldX: (midpoint.x - x) / scale,
      anchorWorldY: (midpoint.y - y) / scale
    };
    panGesture = null;
  };

  const handlePointerDown = (event) => {
    if (!isMobile() || event.pointerType !== 'touch') return;

    touchPoints.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      interactive: isInteractiveTarget(event.target)
    });

    if (touchPoints.size === 2) {
      beginPinch();
      return;
    }

    if (touchPoints.size === 1 && !isInteractiveTarget(event.target)) {
      panGesture = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        x,
        y
      };
    }
  };

  const handlePointerMove = (event) => {
    if (!isMobile() || event.pointerType !== 'touch' || !touchPoints.has(event.pointerId)) return;

    const previous = touchPoints.get(event.pointerId);
    touchPoints.set(event.pointerId, {
      ...previous,
      x: event.clientX,
      y: event.clientY
    });

    if (touchPoints.size === 2 && pinchGesture) {
      event.preventDefault();
      const distance = touchDistance();
      const midpointClient = touchMidpoint();
      if (!distance || !midpointClient) return;

      const midpoint = localPoint(midpointClient.x, midpointClient.y);
      scale = Math.max(
        fitScale,
        Math.min(fitScale * MAX_PINCH_MULTIPLIER, pinchGesture.scale * (distance / pinchGesture.distance))
      );
      x = midpoint.x - pinchGesture.anchorWorldX * scale;
      y = midpoint.y - pinchGesture.anchorWorldY * scale;
      apply();
      return;
    }

    if (
      touchPoints.size === 1 &&
      panGesture &&
      panGesture.pointerId === event.pointerId &&
      !previous.interactive
    ) {
      event.preventDefault();
      x = panGesture.x + (event.clientX - panGesture.clientX);
      y = panGesture.y + (event.clientY - panGesture.clientY);
      apply();
    }
  };

  const handlePointerEnd = (event) => {
    if (event.pointerType !== 'touch') return;
    touchPoints.delete(event.pointerId);

    if (touchPoints.size < 2) pinchGesture = null;
    if (panGesture?.pointerId === event.pointerId || touchPoints.size !== 1) panGesture = null;
  };

  viewport.addEventListener('pointerdown', handlePointerDown, true);
  viewport.addEventListener('pointermove', handlePointerMove, { passive: false, capture: true });
  viewport.addEventListener('pointerup', handlePointerEnd, true);
  viewport.addEventListener('pointercancel', handlePointerEnd, true);

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
      viewport.removeEventListener('pointerdown', handlePointerDown, true);
      viewport.removeEventListener('pointermove', handlePointerMove, true);
      viewport.removeEventListener('pointerup', handlePointerEnd, true);
      viewport.removeEventListener('pointercancel', handlePointerEnd, true);
      touchPoints.clear();
      panGesture = null;
      pinchGesture = null;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
    },
    clientDeltaToWorld: (delta) => delta / scale,
    clientPointToWorld: (clientX, clientY) => {
      const rect = viewportRect();
      return {
        x: (clientX - rect.left - x) / scale,
        y: (clientY - rect.top - y) / scale
      };
    },
    focusNode: () => {}
  };
}

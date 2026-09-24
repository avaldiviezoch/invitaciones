export function setupDistributionCamera(root, world, worldSize) {
  const viewport = root.querySelector('[data-distribution-viewport]');
  let scale = 1;
  let x = 0;
  let y = 0;
  let resizeFrame = 0;

  const apply = () => {
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  };

  const fit = () => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / Math.max(1, worldSize.width);
    const scaleY = rect.height / Math.max(1, worldSize.height);
    scale = Math.max(scaleX, scaleY);
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

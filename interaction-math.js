export function coverCrop(imageWidth, imageHeight, width, height) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  return [(imageWidth - cropWidth) / 2, (imageHeight - cropHeight) / 2, cropWidth, cropHeight];
}

export function revealColumns(progress, width = 720) {
  const t = Math.max(0, Math.min(1, progress));
  return t === 1 ? width : Math.min(width, Math.round(8 * Math.pow(width / 8, t)));
}

export function floatingPreviewPosition(x, y, width, height, viewportWidth, viewportHeight) {
  const margin = 16;
  const preferredX = x - width - 28;
  const nextX = preferredX >= margin ? preferredX : x + 28;
  return {
    x: Math.max(margin, Math.min(viewportWidth - width - margin, nextX)),
    y: Math.max(margin, Math.min(viewportHeight - height - margin, y - height * .42))
  };
}

// Pictures are shrunk in the browser before they are ever uploaded: a phone
// photo is several megabytes, and the server only needs a small copy. Drawing
// the image onto a canvas at a smaller size and exporting it as JPEG does both
// the resize and the compression in one step.

async function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose a picture file (JPEG, PNG or WebP).');
  // createImageBitmap also applies the photo's EXIF rotation, so a portrait
  // photo from a phone does not come out sideways.
  if ('createImageBitmap' in window) return createImageBitmap(file, { imageOrientation: 'from-image' });
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toDataUrl(source, sx, sy, sw, sh, width, height, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // White behind any transparency, since JPEG has none.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/** A square profile photo, cropped from the centre. About 15-30 KB. */
export async function squarePhoto(file, size = 256) {
  const img = await loadImage(file);
  const side = Math.min(img.width, img.height);
  return toDataUrl(img, (img.width - side) / 2, (img.height - side) / 2, side, side, size, size, 0.85);
}

/**
 * Two copies of a receipt photo: a sharper one for reading the text, and a
 * smaller one to keep with the transaction.
 */
export async function receiptPhotos(file) {
  const img = await loadImage(file);
  const fit = (max) => {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    return [Math.round(img.width * scale), Math.round(img.height * scale)];
  };
  const [rw, rh] = fit(1800);
  const [sw, sh] = fit(1000);
  return {
    forReading: toDataUrl(img, 0, 0, img.width, img.height, rw, rh, 0.92),
    forStoring: toDataUrl(img, 0, 0, img.width, img.height, sw, sh, 0.7),
  };
}

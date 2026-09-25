// Pictures - profile photos and receipt photos - arrive as data URLs that the
// browser has already resized and compressed. Keeping them in the document
// they belong to means no file storage to configure, which matters because the
// app has to run on a fresh machine and on Vercel alike. The server still
// checks what it is given: only real image types, and never larger than the
// limit for that kind of picture.

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

/**
 * Returns the image to store, or '' when the picture is being removed.
 * Throws a 400 error the central handler turns into a readable message.
 */
export function cleanImage(value, { maxKb, label }) {
  if (value === null || value === '') return '';
  if (typeof value !== 'string' || !DATA_URL.test(value)) {
    throw badRequest(`${label} must be a JPEG, PNG or WebP image`);
  }
  // Base64 carries 3 bytes in every 4 characters.
  const bytes = Math.floor(((value.length - value.indexOf(',') - 1) * 3) / 4);
  if (bytes > maxKb * 1024) {
    throw badRequest(`${label} is too large (${Math.round(bytes / 1024)} KB, the limit is ${maxKb} KB)`);
  }
  return value;
}

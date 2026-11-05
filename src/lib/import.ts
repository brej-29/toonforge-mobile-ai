export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 40_000_000;
export const MAX_OUTPUT_PIXELS = 1_500_000;

/** Inspect raster headers before invoking the browser's full image decoder. */
export function inspectRaster(bytes: Uint8Array): { width: number; height: number; type: string } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0, height = 0, type = '';
  if (bytes.length >= 24 && bytes[0] === 137 && String.fromCharCode(...bytes.slice(1, 4)) === 'PNG' && view.getUint32(4) === 0x0d0a1a0a && view.getUint32(12) === 0x49484452) {
    width = view.getUint32(16); height = view.getUint32(20); type = 'image/png';
  } else if (bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216) {
    type = 'image/jpeg';
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 7) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
      }
      offset += length;
    }
  } else if (bytes.length >= 30 && view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) {
    type = 'image/webp';
    const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === 'VP8X') {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff;
    } else if (kind === 'VP8L' && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!width || !height) throw new Error('This file could not be read. Choose a JPG, PNG or WebP photo; try re-saving it if it is already one of these formats.');
  if (width * height > MAX_SOURCE_PIXELS || width > 20_000 || height > 20_000) throw new Error('This image is too large to decode safely here. Resize it below 40 megapixels and 20,000 pixels per side, then try again.');
  return { width, height, type };
}

export function outputDimensions(width: number, height: number) {
  const scale = Math.min(1, Math.sqrt(MAX_OUTPUT_PIXELS / (width * height)), 8192 / width, 8192 / height);
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}

export function exportName(name: string, preset: string) {
  const stem = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'my-photo';
  return `${stem}-${preset}.png`;
}

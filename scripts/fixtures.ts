import type { PixelImage } from '../src/lib/processing';

/** Seeded engineering target. It is synthetic, not a photograph or a user study. */
export function makeFixture(seed = 29, size = 512): PixelImage {
  let state = seed >>> 0;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      let base = x < size / 2 ? 90 : 210;
      if (x === Math.floor(size / 4) && y > size * 0.625 && y < size * 0.875) base = 120;
      const value = base + Math.floor(random() * 33) - 16;
      data[index] = data[index + 1] = data[index + 2] = value;
      data[index + 3] = y > size - 32 && x > size - 32 ? (x + y) % 256 : 255;
    }
  }
  return { data, width: size, height: size };
}

export function regionStandardDeviation(image: PixelImage, x0 = 32, y0 = 32, x1 = 224, y1 = 224) {
  let sum = 0, squares = 0, count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const value = image.data[(y * image.width + x) * 4];
      sum += value;
      squares += value * value;
      count++;
    }
  }
  return Math.sqrt(Math.max(0, squares / count - (sum / count) ** 2));
}

export function stepContrast(image: PixelImage) {
  let total = 0;
  for (let y = 32; y < 224; y++) {
    total += image.data[(y * image.width + 257) * 4] - image.data[(y * image.width + 254) * 4];
  }
  return total / 192;
}

export function lineContrast(image: PixelImage) {
  let total = 0;
  for (let y = 336; y < 432; y++) {
    const offset = y * image.width;
    total += image.data[(offset + 128) * 4] -
      (image.data[(offset + 120) * 4] + image.data[(offset + 136) * 4]) / 2;
  }
  return total / 96;
}

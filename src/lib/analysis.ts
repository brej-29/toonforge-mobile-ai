import type { PixelImage, ProcessingOptions } from './processing';

export interface ImageAnalysis {
  histogram: number[];
  mean: number;
  contrast: number;
  edgeDensity: number;
  transparent: number;
  recommendation: ProcessingOptions;
  advice: string;
}

/** Alpha-weighted luminance histogram and finite-difference edges. No semantic/face inference. */
export function analyzeImage(image: PixelImage): ImageAnalysis {
  const { width, height, data } = image;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width * height > 4_000_000 || data.length !== width * height * 4) throw new Error('Invalid analysis image.');
  const histogram = Array<number>(32).fill(0);
  const gray = new Float32Array(width * height);
  let sum = 0, square = 0, weight = 0, edges = 0, pairs = 0;
  for (let i = 0; i < gray.length; i++) {
    const b = i * 4, alpha = data[b + 3] / 255;
    const value = .2126 * data[b] + .7152 * data[b + 1] + .0722 * data[b + 2];
    gray[i] = value;
    histogram[Math.min(31, Math.floor(value / 8))] += alpha;
    weight += alpha; sum += value * alpha; square += value * value * alpha;
    if (alpha === 0) continue;
    for (const n of [i % width ? i - 1 : -1, i >= width ? i - width : -1]) {
      if (n < 0 || data[n * 4 + 3] === 0) continue;
      pairs++; if (Math.abs(value - gray[n]) > 24) edges++;
    }
  }
  const mean = weight ? sum / weight : 255;
  const contrast = weight ? Math.sqrt(Math.max(0, square / weight - mean * mean)) : 0;
  const edgeDensity = pairs ? edges / pairs : 0;
  const busy = edgeDensity > .16;
  return {
    histogram, mean, contrast, edgeDensity, transparent: 1 - weight / (width * height),
    recommendation: { preset: 'soft-print', detail: busy ? 30 : 55, ink: contrast < 35 ? 25 : 40, colors: contrast < 35 ? 9 : 7 },
    advice: !weight ? 'This image is fully transparent. Choose a photo with visible pixels.' : busy
      ? 'Lots of fine transitions. Start with less texture and inspect small details before printing.'
      : contrast < 35 ? 'A narrow tonal range. More tone levels can keep gentle shading from disappearing.'
      : 'A broad tonal range. Start with a soft print, then tune the outlines to suit your subject.',
  };
}

import { PRESETS, type PresetId } from './presets';

export interface PixelImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface ProcessingOptions {
  preset: PresetId;
  /** Higher detail retains more fine texture. */
  detail: number;
  /** Outline strength, from 0 to 100. */
  ink: number;
  /** Tonal levels per channel; not a total palette size. */
  colors?: number;
}

export interface ProcessingMetrics {
  processingMs: number;
  /** Fraction of visible pixels over the outline threshold, 0..1. */
  edgeCoverage: number;
  meanLuminance: number;
  /** Average darkness on white, 0..1. A screen proxy, not printer ink use. */
  estimatedInkCoverage: number;
}

export interface ProcessedImage extends PixelImage {
  metrics: ProcessingMetrics;
}

export const MAX_PIXELS = 4_000_000;
const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function validate(image: PixelImage, options: ProcessingOptions) {
  const { width, height, data } = image;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width > 8192 || height > 8192 || width * height > MAX_PIXELS) {
    throw new Error('Image dimensions must be positive integers within the 4 megapixel limit.');
  }
  if (!(data instanceof Uint8ClampedArray) || data.length !== width * height * 4) {
    throw new Error('The image buffer must contain exactly four RGBA bytes per pixel.');
  }
  const preset = PRESETS.find((entry) => entry.id === options.preset);
  if (!preset) throw new Error('Choose a supported print style.');
  for (const key of ['detail', 'ink'] as const) {
    if (!Number.isFinite(options[key]) || options[key] < 0 || options[key] > 100) {
      throw new Error(`${key} must be a number from 0 to 100.`);
    }
  }
  const levels = options.colors ?? preset.levels;
  if (!Number.isInteger(levels) || levels < 3 || levels > 12) {
    throw new Error('Tone levels must be an integer from 3 to 12.');
  }
  return levels;
}

/** Separable, range-weighted smoothing; transparent neighbors cannot bleed into visible pixels. */
function smooth(image: PixelImage, detail: number, kind: 'edge-aware' | 'box') {
  const { width, height } = image;
  let source = image.data;
  const sigma = 40 - detail * 0.16;
  const rangeWeights = new Float32Array(256);
  for (let difference = 0; difference < 256; difference++) {
    rangeWeights[difference] = kind === 'box' ? 1 : Math.exp(-(difference * difference) / (2 * sigma * sigma));
  }
  const spatialWeights = kind === 'box' ? [1, 1, 1, 1] : [1, 0.82, 0.5, 0.23];
  for (let pass = 0; pass < 4; pass++) {
    const horizontal = pass % 2 === 0;
    const target = new Uint8ClampedArray(source.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const center = (y * width + x) * 4;
        let r = 0, g = 0, b = 0, weightSum = 0;
        for (let offset = -3; offset <= 3; offset++) {
          const nx = horizontal ? Math.min(width - 1, Math.max(0, x + offset)) : x;
          const ny = horizontal ? y : Math.min(height - 1, Math.max(0, y + offset));
          const neighbor = (ny * width + nx) * 4;
          const difference = Math.max(
            Math.abs(source[center] - source[neighbor]),
            Math.abs(source[center + 1] - source[neighbor + 1]),
            Math.abs(source[center + 2] - source[neighbor + 2]),
          );
          const weight = spatialWeights[Math.abs(offset)] * rangeWeights[difference] * (source[neighbor + 3] / 255);
          r += source[neighbor] * weight;
          g += source[neighbor + 1] * weight;
          b += source[neighbor + 2] * weight;
          weightSum += weight;
        }
        target[center] = weightSum ? r / weightSum : source[center];
        target[center + 1] = weightSum ? g / weightSum : source[center + 1];
        target[center + 2] = weightSum ? b / weightSum : source[center + 2];
        target[center + 3] = image.data[center + 3];
      }
    }
    source = target;
  }
  return source;
}

function render(image: PixelImage, options: ProcessingOptions, smoothing: 'edge-aware' | 'box' | 'none'): ProcessedImage {
  const start = performance.now();
  const levels = validate(image, options);
  const { width, height } = image;
  const filtered = smoothing === 'none' ? image.data : smooth(image, options.detail, smoothing);
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = luminance(filtered[i * 4], filtered[i * 4 + 1], filtered[i * 4 + 2]);
  }
  const result = new Uint8ClampedArray(filtered.length);
  const step = 255 / (levels - 1);
  const threshold = 30 - options.detail * 0.16;
  const outlineStrength = options.ink / 100;
  let edgeCount = 0, visibleCount = 0, luminanceSum = 0, alphaSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const byte = index * 4;
      const left = Math.max(0, x - 1), right = Math.min(width - 1, x + 1);
      const top = Math.max(0, y - 1) * width, middle = y * width, bottom = Math.min(height - 1, y + 1) * width;
      const gx = -gray[top + left] + gray[top + right] - 2 * gray[middle + left] +
        2 * gray[middle + right] - gray[bottom + left] + gray[bottom + right];
      const gy = -gray[top + left] - 2 * gray[top + x] - gray[top + right] +
        gray[bottom + left] + 2 * gray[bottom + x] + gray[bottom + right];
      const magnitude = Math.sqrt(gx * gx + gy * gy) / 4;
      const ramp = Math.min(1, Math.max(0, (magnitude - threshold) / 34));
      const darkness = 1 - ramp * ramp * (3 - 2 * ramp) * outlineStrength * 0.92;
      for (let channel = 0; channel < 3; channel++) {
        const value = options.preset === 'mono-ink' ? gray[index] : filtered[byte + channel];
        result[byte + channel] = Math.round(value / step) * step * darkness;
      }
      const alpha = image.data[byte + 3];
      result[byte + 3] = alpha;
      if (alpha > 0) {
        visibleCount++;
        if (magnitude > threshold) edgeCount++;
      }
      const opacity = alpha / 255;
      alphaSum += opacity;
      luminanceSum += luminance(result[byte], result[byte + 1], result[byte + 2]) * opacity;
    }
  }
  const meanLuminance = alphaSum ? luminanceSum / alphaSum : 255;
  return {
    data: result,
    width,
    height,
    metrics: {
      processingMs: performance.now() - start,
      edgeCoverage: visibleCount ? edgeCount / visibleCount : 0,
      meanLuminance,
      estimatedInkCoverage: (1 - meanLuminance / 255) * (alphaSum / (width * height)),
    },
  };
}

/** The production engine is synchronous and pure except for elapsed-time measurement. Run in a worker. */
export function processImage(image: PixelImage, options: ProcessingOptions): ProcessedImage {
  return render(image, options, 'edge-aware');
}

/** Controlled alternatives for the reproducible experiment. */
export function processBaseline(image: PixelImage, options: ProcessingOptions, kind: 'posterize' | 'box'): ProcessedImage {
  return render(image, options, kind === 'posterize' ? 'none' : 'box');
}

import { processImage, type PixelImage, type ProcessingOptions } from './lib/processing';
import { analyzeImage } from './lib/analysis';
self.onmessage = (event: MessageEvent<{ id: number; image: PixelImage; options: ProcessingOptions }>) => {
  const { id, image, options } = event.data;
  try {
    const result = processImage(image, options);
    const analysis = analyzeImage(image);
    self.postMessage({ id, result, analysis }, { transfer: [result.data.buffer] });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'The photo could not be processed.' });
  }
};

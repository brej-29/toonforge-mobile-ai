import { processImage, type PixelImage, type ProcessingOptions } from './lib/processing';
self.onmessage = (event: MessageEvent<{ id: number; image: PixelImage; options: ProcessingOptions }>) => {
  const { id, image, options } = event.data;
  try {
    const result = processImage(image, options);
    self.postMessage({ id, result }, { transfer: [result.data.buffer] });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'The photo could not be processed.' });
  }
};

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectRaster, outputDimensions, exportName } from '../src/lib/import';
function png(width: number, height: number) {
  const bytes = new Uint8Array(24); bytes.set([137,80,78,71,13,10,26,10]); bytes.set([73,72,68,82],12);
  const view = new DataView(bytes.buffer); view.setUint32(16,width); view.setUint32(20,height); return bytes;
}
test('rejects unsupported text and decompression-sized rasters before decode', () => {
  assert.throws(() => inspectRaster(new TextEncoder().encode('<svg></svg>')));
  assert.throws(() => inspectRaster(png(20_000,20_000)), /too large/);
  assert.deepEqual(inspectRaster(png(640,480)), { width:640, height:480, type:'image/png' });
});
test('exports never upscale and remain within the working pixel budget', () => {
  assert.deepEqual(outputDimensions(100,80), {width:100,height:80});
  const size = outputDimensions(8000,4000); assert.ok(size.width*size.height <= 1_500_000);
  assert.ok(Math.abs(size.width / size.height - 2) < .003);
  assert.ok(outputDimensions(20_000,1).width <= 8192);
});
test('download names remove control characters, paths and excessive length', () => {
  assert.equal(exportName('../../my photo.jpg','mono-ink'),'my-photo-mono-ink.png');
  assert.ok(exportName('a'.repeat(300)+'.jpg','soft-print').length < 90);
});

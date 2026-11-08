import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { PRESETS } from '../src/lib/presets';
import { analyzeImage } from '../src/lib/analysis';
import { processImage, type PixelImage } from '../src/lib/processing';
import { validateOptions, planLocalEdit } from '../src/lib/recipes';

const rootIndex = process.argv.indexOf('--root');
if (rootIndex < 0 || !process.argv[rootIndex + 1]) throw new Error('Choose a working directory: npm run mcp -- --root /absolute/path/to/images');
const root = await realpath(path.resolve(process.argv[rootIndex + 1]));
if (!(await stat(root)).isDirectory()) throw new Error('The working root must be a directory.');
function withinRoot(target: string) {
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Paths must stay inside the configured working directory.');
  return target;
}
async function readPNG(input: string): Promise<PixelImage> {
  const target = withinRoot(await realpath(path.resolve(root, input)));
  const info = await stat(target);
  if (!info.isFile() || info.size > 20 * 1024 * 1024) throw new Error('Choose a PNG file up to 20 MiB.');
  const bytes = await readFile(target);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.subarray(12, 16).toString() !== 'IHDR') throw new Error('MCP supports PNG input only. Export JPG/WebP to PNG in the studio first.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (!width || !height || width > 8192 || height > 8192 || width * height > 4_000_000) throw new Error('PNG dimensions exceed the 4 megapixel or 8192-pixel side limit.');
  const decoded = PNG.sync.read(bytes, { checkCRC: true });
  return { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };
}
const optionsShape = {
  preset: z.enum(['soft-print', 'graphic-novel', 'mono-ink']),
  detail: z.number().min(0).max(100), ink: z.number().min(0).max(100), colors: z.number().int().min(3).max(12),
};
const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
const server = new McpServer({ name: 'toonforge-local', version: '2.1.0' }, {
  instructions: 'Local classical image filters, not generative image editing. Read PNGs only within the configured --root. Outputs are new PNG files; existing files are never overwritten. No photo is sent to a service. Ask the user which working directory and output filename to use.',
});
server.registerTool('list_styles', { description: 'List local photo-to-print styles and default settings.', inputSchema: {}, annotations: { readOnlyHint: true, openWorldHint: false } }, async () => text(PRESETS));
server.registerTool('analyze_png', { description: 'Measure a local PNG: luminance histogram, contrast and adjacent-pixel transitions. No semantic or face analysis.', inputSchema: { input: z.string().max(1024) }, annotations: { readOnlyHint: true, openWorldHint: false } }, async ({ input }) => text(analyzeImage(await readPNG(input))));
server.registerTool('plan_edit', { description: 'Translate supported local command words into validated filter settings. Does not call a language model or change a file.', inputSchema: { prompt: z.string().min(1).max(600), current: z.object(optionsShape).strict() }, annotations: { readOnlyHint: true, openWorldHint: false } }, async ({ prompt, current }) => text(planLocalEdit(prompt, current)));
server.registerTool('render_png', { description: 'Apply Toonforge filters to a local PNG and write a new PNG inside the working root. Never overwrites. Return file path and measurements, not image bytes.', inputSchema: { input: z.string().max(1024), output: z.string().max(1024), options: z.object(optionsShape).strict() }, annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } }, async ({ input, output, options }) => {
  if (path.extname(output).toLowerCase() !== '.png') throw new Error('Use a .png output filename.');
  const target = path.resolve(root, output);
  withinRoot(target);
  const parent = withinRoot(await realpath(path.dirname(target)));
  const destination = path.join(parent, path.basename(target));
  const result = processImage(await readPNG(input), validateOptions(options));
  const png = new PNG({ width: result.width, height: result.height }); png.data = Buffer.from(result.data);
  const bytes = PNG.sync.write(png);
  await writeFile(destination, bytes, { flag: 'wx' });
  return text({ output: destination, width: result.width, height: result.height, metrics: result.metrics });
});
await server.connect(new StdioServerTransport());

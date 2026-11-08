import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP handshake, local analysis, real PNG output, path limits and overwrite protection', { timeout: 20_000 }, async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'toonforge-mcp-'));
  const root = path.join(temporary, 'images'); await mkdir(root);
  const png = new PNG({ width: 8, height: 8 });
  png.data.fill(255); for (let i=0;i<32;i++) png.data[i*4] = 10;
  const bytes = PNG.sync.write(png);
  await writeFile(path.join(root, 'photo.png'), bytes); await writeFile(path.join(temporary, 'outside.png'), bytes);
  const client = new Client({ name:'toonforge-test', version:'1.0.0' });
  const transport = new StdioClientTransport({ command:process.execPath, args:['--import','tsx','scripts/mcp-server.ts','--root',root], stderr:'pipe' });
  try {
    await client.connect(transport);
    assert.deepEqual((await client.listTools()).tools.map(t => t.name).sort(), ['analyze_png','list_styles','plan_edit','render_png']);
    const analysis = await client.callTool({name:'analyze_png', arguments:{input:'photo.png'}});
    assert.ok(!analysis.isError); assert.ok(JSON.stringify(analysis.content).includes('histogram'));
    const options = {preset:'mono-ink',detail:55,ink:75,colors:4};
    const render = await client.callTool({name:'render_png',arguments:{input:'photo.png',output:'print.png',options}});
    assert.ok(!render.isError);
    const result = PNG.sync.read(await readFile(path.join(root,'print.png')));
    assert.equal(result.width,8); assert.equal(result.height,8);
    for (let i=0;i<result.data.length;i+=4) { assert.equal(result.data[i],result.data[i+1]); assert.equal(result.data[i+1],result.data[i+2]); }
    assert.equal((await client.callTool({name:'render_png',arguments:{input:'photo.png',output:'print.png',options}})).isError,true);
    assert.equal((await client.callTool({name:'analyze_png',arguments:{input:'../outside.png'}})).isError,true);
    assert.equal((await client.callTool({name:'render_png',arguments:{input:'photo.png',output:'../escape.png',options}})).isError,true);
    const plan = await client.callTool({name:'plan_edit',arguments:{prompt:'softer outlines',current:options}}); assert.ok(!plan.isError);
  } finally {
    await client.close();
    // Only remove the exact fresh test directory returned by mkdtemp.
    assert.ok(path.basename(temporary).startsWith('toonforge-mcp-') && path.dirname(temporary) === path.resolve(tmpdir()));
    await rm(temporary,{recursive:true,force:true});
  }
});

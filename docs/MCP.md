# Toonforge local MCP

Use the same deterministic image engine from an MCP-compatible desktop or command-line agent. The browser remains the easiest way to process JPG, PNG and WebP. This optional server is for repeatable PNG workflows on your own computer; it is not a hosted endpoint.

## Install and connect

Clone the repository, install Node.js 24 and run `npm ci`. Create a directory containing the PNGs you want the agent to use. Configure your MCP client to launch a stdio process in the cloned checkout:

```json
{
  "mcpServers": {
    "toonforge": {
      "command": "node",
      "args": ["--import", "tsx", "/absolute/path/to/toonforge-mobile-ai/scripts/mcp-server.ts", "--root", "/absolute/path/to/images"],
      "cwd": "/absolute/path/to/toonforge-mobile-ai"
    }
  }
}
```

Client configuration formats vary. `cwd` must be the checkout so the `tsx` loader resolves; if your client does not support `cwd`, launch `npm run mcp -- --root /absolute/path/to/images` from the checkout using its supported process configuration. On Windows, use absolute paths such as `D:/Projects/toonforge-mobile-ai` and the client's supported `npm.cmd` launcher. No API key or server port is needed. The process waits for MCP messages on stdin and writes protocol messages to stdout.

## Tools

| Tool | Inputs | Result |
| --- | --- | --- |
| `list_styles` | none | Three styles, descriptions, defaults and tone levels |
| `analyze_png` | `input` | 32-bin histogram, luminance mean/std, transition density, heuristic settings |
| `plan_edit` | `prompt`, `current` settings | Supported local command words mapped to a validated edit plan |
| `render_png` | `input`, new `output`, `options` | A real PNG written locally, dimensions and processing measurements |

Example `render_png` arguments:

```json
{
  "input": "workshop.png",
  "output": "workshop-mono.png",
  "options": {"preset": "mono-ink", "detail": 45, "ink": 60, "colors": 4}
}
```

Example agent request: “Analyze workshop.png, suggest a softer monochrome handout, then render a new workshop-mono.png using Toonforge.” The client controls tool execution and confirmation. The server does not itself contact a text model. `plan_edit` supports the same explicitly rule-based vocabulary as the browser's local commands.

## File behavior

- Resolve input paths, including symlinks, and output parent directories against the chosen root. Reject paths outside it.
- Accept PNG only, up to 20 MiB, 4 MP and 8,192 pixels on either side. Validate the PNG header before full decoding and check its CRCs.
- Write PNG only. The output parent must already exist. Exclusive creation (`wx`) refuses overwrites, including existing output symlinks.
- Return paths and measurements, without embedding photo bytes in the agent conversation.
- Never perform network inference, start a listener, or read credentials. The local MCP client is trusted code; a changing or hostile filesystem is outside this tool's security boundary.

## Verification

`npm test` starts a real SDK stdio client and server, completes initialization, discovers all four tools, measures a fixture, decodes an actual rendered PNG, verifies monochrome channels, rejects outside-root paths, and refuses overwriting the result. It does not establish compatibility with every MCP client. See the [official server guide](https://modelcontextprotocol.io/docs/develop/build-server).

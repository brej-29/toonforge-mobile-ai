# Sources, assets, and comparison criteria

2.1 additions (2026-11-08): [MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server), [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), and [software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app). The current interface adds native CSS view-timeline enhancement, a CSS pipeline signal and background motion with a pause control; the component-choice discussion below describes the earlier release. README captures/GIF and `public/social-preview.png` derive from the actual app and the separately licensed Green Liu sample. Reproduce with `scripts/capture-docs.mjs` and `scripts/make-demo.py`; they are not generative image assets.

Sources checked 2026-11-05. Claims below describe the linked products' published behavior, not a hands-on comparative benchmark. There is no user survey, adoption estimate, or measured market-size claim.

## Product evidence and alternatives

| Alternative | Local processing / account | Scope and relevance |
| --- | --- | --- |
| [Photopea](https://www.photopea.com/) | Its product page says files stay on-device and the editor runs in the browser. | A powerful free editor with filters, layers, and masks. A valid alternative when a user already knows the workflow; Toonforge's hypothesis is fewer decisions for a narrowly defined photo-to-print task, not unique privacy. |
| [Adobe Firefly photo to cartoon](https://www.adobe.com/products/firefly/features/ai-cartoon-generator/photo-to-cartoon.html) | Published instructions require sign-in and uploading a photo. | Offers generative style changes and prompting. Better for reimagining a subject; a local deterministic filter preserves source geometry and avoids a generation service dependency. |
| [Squoosh](https://squoosh.app/) | Says image processing happens locally. | Excellent reference for direct manipulation, side-by-side inspection, and honest output comparison. It optimizes image compression rather than providing comic stylization. |
| Plain channel posterization | Runs in the same local pipeline with no account. | The simplest technical baseline: quantize each channel without edge-aware smoothing. The evaluation measures whether added complexity earns its runtime. |

These references establish available mechanisms and tradeoffs. The reproducible pain evidence is the project's own missing-model/cloud configuration failure in [BASELINE.md](BASELINE.md). A need among teachers or makers remains a product hypothesis until actual users test it.

## Technical foundations and free deployment

- [MDN: pixel manipulation with Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas) documents RGBA `ImageData`, pixel editing, and saving rendered images. This is sufficient for the local pipeline without a server.
- [MDN: Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) documents background processing and message passing. Workers can make network requests; privacy must be enforced by the application, not assumed from the choice of API.
- [Vite: Why Vite](https://vite.dev/guide/why.html) explains its development server and optimized production bundling. Vite is build tooling; published output is static files.
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) states that public repositories are eligible under GitHub Free; published sites are limited to 1 GB and a soft 100 GB bandwidth/month. Deployments time out after ten minutes. Rate limits may return 429; there is no inference service that can exhaust a model quota or need warming.
- The same Pages policy excludes sites primarily facilitating commercial transactions or commercial SaaS. This is a free open-source public utility with no transactions, account system, or hosted private image storage. A future commercial service would need another hosting choice and a fresh terms review.

## Component and motion choices

The tool review favours the editor's task and measured footprint rather than a collection of libraries:

| Option reviewed | Published capability | Decision for this studio |
| --- | --- | --- |
| [Radix Primitives accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) | Focus management, keyboard behaviour, and ARIA patterns for custom components | Useful for richer custom widgets. This screen can use actual buttons, ranges, labels, and disclosure elements, retaining native behaviour without a component runtime. |
| [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Scroll-linked animation, pinning, and progress control | Valuable for narrative surfaces; the image-editing task needs a stable comparison workspace. No scroll-driven effect is installed. |
| [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) | Browser animation timing and element effects | Selected for the single 550 ms comparison reveal. Wipe input cancels it, and reduced motion skips it. Ordinary hover/focus states use CSS. |

The product references remain Squoosh, Photopea, and Adobe Express above. These choices are architectural judgments, not a measured claim that these libraries are slow or inaccessible. Dependency auditing and the Lighthouse record in [QUALITY.md](QUALITY.md) cover the actual chosen application.

## Bundled demonstration photograph

`public/samples/scene.jpg` is a real photograph of Manarola, Italy by **Green Liu**. [Original photograph and license declaration](https://unsplash.com/photos/a-small-village-on-a-cliff-above-the-ocean-wBV8aZSRc4A); [Unsplash License](https://unsplash.com/license). The page marks it free under that license, not Unsplash+. The license allows downloading, copying, modifying, and distributing the photo, subject to its restrictions. It is bundled as a clearly labeled sample, not a user's work or a claimed processing benchmark dataset.

Downloaded derivative: `https://images.unsplash.com/photo-1718953585068-98bc5aea5b2a?auto=format&fit=crop&fm=jpg&q=82&w=1100`. Dimensions: 1100×733; downloaded size: 255,583 bytes. No runtime request to Unsplash is needed. The source photograph is governed by the Unsplash License; the repository's MIT license does not relicense it. The adjacent JSON records provenance.

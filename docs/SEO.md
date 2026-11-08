# Search and discovery

Canonical public URL: https://brej-29.github.io/toonforge-mobile-ai/

The studio's title and description identify the job: free photo-to-cartoon and print preparation. Static HTML explains classroom handouts, zines and memory prints. The [linked guide](https://brej-29.github.io/toonforge-mobile-ai/guide.html) covers concrete steps, methods, privacy, limits and text-model setup without requiring JavaScript to read it.

## Implemented

- Absolute canonical URLs for the studio and guide.
- Descriptive page titles, metadata, semantic headings and visible text; no keyword stuffing or hidden search copy.
- Social preview image, image alternative text, social title/description, and large-image card metadata.
- Truthful `WebApplication` JSON-LD: free software, browser requirements, supported functions, source and license. No invented reviews, ratings or adoption statistics. Schema does not guarantee a rich result; this app does not fabricate rating fields to qualify for Google's software-app rich results.
- `sitemap.xml` listing both public HTML pages, and internal links connecting them.
- `index,follow` page directives and a discoverable public GitHub repository.
- `llms.txt` as an optional plain-language machine-readable index with capabilities and limits. It is not an indexing protocol or a ranking guarantee.
- Static content and self-hosted assets, with accessibility, overflow and output checks in CI.

Google says its existing SEO practices apply to AI Overviews and AI Mode; there is no special AI optimization requirement. Crawlable, accurate, useful content is the work. Source: [Google's AI features guidance](https://developers.google.com/search/docs/appearance/ai-features), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [software-app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app).

## Owner follow-up

Submit `https://brej-29.github.io/toonforge-mobile-ai/sitemap.xml` in a verified Search Console property, inspect both URLs and monitor indexing. Verification and Search Console submission are account-specific; they are not claimed as completed by this release. Other search engines have their own webmaster tools. Existing public HTML and links allow normal discovery meanwhile.

The site lives below `/toonforge-mobile-ai/`. Crawlers consult `/robots.txt` at the origin root, not a file in the repository's subdirectory. Adding a project-level robots file would not control Googlebot, so none is advertised as effective here. Managing an origin-wide robots file would affect the user's other Pages projects and is outside this repository's scope. An origin-root `llms.txt` is likewise outside scope; the project-scoped index is a convenience for readers that fetch it explicitly.

Do not announce “SEO completed” as a promise of ranking. Search engines choose indexing, position, snippets and AI inclusion. No ranking, external backlinks, impressions or conversion uplift has been measured. A later custom domain can simplify origin-level crawler settings, but requires an actual domain decision and DNS setup.

export const PRESETS = [
  {
    id: 'soft-print',
    name: 'Soft print',
    description: 'Gentle color, quiet texture. A softer place to start.',
    defaultDetail: 45,
    defaultInk: 30,
    levels: 7,
  },
  {
    id: 'graphic-novel',
    name: 'Graphic novel',
    description: 'Simplified color with a confident, dark outline.',
    defaultDetail: 55,
    defaultInk: 65,
    levels: 5,
  },
  {
    id: 'mono-ink',
    name: 'Mono ink',
    description: 'Four shades of gray for a monochrome print.',
    defaultDetail: 55,
    defaultInk: 75,
    levels: 4,
  },
] as const;

export type PresetId = (typeof PRESETS)[number]['id'];

// @ts-check
import { defineConfig } from 'astro/config';

// Static site, no server runtime. Nothing here needs a backend.
// Tailwind runs through PostCSS (see postcss.config.mjs).
export default defineConfig({});

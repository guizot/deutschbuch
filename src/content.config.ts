import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The lesson markdown is copied into src/content/lessons by
 * scripts/sync-content.mjs. We read the files directly with fs in the pages,
 * but defining the collection here keeps Astro's content layer happy and
 * silences the auto-generation warning.
 */
const lessons = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lessons" }),
  schema: z.object({}).passthrough(),
});

/**
 * Reference guides: the prose + rule tables of the four reference files, copied
 * by scripts/sync-content.mjs into src/content/guides. Rendered under the
 * interactive tables on /reference/*.
 */
const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({}).passthrough(),
});

export const collections = { lessons, guides };

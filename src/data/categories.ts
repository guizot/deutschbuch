/**
 * The nine topic categories. A category is a heading over a group of themes
 * (Grundlagen → Colours, Numbers, Shapes, Time). The Topics index lists the
 * categories, each linking to its own page; that page lists the themes inside.
 *
 * Kept here rather than inline in the page so the index and the category page
 * read the same names, icons and colours from one place.
 */

export interface CategoryInfo {
  /** URL fragment, e.g. "stadt-reisen" */
  slug: string;
  /** German name, used as the page title */
  name: string;
  /** English gloss shown under the name */
  en: string;
  /** short description of what the category holds */
  sub: string;
  /** icon name from src/lib/icons.ts */
  icon: string;
  /** tile colour class, e.g. "lv-a1" */
  color: string;
  /** CSS colour token matching the tile, drives the page-header icon */
  tint: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: "grundlagen",
    name: "Grundlagen",
    en: "Basics",
    sub: "Colours, numbers, shapes, time",
    icon: "shapes",
    color: "lv-a1",
    tint: "var(--color-feather)",
  },
  {
    slug: "menschen",
    name: "Menschen",
    en: "People",
    sub: "Family, body, character, feelings, health",
    icon: "person",
    color: "lv-a2",
    tint: "var(--color-macaw)",
  },
  {
    slug: "alltag",
    name: "Alltag",
    en: "Everyday life",
    sub: "Food, clothing, shopping, the kitchen, the home",
    icon: "house",
    color: "lv-b2",
    tint: "var(--color-fox)",
  },
  {
    slug: "stadt-reisen",
    name: "Stadt & Reisen",
    en: "Town & Travel",
    sub: "Town, transport, countries, small talk",
    icon: "compass",
    color: "lv-c1",
    tint: "var(--color-beetle)",
  },
  {
    slug: "natur",
    name: "Natur",
    en: "Nature",
    sub: "Animals, landscape, weather, environment",
    icon: "leaf",
    color: "lv-a1",
    tint: "var(--color-feather)",
  },
  {
    slug: "arbeit-lernen",
    name: "Arbeit & Lernen",
    en: "Work & Study",
    sub: "Jobs, office, school, computers",
    icon: "briefcase",
    color: "lv-red",
    tint: "var(--color-cardinal)",
  },
  {
    slug: "freizeit",
    name: "Freizeit",
    en: "Free Time",
    sub: "Sport, music, festivals, communication",
    icon: "ball",
    color: "lv-b2",
    tint: "var(--color-fox)",
  },
  {
    slug: "gesellschaft",
    name: "Gesellschaft",
    en: "Society",
    sub: "Society, politics and the media",
    icon: "globe",
    color: "lv-a2",
    tint: "var(--color-macaw)",
  },
  {
    slug: "grammatik",
    name: "Grammatik",
    en: "Grammar",
    sub: "Verb and preposition patterns",
    icon: "grammar",
    color: "lv-c1",
    tint: "var(--color-beetle)",
  },
];

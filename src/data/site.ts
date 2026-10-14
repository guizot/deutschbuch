/**
 * Static description of the course. The lesson titles/levels are also derived
 * at build time by scripts/sync-content.mjs, but this file defines the level
 * metadata and ordering that the UI relies on.
 */

import dictionary from "./dictionary.json";
import nouns from "./nouns.json";
import verbs from "./verbs.json";
import phrases from "./phrases.json";

/**
 * Counts of the reference datasets, read straight from the JSON that the
 * reference pages themselves render. Deriving them here instead of typing the
 * numbers means a card can never drift out of step with its own page again
 * (the dictionary went 1,024 → 2,530 while the card still said 1,024).
 */
const n = (v: number) => v.toLocaleString("en-US");

export const COUNTS = {
  words: dictionary.length,
  nouns: nouns.length,
  verbs: verbs.length,
  phrases: phrases.length,
};

export interface LevelInfo {
  id: "a1" | "a2" | "b1" | "b2" | "c1";
  label: string;
  /** German name of the stage, shown as the page title. */
  de: string;
  name: string;
  blurb: string;
  hours: string;
  color: string; // css class: lv-a1 ... lv-c1
  icon: string; // custom icon name (see src/lib/icons.ts)
  tint: string; // CSS colour token matching the level (drives icon colour)
}

export const LEVELS: LevelInfo[] = [
  {
    id: "a1",
    label: "A1",
    de: "Anfänger",
    name: "Beginner",
    blurb: "Alphabet, greetings, gender, present tense, numbers, word order.",
    hours: "80–150 h",
    color: "lv-a1",
    icon: "sprout",
    tint: "var(--color-feather)",
  },
  {
    id: "a2",
    label: "A2",
    de: "Grundstufe",
    name: "Elementary",
    blurb: "Dative, Perfekt, Präteritum, subordinate clauses, adjective endings.",
    hours: "230–350 h",
    color: "lv-a2",
    icon: "leaf",
    tint: "var(--color-macaw)",
  },
  {
    id: "b1",
    label: "B1",
    de: "Mittelstufe",
    name: "Intermediate",
    blurb: "Passive, Konjunktiv II, relative clauses, connectors, formal letters.",
    hours: "380–550 h",
    color: "lv-b1",
    icon: "tree",
    tint: "var(--color-bee)",
  },
  {
    id: "b2",
    label: "B2",
    de: "Fortgeschritten",
    name: "Upper intermediate",
    blurb: "Konjunktiv I, nominalisation, register, text types, exam technique.",
    hours: "530–750 h",
    color: "lv-b2",
    icon: "mountain",
    tint: "var(--color-fox)",
  },
  {
    id: "c1",
    label: "C1",
    de: "Experte",
    name: "Advanced",
    blurb: "Full Konjunktiv I, academic writing, idioms, collocations, debate.",
    hours: "750–900+ h",
    color: "lv-c1",
    icon: "rocket",
    tint: "var(--color-beetle)",
  },
];

export interface ReferenceInfo {
  slug: string;
  title: string;
  /** English gloss shown under the German title, as on the topic cards. */
  en: string;
  desc: string;
  count: string;
  icon: string;
  color: string;
}

/**
 * Thematic word modules (Themen). Unlike a lesson, a theme is a browsable
 * collection of vocabulary on one topic — animals, colours, the body — the way
 * a phrasebook groups things. The data lives in src/data/themes.json.
 */
export interface ThemeInfo {
  slug: string;
  title: string;
  subtitle: string;
  desc: string;
  count: string;
  icon: string;
  color: string;
}

export const REFERENCES: ReferenceInfo[] = [
  {
    slug: "dictionary",
    title: "Wörterbuch",
    en: "Dictionary",
    desc: "Every word A–Z with its CEFR level. Searchable.",
    count: `${n(COUNTS.words)} headwords`,
    icon: "book",
    color: "lv-a1",
  },
  {
    slug: "nouns",
    title: "Nomen",
    en: "Nouns",
    desc: "Nouns with article and plural. Filter by der / die / das.",
    count: `${n(COUNTS.nouns)} nouns`,
    icon: "letters",
    color: "lv-a2",
  },
  {
    slug: "verbs",
    title: "Verbtabellen",
    en: "Verb tables",
    desc: "Conjugation tables: Präsens, Präteritum, Perfekt.",
    count: `${n(COUNTS.verbs)} verbs`,
    icon: "table",
    color: "lv-b1",
  },
  {
    slug: "phrases",
    title: "Redemittel",
    en: "Phrase bank",
    desc: "Exam phrases for writing and speaking, by level.",
    count: `${n(COUNTS.phrases)} phrases`,
    icon: "chat",
    color: "lv-b2",
  },
  {
    slug: "cheatsheet",
    title: "Spickzettel",
    en: "Cheat Sheet",
    desc: "The whole grammar on one searchable page.",
    count: "14 sections",
    icon: "bolt",
    color: "lv-c1",
  },
];

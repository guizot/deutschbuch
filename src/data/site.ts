/**
 * Static description of the course. The lesson titles/levels are also derived
 * at build time by scripts/sync-content.mjs, but this file defines the level
 * metadata and ordering that the UI relies on.
 */

export interface LevelInfo {
  id: "a1" | "a2" | "b1" | "b2" | "c1";
  label: string;
  name: string;
  blurb: string;
  hours: string;
  color: string; // css class: lv-a1 ...
  emoji: string;
}

export const LEVELS: LevelInfo[] = [
  {
    id: "a1",
    label: "A1",
    name: "Beginner",
    blurb: "Alphabet, greetings, gender, present tense, numbers, word order.",
    hours: "80–150 h",
    color: "lv-a1",
    emoji: "🌱",
  },
  {
    id: "a2",
    label: "A2",
    name: "Elementary",
    blurb: "Dative, Perfekt, Präteritum, subordinate clauses, adjective endings.",
    hours: "230–350 h",
    color: "lv-a2",
    emoji: "🌿",
  },
  {
    id: "b1",
    label: "B1",
    name: "Intermediate",
    blurb: "Passive, Konjunktiv II, relative clauses, connectors, formal letters.",
    hours: "380–550 h",
    color: "lv-b1",
    emoji: "🌳",
  },
  {
    id: "b2",
    label: "B2",
    name: "Upper intermediate",
    blurb: "Konjunktiv I, nominalisation, register, text types, exam technique.",
    hours: "530–750 h",
    color: "lv-b2",
    emoji: "🏔️",
  },
  {
    id: "c1",
    label: "C1",
    name: "Advanced",
    blurb: "Full Konjunktiv I, academic writing, idioms, collocations, debate.",
    hours: "750–900+ h",
    color: "lv-c1",
    emoji: "🚀",
  },
];

export interface ReferenceInfo {
  slug: string;
  title: string;
  desc: string;
  count: string;
  emoji: string;
  color: string;
}

export const REFERENCES: ReferenceInfo[] = [
  {
    slug: "dictionary",
    title: "Wörterbuch",
    desc: "Every word A–Z with its CEFR level. Searchable.",
    count: "1,024 headwords",
    emoji: "📖",
    color: "lv-a1",
  },
  {
    slug: "nouns",
    title: "Nomen",
    desc: "Nouns with article and plural. Filter by der / die / das.",
    count: "941 nouns",
    emoji: "🔤",
    color: "lv-a2",
  },
  {
    slug: "verbs",
    title: "Verbtabellen",
    desc: "Conjugation tables: Präsens, Präteritum, Perfekt.",
    count: "236 verbs",
    emoji: "⚡",
    color: "lv-b1",
  },
  {
    slug: "phrases",
    title: "Redemittel",
    desc: "Exam phrases for writing and speaking, by level.",
    count: "172 phrases",
    emoji: "💬",
    color: "lv-b2",
  },
  {
    slug: "cheatsheet",
    title: "Cheat Sheet",
    desc: "The whole grammar on one searchable page.",
    count: "14 sections",
    emoji: "⚡",
    color: "lv-c1",
  },
];

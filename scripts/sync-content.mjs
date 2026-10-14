/**
 * sync-content.mjs
 * ---------------------------------------------------------------------------
 * Reads the German course from ~/Documents/languages/german and copies it into
 * this project. THE SOURCE IS OPENED READ-ONLY. This script never writes to,
 * moves, renames or deletes anything inside ~/Documents/languages.
 *
 * It produces:
 *   src/content/lessons/<level>/<NN-slug>.md   (raw markdown, for Astro)
 *   src/content/meta.json                      (lesson index: level, title, order)
 *   src/data/dictionary.json                   (parsed from woerterbuch.md)
 *   src/data/nouns.json                        (parsed from nomen.md)
 *   src/data/verbs.json                        (parsed from verbtabellen.md)
 *   src/data/phrases.json                      (parsed from redemittel.md)
 *
 * Run:  npm run sync
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const HOME = os.homedir();
const SRC = path.join(HOME, "Documents", "languages", "german");
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_LESSONS = path.join(ROOT, "src", "content", "lessons");
const OUT_META = path.join(ROOT, "src", "content", "meta.json");
const OUT_DATA = path.join(ROOT, "src", "data");

const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

/* ------------------------------------------------------------------ helpers */

function read(file) {
  return fs.readFileSync(file, "utf8");
}

/** Split a markdown table row into trimmed cells. */
function cells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isSeparator(line) {
  const c = cells(line);
  return c.length > 0 && c.every((x) => x === "" || /^:?-{2,}:?$/.test(x));
}

function isTableLine(line) {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

/** Strip markdown emphasis/links for plain-text fields. */
function plain(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
}

/**
 * The woerterbuch/nomen sources mark words added from the app's thematic topics
 * with a trailing "†" (so a reader of the raw markdown can tell them apart).
 * That marker is meaningful in the .md file but must never reach the UI.
 */
function stripDagger(s) {
  return s.replace(/\s*†\s*$/, "").trim();
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

/**
 * Infer a lesson "type" from its title, used to pick the icon shown inside the
 * skill-path node (grammar / listen / read / write / practice / chat). There is
 * no explicit type field in the source markdown, so this is a best-effort guess
 * — deliberately conservative, defaulting to "grammar" (the cap icon).
 */
const TYPE_RULES = [
  [/aussprache|pronunciation/i, "listen"],
  [/begr(ü|ue)(ß|ss)ung|vorstellung|greeting/i, "chat"],
  [/diskussion|debatte|argumentation|pr(ä|ae)sentation|meinung|rede/i, "chat"],
  [/brief|schreiben|schriftlich|aufsatz|textsorte|wortbildung|bericht|leserbrief/i, "write"],
  [/zusammenfass|paraphras|idiom|kollokation/i, "read"],
  [/review|wiederholung|pr(ü|ue)fungstechnik|exam/i, "practice"],
];

function lessonType(title) {
  for (const [re, t] of TYPE_RULES) if (re.test(title)) return t;
  return "grammar";
}

/* ------------------------------------------------------- 1. lesson copying */

function syncLessons() {
  const meta = [];

  for (const level of LEVELS) {
    const dir = path.join(SRC, level);
    if (!fs.existsSync(dir)) {
      console.warn(`  ! missing level folder: ${level}`);
      continue;
    }

    const files = fs
      .readdirSync(dir)
      .filter((f) => /^\d.*\.md$/.test(f))
      .sort();

    const outDir = path.join(OUT_LESSONS, level);
    ensureDir(outDir);

    // The per-level vocabulary list is linked from lesson footers
    // (`./wortschatz.md`). Copy it too so /<level>/wortschatz/ can render it.
    const vokab = path.join(dir, "wortschatz.md");
    if (fs.existsSync(vokab)) {
      fs.writeFileSync(path.join(outDir, "_wortschatz.md"), read(vokab), "utf8");
    }

    for (const file of files) {
      const src = path.join(dir, file);
      const raw = read(src); // READ ONLY

      // Title: first H1
      const h1 = raw.match(/^#\s+(.+)$/m);
      const fullTitle = h1 ? plain(h1[1]) : file;

      // "Lektion 01: Aussprache (Pronunciation)" -> num 1, title "Aussprache..."
      let num = null;
      let title = fullTitle;
      const m = fullTitle.match(/^Lektion\s+(\d+)\s*:\s*(.+)$/i);
      if (m) {
        num = parseInt(m[1], 10);
        title = m[2].trim();
      }

      // Metadata line: **Level:** A1 | **Target time:** 30 minutes ... | **Status:** ...
      const levelLine = raw.match(/^\*\*Level:\*\*\s*(.+)$/m);
      const targetLine = raw.match(/^\*\*Target time:\*\*\s*(.+)$/m);
      const statusLine = raw.match(/^\*\*Status:\*\*\s*(.+)$/m);

      // Count exercises for the UI badge
      const exCount = (raw.match(/^\*\*\d+\.\*\*/gm) || []).length;

      const slug = file.replace(/\.md$/, "");

      // Copy the markdown verbatim into the project (never modify the source).
      fs.writeFileSync(path.join(outDir, file), raw, "utf8");

      meta.push({
        level,
        slug,
        file,
        num: num ?? 0,
        title,
        fullTitle,
        target: targetLine ? plain(targetLine[1].split("|")[0]) : "",
        status: statusLine ? plain(statusLine[1]) : "not started",
        levelTag: levelLine ? plain(levelLine[1].split("|")[0]) : level.toUpperCase(),
        exercises: exCount,
        words: raw.split(/\s+/).length,
        type: lessonType(title),
      });
    }

    console.log(`  ${level}: ${files.length} lessons`);
  }

  meta.sort((a, b) => (a.level === b.level ? a.num - b.num : LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)));

  // The last lesson of every level is the level's milestone: turn it into a
  // "trophy" node so the path visibly ends with a reward (like Duolingo's
  // chest/trophy at the end of a unit).
  for (const level of LEVELS) {
    const inLevel = meta.filter((m) => m.level === level);
    if (inLevel.length) inLevel[inLevel.length - 1].type = "trophy";
  }

  fs.writeFileSync(OUT_META, JSON.stringify(meta, null, 2), "utf8");
  console.log(`  meta.json: ${meta.length} lessons indexed`);
  return meta;
}

/* --------------------------------------------------- 2. reference: dictionary */

function syncDictionary() {
  const file = path.join(SRC, "woerterbuch.md");
  if (!fs.existsSync(file)) return console.warn("  ! woerterbuch.md missing");
  const lines = read(file).split("\n");
  const out = [];
  const levelRe = /^(A1|A2|B1|B2|C1)(, (A1|A2|B1|B2|C1))*$/;

  for (const line of lines) {
    if (!isTableLine(line) || isSeparator(line)) continue;
    const c = cells(line);
    if (c.length !== 4) continue;
    if (c[0].toLowerCase() === "deutsch") continue;
    if (!levelRe.test(c[3])) continue;
    out.push({
      de: stripDagger(c[0]),
      en: c[1],
      extra: c[2],
      level: c[3],
      levels: c[3].split(", ").map((s) => s.trim()),
    });
  }
  fs.writeFileSync(path.join(OUT_DATA, "dictionary.json"), JSON.stringify(out), "utf8");
  console.log(`  dictionary.json: ${out.length} entries`);
}

/* -------------------------------------------------------- 3. reference: nouns */

function syncNouns() {
  const file = path.join(SRC, "nomen.md");
  if (!fs.existsSync(file)) return console.warn("  ! nomen.md missing");
  const lines = read(file).split("\n");
  const out = [];
  const levelRe = /^(A1|A2|B1|B2|C1)(, (A1|A2|B1|B2|C1))*$/;

  for (const line of lines) {
    if (!isTableLine(line) || isSeparator(line)) continue;
    const c = cells(line);
    if (c.length !== 4) continue;
    if (c[0].toLowerCase() === "nomen") continue;
    if (!levelRe.test(c[3])) continue;

    const head = stripDagger(c[0]);
    const art = (head.match(/^(der|die|das)\s/) || [])[1] || "";
    const plural = c[2];
    const derived = /\*$/.test(plural);
    // Keep only rows that really are noun entries: a plural in column 3
    // ("die X", "(no pl.)" or "—") and an English gloss in column 2.
    // This drops exercise tables that share the file's table syntax.
    const looksLikePlural = /^(die|der|das)\s/.test(plural) || plural === "—" || /no pl\./.test(plural);
    if (!looksLikePlural) continue;
    if (!/[a-zA-Z]/.test(c[1])) continue;

    const en = c[1];

    out.push({
      de: head,
      art,
      en,
      plural: plural.replace(/\s*\*$/, ""),
      derived,
      level: c[3],
      levels: c[3].split(", ").map((s) => s.trim()),
      stem: head.replace(/^(der|die|das)\s+/, ""),
    });
  }
  fs.writeFileSync(path.join(OUT_DATA, "nouns.json"), JSON.stringify(out), "utf8");
  console.log(`  nouns.json: ${out.length} entries`);
}

/* -------------------------------------------------------- 4. reference: verbs */

function syncVerbs() {
  const file = path.join(SRC, "verbtabellen.md");
  if (!fs.existsSync(file)) return console.warn("  ! verbtabellen.md missing");
  const lines = read(file).split("\n");
  const out = [];
  let section = "";

  const sectionMap = {
    "1.": "core",
    "2.": "modal",
    "3.": "strong",
    "4.": "weak",
    "5.": "separable",
    "6.": "reflexive",
    "7.": "ieren",
  };

  for (const line of lines) {
    const h = line.match(/^##\s+(\d)\.\s*(.+)$/);
    if (h) {
      section = sectionMap[h[1] + "."] || "other";
      continue;
    }
    if (!isTableLine(line) || isSeparator(line)) continue;
    const c = cells(line);
    if (c.length < 6) continue;
    if (c[0].toLowerCase() === "infinitiv") continue;
    const inf = plain(c[0]);
    if (!inf) continue;

    // Modal table has 8 columns (extra Konjunktiv II); others have 7.
    const isModal = section === "modal";
    out.push({
      inf,
      en: c[1],
      ich: c[2],
      du: c[3],
      er: c[4],
      praet: isModal ? c[5] : c[5],
      konj2: isModal ? c[6] : "",
      perf: isModal ? c[7] : c[6],
      type: section,
    });
  }
  fs.writeFileSync(path.join(OUT_DATA, "verbs.json"), JSON.stringify(out), "utf8");
  console.log(`  verbs.json: ${out.length} entries`);
}

/* ------------------------------------------------------ 5. reference: phrases */

function syncPhrases() {
  const file = path.join(SRC, "redemittel.md");
  if (!fs.existsSync(file)) return console.warn("  ! redemittel.md missing");
  const lines = read(file).split("\n");
  const out = [];
  let part = "";
  let section = "";

  for (const line of lines) {
    const p = line.match(/^#\s+PART\s+(\d)\s*[—–-]\s*(.+)$/i);
    if (p) {
      part = p[2].trim();
      continue;
    }
    const h2 = line.match(/^##\s+([\d.]+)\s+(.+)$/);
    if (h2) {
      section = h2[2].trim();
      continue;
    }
    if (!isTableLine(line) || isSeparator(line)) continue;
    const c = cells(line);
    if (c.length < 3) continue;
    if (c[0].toLowerCase() === "deutsch") continue;
    // Only rows whose 3rd column is a bracketed level tag are real phrases.
    // This skips the connector / hedging tables, which have other columns.
    if (!/^\[[^\]]+\]$/.test(c[2].trim())) continue;
    const lv = c[2].replace(/[[\]]/g, "").trim();
    out.push({ de: c[0], en: c[1], level: lv, part, section });
  }
  fs.writeFileSync(path.join(OUT_DATA, "phrases.json"), JSON.stringify(out), "utf8");
  console.log(`  phrases.json: ${out.length} entries`);
}

/* ------------------------------------------------- reference guides (prose) */

/**
 * The four reference files (woerterbuch, nomen, verbtabellen, redemittel) are
 * mostly a big A–Z data table, but each also carries prose and rule tables
 * that the interactive pages did not show. This extracts just that part:
 *   - keep headings, paragraphs, lists, code blocks and RULE tables
 *   - drop the A–Z data tables (they already have their own searchable page)
 *   - drop the letter index (## A .. ## Z) and the "Contents" link block
 * The result is written to src/content/guides/<name>.md for the pages to render.
 */
const LETTER_SECTION = /^#{1,3}\s+[A-ZÄÖÜ]$/;

function isDataTable(headerLine) {
  const h = headerLine.trimEnd();
  return h.endsWith("| Level |") || h.includes("Infinitiv");
}

function dropEmptyHeadings(lines) {
  let changed = true;
  while (changed) {
    changed = false;
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#")) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        if (j >= lines.length || lines[j].startsWith("#")) {
          changed = true;
          continue; // heading with no content under it
        }
      }
      out.push(lines[i]);
    }
    lines = out;
  }
  return lines;
}

function extractGuide(text) {
  const lines = text.split("\n");
  let out = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (ln.startsWith("#")) {
      if (LETTER_SECTION.test(ln.trim())) { i++; continue; }
      if (/^#{1,3}\s+Contents\s*$/.test(ln.trim())) {
        i++;
        while (i < lines.length &&
               (lines[i].trim().startsWith("[") || ["", "---"].includes(lines[i].trim()))) i++;
        continue;
      }
      if (/^#\s+/.test(ln)) { i++; continue; }  // the H1 (page renders its own)
      out.push(ln); i++;
    } else if (ln.startsWith("|")) {
      let j = i;
      while (j < lines.length && lines[j].startsWith("|")) j++;
      if (!isDataTable(lines[i])) out.push(...lines.slice(i, j));
      i = j;
    } else {
      out.push(ln); i++;
    }
  }
  let txt = dropEmptyHeadings(out).join("\n");
  txt = txt.replace(/\n-{3,}\n/g, "\n\n");
  txt = txt.replace(/\n{3,}/g, "\n\n");
  return txt.trim();
}

function syncGuides() {
  const outDir = path.join(ROOT, "src", "content", "guides");
  ensureDir(outDir);
  const files = ["woerterbuch.md", "nomen.md", "verbtabellen.md", "redemittel.md"];
  for (const f of files) {
    const src = path.join(SRC, f);
    if (!fs.existsSync(src)) { console.warn(`  ! ${f} missing`); continue; }
    const guide = extractGuide(read(src));
    fs.writeFileSync(path.join(outDir, f), guide, "utf8");
    console.log(`  guide ${f}: ${guide.split("\n").length} lines`);
  }
}

/* --------------------------------------------------- search index (global) */

/**
 * Build a compact search index over every lesson: title, level, slug and the
 * plain text of the body. The /search page loads this JSON and filters it
 * client-side. Kept small by trimming each body to ~1400 chars.
 */
function syncSearchIndex(meta) {
  const index = [];
  for (const lesson of meta) {
    const file = path.join(OUT_LESSONS, lesson.level, lesson.slug + ".md");
    if (!fs.existsSync(file)) continue;
    let body = read(file);
    body = body.replace(/^#\s+.+$/m, "");          // drop H1
    body = body.replace(/\|/g, " ");                // flatten tables
    body = body.replace(/[*_`#>]/g, "");            // strip md syntax
    body = body.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"); // links → text
    body = body.replace(/\s+/g, " ").trim();
    index.push({
      l: lesson.level,
      s: lesson.slug,
      t: lesson.title,
      d: body.slice(0, 1400),
    });
  }
  fs.writeFileSync(path.join(OUT_DATA, "search.json"), JSON.stringify(index), "utf8");
  console.log(`  search.json: ${index.length} lessons indexed`);
}

/* ------------------------------------------- refresh counts in copied pages */

/**
 * The cheat sheet is copied verbatim from the source, so any counts written
 * into its prose go stale the moment the vocabulary grows (it still said
 * "1,024 headwords" after the dictionary reached 2,530). The source stays
 * untouched; only the local copy is corrected, from the JSON we just wrote.
 */
function syncCheatsheetCounts() {
  const file = path.join(OUT_LESSONS, "_cheatsheet.md");
  if (!fs.existsSync(file)) return;
  const n = (v) => v.toLocaleString("en-US");
  const readCount = (name) => {
    const p = path.join(OUT_DATA, name);
    return fs.existsSync(p) ? JSON.parse(read(p)).length : null;
  };
  const words = readCount("dictionary.json");
  const nouns = readCount("nouns.json");
  const verbs = readCount("verbs.json");

  let txt = read(file);
  const before = txt;
  if (words != null) txt = txt.replace(/(\[woerterbuch\.md\]\([^)]*\) \| A–Z dictionary \()[\d,]+( headwords\))/, `$1${n(words)}$2`);
  if (verbs != null) txt = txt.replace(/(\[verbtabellen\.md\]\([^)]*\) \| verb conjugations \()[\d,]+( verbs\))/, `$1${n(verbs)}$2`);
  if (nouns != null) txt = txt.replace(/(\[nomen\.md\]\([^)]*\) \| nouns \+ article \+ plural \()[\d,]+( nouns\))/, `$1${n(nouns)}$2`);
  if (txt !== before) {
    fs.writeFileSync(file, txt, "utf8");
    console.log(`  _cheatsheet.md counts refreshed (${n(words)} words, ${n(nouns)} nouns, ${n(verbs)} verbs)`);
  }
}

/* ------------------------------------------------------------------- run it */

console.log("sync-content: reading", SRC, "(read-only)");
ensureDir(OUT_LESSONS);
ensureDir(OUT_DATA);

// Copy the cheat sheet and the two info pages as special content files.
for (const [src, out] of [
  ["cheatsheet.md", "_cheatsheet.md"],
  ["roadmap.md", "_roadmap.md"],
  ["resources.md", "_resources.md"],
]) {
  const s = path.join(SRC, src);
  if (fs.existsSync(s)) {
    fs.writeFileSync(path.join(OUT_LESSONS, out), read(s), "utf8");
    console.log(`  ${src} copied`);
  }
}

const meta = syncLessons();
syncDictionary();
syncNouns();
syncVerbs();
syncPhrases();
syncGuides();
syncSearchIndex(meta);
syncCheatsheetCounts();

console.log(`\nDone. ${meta.length} lessons + 4 reference datasets.`);
console.log("Source folder was NOT modified.");

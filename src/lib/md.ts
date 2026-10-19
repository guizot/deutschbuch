/**
 * Shared markdown → HTML pipeline for the whole site.
 *
 * Why this exists: the lesson sources write emphasis *inside* inline code, e.g.
 *
 *     `Ich **lerne** Deutsch.`
 *
 * The intent is "a monospace example with the key word in bold", but markdown
 * treats the inside of backticks as literal, so the asterisks were rendered as
 * plain text and the reader saw `**lerne**`. The sources are the source of
 * truth, so the fix lives here: after marked runs, any **x** that ended up
 * inside <code> is turned into <strong>x</strong>.
 *
 * Every page that renders markdown must go through mdToHtml() so the behaviour
 * stays consistent (lessons, vocabulary, cheatsheet, reference guides, about).
 */
import { marked } from "marked";
import { audioPath } from "./audio";
import { iconSvg } from "./icons";

marked.setOptions({ gfm: true, breaks: true });

/** Wrap tables so wide ones can be swiped sideways on a phone. */
function wrapTables(html: string) {
  return html
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

/**
 * Turn **bold** markers that landed inside inline code into real <strong>.
 * A lone/stray ** is dropped so no asterisks ever reach the reader.
 *
 * Note: this also applies inside fenced blocks. The only fenced blocks in the
 * course that contain ** are model letters/essays where the markers are meant
 * as bold labels, so that is the desired result. Real source code samples
 * (which would need escaping instead) do not occur in this content.
 */
function boldInCode(html: string) {
  return html.replace(
    /(<code(?:\s[^>]*)?>)([\s\S]*?)<\/code>/g,
    (_m, open: string, inner: string) => {
      if (!inner.includes("**")) return `${open}${inner}</code>`;
      const fixed = inner
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*\*/g, "");
      return `${open}${fixed}</code>`;
    }
  );
}

/** Markdown string → HTML ready to drop into a `.prose-de` article. */
export function mdToHtml(md: string) {
  return dashEmptyCells(boldInCode(wrapTables(marked.parse(md))));
}

/**
 * Add a speaker button to the German cell of every vocabulary table.
 *
 * Only tables whose first header cell is "Deutsch" qualify — the course also
 * renders other tables (conjugations, comparisons) where a speaker would be
 * meaningless. `has` decides whether a clip exists, so this module stays free
 * of filesystem access and the caller owns that check.
 */
export function withWordAudio(html: string, has: (word: string) => boolean) {
  // Headers that name a German column. "Topic"/"Source" tables in the same files
  // are a progress tracker and a source list, not vocabulary.
  const GERMAN_HEADERS = new Set([
    "deutsch", "phrase", "phrases", "collocation", "collocations",
    "redemittel", "ausdruck", "ausdrücke", "wort", "wörter",
  ]);
  const strip = (s: string) =>
    s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    const head = table.match(/<thead>[\s\S]*?<\/thead>/);
    const firstTh = head && head[0].match(/<th[^>]*>([\s\S]*?)<\/th>/);
    if (!firstTh || !GERMAN_HEADERS.has(strip(firstTh[1]).toLowerCase())) return table;

    return table.replace(/<tr>[\s\S]*?<\/tr>/g, (row) => {
      if (row.includes("<th")) return row; // header row
      // Only the first cell: that is the German word, the rest are English/plural.
      return row.replace(/<td([^>]*)>([\s\S]*?)<\/td>/, (cell, attrs: string, inner: string) => {
        const word = strip(inner);
        if (!word || !has(word)) return cell;
        const label = esc(`Dengar pelafalan: ${word}`);
        return (
          `<td${attrs}><span class="tts-cell">` +
          `<span class="tts-cell-text">${inner}</span>` +
          `<button type="button" class="tts tts-sm" data-audio="${audioPath(word)}" ` +
          `aria-label="${label}" title="${label}">${iconSvg("listen", 20)}</button>` +
          `</span></td>`
        );
      });
    });
  });
}

/**
 * Vocabulary tables leave the plural column blank for verbs, adjectives and
 * adverbs, which have no plural. An empty <td> reads as a rendering bug, so
 * show a muted dash instead. Only touches cells that are truly empty.
 */
function dashEmptyCells(html: string) {
  return html.replace(/<td([^>]*)><\/td>/g, (_m, attrs: string) => {
    // Preserve any existing style, add the muted colour.
    if (/style="/.test(attrs)) {
      return `<td${attrs.replace(/style="/, 'style="color:var(--text-faint);')}>–</td>`;
    }
    return `<td${attrs} style="color:var(--text-faint)">–</td>`;
  });
}

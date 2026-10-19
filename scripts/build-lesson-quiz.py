#!/usr/bin/env python3
"""
Turn each lesson's vocabulary table and exercises into quiz data.

Input : src/content/lessons/<level>/<slug>.md  (+ src/content/meta.json)
Output: src/data/lesson-quiz.json

Two question pools per lesson:

  vocab[]   {de, en}            straight from the "Deutsch | English" table
  grammar[] {kind, prompt, answer, distractors[]}
            from "## Exercises" paired with "### Answer key"

Distractors are taken from the *same exercise block* first, because those are
mutually exclusive alternatives for the same sentence ("wird gebaut" vs "wurde
gebaut" vs "ist gebaut worden"). Only when a block yields too few do we pad from
other blocks in the same lesson.

Translation prompts are skipped by default: the answer key often accepts several
valid renderings, and a distractor can then be accidentally correct. Pass
--include-translation to keep them anyway.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LESSONS = os.path.join(ROOT, "src", "content", "lessons")
META = os.path.join(ROOT, "src", "content", "meta.json")
OUT = os.path.join(ROOT, "src", "data", "lesson-quiz.json")

MAX_ANSWER_LEN = 70
# The lessons write hints as "Wort = Erklärung" or "Wort → Kategorie".
GLOSS_SEPS = (" = ", " → ")
GLOSS_SEP = GLOSS_SEPS[0]
SKIP_TITLE = re.compile(r"übersetz|ubersetz|translate", re.I)


def clean(text: str) -> str:
    """Strip markdown emphasis/backticks, but keep ______ blank markers."""
    t = text.replace("___", "\x00")  # protect fill-in blanks
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"[`*_]", "", t)
    t = t.replace("\x00", "____")
    return re.sub(r"\s+", " ", t).strip()


def strip_note(text: str) -> str:
    """Drop a trailing parenthetical note: 'Sie (formal, official)' -> 'Sie'."""
    return re.sub(r"\s*\([^)]*\)\s*", " ", text).strip()


def usable_answer(raw: str) -> str | None:
    """Return the cleaned answer, or None when it cannot be graded reliably."""
    a = clean(raw)
    if " / " in a or re.search(r"\bor\b", a, re.I):
        return None  # several valid answers
    a = strip_note(a)
    if not a or len(a) > MAX_ANSWER_LEN:
        return None
    if a.count(".") > 1:
        return None  # a paragraph, not a single answer
    return a


def parse_vocab(lines: list[str]) -> list[dict]:
    """Rows of the first 'Deutsch | English' table in the lesson."""
    out = []
    header = None
    for i, raw in enumerate(lines):
        s = raw.strip()
        if not s.startswith("|"):
            header = None
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if not cells or all(set(c) <= set("-: ") for c in cells):
            continue
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
        nxt_cells = [c.strip() for c in nxt.strip("|").split("|")] if nxt.startswith("|") else []
        if nxt_cells and all(set(c) <= set("-: ") for c in nxt_cells):
            header = clean(cells[0]).lower()
            continue
        if header == "deutsch" and len(cells) >= 2:
            de, en = clean(cells[0]), clean(cells[1])
            if de and en:
                out.append({"de": de, "en": en})
    return out


def parse_exercises(lines: list[str]) -> list[dict]:
    """Pair each exercise item with its answer key entry."""
    ex_i = next((i for i, l in enumerate(lines) if re.match(r"^##\s+Exercises", l)), None)
    key_i = next((i for i, l in enumerate(lines)
                  if re.match(r"^#{2,3}\s+Answer key", l, re.I)), None)
    if ex_i is None or key_i is None:
        return []

    blocks: dict[str, dict] = {}
    cur = None
    for line in lines[ex_i:key_i]:
        s = line.strip()
        m = re.match(r"^\*\*(\d+)\.\s*(.+?)\*\*", s)
        if m:
            cur = m.group(1)
            blocks[cur] = {"kind": clean(m.group(2)), "items": []}
            continue
        m = re.match(r"^([a-h])\)\s*(.+)$", s)
        if m and cur:
            blocks[cur]["items"].append((m.group(1), clean(m.group(2))))

    answers: dict[str, dict] = {}
    cur = None
    for line in lines[key_i:]:
        s = line.strip()
        m = re.match(r"^\*\*(\d+)\.\*\*", s)
        if m:
            cur = m.group(1)
            answers[cur] = {}
            continue
        m = re.match(r"^([a-h])\)\s*(.+)$", s)
        if m and cur:
            answers[cur][m.group(1)] = m.group(2).strip()

    return [{"kind": b["kind"], "block": n, "items": b["items"],
             "answers": answers.get(n, {})} for n, b in blocks.items()]


def build_grammar(blocks: list[dict], include_translation: bool) -> list[dict]:
    items = []
    for b in blocks:
        if not include_translation and SKIP_TITLE.search(b["kind"]):
            continue
        for letter, prompt in b["items"]:
            raw = b["answers"].get(letter)
            if not raw:
                continue
            ans = usable_answer(raw)
            if ans:
                items.append({"kind": b["kind"], "block": b["block"],
                              "prompt": prompt, "answer": ans})
    return items


def add_distractors(items: list[dict]) -> None:
    """Pick up to three plausible wrong answers for each item, in place.

    Ranked by textual similarity to the correct answer, so "Das Haus wird
    gebaut." gets "Das Haus wurde gebaut." / "Das Haus ist gebaut worden." —
    the tense confusion the lesson is actually about — instead of "Die Tür wird
    geöffnet.", which anyone rejects on the noun alone.

    A similarity floor keeps the opposite failure away: for a binary "du or
    Sie?" item, nothing in the lesson is close enough, so it falls back to the
    other answer in its own block and the question stays a 2-option choice
    rather than gaining three absurd options.
    """
    from collections import defaultdict
    from difflib import SequenceMatcher

    MIN_RATIO = 0.55
    by_block = defaultdict(list)
    for it in items:
        by_block[it["block"]].append(it["answer"])

    pool = [i["answer"] for i in items]
    for item in items:
        ans = item["answer"]
        scored = sorted(
            ((SequenceMatcher(None, ans, c).ratio(), c) for c in pool if c != ans),
            key=lambda x: -x[0],
        )

        picked = []
        for ratio, cand in scored:
            if ratio < MIN_RATIO:
                break
            if cand not in picked:
                picked.append(cand)
            if len(picked) == 3:
                break

        if not picked:  # binary choice: only its own block is meaningful
            for cand in by_block[item["block"]]:
                if cand != ans and cand not in picked:
                    picked.append(cand)
                if len(picked) == 3:
                    break

        item["distractors"] = picked


def _rhs(text: str) -> str | None:
    """Everything after the first gloss separator, or None."""
    for sep in GLOSS_SEPS:
        if sep in text:
            return text.split(sep, 1)[1].strip()
    return None


def _unleak(text: str, prompt: str) -> str | None:
    """Rewrite "Wort = Erklärung" down to just the explanation.

    The pronunciation and umlaut exercises are written as "Stadt = short": the
    word, then what it sounds like. Used as-is, the correct option repeats the
    word already printed on the card, so it can be picked without knowing
    anything — "schon / schön" was answered by spotting "schon" in the option.

    The card already shows the word, so the option only needs the right side.
    Returns None when the text is not of that shape.
    """
    parts = [p.strip() for p in prompt.split(" / ")]
    if len(parts) > 1:
        # "schon = already, schön = beautiful" for prompt "schon / schön"
        chunks = [c.strip() for c in text.split(",")]
        if len(chunks) != len(parts):
            return None
        out = []
        for c in chunks:
            rhs = _rhs(c)
            if rhs is None:
                return None
            out.append(rhs)
        return " / ".join(out)
    if text.startswith(prompt):
        rest = text[len(prompt) :]
        for sep in GLOSS_SEPS:
            if rest.startswith(sep):
                return rest[len(sep) :].strip()
    return None


def unleak(items: list[dict]) -> list[dict]:
    """Drop the word from every option, and discard what that makes unanswerable."""
    from collections import defaultdict

    by_block = defaultdict(list)
    for it in items:
        by_block[it["block"]].append(it)

    kept = []
    for it in items:
        prompt = it["prompt"].strip()
        stripped = _unleak(it["answer"], prompt)
        ans = stripped if stripped is not None else it["answer"]
        opts = []
        for d in it["distractors"]:
            v = _unleak(d, prompt)
            if v is None and stripped is not None:
                # A gloss for some *other* word ("Jahr = "yahr""): the answer was
                # stripped, so this has to lose its word too or the options stop
                # looking alike.
                v = _rhs(d)
            opts.append(v if v is not None else d)

        # A classify question ("Stadt = short") only makes sense against the other
        # values of the same exercise — "short" next to "long", not next to "eye".
        # add_distractors ran on the glosses, so re-pick from the block itself.
        if stripped is not None:
            same = []
            for sib in by_block[it["block"]]:
                if sib is it:
                    continue
                v = _unleak(sib["answer"], sib["prompt"].strip()) or _rhs(sib["answer"])
                if v and v.lower() != ans.lower() and v.lower() not in [x.lower() for x in same]:
                    same.append(v)
            if same:
                opts = same[:3]

        # Stripping collapses "Stadt = short" and "Sonne = short" onto the same
        # word, so the same option would appear twice.
        seen = {ans.lower()}
        uniq = []
        for o in opts:
            if o and o.lower() not in seen:
                seen.add(o.lower())
                uniq.append(o)

        # "Arbeit" -> "ARbeit" differs only in capitals: nothing to know there.
        if ans.lower() == prompt.lower():
            continue

        it["answer"] = ans
        it["distractors"] = uniq
        kept.append(it)
    return kept


BLANK = re.compile(r"_{2,}")


def _filler(item: dict) -> str | None:
    """The word that goes in the gap, when the options are whole phrases.

    "Ich habe ________ Kinder. (die Kinder)" answered "keine Kinder" was offered
    against "keine Zeit" and "die Kinder" — the options differed by noun, so the
    answer was found by matching "Kinder", and "die Kinder" repeated the hint
    almost verbatim. What the exercise asks is kein or keine, so that is what the
    options should be.
    """
    prompt = item["prompt"]
    m = BLANK.search(prompt)
    if not m:
        return None
    # Only a gap standing on its own ("___ Dokument", "Ich habe ___ Kinder").
    # "das klein____ Kind" wants an ending glued to the word before it, and
    # offering "e" / "en" as tiles reads worse than the phrase it has now.
    before_ok = m.start() == 0 or prompt[m.start() - 1] == " "
    after_ok = m.end() == len(prompt) or prompt[m.end()] == " "
    if not (before_ok and after_ok):
        return None
    # Whatever follows the gap, up to punctuation: the part the answer repeats.
    after = re.match(r"([^.,;:!?()\[\]]+)", prompt[m.end() :].lstrip())
    if not after:
        return None
    tail = after.group(1).strip()
    # The answer usually ends the sentence ("Am Montag arbeite ich.") while the
    # prompt tail stops at the full stop.
    ans = item["answer"].strip().rstrip(".,;:!?")
    # "Der Termin ist ___ drei Uhr." repeats the sentence before the gap too.
    before = prompt[: m.start()].strip()
    if before and ans.startswith(before):
        ans = ans[len(before) :].strip()
    if tail and ans.endswith(tail):
        filler = ans[: -len(tail)].strip()
        if filler and len(filler) <= 20:
            return filler
    return None


def unblank(items: list[dict]) -> list[dict]:
    """Offer the fillers alone (der/die/das) instead of whole phrases."""
    from collections import defaultdict

    by_block = defaultdict(list)
    for it in items:
        by_block[it["block"]].append(it)

    kept = []
    for it in items:
        filler = _filler(it)
        if filler is None:
            kept.append(it)
            continue

        others = []
        for sib in by_block[it["block"]]:
            if sib is it:
                continue
            other = _filler(sib)
            if other and other.lower() != filler.lower() and other.lower() not in [x.lower() for x in others]:
                others.append(other)

        # With no alternative filler there is no question left to ask.
        if not others:
            continue

        # "________ Dokument" wraps onto two lines on a phone at this font size;
        # a three-underscore gap reads the same and stays on one.
        it["prompt"] = BLANK.sub("___", it["prompt"])
        it["answer"] = filler
        it["distractors"] = others[:3]
        kept.append(it)
    return kept


def main() -> None:
    include_translation = "--include-translation" in sys.argv
    meta = {f"{m['level']}/{m['slug']}": m for m in json.load(open(META, encoding="utf-8"))}

    out: dict[str, dict] = {}
    total_v = total_g = 0

    for path in sorted(glob.glob(os.path.join(LESSONS, "*", "*.md"))):
        name = os.path.basename(path)
        if name.startswith("_"):
            continue
        level = os.path.basename(os.path.dirname(path))
        slug = name[:-3]
        key = f"{level}/{slug}"
        if key not in meta:
            print(f"  lewati (tidak ada di meta): {key}")
            continue

        lines = open(path, encoding="utf-8").read().splitlines()
        vocab = parse_vocab(lines)
        grammar = build_grammar(parse_exercises(lines), include_translation)
        add_distractors(grammar)
        grammar = unblank(unleak(grammar))
        # A question with no wrong option cannot be answered wrong; and the same
        # prompt can appear twice when a lesson repeats an exercise.
        seen = set()
        kept = []
        for g in grammar:
            if not g["distractors"]:
                continue
            sig = (g["prompt"], g["answer"])
            if sig in seen:
                continue
            seen.add(sig)
            kept.append(g)
        grammar = kept
        out[key] = {
            "level": level,
            "slug": slug,
            "title": meta[key].get("fullTitle") or meta[key].get("title") or slug,
            "vocab": vocab,
            "grammar": grammar,
        }
        total_v += len(vocab)
        total_g += len(grammar)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    no_g = [k for k, v in out.items() if not v["grammar"]]
    no_v = [k for k, v in out.items() if not v["vocab"]]
    print(f"lesson      : {len(out)}")
    print(f"soal vocab  : {total_v}")
    print(f"soal grammar: {total_g}")
    print(f"lesson tanpa grammar: {len(no_g)} {no_g[:4]}")
    print(f"lesson tanpa vocab  : {len(no_v)} {no_v[:4]}")
    print(f"output      : {os.path.relpath(OUT, ROOT)} "
          f"({os.path.getsize(OUT) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()

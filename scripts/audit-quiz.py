"""
Audit the generated lesson quizzes for questions that can be answered without
knowing anything.

The quiz is built mechanically from the lessons' exercises, so the failure mode is
always the same shape: the option text carries information the prompt already
gives away. This script classifies every grammar item by that shape, so fixes can
be aimed at a class instead of at one screenshot.

Run: python3 scripts/audit-quiz.py [--examples N]
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIZ = os.path.join(ROOT, "src", "data", "lesson-quiz.json")

# Words too common to prove anything by appearing in both the prompt and an option.
STOP = set("""
der die das den dem des ein eine einen einem einer eines und oder aber nicht kein
keine ist sind war waren wird werden wurde wurden hat haben hatte hatten ich du er
sie es wir ihr man mit von zu im in am an auf für aus bei nach über unter vor durch
gegen ohne um als auch noch nur sehr mehr wie was wer wo wann warum welcher welche
welches diese dieser dieses dem den the a an is are was were be to of in on at for
with and or not no you it he she we they my your his her its our their this that
""".split())


def words(text: str) -> set[str]:
    return {w for w in re.findall(r"\w+", text.lower()) if len(w) > 3 and w not in STOP}


def norm(text: str) -> str:
    return re.sub(r"_{2,}", " ", text).strip().lower()


def audit_item(item: dict) -> list[str]:
    """Defect tags for one grammar item."""
    p, a, ds = item["prompt"], item["answer"], item["distractors"]
    tags = []

    if not ds:
        return ["no-distractor"]
    if len({d.lower() for d in ds}) != len(ds):
        tags.append("duplicate-options")
    if a.lower() in {d.lower() for d in ds}:
        tags.append("answer-in-options")

    # 1. A word from the prompt appears only in the right option: match the word
    #    and win. This is the one behind "das Dokument" vs "das Fenster".
    shared = words(p)
    if shared:
        leaked = [w for w in (words(a) & shared) if not any(w in words(d) for d in ds)]
        if leaked:
            tags.append("word-match")

    # 2. The answer is the prompt with something glued on ("Tisch ist groß." →
    #    "Der Tisch ist groß."), and the wrong options are unrelated sentences.
    np, na = norm(p), a.lower().strip(" .")
    if len(np) > 8 and np in na and not any(norm(d) in na or na in norm(d) for d in ds):
        tags.append("answer-contains-prompt")

    # 3. Every option shares the same first word ("das Dokument", "das Fenster"):
    #    the thing being taught is the same in all of them, so it is not tested.
    # Only an article counts: "das Dokument" / "das Fenster" hides the very thing
    # being taught. "Guten Morgen" / "Guten Abend" sharing "Guten" is fine.
    DET = {"der", "die", "das", "den", "dem", "des", "ein", "eine", "einen",
           "einem", "einer", "eines", "kein", "keine", "keinen", "mein", "meine"}
    first = {d.split()[0].lower() for d in ds if d.split()}
    if first and len(first) == 1 and a.split() and a.split()[0].lower() in first and first & DET:
        tags.append("same-article")

    # 4. Options are not interchangeable in kind: one is a sentence, the rest are
    #    words, so the odd one out is the answer.
    lens = [len(a)] + [len(d) for d in ds]
    if max(lens) > 3 * max(1, min(lens)) and max(lens) > 18:
        tags.append("length-skew")

    return tags or ["ok"]


def main() -> None:
    show = 3
    if "--examples" in sys.argv:
        show = int(sys.argv[sys.argv.index("--examples") + 1])

    data = json.load(open(QUIZ, encoding="utf-8"))
    tag_count: Counter = Counter()
    tag_lessons: defaultdict = defaultdict(set)
    by_lesson: defaultdict = defaultdict(Counter)
    examples: defaultdict = defaultdict(list)
    total = 0

    for key, rec in data.items():
        for item in rec["grammar"]:
            total += 1
            for tag in audit_item(item):
                tag_count[tag] += 1
                tag_lessons[tag].add(key)
                by_lesson[key][tag] += 1
                if tag != "ok" and len(examples[tag]) < show:
                    examples[tag].append((key, item["prompt"], item["answer"], item["distractors"]))

    clean = tag_count.get("ok", 0)
    print(f"soal grammar       : {total}")
    print(f"tanpa temuan       : {clean}  ({clean / total * 100:.0f}%)")
    print(f"dengan temuan      : {total - clean}  ({(total - clean) / total * 100:.0f}%)\n")

    print(f"{'temuan':26s} {'soal':>5s} {'lesson':>7s}   contoh")
    print("-" * 100)
    for tag, n in tag_count.most_common():
        if tag == "ok":
            continue
        ex = examples[tag][0] if examples[tag] else None
        head = f"[{ex[0]}] {ex[1][:34]}" if ex else ""
        print(f"{tag:26s} {n:5d} {len(tag_lessons[tag]):7d}   {head}")

    print("\n=== contoh per temuan ===")
    for tag in tag_count:
        if tag == "ok":
            continue
        print(f"\n## {tag}  ({tag_count[tag]} soal, {len(tag_lessons[tag])} lesson)")
        for key, p, a, ds in examples[tag]:
            print(f"  [{key}]")
            print(f"    soal   : {p[:70]}")
            print(f"    benar  : {a[:70]}")
            print(f"    salah  : {ds}")

    worst = sorted(by_lesson.items(), key=lambda kv: -sum(v for k, v in kv[1].items() if k != "ok"))[:10]
    print("\n=== lesson paling bermasalah ===")
    for key, c in worst:
        bad = sum(v for k, v in c.items() if k != "ok")
        top = ", ".join(f"{k}={v}" for k, v in c.most_common() if k != "ok")
        print(f"  {key:34s} {bad:3d} soal   {top}")


if __name__ == "__main__":
    main()

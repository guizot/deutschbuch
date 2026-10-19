#!/usr/bin/env python3
"""
Generate German pronunciation audio for every unique word in the quiz data.

Output: public/audio/<sha1(de)[:10]>.mp3  (48 kbps mono)

Incremental: files that already exist are skipped, so a rebuild after adding a
handful of words costs seconds. Filenames are content hashes, so the same word
maps to the same file everywhere it appears (quiz question, word table, ...).

Run via:  npm run tts        (auto re-execs into the Piper venv)
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEMES = os.path.join(ROOT, "src", "data", "themes.json")
OUTDIR = os.path.join(ROOT, "public", "audio")
MANIFEST = os.path.join(ROOT, "src", "data", "audio-manifest.json")

PIPER_VENV_PY = os.environ.get(
    "PIPER_PYTHON", os.path.expanduser("~/Documents/projects/piper-tts/venv/bin/python")
)
PIPER_MODEL = os.environ.get(
    "PIPER_MODEL",
    os.path.expanduser("~/Documents/projects/piper-tts/voices/de_DE-thorsten-medium.onnx"),
)
BITRATE = os.environ.get("TTS_BITRATE", "48k")
BATCH = 100  # ffmpeg inputs per process, keeps argv well under ARG_MAX

# Where a pre-built audio bundle lives, for machines without Piper.
# Override with AUDIO_BUNDLE_URL; set to "" to disable fetching entirely.
AUDIO_BUNDLE_URL = os.environ.get(
    "AUDIO_BUNDLE_URL",
    "https://github.com/guizot/deutschbuch/releases/download/audio-v1/audio-bundle.tar.gz",
)

# Piper is optional: a machine without it can still restore the audio from the
# release bundle. The re-exec into the venv therefore happens lazily, inside
# main(), only once something actually needs synthesising.
HAVE_PIPER = False
PIPER_IMPORT_ERROR = None
try:
    from piper import PiperVoice  # noqa: F401
    HAVE_PIPER = True
except ImportError as exc:  # noqa: BLE001
    PIPER_IMPORT_ERROR = exc


def collect_words():
    data = json.load(open(THEMES, encoding="utf-8"))
    seen = {}
    for theme in data["themes"]:
        for group in theme.get("groups", []):
            for w in group.get("words", []):
                text = (w.get("de") or "").strip()
                if not text:
                    continue
                h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
                seen.setdefault(h, text)
    # Vocabulary pages (/a1/wortschatz/ ...) render markdown tables, not themes.json,
    # and hold words the theme list does not cover. First column is "Deutsch".
    for text in collect_wortschatz_words():
        h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
        seen.setdefault(h, text)
    # Lesson vocabulary comes from the generated quiz data so both pipelines agree
    # on exactly which words exist (it is committed, so a fresh clone has it).
    qpath = os.path.join(ROOT, "src", "data", "lesson-quiz.json")
    if os.path.exists(qpath):
        try:
            for lesson in json.load(open(qpath, encoding="utf-8")).values():
                for w in lesson.get("vocab", []):
                    text = (w.get("de") or "").strip()
                    if text:
                        h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
                        seen.setdefault(h, text)
        except (ValueError, OSError) as exc:
            print(f"  peringatan: lesson-quiz.json tidak terbaca ({exc})")
    return seen


def collect_wortschatz_words():
    """First column of vocabulary tables in src/content/lessons/*/_wortschatz.md.

    Only tables whose header names a German column qualify. The same files also
    carry a progress table ("Topic | /25 | not started") and a source list, whose
    first column is not a word to pronounce.
    """
    import glob
    import re

    headers = {"deutsch", "phrase", "phrases", "collocation", "collocations",
               "redemittel", "ausdruck", "ausdrücke", "wort", "wörter"}
    words = set()

    def cells_of(line):
        return [c.strip() for c in line.strip().strip("|").split("|")]

    def is_separator(cells):
        return bool(cells) and all(set(c) <= set("-: ") for c in cells)

    for path in glob.glob(os.path.join(ROOT, "src", "content", "lessons", "*", "_wortschatz.md")):
        lines = open(path, encoding="utf-8").read().splitlines()
        header = None
        for idx, raw_line in enumerate(lines):
            line = raw_line.strip()
            if not line.startswith("|"):
                header = None
                continue
            cells = cells_of(line)
            if is_separator(cells):
                continue
            nxt = lines[idx + 1].strip() if idx + 1 < len(lines) else ""
            if nxt.startswith("|") and is_separator(cells_of(nxt)):
                header = re.sub(r"[*`_]", "", cells[0]).strip().lower()
                continue
            if header not in headers:
                continue
            first = re.sub(r"[*`_]", "", cells[0]).strip()
            if first:
                words.add(first)
    return words


def fetch_bundle():
    """Restore public/audio from the published tarball. True if any clip landed."""
    if not AUDIO_BUNDLE_URL:
        return False
    if shutil.which("curl") is None or shutil.which("tar") is None:
        print("bundle dilewati: curl atau tar tidak tersedia")
        return False

    print(f"audio belum lengkap — mencoba bundle: {AUDIO_BUNDLE_URL}")
    tmp = tempfile.mkdtemp(prefix="deutschbuch-bundle-")
    tgz = os.path.join(tmp, "audio-bundle.tar.gz")
    try:
        r = subprocess.run(
            ["curl", "-fsSL", "--max-time", "600", "-o", tgz, AUDIO_BUNDLE_URL],
            capture_output=True, text=True,
        )
        if r.returncode != 0 or not os.path.exists(tgz) or os.path.getsize(tgz) < 1024:
            print("  gagal unduh:", (r.stderr or "kosong").strip().splitlines()[-1][:160])
            return False
        print(f"  terunduh {os.path.getsize(tgz) / 1048576:.1f} MB, mengekstrak...")

        # The archive holds audio/<hash>.mp3, so it unpacks into public/.
        public_dir = os.path.dirname(OUTDIR)
        r = subprocess.run(["tar", "-xzf", tgz, "-C", public_dir],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print("  gagal ekstrak:", (r.stderr or "").strip()[:160])
            return False

        got = sum(1 for f in os.listdir(OUTDIR) if f.endswith(".mp3")) if os.path.isdir(OUTDIR) else 0
        print(f"  {got} file audio tersedia setelah ekstrak")
        return got > 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def ensure_piper():
    """Guarantee Piper is importable, re-execing into its venv once if needed."""
    if HAVE_PIPER:
        return
    if os.environ.get("_DEUTSCHBUCH_TTS_REEXEC") != "1" and os.path.exists(PIPER_VENV_PY):
        os.environ["_DEUTSCHBUCH_TTS_REEXEC"] = "1"
        os.execv(PIPER_VENV_PY, [PIPER_VENV_PY, os.path.abspath(__file__)] + sys.argv[1:])
    sys.exit(
        "Piper tidak tersedia dan bundle audio tidak bisa dipakai.\n"
        f"  venv Piper  : {PIPER_VENV_PY}\n"
        f"  error import: {PIPER_IMPORT_ERROR}\n"
        f"  bundle URL  : {AUDIO_BUNDLE_URL or '(dinonaktifkan)'}\n"
        "Pasang Piper, atau arahkan AUDIO_BUNDLE_URL ke bundle yang valid."
    )


def main():
    limit = None
    force = False
    for a in sys.argv[1:]:
        if a == "--force":
            force = True
        elif a.startswith("--limit="):
            limit = int(a.split("=", 1)[1])

    words = collect_words()
    os.makedirs(OUTDIR, exist_ok=True)

    todo = [
        (h, t) for h, t in sorted(words.items())
        if force or not os.path.exists(os.path.join(OUTDIR, h + ".mp3"))
        or os.path.getsize(os.path.join(OUTDIR, h + ".mp3")) < 1024
    ]
    print(f"kata unik: {len(words)}  |  sudah ada: {len(words) - len(todo)}  |  perlu dibuat: {len(todo)}")
    if not todo:
        print("audio sudah lengkap, tidak ada yang dirender.")
        write_manifest(words)
        return
    if limit:
        todo = todo[:limit]
        print(f"--limit={limit} → hanya {len(todo)} kata")

    # Prefer the published bundle when clips are missing: it needs no Piper, so a
    # fresh clone on a machine without the voice model still builds.
    if not limit and fetch_bundle():
        todo = [t for t in todo if not os.path.exists(os.path.join(OUTDIR, t[0] + ".mp3"))]
        if not todo:
            print("audio lengkap dari bundle, tidak ada yang dirender.")
            write_manifest(words)
            return
        print(f"  {len(todo)} kata masih perlu disintesis lokal")

    ensure_piper()
    from piper import PiperVoice

    print(f"memuat model: {os.path.basename(PIPER_MODEL)}")
    voice = PiperVoice.load(PIPER_MODEL)

    tmp = tempfile.mkdtemp(prefix="deutschbuch-tts-")
    try:
        wavs = []
        for i, (h, text) in enumerate(todo):
            wav = os.path.join(tmp, f"{i:05d}.wav")
            with wave.open(wav, "wb") as wf:
                voice.synthesize_wav(text, wf)
            wavs.append((wav, h))
            if (i + 1) % 100 == 0:
                print(f"  tts {i + 1}/{len(todo)}", flush=True)

        if len(wavs) != len(todo):
            sys.exit(f"jumlah wav ({len(wavs)}) != jumlah kata ({len(todo)})")

        print(f"encode mp3 ({len(wavs)} file, batch {BATCH})...", flush=True)
        for start in range(0, len(wavs), BATCH):
            chunk = wavs[start:start + BATCH]
            cmd = ["ffmpeg", "-y", "-v", "error"]
            for wav, _ in chunk:
                cmd += ["-i", wav]
            for idx, (_, h) in enumerate(chunk):
                cmd += ["-map", f"{idx}:a", "-c:a", "libmp3lame",
                        "-b:a", BITRATE, "-ac", "1",
                        os.path.join(OUTDIR, h + ".mp3")]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode != 0:
                sys.exit("ffmpeg gagal: " + r.stderr[-600:])
            print(f"  mp3 {min(start + BATCH, len(wavs))}/{len(wavs)}", flush=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    missing = [h for h, _ in todo
               if not os.path.exists(os.path.join(OUTDIR, h + ".mp3"))
               or os.path.getsize(os.path.join(OUTDIR, h + ".mp3")) < 1024]
    if missing:
        sys.exit(f"{len(missing)} file gagal dibuat: {missing[:5]}")

    write_manifest(words)
    existing = [h for h in words if os.path.exists(os.path.join(OUTDIR, h + ".mp3"))]
    total = sum(os.path.getsize(os.path.join(OUTDIR, h + ".mp3")) for h in existing)
    print(f"\nselesai: {len(existing)}/{len(words)} file, {total / 1048576:.1f} MB di public/audio/")


def write_manifest(words):
    json.dump({h: t for h, t in sorted(words.items())},
              open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"manifest: {os.path.relpath(MANIFEST, ROOT)}")


if __name__ == "__main__":
    main()

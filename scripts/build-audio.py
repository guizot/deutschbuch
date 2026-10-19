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

# Re-exec into the Piper venv when the system interpreter has no piper module.
# NOTE: do not compare sys.executable paths — venv/bin/python is a symlink to
# /usr/bin/python3.x, so realpath() makes the two look identical. Use a sentinel.
try:
    from piper import PiperVoice  # noqa: F401
except ImportError:
    if os.environ.get("_DEUTSCHBUCH_TTS_REEXEC") == "1":
        sys.exit(
            "piper tidak bisa di-import dari venv: "
            + PIPER_VENV_PY
            + "\n  coba: "
            + PIPER_VENV_PY
            + " -c 'from piper import PiperVoice'"
        )
    if not os.path.exists(PIPER_VENV_PY):
        sys.exit(f"venv Piper tidak ditemukan: {PIPER_VENV_PY}")
    os.environ["_DEUTSCHBUCH_TTS_REEXEC"] = "1"
    os.execv(PIPER_VENV_PY, [PIPER_VENV_PY, os.path.abspath(__file__)] + sys.argv[1:])


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
    return seen


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

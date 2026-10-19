#!/usr/bin/env bash
# Package public/audio into one tarball for a GitHub Release.
#
# The build script downloads this bundle when clips are missing and Piper is not
# installed, so a fresh clone on any machine can still build the site.
#
# Usage:  ./scripts/make-audio-bundle.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

OUT="audio-bundle.tar.gz"
[ -d public/audio ] || { echo "public/audio belum ada — jalankan 'npm run tts' dulu." >&2; exit 1; }

rm -f "$OUT"
tar -czf "$OUT" -C public audio

printf 'file  : %s\n' "$OUT"
printf 'ukuran: %s\n' "$(du -h "$OUT" | cut -f1)"
printf 'isi   : %s klip\n\n' "$(ls public/audio/*.mp3 | wc -l)"

cat <<'TXT'
Upload ke GitHub Release (tag: audio-v1), lalu pastikan URL di
scripts/build-audio.py cocok:

  https://github.com/guizot/deutschbuch/releases/download/audio-v1/audio-bundle.tar.gz

Lewat web:  Repo > Releases > Draft a new release > tag "audio-v1" >
            lampirkan audio-bundle.tar.gz > Publish release

Lewat gh CLI:
  gh release create audio-v1 audio-bundle.tar.gz \
     --title "Audio bundle v1" \
     --notes "Pre-built German pronunciation clips (public/audio)."
TXT

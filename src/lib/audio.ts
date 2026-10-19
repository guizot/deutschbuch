/**
 * Pemetaan kata Jerman → file audio.
 *
 * Nama file adalah sha1 dari teks kata, 10 karakter pertama. Fungsi ini HARUS
 * identik dengan `hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]` di
 * scripts/build-audio.py — kalau berbeda satu karakter, audio tidak akan ketemu.
 *
 * Karena berbasis isi, kata yang sama selalu menunjuk file yang sama, sehingga
 * satu file dipakai bersama oleh halaman quiz, tabel topik, dan mana pun nanti.
 */
import { createHash } from "node:crypto";

export function audioHash(de: string): string {
  return createHash("sha1").update(de.trim(), "utf8").digest("hex").slice(0, 10);
}

export function audioPath(de: string): string {
  return `/audio/${audioHash(de)}.mp3`;
}

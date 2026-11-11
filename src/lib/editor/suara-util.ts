/* ══════════ Suara (TTS) — fungsi MURNI ══════════
 * Tanpa DOM/React → bisa diuji dan diport ke Kotlin (padanan: TextToSpeech + utterance listener).
 * Suara memakai TTS bawaan browser (Web Speech API): gratis, tanpa key, tanpa server.
 */

/** Teks yang dibacakan: sisa kata setelah `offsetDetik` berjalan (resume di tengah scene). */
export function sisaTeks(teks: string, offsetDetik: number, durasi: number): string {
  const kata = teks.split(/\s+/).filter(Boolean)
  if (!kata.length) return ''
  if (offsetDetik < 0.8 || durasi <= 0) return kata.join(' ')
  const rasio = offsetDetik / durasi
  if (rasio >= 0.95) return ''
  return kata.slice(Math.floor(kata.length * rasio)).join(' ')
}

/** Durasi scene yang disarankan dari lama bicara nyata (+jeda napas), langkah 0,5 dtk, 2–15 dtk. */
export function durasiDisarankan(msBicara: number, jeda = 0.4): number {
  const d = Math.ceil((msBicara / 1000 + jeda) * 2) / 2
  return Math.min(15, Math.max(2, d))
}

/** Urutkan suara: Bahasa Indonesia dulu, lalu Melayu (mirip), lalu sisanya; nama menaik. */
export function urutkanSuara<T extends { lang: string; name: string }>(suara: T[]): T[] {
  const rank = (v: T) => {
    const l = v.lang.toLowerCase().replace('_', '-')
    return l.startsWith('id') ? 0 : l.startsWith('ms') ? 1 : 2
  }
  return [...suara].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

export function adaSuaraIndonesia(suara: { lang: string }[]): boolean {
  return suara.some((v) => v.lang.toLowerCase().replace('_', '-').startsWith('id'))
}

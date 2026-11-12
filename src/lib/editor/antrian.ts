'use client'

/* ══════════ Antrian pengembangan — kebutuhan baru dari AI ══════════
 * Saat JSON rancangan dari AI diimpor, bagian "kebutuhan_baru" (style, animasi, transisi, efek, fitur
 * yang belum ada di WokCam) dicatat di sini. Tersimpan di perangkat; daftar utama ada di docs/ANTRIAN.md.
 */

export const KUNCI_ANTRIAN = 'wokcam.antrian.v1'
export type ItemAntrian = { jenis: string; nama: string; deskripsi: string; alasan: string; waktu: string; jumlah: number }

export function bacaAntrian(): ItemAntrian[] {
  try {
    const raw = window.localStorage.getItem(KUNCI_ANTRIAN)
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Gabungkan kebutuhan dari satu impor. Nama+jenis sama → dihitung ulang (jumlah naik), bukan diduplikasi. */
export function catatKebutuhan(kebutuhan: unknown): number {
  if (!Array.isArray(kebutuhan)) return 0
  const daftar = bacaAntrian()
  let baru = 0
  for (const k of kebutuhan.slice(0, 50)) {
    const o = (k ?? {}) as Record<string, unknown>
    const jenis = String(o.jenis ?? 'lain').slice(0, 20)
    const nama = String(o.nama ?? '').trim().slice(0, 80)
    if (!nama) continue
    const ada = daftar.find((d) => d.jenis === jenis && d.nama.toLowerCase() === nama.toLowerCase())
    if (ada) { ada.jumlah += 1; continue }
    daftar.push({
      jenis, nama,
      deskripsi: String(o.deskripsi ?? '').slice(0, 300),
      alasan: String(o.alasan ?? '').slice(0, 200),
      waktu: new Date().toISOString(), jumlah: 1,
    })
    baru++
  }
  try { window.localStorage.setItem(KUNCI_ANTRIAN, JSON.stringify(daftar)) } catch { /* penuh */ }
  return baru
}

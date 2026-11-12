'use client'

/* ══════════ Aset overlay bawaan (generik, SVG di /public/aset) ══════════
 * Dipakai sebagai isi slot dari prompt (jenis_aset). Generik: bukan konten kreator lain.
 * Ditambah lewat daftar ini + berkas di public/aset/.
 */

export type AsetBawaan = { id: string; nama: string; file: string; kataCari: string };

export const ASET_BAWAAN: AsetBawaan[] = [
  { id: 'donat-persen', nama: 'Donat persen', file: 'donat-persen.svg', kataCari: 'circular progress chart' },
  { id: 'kartu-kode-gelap', nama: 'Kartu kode gelap', file: 'kartu-kode-gelap.svg', kataCari: 'dark code editor card' },
  { id: 'kartu-prompt-putih', nama: 'Kartu prompt putih', file: 'kartu-prompt-putih.svg', kataCari: 'white prompt card' },
  { id: 'tombol-bulat-3d', nama: 'Tombol bulat 3D', file: 'tombol-bulat-3d.svg', kataCari: '3d round button icon' },
  { id: 'logo-mahkota', nama: 'Logo mahkota', file: 'logo-mahkota.svg', kataCari: 'black crown logo' },
  { id: 'kartu-foto-bingkai', nama: 'Kartu foto bingkai', file: 'kartu-foto-bingkai.svg', kataCari: 'polaroid photo frame' },
];

export function asetBawaanUrl(id: string | undefined): string | null {
  if (!id) return null;
  const a = ASET_BAWAAN.find((x) => x.id === id);
  if (!a) return null;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${base}/aset/${a.file}`;
}

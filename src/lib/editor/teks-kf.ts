/* ══════════ Keyframe posisi teks (MURNI) ══════════
 * Posisi teks per scene = daftar keyframe {t, x, y}: t = detik sejak awal scene, x/y = pusat teks dalam %.
 * Di antara dua keyframe posisi digeser linear. Sebelum keyframe pertama = posisi pertama; sesudah terakhir = terakhir.
 * Kosong = tata letak bawaan (gaya teks: atas/tengah/bawah).
 */

export type KfTeks = { t: number; x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Bersihkan data dari JSON/autosave: angka dijepit, urut menurut t. */
export function kfTeksDariJSON(v: unknown): KfTeks[] {
  if (!Array.isArray(v)) return [];
  const out: KfTeks[] = [];
  for (const it of v.slice(0, 40)) {
    const o = (it ?? {}) as Record<string, unknown>;
    const t = Number(o.t), x = Number(o.x), y = Number(o.y);
    if (!Number.isFinite(t) || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ t: clamp(t, 0, 15), x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Posisi (%) pada waktu `t` detik dalam scene; null bila tanpa keyframe. */
export function posTeksDiWaktu(kf: KfTeks[], t: number): { x: number; y: number } | null {
  if (!kf.length) return null;
  if (t <= kf[0].t) return { x: kf[0].x, y: kf[0].y };
  const last = kf[kf.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y };
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i], b = kf[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
  }
  return { x: last.x, y: last.y };
}

/** Tulis posisi di waktu t: perbarui keyframe terdekat dalam `toleransi` detik, atau sisipkan baru. */
export function tulisKfTeks(kf: KfTeks[], t: number, x: number, y: number, toleransi = 0.25): KfTeks[] {
  const titik = { t: clamp(t, 0, 15), x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  let idx = -1, jarak = Infinity;
  kf.forEach((k, i) => { const d = Math.abs(k.t - titik.t); if (d < jarak) { jarak = d; idx = i; } });
  if (idx >= 0 && jarak <= toleransi) {
    return kf.map((k, i) => (i === idx ? { ...k, x: titik.x, y: titik.y } : k));
  }
  return [...kf, titik].sort((a, b) => a.t - b.t);
}

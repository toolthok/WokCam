/* ══════════ Render video — matematika animasi & transisi (MURNI, tanpa DOM) ══════════
 * Semua posisi dalam pecahan: dx/dy = fraksi lebar/tinggi kanvas. sc = skala, alpha = opasitas,
 * clip = 0..1 (sapuan dari sisi `sisi`). Dipakai renderer kanvas; diuji dengan scripts/test-render-math.ts.
 */

export type Pose = { alpha: number; dx: number; dy: number; sc: number; clip: number | null; sisi: string };
export const IDENT: Pose = { alpha: 1, dx: 0, dy: 0, sc: 1, clip: null, sisi: '' };

/** Minimal bentuk preset (cocok dengan PresetAnimasi Koleksi). */
export type PresetLike = { gerakan: string; arah?: string; durasi_ms: number; intensitas?: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function gabung(...ps: (Pose | null | undefined)[]): Pose {
  const r: Pose = { ...IDENT };
  for (const p of ps) {
    if (!p) continue;
    r.alpha *= p.alpha;
    r.dx += p.dx;
    r.dy += p.dy;
    r.sc *= p.sc;
    if (p.clip !== null) { r.clip = p.clip; r.sisi = p.sisi; }
  }
  return r;
}

/** Arah sisi asal → vektor (−1..1). kiri = dari kiri. */
export function arahDir(arah: string | undefined): [number, number] {
  switch (arah) {
    case 'kiri': return [-1, 0];
    case 'kanan': return [1, 0];
    case 'atas': return [0, -1];
    case 'bawah': return [0, 1];
    default: return [0, 0];
  }
}

/** Segitiga 0→1→0 dengan periode `periode` detik (seperti WAAPI alternate). */
export function segitiga(t: number, periode: number): number {
  if (periode <= 0) return 0;
  const u = (((t % (2 * periode)) + 2 * periode) % (2 * periode)) / periode;
  return u <= 1 ? u : 2 - u;
}

function efekMasuk(g: string, arah: string | undefined, x: number): Pose {
  const [dx, dy] = arahDir(arah);
  switch (g) {
    case 'slide':
    case 'bounce':
      return { alpha: x, dx: dx * (1 - x) * 0.25, dy: dy * (1 - x) * 0.25, sc: 1, clip: null, sisi: '' };
    case 'zoom': return { alpha: x, dx: 0, dy: 0, sc: 0.6 + 0.4 * x, clip: null, sisi: '' };
    case 'shrink': return { alpha: x, dx: 0, dy: 0, sc: 1.4 - 0.4 * x, clip: null, sisi: '' };
    case 'wipe': return { alpha: 1, dx: 0, dy: 0, sc: 1, clip: x, sisi: arah ?? '' };
    default: return { alpha: x, dx: 0, dy: 0, sc: 1, clip: null, sisi: '' }; // fade & lainnya
  }
}

function efekKeluar(g: string, arah: string | undefined, x: number): Pose {
  const [dx, dy] = arahDir(arah);
  switch (g) {
    case 'slide':
    case 'bounce':
      return { alpha: 1 - x, dx: dx * x * 0.25, dy: dy * x * 0.25, sc: 1, clip: null, sisi: '' };
    case 'zoom':
    case 'shrink':
      return { alpha: 1 - x, dx: 0, dy: 0, sc: 1 - 0.4 * x, clip: null, sisi: '' };
    case 'wipe': return { alpha: 1, dx: 0, dy: 0, sc: 1, clip: 1 - x, sisi: arah ?? '' };
    default: return { alpha: 1 - x, dx: 0, dy: 0, sc: 1, clip: null, sisi: '' };
  }
}

/** Pose animasi masuk/keluar pada `off` detik dari awal elemen (durasi elemen D). */
export function animasiMasukKeluar(p: PresetLike | null, off: number, D: number, tipe: 'in' | 'out'): Pose {
  if (!p) return IDENT;
  const dur = clamp(p.durasi_ms / 1000, 0.05, Math.max(0.05, D));
  if (tipe === 'in') {
    if (off >= dur) return IDENT;
    if (p.gerakan === 'kata') return IDENT; // kata-demi-kata ditangani renderer teks
    return efekMasuk(p.gerakan, p.arah, clamp(off / dur, 0, 1));
  }
  const mulai = D - dur;
  if (off < mulai) return IDENT;
  return efekKeluar(p.gerakan, p.arah, clamp((off - mulai) / dur, 0, 1));
}

/** Pose gerak loop (latar/aset). pan memakai skala dasar 1,06 seperti pratinjau. */
export function animasiLoop(p: PresetLike | null, t: number): Pose {
  if (!p) return IDENT;
  const amp = clamp(p.intensitas ?? 100, 0, 200) / 100;
  const dur = clamp(p.durasi_ms, 600, 6000) / 1000;
  const k = segitiga(t, dur);
  switch (p.gerakan) {
    case 'zoom_in': return { alpha: 1, dx: 0, dy: 0, sc: 1 + 0.1 * amp * k, clip: null, sisi: '' };
    case 'zoom_out': return { alpha: 1, dx: 0, dy: 0, sc: 1 + 0.1 * amp * (1 - k), clip: null, sisi: '' };
    case 'pan_kiri': return { alpha: 1, dx: -0.02 * amp * k, dy: 0, sc: 1.06, clip: null, sisi: '' };
    case 'pan_kanan': return { alpha: 1, dx: 0.02 * amp * k, dy: 0, sc: 1.06, clip: null, sisi: '' };
    case 'pan_atas': return { alpha: 1, dx: 0, dy: -0.02 * amp * k, sc: 1.06, clip: null, sisi: '' };
    case 'pan_bawah': return { alpha: 1, dx: 0, dy: 0.02 * amp * k, sc: 1.06, clip: null, sisi: '' };
    default: return IDENT;
  }
}

/** Pose untuk scene A (keluar) dan B (masuk) selama transisi, q = progres 0..1. */
export function transisiPose(gerakan: string, arah: string, q: number): { A: Pose; B: Pose } {
  const [dx, dy] = arahDir(arah);
  switch (gerakan) {
    case 'slide':
      return {
        A: { alpha: 1, dx: -dx * q, dy: -dy * q, sc: 1, clip: null, sisi: '' },
        B: { alpha: 1, dx: dx * (1 - q), dy: dy * (1 - q), sc: 1, clip: null, sisi: '' },
      };
    case 'zoom':
      return {
        A: { alpha: 1 - q, dx: 0, dy: 0, sc: 1 + 0.3 * q, clip: null, sisi: '' },
        B: { alpha: q, dx: 0, dy: 0, sc: 0.6 + 0.4 * q, clip: null, sisi: '' },
      };
    case 'wipe':
      return {
        A: IDENT,
        B: { alpha: 1, dx: 0, dy: 0, sc: 1, clip: q, sisi: arah },
      };
    default: // crossfade, blur, lainnya
      return {
        A: { alpha: 1 - q, dx: 0, dy: 0, sc: 1, clip: null, sisi: '' },
        B: { alpha: q, dx: 0, dy: 0, sc: 1, clip: null, sisi: '' },
      };
  }
}

/* ── warna: kelas gradien Tailwind → hex (untuk latar di kanvas) ── */
const HEX: Record<string, string> = {
  'black': '#000000', 'white': '#ffffff',
  'zinc-100': '#f4f4f5', 'zinc-200': '#e4e4e7', 'zinc-300': '#d4d4d8', 'zinc-400': '#a1a1aa', 'zinc-700': '#3f3f46',
  'zinc-900': '#18181b', 'zinc-950': '#09090b',
  'sky-300': '#7dd3fc', 'emerald-300': '#6ee7b7', 'emerald-400': '#34d399', 'emerald-700': '#047857',
  'emerald-800': '#065f46', 'emerald-950': '#022c22', 'green-700': '#15803d', 'teal-600': '#0d9488',
  'teal-900': '#134e4a', 'amber-400': '#fbbf24', 'rose-600': '#e11d48', 'rose-900': '#881337',
  'purple-800': '#6b21a8', 'purple-900': '#581c87', 'blue-800': '#1e40af', 'indigo-950': '#1e1b4b',
  'red-600': '#dc2626', 'violet-500': '#8b5cf6', 'violet-900': '#4c1d95', 'fuchsia-600': '#c026d3',
  'fuchsia-950': '#4a044e', 'pink-500': '#ec4899', 'orange-500': '#f97316',
};

/** "from-x via-y to-z" → daftar hex berurutan (from, via, to). Token tak dikenal → abu-abu. */
export function warnaDariKelas(kelas: string): string[] {
  const out: string[] = [];
  const re = /\b(?:from|via|to)-([a-z]+(?:-\d{2,3})?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(kelas))) out.push(HEX[m[1]] ?? '#52525b');
  return out.length ? out : ['#3f3f46', '#18181b'];
}

/** Resolusi keluaran per rasio (sisi pendek ≈ 720 px untuk 9:16 — ringan di tablet). */
export function resolusiRasio(rasio: string): [number, number] {
  if (rasio === '1:1') return [1080, 1080];
  if (rasio === '16:9') return [1280, 720];
  return [720, 1280];
}

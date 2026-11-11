/* ══════════ Sampler video (hanya browser) — cuplik frame → analisis ══════════
 * Pakai <video> tersembunyi + seek per frame (deterministik, jalan di Chrome Android).
 * Semua pemrosesan di perangkat; video TIDAK diunggah ke mana pun.
 */
import {
  LEBAR, TINGGI, tandaDariPiksel, analisisStruktur, estimasiGayaTeks, gabungHasil,
  type Tanda, type ItemDeteksi, type Struktur, type GayaTeks,
} from "./video-analyzer";

export type Progres = { tahap: string; persen: number };
export type OpsiAnalisis = {
  fps?: number;                       // default 8
  maksDetik?: number;                 // default 60
  onProgres?: (p: Progres) => void;
  sinyal?: { batal: boolean };
};
export type HasilAnalisis = { items: ItemDeteksi[]; struktur: Struktur; dipotong: boolean };

function tungguEvent(v: HTMLVideoElement, ok: string, batasMs: number): Promise<void> {
  return new Promise((res, rej) => {
    const timer = setTimeout(() => { bersih(); res(); }, batasMs);
    const gagal = () => { bersih(); rej(new Error("Video tidak bisa dibaca browser (format/codec tidak didukung).")); };
    const bersih = () => { clearTimeout(timer); v.removeEventListener(ok, sukses); v.removeEventListener("error", gagal); };
    const sukses = () => { bersih(); res(); };
    v.addEventListener(ok, sukses); v.addEventListener("error", gagal);
  });
}

async function cari(v: HTMLVideoElement, t: number): Promise<void> {
  if (Math.abs(v.currentTime - t) < 0.001) return;
  const tunggu = tungguEvent(v, "seeked", 4000);
  v.currentTime = t;
  await tunggu;
}

export async function analisisBerkasVideo(berkas: File, opsi: OpsiAnalisis = {}): Promise<HasilAnalisis> {
  const fps = opsi.fps ?? 8, maks = opsi.maksDetik ?? 60, dtMs = 1000 / fps;
  const lapor = (tahap: string, persen: number) => opsi.onProgres?.({ tahap, persen });
  const url = URL.createObjectURL(berkas);
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
  try {
    lapor("Membuka video…", 0);
    if (v.readyState < 1) await tungguEvent(v, "loadedmetadata", 15000);
    if (!Number.isFinite(v.duration) || v.duration <= 0) throw new Error("Durasi video tidak terbaca.");
    if (v.readyState < 2) await tungguEvent(v, "loadeddata", 15000);

    const durasi = Math.min(v.duration, maks), dipotong = v.duration > maks;
    const kanvas = document.createElement("canvas");
    kanvas.width = LEBAR; kanvas.height = TINGGI;
    const ctx = kanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas tidak tersedia.");

    const jumlah = Math.max(8, Math.floor(durasi * fps));
    const frames: Tanda[] = [];
    for (let i = 0; i < jumlah; i++) {
      if (opsi.sinyal?.batal) throw new Error("Dibatalkan.");
      const t = Math.min(durasi - 0.01, (i * dtMs) / 1000);
      await cari(v, t);
      ctx.drawImage(v, 0, 0, LEBAR, TINGGI);
      frames.push(tandaDariPiksel(ctx.getImageData(0, 0, LEBAR, TINGGI).data, LEBAR, TINGGI, t));
      if (i % 6 === 0) lapor("Membaca frame…", Math.round((i / jumlah) * 85));
    }

    lapor("Menganalisis transisi & animasi…", 88);
    const struktur = analisisStruktur(frames, dtMs);

    lapor("Membaca gaya teks…", 94);
    const potret = v.videoHeight > v.videoWidth;
    const gw = potret ? 108 : 192, gh = potret ? 192 : 108;
    const k2 = document.createElement("canvas"); k2.width = gw; k2.height = gh;
    const c2 = k2.getContext("2d", { willReadFrequently: true });
    const gaya: (GayaTeks | null)[] = [];
    if (c2) for (const t of struktur.waktuSampelGaya) {
      await cari(v, Math.min(durasi - 0.01, t));
      c2.drawImage(v, 0, 0, gw, gh);
      gaya.push(estimasiGayaTeks(c2.getImageData(0, 0, gw, gh).data, gw, gh));
    }
    lapor("Selesai", 100);
    return { items: gabungHasil(struktur, gaya, berkas.name), struktur, dipotong };
  } finally {
    URL.revokeObjectURL(url);
    v.removeAttribute("src"); v.load();
  }
}

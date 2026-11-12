'use client'

/* ══════════ Render video di browser (kanvas + MediaRecorder) ══════════
 * Menggambar ulang setiap scene ke kanvas, memutar audio TTS Gemini yang sudah dibuat ke
 * MediaStream, lalu merekam keduanya. Render berjalan REAL-TIME: video 60 dtk = ±60 dtk.
 * Batas: font memakai sans-serif sistem; grain/bokeh disederhanakan; suara browser tidak ikut.
 */

import { hitungTiming, kelasLatar, overlayDariId, sceneIndexDiWaktu, totalDurasi, transisiDiWaktu, uraiTeks, type SceneProyek } from '@/lib/editor/proyek'
import { koleksiStore, type Koleksi, type PresetAnimasi } from '@/lib/preset-store'
import { urlAset } from '@/lib/editor/aset-store'
import { kunciScene, useSuara } from '@/lib/editor/suara'
import { muatDariCache } from '@/lib/editor/suara-gemini'
import { useEditor } from '@/lib/editor/store'
import {
  IDENT, animasiLoop, animasiMasukKeluar, gabung, transisiPose, warnaDariKelas, resolusiRasio, type Pose,
} from '@/lib/editor/render-math'
import { posTeksDiWaktu } from '@/lib/editor/teks-kf'

export type ProgresRender = { persen: number; t: number; total: number };
type Media = { tipe: 'gambar' | 'video'; el: HTMLImageElement | HTMLVideoElement; w: number; h: number };

const presetDari = (k: Koleksi, nama: string | null | undefined, tipe: 'in' | 'out' | 'loop'): PresetAnimasi | null =>
  nama ? k.presets.find((p) => p.nama === nama && p.tipe === tipe) ?? null : null;

const tunggu = (el: HTMLMediaElement, ev: string, ms: number) => new Promise<void>((res) => {
  const t = setTimeout(res, ms);
  el.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true });
});

async function muatMedia(scenes: SceneProyek[]): Promise<Map<string, Media>> {
  const map = new Map<string, Media>();
  for (const sc of scenes) for (const a of sc.aset ?? []) {
    if (map.has(a.id)) continue;
    const url = await urlAset(a.id);
    if (!url) continue;
    if (a.tipe === 'gambar') {
      const img = new Image();
      img.src = url;
      await img.decode().catch(() => {});
      map.set(a.id, { tipe: 'gambar', el: img, w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    } else {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      await tunggu(v, 'loadeddata', 8000);
      map.set(a.id, { tipe: 'video', el: v, w: v.videoWidth || 1, h: v.videoHeight || 1 });
    }
  }
  return map;
}

/* ── penggambaran ── */

type Konteks = {
  ctx: CanvasRenderingContext2D; W: number; H: number; koleksi: Koleksi; media: Map<string, Media>; t: number;
};

function jalurPersegiBulat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Terapkan pose di sekitar titik jangkar (cx,cy), lalu jalankan `gambar`. */
function denganPose(k: Konteks, p: Pose, cx: number, cy: number, gambar: () => void) {
  const { ctx, W, H } = k;
  ctx.save();
  if (p.clip !== null) {
    const c = Math.max(0, Math.min(1, p.clip));
    if (p.sisi === 'kiri') ctx.rect(0, 0, W * c, H);
    else if (p.sisi === 'kanan') ctx.rect(W * (1 - c), 0, W * c, H);
    else if (p.sisi === 'atas') ctx.rect(0, 0, W, H * c);
    else ctx.rect(0, H * (1 - c), W, H * c);
    ctx.clip();
  }
  ctx.globalAlpha *= Math.max(0, Math.min(1, p.alpha));
  ctx.translate(cx + p.dx * W, cy + p.dy * H);
  ctx.scale(p.sc, p.sc);
  ctx.translate(-cx, -cy);
  gambar();
  ctx.restore();
}

function gambarLatar(k: Konteks, sc: SceneProyek, off: number, lat: Pose) {
  const { ctx, W, H } = k;
  const kelas = kelasLatar(sc.latarPreset, sc.mood);
  const warna = warnaDariKelas(kelas);
  const grad = ctx.createLinearGradient(0, 0, W, H);
  warna.forEach((c, i) => grad.addColorStop(warna.length === 1 ? 0 : i / (warna.length - 1), c));
  const loop = animasiLoop(presetDari(k.koleksi, sc.animLoop, 'loop'), k.t);
  denganPose(k, gabung(lat, loop), W / 2, H / 2, () => { ctx.fillStyle = grad; ctx.fillRect(-W, -H, W * 3, H * 3); });
  void off;
}

function gambarKartu(k: Konteks, sc: SceneProyek, p: Pose) {
  const { ctx, W, H } = k;
  const lebar = W * 0.62, tinggi = lebar * 0.62, x = (W - lebar) / 2, y = H * 0.09;
  const cx = W / 2, cy = y + tinggi / 2;
  denganPose(k, p, cx, cy, () => {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(-2.5 * Math.PI / 180); ctx.translate(-cx, -cy);
    ctx.shadowColor = 'rgba(24,24,27,0.18)'; ctx.shadowBlur = H * 0.03; ctx.shadowOffsetY = H * 0.01;
    ctx.fillStyle = '#ffffff';
    jalurPersegiBulat(ctx, x, y, lebar, tinggi, H * 0.02); ctx.fill();
    ctx.shadowColor = 'transparent';
    const pad = H * 0.022;
    ['#d4d4d8', '#d4d4d8', '#d4d4d8'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + pad + i * H * 0.02, y + pad + H * 0.006, H * 0.0055, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#27272a';
    ctx.font = `700 ${H * 0.04}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(sc.kartu ?? '', x + pad, y + pad + H * 0.05, lebar - pad * 2);
    ctx.restore();
  });
}

function gambarOverlay(k: Konteks, sc: SceneProyek, progres: number) {
  const { ctx, W, H } = k;
  const ov = overlayDariId(sc.overlayId);
  if (ov) switch (ov.id) {
    case 'vignette': {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); break;
    }
    case 'letterbox':
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H * 0.1); ctx.fillRect(0, H * 0.9, W, H * 0.1); break;
    case 'haze': {
      const g = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W);
      g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); break;
    }
    case 'progress':
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(0, H * 0.985, W * progres, H * 0.008); break;
    default: break; // grain & lainnya: tidak digambar (batas renderer)
  }
  /* gradien gelap atas-bawah agar teks terbaca (seperti pratinjau), kecuali latar terang */
  if (!sc.latarPreset || !/kertas/.test(sc.latarPreset)) {
    const a = ctx.createLinearGradient(0, 0, 0, H * 0.06);
    a.addColorStop(0, 'rgba(0,0,0,0.4)'); a.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = a; ctx.fillRect(0, 0, W, H * 0.06);
    const b = ctx.createLinearGradient(0, H * 0.92, 0, H);
    b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = b; ctx.fillRect(0, H * 0.92, W, H * 0.08);
  }
}

function gambarAset(k: Konteks, sc: SceneProyek, off: number) {
  const { ctx, W, H, koleksi, t } = k;
  for (const a of sc.aset ?? []) {
    const sisa = Math.max(0, sc.durasi - a.mulai);
    const tampil = a.durasi > 0 ? Math.min(a.durasi, sisa) : sisa;
    const rel = off - a.mulai;
    if (rel < 0 || rel >= tampil) continue;
    const m = k.media.get(a.id);
    if (!m) continue;
    if (m.tipe === 'video') {
      const v = m.el as HTMLVideoElement;
      if (v.readyState >= 2 && Math.abs(v.currentTime - rel) > 0.3) { try { v.currentTime = rel; } catch { /* abaikan */ } }
    }
    const wid = (a.lebar / 100) * W, hei = wid * (m.h / m.w);
    const cx = (a.x / 100) * W, cy = (a.y / 100) * H;
    const pose = gabung(
      animasiMasukKeluar(presetDari(koleksi, a.animIn, 'in'), rel, tampil, 'in'),
      animasiMasukKeluar(presetDari(koleksi, a.animOut, 'out'), rel, tampil, 'out'),
      animasiLoop(presetDari(koleksi, a.animLoop, 'loop'), t),
    );
    ctx.save();
    ctx.globalAlpha *= a.opacity;
    denganPose(k, pose, cx, cy, () => {
      const x = cx - wid / 2, y = cy - hei / 2;
      const gaya = a.gaya ?? 'biasa';
      if (gaya === 'bayangan') { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = H * 0.03; ctx.shadowOffsetY = H * 0.015; }
      if (gaya === 'bulat') { ctx.save(); jalurPersegiBulat(ctx, x, y, wid, hei, Math.min(wid, hei) * 0.16); ctx.clip(); }
      if (m.tipe === 'gambar' || (m.el as HTMLVideoElement).readyState >= 2) ctx.drawImage(m.el, x, y, wid, hei);
      if (gaya === 'bulat') ctx.restore();
      if (gaya === 'bingkai') { ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, H * 0.004); ctx.strokeRect(x, y, wid, hei); }
    });
    ctx.restore();
  }
}

function ukurKata(ctx: CanvasRenderingContext2D, teks: string, font: string): number {
  ctx.font = font;
  return ctx.measureText(teks).width;
}

function gambarTeks(k: Konteks, sc: SceneProyek, off: number) {
  const { ctx, W, H, koleksi } = k;
  const style = sc.style ? koleksi.styles.find((p) => p.nama === sc.style) ?? null : null;
  const size = style ? style.ukuran * H / 1080 : H * 0.034;
  const tebal = style ? Math.max(0, style.tebal_outline * H / 1080) : 0;
  const bobot = style?.font === 'montserrat_black' ? 900 : style?.font === 'poppins_regular' ? 400 : 700;
  const kataList = uraiTeks(sc.teks || sc.naskah);
  if (!kataList.length) return;

  /* pecah jadi baris (bungkus sederhana) */
  const fontDari = (gaya: string, s: number) => `${gaya === 'miring' ? 'italic ' : ''}${gaya === 'tebal' ? 900 : bobot} ${s}px sans-serif`;
  const baris: { kata: string; gaya: string; lebar: number; font: string; idx: number }[][] = [[]];
  let lebarBaris = 0;
  const maks = W * 0.86;
  kataList.forEach((seg, idx) => {
    const s = seg.gaya === 'tebal' ? size * 1.1 : size;
    const font = fontDari(seg.gaya, s);
    const w = ukurKata(ctx, seg.kata, font);
    const spasi = ukurKata(ctx, ' ', font);
    const baru = lebarBaris === 0 ? w : lebarBaris + spasi + w;
    if (baru > maks && baris[baris.length - 1].length) { baris.push([]); lebarBaris = w; }
    else lebarBaris = baru;
    baris[baris.length - 1].push({ kata: seg.kata, gaya: seg.gaya, lebar: w, font, idx });
  });

  const lh = size * 1.18;
  const blok = baris.length * lh;
  const posisi = style?.posisi ?? 'bawah';
  const y0 = posisi === 'atas' ? H * 0.07 : posisi === 'tengah' ? (H - blok) / 2 : H * 0.91 - blok;
  const pk = sc.kfTeks?.length ? posTeksDiWaktu(sc.kfTeks, off) : null;
  const cxT = pk ? (pk.x / 100) * W : W / 2;
  const yAwal = pk ? (pk.y / 100) * H - blok / 2 : y0;

  /* animasi masuk kata-demi-kata (jendela ≤55% scene) */
  const pIn = presetDari(koleksi, sc.animIn, 'in');
  const kataMode = pIn?.gerakan === 'kata';
  const n = kataList.length;
  const jendela = kataMode ? sc.durasi * 0.55 : 0;
  const pose = gabung(
    animasiMasukKeluar(pIn, off, sc.durasi, 'in'),
    animasiMasukKeluar(presetDari(koleksi, sc.animOut, 'out'), off, sc.durasi, 'out'),
  );
  denganPose(k, pose, cxT, yAwal + blok / 2, () => {
    baris.forEach((bar, bi) => {
      const total = bar.reduce((s, b, i) => s + b.lebar + (i ? ukurKata(ctx, ' ', b.font) : 0), 0);
      let x = cxT - total / 2;
      const y = yAwal + bi * lh + lh / 2;
      ctx.textBaseline = 'middle';
      for (const b of bar) {
        let alpha = 1;
        if (kataMode) {
          const mulaiKata = (b.idx / n) * jendela;
          alpha = Math.max(0, Math.min(1, (off - mulaiKata) / 0.15));
        }
        ctx.globalAlpha = alpha;
        ctx.font = b.font;
        const warnaKata = b.gaya === 'miring' ? '#d4d4d8' : (style?.warna_teks ?? '#FFFFFF');
        ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 10 * H / 1080; ctx.shadowOffsetY = 2 * H / 1080;
        if (tebal > 0) { ctx.lineWidth = Math.max(0.6, tebal); ctx.strokeStyle = style?.warna_outline ?? '#000000'; ctx.strokeText(b.kata, x, y); }
        ctx.fillStyle = warnaKata;
        ctx.fillText(b.kata, x, y);
        x += b.lebar + ukurKata(ctx, ' ', b.font);
        ctx.shadowColor = 'transparent';
      }
      ctx.globalAlpha = 1;
    });
  });
}

function gambarSceneLapis(k: Konteks, sc: SceneProyek, off: number, lapis: Pose, progres: number) {
  const { W, H, koleksi } = k;
  const D = sc.durasi;
  denganPose(k, lapis, W / 2, H / 2, () => {
    /* latar (+ animasi masuk/keluar latar & gerak loop) */
    gambarLatar(k, sc, off, gabung(
      animasiMasukKeluar(presetDari(koleksi, sc.animLatar?.in, 'in'), off, D, 'in'),
      animasiMasukKeluar(presetDari(koleksi, sc.animLatar?.out, 'out'), off, D, 'out'),
    ));
    /* kartu mengambang */
    if (sc.kartu) gambarKartu(k, sc, gabung(
      animasiMasukKeluar(presetDari(koleksi, sc.animKartu?.in, 'in'), off, D, 'in'),
      animasiMasukKeluar(presetDari(koleksi, sc.animKartu?.out, 'out'), off, D, 'out'),
    ));
    gambarOverlay(k, sc, progres);
    gambarAset(k, sc, off);
    gambarTeks(k, sc, off);
  });
}

function gambarBranding(k: Konteks, badge: string | null, watermark: string | null) {
  const { ctx, W, H } = k;
  if (badge) {
    ctx.font = `700 ${H * 0.03}px sans-serif`;
    const pad = H * 0.03, tw = ctx.measureText(badge).width, h = H * 0.052;
    const x = (W - tw - pad * 2) / 2, y = H * 0.032;
    ctx.save();
    ctx.shadowColor = 'rgba(24,24,27,0.14)'; ctx.shadowBlur = H * 0.016; ctx.shadowOffsetY = H * 0.006;
    ctx.fillStyle = '#ffffff'; jalurPersegiBulat(ctx, x, y, tw + pad * 2, h, h / 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#18181b'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(badge, x + pad, y + h / 2);
  }
  if (watermark) {
    ctx.font = `600 ${H * 0.02}px sans-serif`;
    ctx.fillStyle = 'rgba(113,113,122,0.85)'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    ctx.fillText(watermark, W / 2, H * 0.984);
    ctx.textAlign = 'left';
  }
}

/** Gambar satu bingkai pada waktu t (detik). */
export function gambarBingkai(k: Konteks, scenes: SceneProyek[], segs: ReturnType<typeof hitungTiming>, total: number, judul: string, badge: string | null, watermark: string | null) {
  void judul;
  const { ctx, W, H } = k;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const t = k.t;
  const trans = transisiDiWaktu(scenes, k.koleksi, t);
  if (trans) {
    const q = trans.q;
    const { A, B } = transisiPose(trans.gerakan, trans.presetArah, q);
    const sa = scenes[trans.indexA], sb = scenes[trans.indexB];
    gambarSceneLapis(k, sa, t - (segs[trans.indexA]?.mulai ?? 0), A, progresDi(segs, trans.indexA, t, total));
    gambarSceneLapis(k, sb, t - (segs[trans.indexB]?.mulai ?? 0), B, progresDi(segs, trans.indexB, t, total));
  } else {
    const i = sceneIndexDiWaktu(segs, t);
    const sc = scenes[i];
    if (sc) gambarSceneLapis(k, sc, t - (segs[i]?.mulai ?? 0), IDENT, progresDi(segs, i, t, total));
  }
  gambarBranding(k, badge, watermark);
}

function progresDi(segs: ReturnType<typeof hitungTiming>, i: number, t: number, total: number): number {
  const s = segs[i];
  if (!s || total <= 0) return 0;
  return Math.max(0, Math.min(1, (t - s.mulai) / Math.max(0.001, s.dur)));
}

/* ── perekaman ── */

function pilihMime(): string {
  /* WebM diutamakan: rekaman MP4 di Chrome Android berhenti menulis data setelah beberapa detik */
  const kandidat = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
  return kandidat.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

export function dukungRender(): boolean {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

export type HasilRender = { blob: Blob; mime: string; ext: string; suara: string; frames: number; detikNyata: number };

export async function renderVideo(opts: {
  onProgres: (p: ProgresRender) => void;
  sinyal: { batal: boolean };
}): Promise<HasilRender> {
  if (!dukungRender()) throw new Error('Browser ini tidak bisa merekam video (MediaRecorder/captureStream). Coba Chrome terbaru.');
  const st = useEditor.getState();
  const scenes = st.scenes;
  if (!scenes.length) throw new Error('Belum ada scene untuk dirender.');
  const koleksi = koleksiStore.getSnapshot();
  const segs = hitungTiming(scenes);
  const total = totalDurasi(scenes);
  const [W, H] = resolusiRasio(st.rasio);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kanvas tidak tersedia di perangkat ini.');

  /* suara: hanya Gemini (audio asli). Suara browser tidak bisa diambil ke berkas. */
  const p = useSuara.getState();
  const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const audioCtx = new AC();
  const dest = audioCtx.createMediaStreamDestination();
  let suaraCatatan = 'tanpa suara';
  let adaAudio = 0;
  if (p.provider === 'gemini' && p.gKey) {
    suaraCatatan = 'suara Gemini';
    for (let i = 0; i < scenes.length; i++) {
      const e = await muatDariCache(kunciScene(scenes[i], p));
      if (!e) continue;
      try {
        const buf = await (await fetch(e.url)).arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buf.slice(0));
        const src = audioCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(dest);
        src.start(audioCtx.currentTime + segs[i].mulai);
        adaAudio++;
      } catch { /* satu scene gagal didekode — lewati */ }
    }
  } else {
    suaraCatatan = 'tanpa suara (aktifkan penyedia Gemini di dialog Suara untuk suara di video)';
  }

  const media = await muatMedia(scenes);
  const stream = canvas.captureStream(30);
  /* track audio kosong (tanpa sumber) membuat perekaman berhenti di sebagian perangkat — hanya dipasang bila ada suara */
  if (adaAudio > 0) dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const mime = pilihMime();
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const k: Konteks = { ctx, W, H, koleksi, media, t: 0 };
  /* video overlay: mainkan agar frame tersedia */
  media.forEach((m) => { if (m.tipe === 'video') (m.el as HTMLVideoElement).play().catch(() => {}); });

  return new Promise<HasilRender>((resolve, reject) => {
    const mulai = performance.now();
    let selesai = false;
    let frames = 0;
    rec.onstop = () => {
      audioCtx.close().catch(() => {});
      const jenis = mime || rec.mimeType || 'video/webm';
      const ext = jenis.includes('mp4') ? 'mp4' : 'webm';
      resolve({
        blob: new Blob(chunks, { type: jenis.split(';')[0] }), mime: jenis, ext, suara: suaraCatatan,
        frames, detikNyata: (performance.now() - mulai) / 1000,
      });
    };
    rec.onerror = () => { if (!selesai) reject(new Error('Perekaman gagal di perangkat ini.')); };

    const langkah = () => {
      if (selesai) return;
      if (opts.sinyal.batal) {
        selesai = true;
        if (rec.state !== 'inactive') rec.stop();
        reject(new Error('Render dibatalkan.'));
        return;
      }
      const t = (performance.now() - mulai) / 1000;
      if (t >= total) {
        selesai = true;
        k.t = total;
        gambarBingkai(k, scenes, segs, total, '', st.badge, st.watermark);
        rec.stop();
        return;
      }
      k.t = t;
      frames++;
      gambarBingkai(k, scenes, segs, total, '', st.badge, st.watermark);
      opts.onProgres({ persen: Math.round((t / total) * 100), t, total });
      requestAnimationFrame(langkah);
    };

    rec.start(500);
    requestAnimationFrame(langkah);
  });
}

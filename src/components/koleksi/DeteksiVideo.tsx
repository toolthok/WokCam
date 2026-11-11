"use client";

import { useRef, useState } from "react";
import { analisisBerkasVideo, type HasilAnalisis, type Progres } from "@/lib/video-sampler";
import { itemKeBerkas } from "@/lib/video-analyzer";
import { imporKeKoleksi, ubahKoleksi, koleksiStore } from "@/lib/preset-store";
import { PratinjauBersih } from "@/components/preset-preview";

const btnUtama = "w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white active:opacity-80 min-h-[44px] disabled:opacity-40";
const btnKedua = "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 active:opacity-80 min-h-[44px]";
const selCls = "rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 min-h-[44px]";

const JENIS = (d: Record<string, unknown>, kat: string): "in" | "out" | "loop" | "transisi" | "style" =>
  kat === "transitions" ? "transisi" : kat === "styles" ? "style" : (d.tipe as "in" | "out" | "loop");

export default function DeteksiVideo() {
  const [berkas, setBerkas] = useState<File | null>(null);
  const [fps, setFps] = useState(8);
  const [maks, setMaks] = useState(60);
  const [proses, setProses] = useState<Progres | null>(null);
  const [galat, setGalat] = useState("");
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);
  const [pilih, setPilih] = useState<Set<number>>(new Set());
  const [info, setInfo] = useState("");
  const sinyal = useRef({ batal: false });

  const mulai = async () => {
    if (!berkas) return;
    sinyal.current = { batal: false };
    setGalat(""); setInfo(""); setHasil(null); setProses({ tahap: "Menyiapkan…", persen: 0 });
    try {
      const h = await analisisBerkasVideo(berkas, { fps, maksDetik: maks, onProgres: setProses, sinyal: sinyal.current });
      setHasil(h);
      setPilih(new Set(h.items.map((_, i) => i)));
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal menganalisis video.");
    } finally {
      setProses(null);
    }
  };

  const simpan = () => {
    if (!hasil) return;
    const terpilih = hasil.items.filter((_, i) => pilih.has(i));
    const h = imporKeKoleksi(koleksiStore.getSnapshot(), itemKeBerkas(terpilih));
    if (h.ditambah > 0) ubahKoleksi(h.koleksi);
    setInfo(`✓ ${h.ditambah} ditambahkan ke Koleksi${h.duplikat ? ` · ${h.duplikat} duplikat dilewati` : ""}${h.ditolak ? ` · ${h.ditolak} ditolak` : ""}.`);
  };

  const st = hasil?.struktur;
  return (
    <section className="mb-5 rounded-2xl border border-violet-500/40 bg-zinc-900/60 p-4">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-violet-300">★ Deteksi Otomatis dari Video (tanpa AI)</h2>
      <p className="mb-3 text-xs leading-relaxed text-zinc-500">
        Pilih video referensi → wokCam membaca frame-nya di perangkatmu (video tidak diunggah) lalu menebak
        transisi, gerak latar (loop), animasi teks masuk/keluar, dan gaya teks. Hasilnya usulan — centang yang
        mau disimpan ke Koleksi.
      </p>

      <input type="file" accept="video/*" onChange={e => { setBerkas(e.target.files?.[0] ?? null); setHasil(null); setGalat(""); setInfo(""); }}
        className="mb-3 block w-full text-xs text-zinc-300 file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:text-sm file:font-semibold file:text-zinc-100" />

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <label className="flex items-center gap-2">Ketelitian
          <select className={selCls} value={fps} onChange={e => setFps(+e.target.value)}>
            <option value={5}>Cepat (5 fps)</option>
            <option value={8}>Seimbang (8 fps)</option>
            <option value={12}>Teliti (12 fps)</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Panjang dibaca
          <select className={selCls} value={maks} onChange={e => setMaks(+e.target.value)}>
            <option value={30}>30 dtk</option>
            <option value={60}>60 dtk</option>
            <option value={120}>120 dtk</option>
          </select>
        </label>
      </div>

      {proses ? (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${proses.persen}%` }} />
          </div>
          <p className="text-xs text-zinc-400">{proses.tahap} {proses.persen}%</p>
          <button className={btnKedua} onClick={() => { sinyal.current.batal = true; }}>Batalkan</button>
        </div>
      ) : (
        <button className={btnUtama} disabled={!berkas} onClick={mulai}>🔍 Deteksi dari Video</button>
      )}

      {galat && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{galat}</p>}

      {hasil && st && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-400">
            {st.durasiDetik.toFixed(0)} dtk dibaca{hasil.dipotong ? " (dipotong sesuai batas)" : ""} · {st.jumlahAdegan} adegan ·
            {" "}{st.ciri.potongPerDetik.toFixed(2)} pergantian/dtk
          </p>
          {hasil.items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 p-4 text-center text-xs text-zinc-500">
              Tidak ada transisi/animasi yang meyakinkan. Coba ketelitian lebih tinggi, video dengan pergantian adegan jelas,
              atau pakai jalur AI di bawah.
            </p>
          ) : (
            <>
              <div className="mb-2 flex gap-2">
                <button className={btnKedua} onClick={() => setPilih(new Set(hasil.items.map((_, i) => i)))}>Pilih semua</button>
                <button className={btnKedua} onClick={() => setPilih(new Set())}>Kosongkan</button>
              </div>
              <div className="max-h-[26rem] space-y-2 overflow-y-auto rounded-xl border border-zinc-800 p-2">
                {hasil.items.map((it, i) => (
                  <label key={i} className="flex cursor-pointer gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <input type="checkbox" className="mt-1 h-5 w-5 accent-violet-500" checked={pilih.has(i)}
                      onChange={() => setPilih(p => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-100">{it.label}</p>
                      <p className="mb-2 font-mono text-[11px] text-zinc-500">{it.ringkas}</p>
                      <PratinjauBersih jenis={JENIS(it.data, it.kategori)} data={it.data} />
                    </div>
                  </label>
                ))}
              </div>
              <button className={`${btnUtama} mt-3`} disabled={pilih.size === 0} onClick={simpan}>
                💾 Simpan {pilih.size} terpilih ke Koleksi
              </button>
            </>
          )}
          {info && <p className="mt-2 text-xs text-emerald-300">{info}</p>}
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
            Batas jujur: transisi “flip” belum dikenali; animasi teks hanya terbaca pada latar yang relatif diam; font
            hanya ditebak dari ketebalan. Pratinjau di atas membantu menilai — hapus yang meleset di bagian Koleksi.
          </p>
        </div>
      )}
    </section>
  );
}

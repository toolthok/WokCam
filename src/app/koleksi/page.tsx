"use client";

import { useSyncExternalStore, useMemo, useState } from "react";
import Link from "next/link";

import {
  imporKeKoleksi, ubahKoleksi, eksporKoleksi, promptUraiVideo, koleksiStore, tambahkanPaket,
  type Koleksi, type HasilImporKoleksi, type NamaPaket,
} from "@/lib/preset-store";
import { PratinjauAnimasi, PratinjauTransisi, PratinjauStyle } from "@/components/preset-preview";

/* ══════════ Util (pola sama dengan halaman generator) ══════════ */

async function salinTeks(teks: string) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = teks;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}

async function bacaClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

function unduhBerkas(nama: string, isi: string) {
  const blob = new Blob([isi], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

const inputCls = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500 min-h-[44px]";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400";
const btnUtama = "w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white active:opacity-80 min-h-[44px]";
const btnKedua = "w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 active:opacity-80 min-h-[44px]";

/* ══════════ Kartu preset ══════════ */

const TAG_CLS = "rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300";

function Chip({ children, warna }: { children: React.ReactNode; warna?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${warna ?? "bg-zinc-800 text-zinc-300"}`}>{children}</span>;
}

/* Pengelompokan tampilan (tanpa ubah data): keluarga item yang serupa tampil bersama —
 * varian beda nama tetap hidup berdampingan, duplikat nama sama sudah dilewati saat impor. */
function kelompokkan<T>(items: T[], kunci: (x: T) => string): [string, T[]][] {
  const urutan: [string, T[]][] = [];
  const petakan = new Map<string, T[]>();
  for (const it of items) {
    const k = kunci(it) || "lainnya";
    if (!petakan.has(k)) { const arr: T[] = []; petakan.set(k, arr); urutan.push([k, arr]); }
    petakan.get(k)!.push(it);
  }
  return urutan;
}

function KartuPreset({ p, onHapus }: { p: Koleksi["presets"][number]; onHapus: () => void }) {
  const warnaTipe = p.tipe === "in" ? "bg-violet-500/15 text-violet-300" : p.tipe === "out" ? "bg-fuchsia-500/15 text-fuchsia-300" : "bg-emerald-500/15 text-emerald-300";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-zinc-100">{p.nama}</span>
        <Chip warna={warnaTipe}>{p.tipe.toUpperCase()}</Chip>
      </div>
      <div className="mt-2">
        <PratinjauAnimasi preset={p} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
        {p.gerakan}{p.arah ? ` · ${p.arah}` : ""} · {p.durasi_ms}ms · {p.easing} · int {p.intensitas}
      </p>
      {p.sfx && <p className="mt-0.5 text-[11px] text-amber-300/80">🔊 {p.sfx}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">{p.tag.map(t => <span key={t} className={TAG_CLS}>{t}</span>)}</div>
        <button onClick={onHapus} className="min-h-[32px] rounded-lg px-2 text-[11px] font-semibold text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label={`Hapus ${p.nama}`}>
          Hapus
        </button>
      </div>
    </div>
  );
}

function KartuTransisi({ p, onHapus }: { p: Koleksi["transitions"][number]; onHapus: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-zinc-100">{p.nama}</span>
        <Chip warna="bg-amber-500/15 text-amber-300">TRANSISI</Chip>
      </div>
      <div className="mt-2">
        <PratinjauTransisi preset={p} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
        {p.gerakan}{p.arah ? ` · ${p.arah}` : ""} · {p.durasi_ms}ms · {p.easing}
      </p>
      {p.sfx && <p className="mt-0.5 text-[11px] text-amber-300/80">🔊 {p.sfx}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">{p.tag.map(t => <span key={t} className={TAG_CLS}>{t}</span>)}</div>
        <button onClick={onHapus} className="min-h-[32px] rounded-lg px-2 text-[11px] font-semibold text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label={`Hapus ${p.nama}`}>
          Hapus
        </button>
      </div>
    </div>
  );
}

function KartuStyle({ p, onHapus }: { p: Koleksi["styles"][number]; onHapus: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-zinc-100">{p.nama}</span>
        <Chip warna="bg-sky-500/15 text-sky-300">STYLE</Chip>
      </div>
      <div className="mt-2">
        <PratinjauStyle preset={p} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-zinc-400">{p.font} · {p.ukuran}px · {p.posisi}</p>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-400">
        <span className="inline-block h-4 w-4 rounded border border-zinc-700" style={{ background: p.warna_teks }} aria-hidden />
        teks {p.warna_teks}
        <span className="inline-block h-4 w-4 rounded border border-zinc-700" style={{ background: p.warna_outline }} aria-hidden />
        outline {p.warna_outline} · {p.tebal_outline}px
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">{p.tag.map(t => <span key={t} className={TAG_CLS}>{t}</span>)}</div>
        <button onClick={onHapus} className="min-h-[32px] rounded-lg px-2 text-[11px] font-semibold text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label={`Hapus ${p.nama}`}>
          Hapus
        </button>
      </div>
    </div>
  );
}

/* ══════════ Halaman ══════════ */

type Filter = "semua" | "presets" | "transitions" | "styles";

export default function KoleksiPage() {
  /* Koleksi = store eksternal (localStorage + cache memori) — hidrasi aman, tanpa useEffect */
  const koleksi = useSyncExternalStore(koleksiStore.subscribe, koleksiStore.getSnapshot, koleksiStore.getServerSnapshot);
  const [filter, setFilter] = useState<Filter>("semua");
  const [vibe, setVibe] = useState("");
  const [copied, setCopied] = useState("");
  const [pasteInfo, setPasteInfo] = useState("");
  const [hasilImpor, setHasilImpor] = useState<HasilImporKoleksi | null>(null);
  const [modeImpor, setModeImpor] = useState<"gabung" | "ganti">("gabung");
  const [paketInfo, setPaketInfo] = useState("");

  const flash = async (teks: string, kunci: string) => {
    await salinTeks(teks);
    setCopied(kunci);
    setTimeout(() => setCopied(""), 1800);
  };

  const promptUrai = useMemo(() => promptUraiVideo(vibe), [vibe]);

  const jalankanImpor = (teks: string) => {
    const h = imporKeKoleksi(koleksi, teks, modeImpor);
    setHasilImpor(h);
    if (h.ditambah > 0) ubahKoleksi(h.koleksi);
  };

  const tempelImpor = async () => {
    const teks = await bacaClipboard();
    if (teks === null) { setPasteInfo("Browser menolak akses clipboard — tempel manual di kotak, lalu tekan Impor JSON."); return; }
    if (!teks.trim()) { setPasteInfo("Clipboard masih kosong — salin dulu hasil AI."); return; }
    const el = document.getElementById("paste-koleksi") as HTMLTextAreaElement | null;
    if (el) el.value = teks;
    setPasteInfo("");
    jalankanImpor(teks);
  };

  const bacaBerkas = (berkas: File) => {
    const pembaca = new FileReader();
    pembaca.onload = () => {
      const teks = String(pembaca.result ?? "");
      const el = document.getElementById("paste-koleksi") as HTMLTextAreaElement | null;
      if (el) el.value = teks;
      jalankanImpor(teks);
    };
    pembaca.readAsText(berkas);
  };

  const hapus = (kategori: Filter, nama: string) => {
    if (kategori === "semua") return;
    const k: Koleksi = { ...koleksi };
    if (kategori === "presets") k.presets = k.presets.filter(p => p.nama !== nama);
    if (kategori === "transitions") k.transitions = k.transitions.filter(p => p.nama !== nama);
    if (kategori === "styles") k.styles = k.styles.filter(p => p.nama !== nama);
    ubahKoleksi(k);
  };

  const total = koleksi ? koleksi.presets.length + koleksi.transitions.length + koleksi.styles.length : 0;
  const jsonEkspor = koleksi ? eksporKoleksi(koleksi) : "";

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        {/* Header */}
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-fuchsia-300">
            <span className="h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#e879f9]" />
            Prototype Tahap 0 — wokCam Mobile
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold">Koleksi Style</h1>
            <Link href="/generator" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:border-violet-500">
              ← Generator Prompt AI
            </Link>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Gudang animasi (in/out/loop), transisi, dan gaya teks — diisi dari hasil bedah video referensi lewat ChatGPT.
            Tersimpan di perangkat ini dan bisa diekspor ke berkas .json (format yang sama nanti dipakai app).
          </p>
        </div>

        {/* Ringkasan koleksi */}
        <div className="mb-5 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "animasi", n: koleksi?.presets.length ?? 0 },
            { label: "transisi", n: koleksi?.transitions.length ?? 0 },
            { label: "style teks", n: koleksi?.styles.length ?? 0 },
            { label: "total", n: total },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
              <div className="text-lg font-extrabold text-violet-300">{s.n}</div>
              <div className="text-[10px] uppercase text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 1 · Prompt Urai Video */}
        <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-violet-300">1 · Bedah Video Referensi</h2>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            Menemukan video bagus? Jangan disia-siakan: salin prompt ini ke ChatGPT/Claude/Gemini, lampirkan video
            (atau screenshot / deskripsinya), lalu salin balasan JSON-nya ke bagian 2 di bawah.
          </p>
          <div className="mb-3">
            <label className={labelCls}>Karakter gaya yang dicari (opsional)</label>
            <input className={inputCls} value={vibe} onChange={e => setVibe(e.target.value)}
              placeholder="misal: horor mistis, kabut, gelap — kosongkan untuk netral" />
            <p className="mt-1 text-[11px] text-zinc-500">
              Dikosongkan → kalimat “karakter gaya yang saya cari” otomatis dilepas dari prompt (tidak perlu lagi menghapusnya manual).
            </p>
          </div>
          <textarea readOnly value={promptUrai} rows={9}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-300" />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">{promptUrai.length} karakter · format terkunci sesuai kontrak koleksi</span>
            <button onClick={() => flash(promptUrai, "pu")} className={`${btnUtama} max-w-[240px]`}>
              {copied === "pu" ? "✓ Tersalin!" : "Salin Prompt Bedah"}
            </button>
          </div>
          <ol className="mt-3 space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-400">
            <li>1. Salin prompt di atas → tempel di ChatGPT/Claude → lampirkan video referensi / screenshot / deskripsi.</li>
            <li>2. AI membalas HANYA JSON (presets + transitions + styles + usulan sfx) langsung di pesan — bukan artifact.</li>
            <li>3. Salin balasannya → kembali ke bagian 2 → tekan 📋 Tempel &amp; Impor.</li>
          </ol>
        </section>

        {/* 2 · Impor JSON */}
        <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">2 · Impor JSON Hasil Bedah</h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Mode impor</span>
            {(["gabung", "ganti"] as const).map(m => (
              <button key={m} onClick={() => setModeImpor(m)}
                className={`min-h-[36px] rounded-full px-3 text-xs font-bold transition ${
                  modeImpor === m ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "border border-zinc-700 text-zinc-400"
                }`}>
                {m === "gabung" ? "🔗 Gabungkan" : "🔄 Ganti semua"}
              </button>
            ))}
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
            {modeImpor === "gabung"
              ? "Gabungkan: item baru ditambahkan ke koleksi, yang namanya sudah ada dilewati — AMAN untuk menambah hasil bedah video. JANGAN minta ChatGPT menggabungkan dua JSON; di situlah data biasanya hilang."
              : "Ganti semua: isi koleksi dikosongkan lalu diisi persis dari JSON ini (pulihkan backup). Batal otomatis bila JSON tidak berisi item valid."}
          </p>
          <div className="relative">
            <textarea rows={7} id="paste-koleksi"
              placeholder='{"version":1,"presets":[ ... ],"transitions":[ ... ],"styles":[ ... ]}'
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 pb-16 font-mono text-xs text-zinc-200 outline-none focus:border-violet-500" />
            <button onClick={tempelImpor}
              className="absolute bottom-3 right-3 min-h-[44px] rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-xs font-bold text-white shadow-lg shadow-violet-950/60 transition active:scale-95">
              📋 Tempel &amp; Impor
            </button>
          </div>
          {pasteInfo && <p className="mt-1 text-[11px] text-amber-400">{pasteInfo}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const el = document.getElementById("paste-koleksi") as HTMLTextAreaElement | null;
                jalankanImpor(el?.value ?? "");
              }}
              className={btnUtama}
            >
              Impor JSON
            </button>
            <label className={`${btnKedua} flex cursor-pointer items-center justify-center`}>
              Pilih Berkas .json…
              <input type="file" accept=".json,application/json" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) bacaBerkas(f); e.target.value = ""; }} />
            </label>
          </div>

          {hasilImpor?.errorGlobal && (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{hasilImpor.errorGlobal}</p>
          )}

          {hasilImpor && !hasilImpor.errorGlobal && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-zinc-400">
                <span className="font-bold text-emerald-400">{hasilImpor.ditambah} baru tersimpan</span>
                {" · "}
                <span className="font-bold text-amber-400">{hasilImpor.duplikat} duplikat dilewati</span>
                {" · "}
                <span className="font-bold text-red-400">{hasilImpor.ditolak} ditolak</span>
              </p>
              {hasilImpor.catatan.length > 0 && (
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
                  {hasilImpor.catatan.map((c, i) => (
                    <p key={i} className="text-[11px] text-amber-400/90">± {c}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 3 · Paket siap pakai */}
        <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-violet-300">3 · Paket Siap Pakai</h2>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            Paket tervalidasi hasil uji bedah video referensi — satu klik masuk koleksi, tanpa ChatGPT,
            tanpa risiko kehilangan data. Cocok juga untuk mengembalikan isi yang hilang.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              { id: "horror", nama: "Paket Horror Mistis", isi: "6 animasi masuk · kabut, bayangan, teror — gaya cerita horor" },
              { id: "minimalis", nama: "Paket Minimalis Editorial", isi: "6 animasi (in/out/loop) · 4 transisi · 4 gaya teks — hasil bedah video referensi screenshot" },
              { id: "promo", nama: "Paket Promo Tipografi Terang", isi: "gaya video promo viral: kata muncul berturut (kata-demi-kata), kartu mengambang, transisi blur · 4 animasi · 3 transisi · 3 gaya teks" },
            ] as { id: NamaPaket; nama: string; isi: string }[]).map(pk => (
              <div key={pk.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-sm font-semibold text-zinc-100">{pk.nama}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{pk.isi}</p>
                <button
                  onClick={() => {
                    const h = tambahkanPaket(koleksi, pk.id);
                    if (h.ditambah > 0) ubahKoleksi(h.koleksi);
                    setPaketInfo(
                      `${pk.nama}: ${h.ditambah} baru${h.duplikat ? ` · ${h.duplikat} duplikat dilewati` : ""}` +
                      (h.errorGlobal ? ` · ${h.errorGlobal}` : ""),
                    );
                  }}
                  className={`${btnKedua} mt-2`}
                >
                  + Tambahkan ke Koleksi
                </button>
              </div>
            ))}
          </div>
          {paketInfo && <p className="mt-2 text-[11px] text-emerald-400">✓ {paketInfo}</p>}
        </section>

        {/* 4 · Koleksi tersimpan */}
        <section className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-violet-300">4 · Koleksi Tersimpan</h2>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            Dikelompokkan otomatis: animasi per tipe·gerakan, transisi per gerakan, gaya teks per font.
            Tiap kartu punya <span className="font-semibold text-zinc-300">pratinjau langsung</span> — teks bergerak,
            scene bertukar, gaya teks tampil sesuai nilai aslinya; tekan ▶ putar untuk mengulang.
            Nama sama = duplikat (otomatis dilewati saat impor); serupa beda nama = varian yang hidup berdampingan —
            pilih yang paling pas, hapus sisanya lewat tombol Hapus.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {([
              ["semua", `Semua (${total})`],
              ["presets", `Animasi (${koleksi?.presets.length ?? 0})`],
              ["transitions", `Transisi (${koleksi?.transitions.length ?? 0})`],
              ["styles", `Gaya Teks (${koleksi?.styles.length ?? 0})`],
            ] as [Filter, string][]).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`min-h-[36px] rounded-full px-3 text-xs font-bold transition ${
                  filter === k ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "border border-zinc-700 text-zinc-400"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {!koleksi ? null : total === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
              Koleksi masih kosong — pakai Paket Siap Pakai di bagian 3, bedah video referensi lewat bagian 1, atau impor berkas backup.
            </p>
          ) : (
            <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-zinc-800 p-2">
              {(filter === "semua" || filter === "presets") && kelompokkan(koleksi.presets, p => `${p.tipe} · ${p.gerakan}`).map(([kel, items]) => (
                <div key={kel} className="space-y-2">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-300/90">{kel} <span className="text-zinc-600">· {items.length}</span></p>
                  {items.map(p => <KartuPreset key={`p-${p.nama}-${p.gerakan}`} p={p} onHapus={() => hapus("presets", p.nama)} />)}
                </div>
              ))}
              {(filter === "semua" || filter === "transitions") && kelompokkan(koleksi.transitions, p => p.gerakan).map(([kel, items]) => (
                <div key={kel} className="space-y-2">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-amber-300/90">{kel} <span className="text-zinc-600">· {items.length}</span></p>
                  {items.map(p => <KartuTransisi key={`t-${p.nama}-${p.gerakan}`} p={p} onHapus={() => hapus("transitions", p.nama)} />)}
                </div>
              ))}
              {(filter === "semua" || filter === "styles") && kelompokkan(koleksi.styles, p => p.font).map(([kel, items]) => (
                <div key={kel} className="space-y-2">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-sky-300/90">{kel} <span className="text-zinc-600">· {items.length}</span></p>
                  {items.map(p => <KartuStyle key={`s-${p.nama}-${p.font}`} p={p} onHapus={() => hapus("styles", p.nama)} />)}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5 · Backup */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-violet-300">5 · Backup &amp; Pindah Perangkat</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Berkas .json ini adalah format kontrak yang sama — nanti tinggal di-bundle sebagai paket bawaan di app Kotlin.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => flash(jsonEkspor, "ek")} className={btnKedua}>
              {copied === "ek" ? "✓ Tersalin!" : "Salin JSON Koleksi"}
            </button>
            <button onClick={() => unduhBerkas("wokcam-koleksi.json", jsonEkspor)} className={btnKedua}>
              Unduh wokcam-koleksi.json
            </button>
          </div>
          <button
            onClick={() => {
              if (!window.confirm("Hapus SEMUA isi koleksi dan kembalikan ke koleksi kosong?")) return;
              ubahKoleksi({ version: 1, diperbarui: new Date().toISOString(), presets: [], transitions: [], styles: [] });
              setHasilImpor(null);
            }}
            className="mt-2 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 active:opacity-80"
          >
            Reset Koleksi (kembali kosong)
          </button>
        </section>

        <p className="mt-8 text-center text-[11px] text-zinc-600">
          Kontrak format koleksi identik dengan PRD wokCam Mobile v1.0 — berkas versi 1 (presets · transitions · styles).
        </p>
      </div>
    </main>
  );
}

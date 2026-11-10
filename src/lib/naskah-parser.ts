/* ══════════ Parser Naskah wokCam — kontrak tunggal (prototype web ⇄ app Kotlin) ══════════
 *
 * Toleran terhadap deviasi umum keluaran ChatGPT (prinsip "AI tempel + validasi toleran"):
 *  1. Semua field digabung dalam SATU baris  → dipisah otomatis per label
 *  2. Penanda scene bervariasi: === SCENE 1 ===, **SCENE 1**, SCENE 1:, --- Scene 1 ---
 *  3. Tanpa penanda scene sama sekali        → scene dipisah dari tiap label NASKAH:
 *  4. Markdown dibersihkan: fence ```, **bold**, bullet "- ", tanda kutip aneh
 *  5. DURASI menerima "5", "4,5", "5 detik", "±5s" → dibulatkan ke 0,5 dtk, clamp 2-15
 *  6. MOOD dinormalkan (huruf besar/tanda baca dihapus), di luar daftar → "fokus"
 *  7. LATAR dipisah pada "| EN:" atau "EN:" tanpa pipe
 */

export const MOODS = ["tenang", "energik", "dramatis", "ceria", "misterius", "fokus"] as const;

export type Catatan = { tipe: "info" | "peringatan" | "error"; teks: string };
export type Scene = {
  no: number;
  naskah: string;
  teks: string;
  durasi: number;
  mood: string;
  latarId: string;
  latarEn: string;
  catatan: Catatan[];
};
export type HasilNaskah = { scenes: Scene[]; errorGlobal?: string };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* Label field: huruf besar persis template, atau varian Kapital di awal kata ("Naskah:").
   Sengaja TIDAK case-insensitive agar kata "naskah:" dalam prosa tidak salah dipotong. */
const LABEL_SRC = "\\b(NASKAH|TEKS|DURASI|MOOD|LATAR|Naskah|Teks|Durasi|Mood|Latar)\\s*[*_]*\\s*:";

/* Penanda scene: baris pendek berisi "SCENE <angka>" dengan dekorasi opsional.
   Sisa baris dibatasi 40 karakter agar baris "=== SCENE 1 === NASKAH: teks panjang..."
   (marker + field digabung) TIDAK dianggap marker → jatuh ke fallback split NASKAH. */
const MARKER_SRC = "^[^\\S\\n]*[-=*~#>\\s]*SCENE\\s*(\\d+)\\b[^\\n]{0,40}$";

export function fmtDurasi(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/* Bersihkan dekorasi markdown pada nilai field */
function bersihkanNilai(s: string): string {
  return s
    .replace(/```+/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[\s\-–—•*#>"']+/, "")
    .trim();
}

type Kemunculan = { kunci: string; mulai: number; akhir: number };

function cariLabel(blok: string): Kemunculan[] {
  const re = new RegExp(LABEL_SRC, "g");
  const hasil: Kemunculan[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(blok)) !== null) {
    hasil.push({ kunci: m[1].toUpperCase(), mulai: m.index, akhir: m.index + m[0].length });
  }
  return hasil;
}

/* Ambil semua field dari satu blok scene — bekerja untuk format multiline & inline satu baris */
function ekstrakFields(blok: string): { fields: Record<string, string>; inline: boolean } {
  const labels = cariLabel(blok);
  const fields: Record<string, string> = {};
  for (let i = 0; i < labels.length; i++) {
    if (fields[labels[i].kunci] !== undefined) continue; // kemunculan pertama menang
    const nilai = blok.slice(labels[i].akhir, i + 1 < labels.length ? labels[i + 1].mulai : blok.length);
    fields[labels[i].kunci] = bersihkanNilai(nilai);
  }
  const barisTidakKosong = blok.split("\n").filter((l) => l.trim()).length;
  const inline = labels.length >= 3 && barisTidakKosong < labels.length;
  return { fields, inline };
}

/* "5", "4,5", "5 detik", "±5s" → angka dibulatkan ke 0,5 dtk; gagal → null */
function parseDurasiNilai(raw: string): number | null {
  const m = raw.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  if (!isFinite(v) || v <= 0) return null;
  return Math.round(v * 2) / 2;
}

export function parseNaskah(raw: string, target: number | null): HasilNaskah {
  const masuk = raw
    .replace(/^[^\S\n]*```[a-zA-Z0-9]*[^\S\n]*$/gm, "") // buang baris fence markdown
    .replace(/```+/g, "")
    .trim();
  if (!masuk) return { scenes: [], errorGlobal: "Kotak tempel masih kosong." };

  /* ── Potong menjadi blok per scene ── */
  let blok: string[] = [];
  let pakaiFallback = false;

  const markerRe = new RegExp(MARKER_SRC, "gim");
  const posisi: { mulai: number; akhir: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(masuk)) !== null) {
    posisi.push({ mulai: m.index, akhir: m.index + m[0].length });
  }

  if (posisi.length > 0) {
    for (let i = 0; i < posisi.length; i++) {
      blok.push(masuk.slice(posisi[i].akhir, i + 1 < posisi.length ? posisi[i + 1].mulai : masuk.length));
    }
  } else {
    // Fallback: pisah scene dari tiap label NASKAH:
    // Buang dulu penanda scene yang menempel di tengah baris agar tidak ikut jadi nilai field
    const tanpaMarker = masuk
      .replace(/={2,}\s*SCENE\s*\d+\s*={2,}/gi, "\n")
      .replace(/\*\*\s*SCENE\s*\d+\s*\*\*/gi, "\n");
    const re = new RegExp("\\b(NASKAH|Naskah)\\s*[*_]*\\s*:", "g");
    const idx: number[] = [];
    let n: RegExpExecArray | null;
    while ((n = re.exec(tanpaMarker)) !== null) idx.push(n.index);
    if (idx.length === 0) {
      return {
        scenes: [],
        errorGlobal:
          "Format tidak dikenali. Tempel hasil ChatGPT yang memakai penanda '=== SCENE 1 ===' atau minimal berisi 'NASKAH: ...' di tiap scene.",
      };
    }
    pakaiFallback = true;
    for (let i = 0; i < idx.length; i++) {
      blok.push(tanpaMarker.slice(idx[i], i + 1 < idx.length ? idx[i + 1] : tanpaMarker.length));
    }
  }

  /* ── Parse tiap blok ── */
  const scenes: Scene[] = [];
  let no = 1;

  for (const b of blok) {
    const { fields, inline } = ekstrakFields(b);
    const catatan: Catatan[] = [];
    if (inline) catatan.push({ tipe: "info", teks: "Field satu baris terdeteksi — dipisah otomatis." });

    const naskah = fields.NASKAH ?? "";
    if (!naskah) catatan.push({ tipe: "error", teks: "Field NASKAH kosong — scene ditolak sampai diperbaiki." });

    let teks_ = fields.TEKS ?? "";
    if (!teks_) {
      teks_ = naskah;
      catatan.push({ tipe: "info", teks: "TEKS kosong — memakai NASKAH sebagai teks tampilan." });
    }

    const kata = naskah.split(/\s+/).filter(Boolean).length;

    let durasi = 0;
    const durasiNilai = fields.DURASI ? parseDurasiNilai(fields.DURASI) : null;
    if (durasiNilai !== null) {
      durasi = durasiNilai;
      if (durasi < 2 || durasi > 15) {
        durasi = clamp(durasi, 2, 15);
        catatan.push({ tipe: "peringatan", teks: `DURASI di luar rentang 2-15 — dipangkas menjadi ${fmtDurasi(durasi)}.` });
      }
    } else {
      durasi = clamp(Math.ceil(kata / 2.4), 2, 15);
      catatan.push({ tipe: "peringatan", teks: `DURASI tidak sah — diperkirakan otomatis menjadi ${durasi} detik (${kata} kata).` });
    }

    if (naskah && kata / 2.4 > durasi + 1) {
      catatan.push({ tipe: "peringatan", teks: `Naskah ±${kata} kata butuh ±${Math.ceil(kata / 2.4)} dtk — pertimbangkan memperpanjang DURASI.` });
    }

    const moodMentah = (fields.MOOD ?? "").toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const moodKata = moodMentah.split(/\s+/)[0] ?? "";
    let mood: string;
    if (MOODS.includes(moodKata as (typeof MOODS)[number])) {
      mood = moodKata;
    } else {
      mood = "fokus";
      if (moodMentah) catatan.push({ tipe: "peringatan", teks: `MOOD "${moodMentah}" tidak dikenal — memakai "fokus".` });
      else catatan.push({ tipe: "info", teks: "MOOD kosong — memakai \"fokus\"." });
    }

    let latarId = "", latarEn = "";
    const latarMentah = fields.LATAR ?? "";
    if (latarMentah) {
      const m2 = latarMentah.match(/^(.*?)\s*\|?\s*\bEN\b\s*:\s*(.+)$/i);
      if (m2) {
        latarId = bersihkanNilai(m2[1]).replace(/[|]+[\s]*$/, "").trim();
        latarEn = bersihkanNilai(m2[2]).replace(/[|]+[\s]*$/, "").trim();
      } else {
        latarId = bersihkanNilai(latarMentah).replace(/[|]+[\s]*$/, "").trim();
        catatan.push({ tipe: "info", teks: "LATAR tanpa | EN: — kata kunci Inggris kosong." });
      }
    } else {
      catatan.push({ tipe: "info", teks: "LATAR kosong — memakai latar default global." });
    }

    scenes.push({ no: no++, naskah, teks: teks_, durasi, mood, latarId, latarEn, catatan });
  }

  if (pakaiFallback && scenes.length) {
    scenes[0].catatan.unshift({
      tipe: "info",
      teks: "Penanda SCENE tidak ada — scene dipisah otomatis dari tiap NASKAH.",
    });
  }

  /* ── Cek deviasi dari target durasi (toleransi 20%) ── */
  if (target !== null && scenes.length) {
    const total = scenes.reduce((s, sc) => s + sc.durasi, 0);
    const selisih = total - target;
    if (Math.abs(selisih) > target * 0.2) {
      scenes[0].catatan.unshift({
        tipe: "peringatan",
        teks: `Total durasi ${fmtDurasi(total)} dtk meleset ${Math.abs(Math.round((selisih / target) * 100))}% dari target ${target} dtk — pertimbangkan generate ulang.`,
      });
    }
  }

  return { scenes };
}

/* ── Perbaiki ritme: naikkan DURASI scene yang naskahnya kepadatan berlebih ──
 * Kecepatan bicara TTS ±2,4 kata/dtk. Scene dengan kata/2,4 > durasi + 1 diberi
 * durasi baru = ceil(kata/2,4) (clamp 2-15); durasi yang sudah cukup TIDAK diubah.
 * Peringatan kepadatan yang teratasi dihapus, peringatan deviasi target dihitung ulang.
 * Dipakai tombol "Perbaiki Ritme" (web sekarang, app Kotlin nanti). */
export function terapkanRitme(hasil: HasilNaskah, target: number | null): HasilNaskah {
  const scenes = hasil.scenes.map((sc) => {
    const kata = sc.naskah.split(/\s+/).filter(Boolean).length;
    const butuh = clamp(Math.ceil(kata / 2.4), 2, 15);
    if (butuh <= sc.durasi) return sc;
    const catatan = sc.catatan
      .filter((c) => !(c.tipe === "peringatan" && c.teks.startsWith("Naskah ±")))
      .concat([{ tipe: "info" as const, teks: `Durasi dinaikkan otomatis ${fmtDurasi(sc.durasi)} → ${fmtDurasi(butuh)} dtk agar muat ${kata} kata.` }]);
    return { ...sc, durasi: butuh, catatan };
  });

  if (scenes.length) {
    const total = scenes.reduce((s, sc) => s + sc.durasi, 0);
    let catatan0 = scenes[0].catatan.filter((c) => !c.teks.startsWith("Total durasi"));
    if (target !== null && Math.abs(total - target) > target * 0.2) {
      catatan0 = [{
        tipe: "peringatan",
        teks: `Total durasi ${fmtDurasi(total)} dtk meleset ${Math.abs(Math.round(((total - target) / target) * 100))}% dari target ${target} dtk — pertimbangkan generate ulang.`,
      }, ...catatan0];
    }
    scenes[0] = { ...scenes[0], catatan: catatan0 };
  }

  return { scenes, errorGlobal: hasil.errorGlobal };
}


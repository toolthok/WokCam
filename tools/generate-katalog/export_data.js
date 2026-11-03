#!/usr/bin/env node
// Ekspor data katalog dari data_teknik.js menjadi JSON mesin-baca.
// Pemakaian: node export_data.js  (menulis ke ../../data/katalog-teknik-v1.json)
const fs = require("fs");
const path = require("path");
const D = require("./data_teknik.js");

const total = D.KATEGORI.reduce((n, k) => n + k.rows.length, 0);
const inti = D.KATEGORI.reduce((n, k) => n + k.rows.filter(r => r[5] === "Inti").length, 0);

const out = {
  meta: {
    name: "katalog-teknik-editing-mobile",
    version: "1.0",
    schema_version: "1.0",
    generated: new Date().toISOString().slice(0, 10),
    counts: { categories: D.KATEGORI.length, techniques: total, core: inti, advanced: total - inti, style_families: D.GAYA.length },
    note: "Sumber tunggal kosakata teknik. Kontrak data antara lapisan AI, mesin preset, dan antarmuka radial menu."
  },
  categories: D.KATEGORI.map(k => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    intro: k.intro,
    techniques: k.rows.map(r => ({
      id: r[0],
      name: r[1],
      description: r[2],
      params: r[3],
      exec_class: r[4],
      priority: r[5]
    }))
  })),
  style_families: D.GAYA.map(g => ({
    name: g.nama,
    karakter: g.karakter,
    techniques: g.andalan,
    skenario: g.skenario
  })),
  narrative_grammar: D.TATA_BAHASA.map(t => ({
    beat: t[0], peran: t[1], pemicu: t[2], teknik: t[3]
  })),
  execution_rules: D.ATURAN_EKSEKUSI.map(a => ({
    aturan: a[0], penjelasan: a[1]
  })),
  roadmap: D.ROADMAP.map(r => ({
    fase: r[0], isi: r[1], teknik: r[2], keluaran: r[3]
  }))
};

const dest = path.join(__dirname, "..", "..", "data", "katalog-teknik-v1.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log("OK:", dest, "(" + total + " teknik, " + inti + " inti)");

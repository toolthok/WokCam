#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ekstrak KDICT dari part3_js.html -> TSV siap paste ke Google Sheets."""
import re, io

SRC = "/home/z/my-project/scripts/prototype/part3_js.html"
OUT = "/home/z/my-project/download/kamus_pemicu_v1.1.tsv"

src = io.open(SRC, encoding="utf-8").read()

# --- parse blok KDICT ---
block = re.search(r"const KDICT=\[(.*?)\n\];", src, re.S).group(1)
entries = re.findall(r"\{w:\[(.*?)\],tier:(\d+),code:\"(.*?)\",name:\"(.*?)\",fx:\"(.*?)\",dur:([\d.]+),conf:([\d.]+)\}", block)

# --- parse konstanta khusus (E_NUM / E_HOOK / E_CTA) ---
const = {m[0]: m[1:] for m in re.findall(
    r"const (E_\w+)\s*=\{code:\"(.*?)\",name:\"(.*?)\",fx:\"(.*?)\",dur:([\d.]+),tier:(\d+)\}", src)}

def dur_label(d):
    return "tayang terus (toggle)" if d == "999" else d

def conf_label(c):
    return "%.2f" % float(c)  # 0.90, 0.85, 0.55 ...

def aksi(conf):
    return "AUTO (>=85%)" if float(conf) >= 0.85 else "KONFIRMASI 1 KLIK"

rows = []  # (kata, tier, metode, kode, nama, fx, dur, conf, aksi)

# 1) kata pemicu biasa
for w_list, tier, code, name, fx, dur, conf in entries:
    words = re.findall(r'"(.*?)"', w_list)
    for w in words:
        rows.append((w, tier, "kata", code, name, fx, dur_label(dur), conf_label(conf), aksi(conf)))

# 2) pola angka (tier 2)
c = const["E_NUM"]
rows.append((r"N%  (contoh: 53%)", "2", "pola angka", c[0], c[1], c[2], dur_label(c[3]), conf_label("0.85"), aksi("0.85")))
rows.append((r"N persen  (contoh: 53 persen)", "2", "pola angka", c[0], c[1], c[2], dur_label(c[3]), conf_label("0.85"), aksi("0.85")))
rows.append((r"N kali lipat  (dua/tiga/... kali lipat)", "2", "pola angka", c[0], c[1], c[2], dur_label(c[3]), conf_label("0.85"), aksi("0.85")))

# 3) struktur naskah (tier 3)
c = const["E_HOOK"]
rows.append(("(kalimat PEMBUKA naskah — kalau belum ada judul)", "3", "posisi kalimat", c[0], c[1], c[2], dur_label(c[3]), conf_label("0.7"), aksi("0.7")))
c = const["E_CTA"]
rows.append(("(kalimat PENUTUP naskah — kalau belum ada end card)", "3", "posisi kalimat", c[0], c[1], c[2], dur_label(c[3]), conf_label("0.7"), aksi("0.7")))

# --- urutkan: tier, kode, kata ---
rows.sort(key=lambda r: (int(r[1]), r[3], r[0].lower()))

hdr = ["No", "Kata/Pola Pemicu", "Tier", "Metode", "Kode Teknik", "Nama Teknik", "Efek (fx)", "Durasi (detik)", "Conf", "Aksi"]
lines = ["\t".join(hdr)]
for i, r in enumerate(rows, 1):
    lines.append("\t".join([str(i)] + list(r)))

tsv = "\n".join(lines) + "\n"
io.open(OUT, "w", encoding="utf-8").write(tsv)

# statistik
tiers = {t: sum(1 for r in rows if r[1] == t) for t in ("1", "2", "3")}
uniq_fx = len({r[5] for r in rows})
uniq_code = len({r[3] for r in rows})
print(f"Total baris kata pemicu : {len(rows)}")
print(f"  Tier 1 (perintah)     : {tiers['1']}")
print(f"  Tier 2 (naratif/pola) : {tiers['2']}")
print(f"  Tier 3 (struktur)     : {tiers['3']}")
print(f"Teknik unik (kode)      : {uniq_code}")
print(f"Efek unik (fx)          : {uniq_fx}")
print(f"File tersimpan          : {OUT}")

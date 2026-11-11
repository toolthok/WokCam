#!/usr/bin/env python3
"""Susun staging repo wokCam (kode + uji + dokumentasi) dan kompres ke ZIP.
ZIP dirancang kompatibel dengan gitUploader.html:
- metode DEFLATE (8) / STORE (0) saja, tanpa ZIP64
- tanpa entri folder terenkripsi, tanpa .., tanpa .DS_Store/__MACOSX

v0.2.0: tanpa database (Prisma/Sheets dihapus), menyertakan skrip uji bun,
README.md, docs/PROGRES.md, dan menyalin ZIP ke public/ untuk halaman /unduhan.

v0.3.0: editor timeline lengkap (drag-reorder, trim, edit teks, transisi, katalog
latar/overlay, undo/redo, proyek tutorial 8 scene + PanduanEditor tur 10 langkah),
pratinjau WAAPI koleksi, uji promo-style & tutorial, total 430 uji · 10 rangkaian.
"""
import os, shutil, zipfile, json

ROOT = "/home/z/my-project"
SRC = f"{ROOT}/src"
PUB = f"{ROOT}/public"
STAGE = f"{ROOT}/build/wokcam-repo"
OUT = f"{ROOT}/download/wokcam-repo.zip"

# ---------- 0. staging bersih ----------
if os.path.exists(STAGE):
    shutil.rmtree(STAGE)
os.makedirs(STAGE)

# ---------- 1. salin kode sumber ----------
dst_src = f"{STAGE}/src"
shutil.copytree(SRC, dst_src, ignore=shutil.ignore_patterns("*.log"))
print(f"src/ → {sum(len(f) for _,_,f in os.walk(dst_src))} file")

dst_pub = f"{STAGE}/public"
shutil.copytree(PUB, dst_pub)
# buang artefak yang tidak perlu ikut ke repo
for bersih in [f"{dst_pub}/wokcam-repo.zip", f"{dst_pub}/robots.txt"]:
    if os.path.exists(bersih):
        os.remove(bersih)
print(f"public/ → {sum(len(f) for _,_,f in os.walk(dst_pub))} file")

# ---------- 2. skrip uji (kurasi: hanya milik proyek) ----------
skrip_uji = [
    "test-parser.ts", "test-preset-store.ts", "test-impor-toleran.ts",
    "test-koleksi-user.ts", "test-horror-joglo.ts", "test-alam-semesta.ts",
    "test-kuantum.ts", "test-editor-proyek.ts", "test-promo-style.ts",
    "test-tutorial.ts", "gen-fixture-alam.ts", "build_wokcam_zip.py",
]
os.makedirs(f"{STAGE}/scripts/fixtures")
n_skrip = 0
for s in skrip_uji:
    p = f"{ROOT}/scripts/{s}"
    if os.path.exists(p):
        shutil.copy2(p, f"{STAGE}/scripts/{s}")
        n_skrip += 1
for f in os.listdir(f"{ROOT}/scripts/fixtures"):
    shutil.copy2(f"{ROOT}/scripts/fixtures/{f}", f"{STAGE}/scripts/fixtures/{f}")
    n_skrip += 1
print(f"scripts/ → {n_skrip} file (uji + fixture)")

# ---------- 3. dokumentasi ----------
shutil.copy2(f"{ROOT}/README.md", f"{STAGE}/README.md")
os.makedirs(f"{STAGE}/docs")
shutil.copy2(f"{ROOT}/docs/PROGRES.md", f"{STAGE}/docs/PROGRES.md")
shutil.copy2(f"{ROOT}/docs/CHANGELOG.md", f"{STAGE}/docs/CHANGELOG.md")
print("README.md + docs/PROGRES.md + docs/CHANGELOG.md ditulis")

# ---------- 4. config ----------
CONFIGS = ["tsconfig.json", "tailwind.config.ts", "postcss.config.mjs",
           "eslint.config.mjs", "components.json", "bun.lock"]
for c in CONFIGS:
    p = f"{ROOT}/{c}"
    if os.path.exists(p):
        shutil.copy2(p, f"{STAGE}/{c}")
    else:
        print(f"!! hilang: {c}")
print("config disalin:", ", ".join(c for c in CONFIGS if os.path.exists(f"{STAGE}/{c}")))

# package.json versi repo (bersih, portabel)
pkg = json.load(open(f"{ROOT}/package.json"))
pkg["name"] = "wokcam"
pkg["version"] = "0.3.0"
pkg["description"] = "Studio produksi video faceless Rp0 — prototype Next.js TANPA database: generator prompt, koleksi style (localStorage), editor timeline langsung (drag, trim, teks, transisi, katalog latar/overlay), proyek tutorial + panduan interaktif, pratinjau WAAPI. Kontrak siap porting ke app Kotlin."
pkg["license"] = "MIT"
pkg["scripts"] = {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "bash scripts/uji-semua.sh",
}
json.dump(pkg, open(f"{STAGE}/package.json", "w"), indent=2, ensure_ascii=False)
print(f"package.json (versi repo {pkg['version']}) ditulis")

# next.config.ts versi repo (tanpa standalone, tanpa bypass TS)
open(f"{STAGE}/next.config.ts", "w").write(
'''import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
''')

# skrip pembantu: jalankan seluruh uji bun
open(f"{STAGE}/scripts/uji-semua.sh", "w").write(
'''#!/usr/bin/env bash
# Jalankan seluruh uji regresi wokCam (butuh bun).
set -e
total=0
for f in scripts/test-*.ts; do
  echo "== $f =="
  bun "$f" | tail -1
done
echo "Selesai — semua rangkaian dijalankan."
''')

# ---------- 5. kompres ZIP ----------
os.makedirs(f"{ROOT}/download", exist_ok=True)
if os.path.exists(OUT):
    os.remove(OUT)

SKIP_DIRS = {"node_modules", ".next", ".git", "__MACOSX"}
SKIP_FILES = {".DS_Store", "Thumbs.db", "dev.log", "server.log"}
count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for base, dirs, files in os.walk(STAGE):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in sorted(files):
            if f in SKIP_FILES or f.endswith(".zip"):
                continue
            full = os.path.join(base, f)
            rel = os.path.relpath(full, STAGE)  # root ZIP = root repo
            z.write(full, rel.replace(os.sep, "/"))
            count += 1

size = os.path.getsize(OUT)
print(f"\nZIP: {OUT}")
print(f"     {count} file · {size/1024:.0f} KB ({size/1024/1024:.2f} MB)")

# ---------- 6. salin ke public/ untuk halaman /unduhan ----------
shutil.copy2(OUT, f"{ROOT}/public/wokcam-repo.zip")
print("disalin ke public/wokcam-repo.zip (halaman /unduhan)")

# ---------- 7. verifikasi ----------
with zipfile.ZipFile(OUT) as z:
    bad = z.testzip()
    assert bad is None, f"CRC gagal: {bad}"
    names = z.namelist()
    assert not any(n.endswith("/") for n in names), "ada entri folder"
    assert not any(n.startswith("__MACOSX") for n in names)
    assert not any(".DS_Store" in n for n in names)
    assert "README.md" in names and "docs/PROGRES.md" in names, "dokumentasi hilang"
    assert "docs/CHANGELOG.md" in names, "changelog hilang"
    assert any(n.startswith("scripts/test-") for n in names), "uji hilang"
    assert "src/lib/db.ts" not in names, "db.ts masih ada!"
    assert "prisma/schema.prisma" not in names
    for terlarang in [
        "src/app/api/route.ts",
        "src/components/editor/DatabasePanel.tsx",
        "src/components/editor/ExportModal.tsx",
        "src/components/editor/ToolGuidePanel.tsx",
        "src/components/editor/AnimationLibrary.tsx",
        "src/lib/editor/engine.ts",
        "src/lib/editor/model.ts",
    ]:
        assert terlarang not in names, f"sisa era database: {terlarang}"
    assert not any(n.startswith("src/components/editor/tabs/") for n in names), "tabs lama masih ada"
    infos = z.infolist()
    assert all(i.compress_type in (0, 8) for i in infos), "metode kompresi tidak didukung"
    assert all((i.flag_bits & 0x1) == 0 for i in infos), "ada entri terenkripsi"
    assert all(len(n.encode()) < 65535 for n in names)
print(f"verifikasi: CRC OK · {len(names)} entri · DEFLATE · tanpa zip64/enkripsi · tanpa database ✓")

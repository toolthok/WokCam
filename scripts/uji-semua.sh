#!/usr/bin/env bash
# Jalankan seluruh uji regresi wokCam (butuh bun).
set -e
total=0
for f in scripts/test-*.ts; do
  echo "== $f =="
  bun "$f" | tail -1
done
echo "Selesai — semua rangkaian dijalankan."

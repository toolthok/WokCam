#!/usr/bin/env python3
"""Patch kompatibilitas WPS: format nomor halaman di footer + hapus pgNumType kosong."""
import re, shutil, sys, zipfile, os

SRC = sys.argv[1]
TMP = SRC + ".tmp"

with zipfile.ZipFile(SRC, "r") as zin:
    names = zin.namelist()
    data = {n: zin.read(n) for n in names}

changed = []
for n in list(data.keys()):
    if re.match(r"word/footer\d*\.xml$", n):
        xml = data[n].decode("utf-8")
        if "888887" in xml:  # penanda footer Romawi
            new = re.sub(r"(<w:instrText[^>]*>)[^<]*PAGE[^<]*(</w:instrText>)",
                         r"\1 PAGE \\* ROMAN \\* MERGEFORMAT \2", xml)
        else:
            new = re.sub(r"(<w:instrText[^>]*>)[^<]*PAGE[^<]*(</w:instrText>)",
                         r"\1 PAGE \\* arabic \\* MERGEFORMAT \2", xml)
        if new != xml:
            data[n] = new.encode("utf-8"); changed.append(n)

doc = data["word/document.xml"].decode("utf-8")
new = doc.replace("<w:pgNumType/>", "")
if new != doc:
    data["word/document.xml"] = new.encode("utf-8"); changed.append("word/document.xml")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as zout:
    for n in names:
        zout.writestr(n, data[n])
shutil.move(TMP, SRC)
print("Patched:", ", ".join(changed) if changed else "(tidak ada perubahan)")

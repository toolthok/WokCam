"use client";

import { useState, useSyncExternalStore } from "react";

const FILES = [
  {
    nama: "wokcam-repo.zip",
    ukuran: "0,9 MB · 108 file · v0.2.0",
    deskripsi:
      "Sumber kode lengkap: editor timeline baru (tanpa database, editing langsung), generator & koleksi, 284 uji regresi (bun), README.md + docs/PROGRES.md (status, masalah terbuka, rencana) — siap diunggah ke GitHub.",
  },
  {
    nama: "PRD-wokCam-Mobile.docx",
    ukuran: "32 KB · 17 halaman",
    deskripsi: "Dokumen Persyaratan Produk (PRD) wokCam Mobile v1.0 — siap dikirim ke klien untuk persetujuan.",
  },
];

const emptySubscribe = () => () => {};
const getClientOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export default function UnduhanPage() {
  const origin = useSyncExternalStore(emptySubscribe, getClientOrigin, getServerOrigin);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyUrl(file: string) {
    const fullUrl = `${window.location.origin}/${file}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = fullUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(file);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#09090b",
        color: "#e4e4e7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
            Unduhan wokCam
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, margin: 0 }}>
            Salin URL di bawah ke browser lain (Chrome) jika tombol unduh bermasalah.
          </p>
        </div>

        {FILES.map(f => (
          <div
            key={f.nama}
            style={{
              background: "#111113",
              border: "1px solid #27272a",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#a78bfa",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: "#8b5cf6",
                  boxShadow: "0 0 10px #8b5cf6",
                  display: "inline-block",
                }}
              />
              {f.ukuran}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px", wordBreak: "break-all" }}>
              {f.nama}
            </h2>
            <p style={{ color: "#a1a1aa", fontSize: 13, margin: "0 0 12px" }}>
              {f.deskripsi}
            </p>
            <a
              href={`/${f.nama}`}
              download={f.nama}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                background: "linear-gradient(to right, #7c3aed, #c026d3)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                padding: "12px 0",
                borderRadius: 12,
                textDecoration: "none",
                marginBottom: 10,
              }}
            >
              ⬇ Unduh sekarang
            </a>
            <div
              style={{
                fontSize: 12,
                fontFamily: "ui-monospace, monospace",
                color: "#e4e4e7",
                wordBreak: "break-all",
                background: "#09090b",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #27272a",
                marginBottom: 8,
              }}
            >
              {origin ? `${origin}/${f.nama}` : "Memuat…"}
            </div>
            <button
              onClick={() => copyUrl(f.nama)}
              style={{
                width: "100%",
                background: "#27272a",
                color: "#e4e4e7",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                padding: "9px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copied === f.nama ? "✓ URL tersalin!" : "Salin URL"}
            </button>
          </div>
        ))}

        <a
          href="/generator"
          style={{
            display: "block",
            textAlign: "center",
            background: "#111113",
            border: "1px solid #3f3f46",
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 700,
            color: "#a78bfa",
            textDecoration: "none",
          }}
        >
          🛠 Buka Generator Prompt AI →
        </a>
      </div>
    </main>
  );
}

import type { NextConfig } from "next";

/* Ekspor statis → bisa di-host di GitHub Pages (tanpa server; data di localStorage).
 * NEXT_PUBLIC_BASE_PATH diisi workflow Pages ("/nama-repo"); kosong saat `npm run dev`. */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;

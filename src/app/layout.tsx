import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "wokCam — Studio Video Faceless (Mockup UI)",
  description:
    "Editor video faceless: tempel naskah dari AI chat, atur scene, suara, visual & subtitle, lalu export. Dilengkapi database Google Sheets, koleksi animasi & sumber aset gratis Rp0.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${montserrat.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid #3f3f46",
              color: "#e4e4e7",
            },
          }}
        />
      </body>
    </html>
  );
}

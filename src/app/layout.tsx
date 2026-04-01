import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시황 브리핑 플레이어",
  description: "시황/종목 이슈 TTS 플레이어",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "시황 브리핑",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full bg-gray-950 text-white overscroll-none">
        {children}
      </body>
    </html>
  );
}

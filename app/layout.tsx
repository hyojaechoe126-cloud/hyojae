import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AiTutor from "@/components/AiTutor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "효재의 교육용 웹앱",
  description: "Vercel에 즉시 배포 가능한 교육용 웹앱 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500/30">
        {children}
        <AiTutor />
      </body>
    </html>
  );
}

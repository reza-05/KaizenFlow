import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaizenFlow — Lock In & Learn | Distraction-Free Video Study",
  description: "Transform any YouTube playlist into an active, locked-in study portal with proof-of-focus verification, streaks, and syllabus matching.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Noto_Sans_Telugu, Noto_Serif_Telugu } from "next/font/google";
import "./globals.css";

const teluguSans = Noto_Sans_Telugu({
  variable: "--font-telugu-sans",
  subsets: ["telugu", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Serif display — editorial authority for headlines, wordmark, section titles.
const teluguDisplay = Noto_Serif_Telugu({
  variable: "--font-telugu-display",
  subsets: ["telugu", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "AK Ganesh",
  description: "Telugu news and stories",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="te">
      <body className={`${teluguSans.variable} ${teluguDisplay.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

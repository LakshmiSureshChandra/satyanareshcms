import type { Metadata } from "next";
import { Noto_Sans_Telugu, Baloo_Tammudu_2 } from "next/font/google";
import "./globals.css";

const teluguSans = Noto_Sans_Telugu({
  variable: "--font-telugu-sans",
  subsets: ["telugu", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Chunky rounded display face (supports Telugu) — headlines, wordmark, section titles.
const teluguDisplay = Baloo_Tammudu_2({
  variable: "--font-telugu-display",
  subsets: ["telugu", "latin"],
  weight: ["500", "600", "700", "800"],
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

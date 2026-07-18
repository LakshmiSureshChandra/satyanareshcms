import type { Metadata, Viewport } from "next";
import { Noto_Sans_Telugu, Playfair_Display } from "next/font/google";
import "./globals.css";

// Body: Noto Sans Telugu covers Latin cleanly and still renders any Telugu content.
const bodySans = Noto_Sans_Telugu({
  variable: "--font-telugu-sans",
  subsets: ["telugu", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Serif display — editorial authority for headlines, wordmark, section titles.
const display = Playfair_Display({
  variable: "--font-telugu-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "AK Ganesh",
  description: "News and stories",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AK Ganesh" },
};

export const viewport: Viewport = {
  themeColor: "#8e1f22",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodySans.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

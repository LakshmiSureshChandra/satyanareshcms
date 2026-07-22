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
      <head>
        {/* runs before paint so a saved text-size preference never flashes at the default size */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('text-size');if(s&&s!=='md')document.documentElement.setAttribute('data-text-size',s)}catch(e){}`,
          }}
        />
      </head>
      <body className={`${bodySans.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Telugu, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Body copy — Inter. Neutral, dense, excellent at small sizes in tables/meta.
const bodySans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Display — Plus Jakarta Sans. Geometric, confident, carries the headlines.
const display = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

// Neither Latin face ships Telugu glyphs, so Telugu characters fall through to
// this in the font stack — CMS content can stay bilingual without a second theme.
const telugu = Noto_Sans_Telugu({
  variable: "--font-telugu-sans",
  subsets: ["telugu", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "AK Ganesh",
  description: "News and stories",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AK Ganesh" },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the beforeInteractive script below sets
    // data-text-size/data-theme-color on this element from localStorage before
    // React hydrates. Without this flag, React's hydration treats those as a
    // server/client mismatch and "corrects" <html> back to what the server
    // rendered (which has neither attribute) — the attribute was visibly
    // being set correctly for ~50ms and then wiped right as hydration ran.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* strategy="beforeInteractive" is Next's actual mechanism for a script that
            must run before hydration — a plain <script dangerouslySetInnerHTML> in a
            Server Component looks like it should work the same way, but under the App
            Router's RSC streaming it only ends up serialized inside the hydration
            payload, not as literal pre-hydration HTML, so it never actually executes on
            a real page load (confirmed: saved theme/text-size silently reset on every
            refresh because this was never reapplying them). */}
        <Script id="prefs-init" strategy="beforeInteractive">
          {`try{
            var s=localStorage.getItem('text-size');if(s&&s!=='md')document.documentElement.setAttribute('data-text-size',s);
            var c=localStorage.getItem('theme-color');if(c&&c!=='default')document.documentElement.setAttribute('data-theme-color',c);
          }catch(e){}`}
        </Script>
      </head>
      <body className={`${bodySans.variable} ${display.variable} ${telugu.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

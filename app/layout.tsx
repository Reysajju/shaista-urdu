import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google"; // Old money fonts
import "./globals.css";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { createClient } from "@/utils/supabase/server";
import Script from "next/script";

// Serif font for headings (Old Money style)
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Clean sans-serif for body text readability
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shaista Model | Premium AI Executive Assistant",
  description: "Experience Shaista: A refined, Urdu-native AI model built for polished intelligence, scholarly research, and professional consulting.",
  keywords: ["AI", "Shaista", "Urdu LLM", "Artifical Intelligence", "Premium AI", "Old Money Aesthetic", "Scholarly AI"],
  authors: [{ name: "Shaista Intelligence" }],
  openGraph: {
    title: "Shaista Model | Polished Urdu Intelligence",
    description: "The most refined Urdu-native AI assistant designed for the study and the boardroom.",
    url: "https://shaista.ai",
    siteName: "Shaista",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shaista AI - Polished Intelligence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shaista Model | Premium AI",
    description: "Refined, Urdu-native AI for scholarly and professional discourse.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://shaista.ai",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Shaista AI",
  "operatingSystem": "Web",
  "applicationCategory": "AI Assistant",
  "description": "A refined and polite Urdu-native AI assistant for scholarly research and professional needs.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Organization",
    "name": "Shaista Intelligence"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://media.ethicalads.io/media/client/ethicalads.min.js"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased bg-[#050F0A] text-[#F5F5F0] font-sans selection:bg-[#D4AF37] selection:text-[#050F0A]`}
      >
        <RealtimeProvider initialUser={user}>
          {children}
        </RealtimeProvider>
      </body>
    </html>
  );
}

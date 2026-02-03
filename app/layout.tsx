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
  title: "Shaista Model | Premium AI Experience",
  description: "A refined and polite AI assistant for your professional needs.",
  keywords: ["AI", "Shaista", "Urdu", "Assistant", "Premium", "Old Money"],
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

import type { Metadata } from "next";
import { Fredoka, Geist_Mono, Nunito } from "next/font/google";
import {
  APP_NAME,
  APP_SEO_DESCRIPTION,
  APP_SEO_KEYWORDS,
  APP_SEO_TITLE,
  APP_URL,
} from "@/lib/app-config";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_SEO_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_SEO_DESCRIPTION,
  keywords: [...APP_SEO_KEYWORDS],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_SEO_TITLE,
    description: APP_SEO_DESCRIPTION,
    images: [
      {
        url: "/image/logo.png",
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_SEO_TITLE,
    description: APP_SEO_DESCRIPTION,
    images: ["/image/logo.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${nunito.variable} ${fredoka.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

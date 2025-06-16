import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
export const metadata: Metadata = {
  title: "SocializeNow - Conecte-se com o mundo",
  description: "Rede social para conectar pessoas e compartilhar momentos.",
  keywords: "rede social, conectar pessoas, compartilhar momentos, SocializeNow",
  authors: [{ name: "Eliobros Tech" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://socializenow.vercel.app",
    title: "SocializeNow - Conecte-se com o mundo",
    description: "Rede social para conectar pessoas e compartilhar momentos.",
    images: [
      {
        url: "https://socializenow.vercel.app/soocializenow.png",
        width: 1200,
        height: 630,
        alt: "SocializeNow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SocializeNow - Conecte-se com o mundo",
    description: "Rede social para conectar pessoas e compartilhar momentos.",
    images: ["https://socializenow.vercel.app/socializenow.png"],
    creator: "@tech12384",
  },
  icons: {
    icon: "/socializenow.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        {children}
        <Analytics />
        </body>
    </html>
  );
}

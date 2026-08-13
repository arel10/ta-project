import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sirkula.tech"),
  title: {
    default: "Sirkula Admin - Dashboard Pengelolaan Sampah",
    template: "%s | Sirkula Admin",
  },
  description: "Platform Digital Bank Sampah dan Sistem Pengelolaan Sampah Kota Padang",
  keywords: ["Sirkula", "Bank Sampah", "Kota Padang", "Waste Management", "Next.js"],
  authors: [{ name: "Dinas Lingkungan Hidup Kota Padang" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Sirkula Admin - Dashboard Pengelolaan Sampah",
    description: "Platform Digital Bank Sampah dan Sistem Pengelolaan Sampah Kota Padang",
    url: "https://sirkula.tech",
    siteName: "Sirkula Ecosystem",
    images: [
      {
        url: "https://sirkula.tech/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sirkula Admin Dashboard",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sirkula Admin - Dashboard Pengelolaan Sampah",
    description: "Platform Digital Bank Sampah dan Sistem Pengelolaan Sampah Kota Padang",
    images: ["https://sirkula.tech/twitter-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}

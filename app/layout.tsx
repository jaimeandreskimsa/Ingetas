import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ingetas Ltda | Aplicamos Ingeniería a los Procesos de Tasación",
  description:
    "Empresa especialista en tasación de bienes muebles e inmuebles y revisión de avance de obras. Más de 25.000 tasaciones en 20 años. Viña del Mar, Chile.",
  keywords: [
    "tasación",
    "tasaciones",
    "peritaje",
    "avalúo",
    "bienes raíces",
    "Viña del Mar",
    "Valparaíso",
    "Ingetas",
  ],
  openGraph: {
    title: "Ingetas Ltda | Ingeniería aplicada a la tasación",
    description:
      "Más de 25.000 tasaciones en 20 años. Inmobiliaria, industrial, vehículos, naviera, IFRS y portuaria.",
    type: "website",
    locale: "es_CL",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

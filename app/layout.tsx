import type { Metadata } from "next";
import { Roboto_Mono, Road_Rage } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-roboto",
  display: "swap",
});

const roadRage = Road_Rage({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-road-rage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EdZa tech",
  description:
    "Diseñamos y creamos páginas web que no solo se ven bien, atraen clientes y venden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${robotoMono.variable} ${robotoMono.className} ${roadRage.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

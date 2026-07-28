import type { Metadata } from "next";
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import "./globals.css";

export const metadata: Metadata = {
  title: "Calzados Juárez",
  description: "Tienda en línea de sandalías a mayoreo y menudeo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
    >
      <body className="min-h-screen flex flex-col">
        <Header></Header>
        <main className="flex-1">{children}</main>
        <Footer></Footer>

      </body>
    </html>
  );
}
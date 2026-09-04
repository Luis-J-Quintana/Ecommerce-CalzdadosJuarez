import type { Metadata } from "next";
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { CartProvider } from "@/lib/cartContex";
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
        <CartProvider>
          <Header></Header>
          <CartProvider><main className="flex-1 pb-16 sm:pb-20">{children}</main></CartProvider>
          <Footer></Footer>
        </CartProvider>
      </body>
    </html>
  );
}
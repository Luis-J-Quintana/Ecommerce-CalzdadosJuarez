"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/icons/LogoCalzadosV2.png";
import { usePathname } from "next/navigation";
import { categories } from "@/lib/categories";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { IoMdMenu } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import CustomIcon from "./CustomIcon";
import { useRef, useState, useEffect } from "react";
import SideMenu from "./HeaderComponents/SideMenu";
import SideListProducts from "../ShopingCart/SideListProducts";
import CartToast from "../ShopingCart/CartToast";
import { useCart } from "@/lib/cartContex";
import { LuSearch, LuUser, LuShoppingCart } from "react-icons/lu";

function LinkCategories() {
  const pathname = usePathname();

  return (
    <>
      {categories.map((cat) => {
        const isActive = pathname === cat.href;
        return (
          <Link
            key={cat.href}
            href={cat.href}
            className={isActive ? "text-black font-bold" : "text-gray-500 hover:text-black transition-colors"}
          >
            {cat.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isCategorySelected = categories.some((cat) => cat.href === pathname);
  const topNavRef = useRef<HTMLDivElement>(null);
  const [topNavHeight, setTopNavHeight] = useState(0);
  const [menuOpened, setMenuOpened] = useState(false);
  const hidden = useScrollDirection();
  const { totalPairs, toggleCart, isOpen: isCartOpen, closeCart } = useCart();

  // useEffect para actualizar la altura del header
  useEffect(() => {
    if (!topNavRef.current) return;

    const updateHeight = () => setTopNavHeight(topNavRef.current?.offsetHeight ?? 0);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(topNavRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <>
      <div
        className={`sticky top-0 z-40 flex flex-col transition-transform duration-300 ${
          hidden && !menuOpened ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <nav ref={topNavRef} className="relative z-30 bg-white border-b border-gray-100 shadow-xs">
          <ul className="grid grid-cols-3 items-center px-4 h-14">
            {/* Columna izquierda */}
            <li className="flex items-center gap-3 justify-self-start">
              <button
                onClick={() => setMenuOpened(!menuOpened)}
                aria-label={menuOpened ? "Cerrar menú" : "Abrir menú"}
              >
                <CustomIcon icon={menuOpened ? AiOutlineClose : IoMdMenu} size={28} color="black" />
              </button>
            </li>

            {/* Columna centro */}
            <li className="justify-self-center">
              <Link href="/" onClick={() => setMenuOpened(false)} className="flex items-center">
                <Image
                  src={Logo}
                  alt="Logo Calzados Juárez"
                  height={38}
                  className="object-contain w-auto"
                  priority
                />
              </Link>
            </li>

            {/* Columna derecha */}
            <li className="flex items-center gap-4 justify-self-end">
              <button aria-label="Buscar productos">
                <CustomIcon icon={LuSearch} size={24} color="black" />
              </button>
              <Link href="/login" aria-label="Mi cuenta">
                <CustomIcon icon={LuUser} size={24} color="black" />
              </Link>
              <button
                onClick={toggleCart}
                aria-label={`Ver carrito (${totalPairs} artículos)`}
                className="relative flex items-center justify-center p-1 transition-transform active:scale-95"
              >
                <CustomIcon icon={LuShoppingCart} size={24} color="black" />
                {totalPairs > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-black text-white">
                    {totalPairs > 99 ? "99+" : totalPairs}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        {/* Barra de categorías secundaria */}
        {isCategorySelected && (
          <nav className="relative z-20 flex justify-around py-3 bg-white border-b border-gray-100">
            <LinkCategories />
          </nav>
        )}
      </div>

      <SideMenu
        isOpen={menuOpened}
        onClose={() => setMenuOpened(false)}
        topOffset={topNavHeight}
      />

      <SideListProducts
        isOpen={isCartOpen}
        onClose={closeCart}
        topOffset={0}
      />

      <CartToast />
    </>
  );
}
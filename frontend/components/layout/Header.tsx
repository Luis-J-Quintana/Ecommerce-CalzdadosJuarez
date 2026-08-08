"use client"
import Link from 'next/link';
import Image from 'next/image'; // 1. Importar el componente Image de Next.js
import Logo from '@/icons/LogoCalzadosV2.png'; // 2. Importar tu imagen
import { usePathname } from "next/navigation";
import { categories } from "@/lib/categories";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { IoMdMenu } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import CustomIcon from './CustomIcon'
import { useRef, useState, useEffect } from "react";
import SideMenu from './HeaderComponents/SideMenu';
import SideListProducts from '../ShopingCart/SideListProducts';
import {
  LuSearch,
  LuUser,
  LuShoppingCart
} from "react-icons/lu";

function LinkCategories() {
  const pathname = usePathname();

  return (
    <>
      {categories.map((cat) => {
        const isActive = pathname === cat.href;
        if (isActive){console.log('pasar prop al header')}

        return (
          <Link
            key={cat.href}
            href={cat.href}
            className={isActive ? "text-black font-bold" : "text-gray-500"}
          >
            {cat.label}
          </Link>
        );
      })}
    </>
  );
};

export default function Header() {
  const pathname = usePathname();
  const isCategorySelected = categories.some((cat) => cat.href === pathname);
  const topNavRef = useRef<HTMLDivElement>(null);
  const [topNavHeight, setTopNavHeight] = useState(0);
  const [menuOpened, setMenuOpened] = useState(false);
  const [shopingCartOpened, setShopingCartOpened] = useState(false);
  const hidden = useScrollDirection();


  // useEffect for update the heght of the header variable
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
        className={`sticky top-0 z-50 flex flex-col transition-transform duration-300 ${
          hidden && !menuOpened ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <nav ref={topNavRef} className="relative z-30 bg-white">
          <ul className="grid grid-cols-3 items-center px-4 h-12">
            {/* Columna izquierda */}
            <li className="flex items-center gap-3 justify-self-start">
              <button onClick={() =>{setMenuOpened(!menuOpened)}}>
                <CustomIcon icon={menuOpened ? AiOutlineClose : IoMdMenu} size={30} color='black'/>
              </button>
            </li>

            {/* Columna centro */}
            <li className="justify-self-center">
              <Link href="/" onClick={() => setMenuOpened(false)} className="flex items-center">
                <Image 
                  src={Logo} 
                  alt="Logo Calzados" 
                  height={36} // Ajusta la altura según tu diseño (la barra mide h-12)
                  className="object-contain width-auto"
                  priority 
                />
              </Link>
            </li>

            <li className="flex items-center gap-3 justify-self-end">
              <button>
                <CustomIcon icon={LuSearch} size={30} color='black'/>
              </button>
              <Link href={"/login"}>
                <CustomIcon icon={LuUser} size={30} color='black'/>
              </Link>
              <button onClick={() => {setShopingCartOpened(!shopingCartOpened)}}>
                <CustomIcon icon={LuShoppingCart} size={30} color='black'/>
              </button>
            </li>
          </ul>
        </nav>
        {/* the nav behind should apears only when some link were selected */}
        {isCategorySelected && (
          <nav className='relative z-0 flex justify-around py-3 bg-white'>
            <LinkCategories/>
          </nav>
        )}
      </div>        
          
      <SideMenu 
        isOpen={menuOpened} 
        onClose={() => setMenuOpened(false)}
        topOffset={topNavHeight} 
      />

      <SideListProducts
        isOpen={shopingCartOpened}
        onClose={() => setShopingCartOpened(false)}
        topOffset={0}/>
        
      
    </>
  );
}
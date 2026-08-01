"use client"
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { categories } from "@/lib/categories";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { IoMdMenu } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import CustomIcon from './CustomIcon'
import { useRef, useState, useEffect } from "react";
import SideMenu from './HeaderComponents/SideMenu'
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
              <Link href="/" onClick={() => setMenuOpened(false)}>
                <span className="font-bold text-lg">LOGO</span>
              </Link>
            </li>

            <li className="flex items-center gap-3 justify-self-end">
              <CustomIcon icon={LuSearch} size={30} color='black'/>
              <CustomIcon icon={LuUser} size={30} color='black'/>
              <CustomIcon icon={LuShoppingCart} size={30} color='black'/>
            </li>
          </ul>
        </nav>
        {/* the nav behind it should apears only when some link were selected */}
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
        
      
    </>
  );
}
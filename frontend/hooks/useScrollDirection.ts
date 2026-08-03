// hooks/useScrollDirection.ts
"use client";
import { useState, useEffect, useRef } from "react";

export function useScrollDirection(threshold = 10) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) < threshold) return; // ignora micro-scrolls

      if (currentScrollY <= 0) {
        setHidden(false); // arriba del todo, siempre visible
      } else if (diff > 0) {
        setHidden(true); // bajando -> ocultar
      } else {
        setHidden(false); // subiendo -> mostrar
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return hidden;
}
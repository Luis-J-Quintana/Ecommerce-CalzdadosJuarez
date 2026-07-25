import Link from 'next/link'
import React from 'react'

export default function Header() {
  return (
    <nav>
        <ul>
            <Link href="/nosotros">Nostros</Link>

            <Link href="/productos">Productos </Link>

            <Link href="/contacto">Contáctanos</Link>
        </ul>
    </nav>
  );
}
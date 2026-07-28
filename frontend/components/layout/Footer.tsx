import Link from "next/link";
import Image from "next/image";
import MercadoPagoLogo from "../../icons/MercadoPagoLogo.png";
import PaypalLogo from "../../icons/PaypalLogo.jpg";
import "../../app/global.css";

export default function Footer() {
  return (
    <footer className="relative bg-(--footer-bg) text-(--footer-text) font-(family-name:var--footer-font)">
      {/* Efecto wave */}
      <div className="pointer-events-none absolute inset-x-0 top-0 translate-y-[-99%] h-16 overflow-hidden sm:h-20">
        <svg
          className="wave-layer wave-layer-1 absolute top-0 left-0 h-full w-[200%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z"
            fill="var(--footer-wave-1)"
          />
        </svg>
        <svg
          className="wave-layer wave-layer-2 absolute top-0 left-0 h-full w-[200%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,55 C200,15 400,95 600,55 C800,15 1000,95 1200,55 L1200,120 L0,120 Z"
            fill="var(--footer-wave-2)"
          />
        </svg>
        <svg
          className="wave-layer wave-layer-3 absolute top-0 left-0 h-full w-[200%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,70 C180,30 420,100 600,70 C780,40 1020,100 1200,70 L1200,120 L0,120 Z"
            fill="var(--footer-wave-3)"
          />
        </svg>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          {/* Columna politicas */}
          <div>
            <h3 className="mb-5 text-lg font-bold">Politicas</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="hover:underline">
                  Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">
                  Terminos de Servicio
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">
                  Politica de Reembolso
                </Link>
              </li>
            </ul>
          </div>
          {/* Columna comprar */}
          <div>
            <h3 className="mb-5 text-lg font-bold">Comprar</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="hover:underline">
                  Nuevos Modelos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">
                  Tipos de Zapatos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">
                  Emprende con Nosotros
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">
                  Nuestra Historia
                </Link>
              </li>
            </ul>
          </div>
          {/* Columna nosotros */}
          <div>
            <h3 className="mb-5 text-lg font-bold">Nosotros</h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">Cancun, Quintana Roo <b> MX</b></p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Ubicados en Cancun en av. Ninos Heroes 181-Mz 8, C.P. 77510
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.instagram.com/calzadojuarez_/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:opacity-80"
              >
                <span className="icon-[skill-icons--instagram] h-7 w-7"></span>
              </a>
              <a
                href="https://www.facebook.com/p/Calzados-Ju%C3%A1rez-100086203390716/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:opacity-80"
              >
                <span className="icon-[logos--facebook] h-7 w-7"></span>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:opacity-80"
              >
                <span className="icon-[logos--tiktok-icon] h-7 w-7"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Franja inferior */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex h-8 w-14 items-center justify-center rounded bg-white px-1">
              <Image
                src={MercadoPagoLogo}
                alt="Mercado Pago"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex h-8 w-14 items-center justify-center rounded bg-white px-1">
              <Image
                src={PaypalLogo}
                alt="PayPal"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center text-sm text-white/80 sm:flex-row sm:justify-center sm:gap-2">
            <span>© 2026, Calzados Juarez</span>
            <span className="hidden sm:inline">·</span>
            <Link href="#" className="hover:underline">
              Politica de reembolso
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="#" className="hover:underline">
              Politica de privacidad
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="#" className="hover:underline">
              Terminos del servicio
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="#" className="hover:underline">
              Politica de envio
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-white/50">
            calzadosjuarez.com
          </p>
        </div>
      </div>
    </footer>
  );
}
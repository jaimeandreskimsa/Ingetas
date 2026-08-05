import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Servicios", href: "#servicios" },
  { label: "Experiencia", href: "#experiencia" },
  { label: "Contacto", href: "#contacto" },
];

const SERVICIOS = [
  "Inmobiliaria",
  "Industrial",
  "Vehículos",
  "Naviera",
  "IFRS",
  "Portuaria",
];

export function Footer() {
  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="container-x py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm leading-relaxed">
              Aplicamos ingeniería a los procesos de tasación. Más de 25.000
              tasaciones en 20 años de experiencia en todo Chile.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <a
                href="tel:+56994376425"
                className="flex items-center gap-2 hover:text-gold-400"
              >
                <Phone size={16} /> 9 9437 6425 · 9 9536 8287
              </a>
              <a
                href="mailto:ingetas@vtr.net"
                className="flex items-center gap-2 hover:text-gold-400"
              >
                <Mail size={16} /> ingetas@vtr.net
              </a>
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" /> Calle Limache
                3421, edificio Reitz II, oficina 705, Viña del Mar, Chile
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-white">
              Enlaces
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="transition hover:text-gold-400">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className="transition hover:text-gold-400">
                  Acceder al panel
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-white">
              Servicios
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {SERVICIOS.map((s) => (
                <li key={s}>
                  <a href="#servicios" className="transition hover:text-gold-400">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-sm sm:flex-row">
          <p>
            © {new Date().getFullYear()} Ingetas Ltda. Todos los derechos
            reservados.
          </p>
          <p className="text-white/40">
            Aplicamos ingeniería a los procesos de tasación.
          </p>
        </div>
      </div>
    </footer>
  );
}

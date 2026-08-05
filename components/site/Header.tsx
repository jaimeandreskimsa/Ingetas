"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, LogIn } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { label: "Inicio", href: "#inicio" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Servicios", href: "#servicios" },
  { label: "Experiencia", href: "#experiencia" },
  { label: "Contacto", href: "#contacto" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy-950/95 shadow-lg shadow-navy-950/20 backdrop-blur"
          : "bg-transparent"
      }`}
    >
      <div className="container-x flex h-[76px] items-center justify-between">
        <Link href="#inicio" aria-label="Ingetas inicio">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative text-sm font-medium text-white/80 transition hover:text-white"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 rounded-full bg-gold-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="tel:+56994376425"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-gold-400 hover:text-gold-400"
          >
            <Phone size={16} /> Llamar
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-300"
          >
            <LogIn size={16} /> Acceder
          </Link>
        </div>

        <button
          className="text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="border-t border-white/10 bg-navy-950 lg:hidden">
          <nav className="container-x flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-white/90 transition hover:bg-white/5 hover:text-gold-400"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gold-400 px-5 py-3 font-semibold text-navy-950"
            >
              <LogIn size={16} /> Acceder al panel
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

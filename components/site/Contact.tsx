import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Reveal, Stagger, Item } from "./anim";

const CARDS = [
  {
    icon: Phone,
    label: "Llámanos",
    lines: ["9 9437 6425", "9 9536 8287"],
    href: "tel:+56994376425",
  },
  {
    icon: Mail,
    label: "Escríbenos",
    lines: ["ingetas@vtr.net"],
    href: "mailto:ingetas@vtr.net",
  },
  {
    icon: MapPin,
    label: "Visítanos",
    lines: ["Calle Limache 3421, edificio Reitz II", "Oficina 705, Viña del Mar"],
    href: "https://maps.google.com/?q=Calle+Limache+3421+Vi%C3%B1a+del+Mar",
  },
];

export function Contact() {
  return (
    <section id="contacto" className="bg-white py-24">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-3xl bg-navy-950 shadow-xl shadow-navy-900/10">
          <div className="absolute -right-20 -top-20 h-72 w-72 animate-float-slow rounded-full bg-gold-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 animate-float-slow2 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative p-10 text-center lg:p-16">
            <p className="eyebrow mb-4 justify-center">
              <span className="h-px w-8 bg-gold-500" /> Contacto
            </p>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Conversemos sobre tu tasación
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Nuestro equipo está listo para ayudarte. Contáctanos por teléfono o
              correo y te responderemos a la brevedad.
            </p>

            <Stagger className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
              {CARDS.map((c) => (
                <Item key={c.label}>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/[0.08]"
                  >
                    <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400 transition group-hover:scale-110 group-hover:bg-gold-400 group-hover:text-navy-950">
                      <c.icon size={22} />
                    </span>
                    <p className="text-sm font-semibold uppercase tracking-wide text-gold-400">
                      {c.label}
                    </p>
                    {c.lines.map((l) => (
                      <p key={l} className="mt-1 text-white/85">
                        {l}
                      </p>
                    ))}
                  </a>
                </Item>
              ))}
            </Stagger>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <a href="tel:+56994376425" className="btn-gold">
                <Phone size={18} /> Llamar ahora
              </a>
              <a
                href="mailto:ingetas@vtr.net"
                className="btn-outline"
              >
                Escribir un correo <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

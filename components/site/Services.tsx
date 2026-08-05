import {
  Building2,
  Factory,
  Car,
  Ship,
  FileBarChart,
  Anchor,
} from "lucide-react";
import { Reveal, Stagger, Item, SpotlightCard } from "./anim";

const SERVICES = [
  {
    icon: Building2,
    title: "Inmobiliaria",
    text: "Tasación de casas, departamentos, terrenos, oficinas y proyectos residenciales o comerciales.",
  },
  {
    icon: Factory,
    title: "Industrial",
    text: "Valorización de plantas, galpones, maquinaria y activos productivos de todo tipo.",
  },
  {
    icon: Car,
    title: "Vehículos",
    text: "Peritajes y avalúos de vehículos, flotas y maquinaria de transporte.",
  },
  {
    icon: Ship,
    title: "Naviera",
    text: "Tasación de embarcaciones y activos del sector marítimo y naval.",
  },
  {
    icon: FileBarChart,
    title: "IFRS",
    text: "Valorizaciones bajo normas internacionales de información financiera para estados contables.",
  },
  {
    icon: Anchor,
    title: "Portuaria",
    text: "Tasación de terrenos, construcciones e infraestructura portuaria.",
  },
];

export function Services() {
  return (
    <section id="servicios" className="relative bg-navy-50/50 py-24">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-4 justify-center">
            <span className="h-px w-8 bg-gold-500" /> Nuestros servicios
          </p>
          <h2 className="section-title">¿Qué servicios ofrecemos?</h2>
          <p className="mt-4 text-lg text-navy-600">
            Privilegiamos la comunicación y cercanía con nuestros clientes, lo
            que nos permite adaptar nuestro servicio a sus requerimientos
            específicos.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Item key={s.title}>
              <SpotlightCard className="gradient-border group h-full overflow-hidden rounded-2xl border border-navy-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-navy-900/10">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-gold-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-400 group-hover:text-navy-950 group-hover:shadow-lg group-hover:shadow-gold-400/40">
                  <s.icon size={26} />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900">
                  {s.title}
                </h3>
                <p className="mt-3 leading-relaxed text-navy-600">{s.text}</p>
              </SpotlightCard>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

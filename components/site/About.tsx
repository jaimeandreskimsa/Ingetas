import { ShieldCheck, Target, Users, TrendingUp } from "lucide-react";
import { Reveal, Stagger, Item, SpotlightCard } from "./anim";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Sistema de Gestión de Calidad",
    text: "Procesos certificados con mejora continua y liderazgo comprometido en todos los niveles.",
  },
  {
    icon: Users,
    title: "Cercanía con el cliente",
    text: "Privilegiamos la comunicación para adaptar cada servicio a requerimientos específicos.",
  },
  {
    icon: Target,
    title: "Precisión técnica",
    text: "Metodología de ingeniería aplicada a la tasación de bienes muebles e inmuebles.",
  },
  {
    icon: TrendingUp,
    title: "Experiencia comprobada",
    text: "Dos décadas valorizando proyectos residenciales, comerciales, industriales y portuarios.",
  },
];

export function About() {
  return (
    <section id="nosotros" className="bg-white py-24">
      <div className="container-x">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow mb-4">
              <span className="h-px w-8 bg-gold-500" /> Nosotros
            </p>
            <h2 className="section-title">
              Especialistas en el rubro, con más de 20 años de experiencia
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-navy-700">
              <p>
                <strong className="text-navy-900">Ingetas Ltda</strong> es una
                empresa dedicada a la tasación de bienes muebles e inmuebles y a
                la revisión de avance de obras.
              </p>
              <p>
                Cumplimos con las necesidades y expectativas de nuestros
                clientes, promoviendo un compromiso hacia la calidad en todos los
                niveles de la organización, con énfasis en mejorar continuamente
                nuestros procesos. La Gerencia General mantiene un liderazgo
                coherente con la visión y las estrategias para el futuro de la
                organización, demostrando su compromiso con el Sistema de Gestión
                de la Calidad.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-navy-100 bg-navy-50/60 p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">
                Política de Calidad
              </p>
              <p className="mt-2 text-navy-700">
                Un compromiso transversal con la calidad, la mejora continua y la
                satisfacción de cada cliente.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-5 sm:grid-cols-2" gap={0.12}>
            {PILLARS.map((p) => (
              <Item key={p.title}>
                <SpotlightCard className="gradient-border group h-full rounded-2xl border border-navy-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-200 hover:shadow-xl hover:shadow-navy-900/5">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-400 group-hover:text-navy-950">
                    <p.icon size={22} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">
                    {p.text}
                  </p>
                </SpotlightCard>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

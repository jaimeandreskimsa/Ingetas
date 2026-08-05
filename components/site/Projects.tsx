import { MapPin, Building } from "lucide-react";
import { Reveal, Stagger, Item, Counter } from "./anim";

const PROJECTS = [
  '"Mall Plaza del Sol" en Quilpué',
  '"Condominio Gran Océano"',
  'Edificios "Costa de Montemar"',
  '"Condominio Olas de Marbella"',
  '"Mall Plaza Reñaca Shopping Center"',
  'Edificio "San Luis"',
  '"Condominio Cruz del Sur"',
  'Edificio "Travesía"',
  'Edificio "Liágora"',
];

export function Projects() {
  return (
    <section
      id="experiencia"
      className="relative overflow-hidden bg-navy-950 py-24"
    >
      <div className="absolute -left-40 top-20 h-96 w-96 animate-float-slow rounded-full bg-gold-400/10 blur-[120px]" />
      <div className="absolute -right-40 bottom-10 h-96 w-96 animate-float-slow2 rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="container-x relative">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <p className="eyebrow mb-4">
              <span className="h-px w-8 bg-gold-500" /> Experiencia
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Algunos proyectos y tasaciones realizadas
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              Desarrollo de más de{" "}
              <span className="font-bold text-gold-400">
                <Counter to={25000} prefix="+" /> tasaciones
              </span>{" "}
              en los últimos 20 años, incluyendo tasaciones, evaluaciones y
              avances de obras de importantes proyectos.
            </p>

            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold-400 text-navy-950">
                <MapPin size={22} />
              </span>
              <p className="text-white/80">
                <strong className="text-white">Puerto de Valparaíso:</strong>{" "}
                tasación de terrenos y construcciones en los sectores de Estación
                Puerto, Barón (ex terrenos de Segetrans) y Yolanda (terrenos
                Emporchi).
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-3 sm:grid-cols-2" gap={0.07}>
            {PROJECTS.map((p) => (
              <Item key={p}>
                <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:translate-x-1 hover:border-gold-400/40 hover:bg-white/[0.07]">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gold-400/15 text-gold-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-400 group-hover:text-navy-950">
                    <Building size={18} />
                  </span>
                  <span className="text-sm font-medium text-white/90">{p}</span>
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

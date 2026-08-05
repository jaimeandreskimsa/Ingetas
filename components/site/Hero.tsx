"use client";

import { ArrowRight, Phone, TrendingUp, ShieldCheck, Building2 } from "lucide-react";
import { motion, Counter } from "./anim";

const EASE = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const up = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const HEAD_1 = "Aplicamos ingeniería a".split(" ");
const HEAD_2 = "los procesos de tasación".split(" ");

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy-950"
    >
      {/* Fondos animados */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 90% 70% at 65% 35%, black 40%, transparent 100%)",
          }}
        />
        <div className="absolute -right-40 -top-40 h-[560px] w-[560px] animate-float-slow rounded-full bg-gold-400/20 blur-[130px]" />
        <div className="absolute -bottom-52 left-0 h-[460px] w-[460px] animate-float-slow2 rounded-full bg-navy-400/30 blur-[130px]" />
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] animate-aurora rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="container-x relative z-10 grid gap-12 pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
        {/* Columna texto */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={up} className="eyebrow mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gold-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
            </span>
            Tasaciones profesionales · Chile
          </motion.p>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            <span className="block">
              {HEAD_1.map((w, i) => (
                <motion.span key={i} variants={up} className="inline-block">
                  {w}&nbsp;
                </motion.span>
              ))}
            </span>
            <span className="block">
              {HEAD_2.map((w, i) => (
                <motion.span
                  key={i}
                  variants={up}
                  className={`inline-block ${
                    i >= 1 ? "text-gradient-gold" : "text-gold-400"
                  }`}
                >
                  {w}&nbsp;
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            variants={up}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70"
          >
            Especialistas en tasación de bienes muebles e inmuebles y revisión
            de avance de obras. Más de{" "}
            <strong className="text-white">25.000 tasaciones</strong> realizadas
            en 20 años de experiencia.
          </motion.p>

          <motion.div
            variants={up}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <motion.a
              href="#contacto"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold"
            >
              Solicitar tasación <ArrowRight size={18} />
            </motion.a>
            <motion.a
              href="tel:+56994376425"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-outline"
            >
              <Phone size={18} /> 9 9437 6425
            </motion.a>
          </motion.div>

          <motion.dl
            variants={up}
            className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8"
          >
            {[
              { to: 25000, prefix: "+", l: "Tasaciones" },
              { to: 20, prefix: "+", l: "Años de experiencia" },
              { to: 6, prefix: "", l: "Áreas de especialidad" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-3xl font-bold text-gold-400">
                  <Counter to={s.to} prefix={s.prefix} />
                </dt>
                <dd className="mt-1 text-sm text-white/60">{s.l}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Columna dashboard flotante */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
          className="relative hidden lg:block"
          style={{ perspective: 1000 }}
        >
          <DashboardMock />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

function DashboardMock() {
  const bars = [52, 68, 45, 82, 60, 92, 74];
  return (
    <div className="relative">
      {/* halo */}
      <div className="absolute -inset-6 rounded-[2rem] bg-gold-400/10 blur-2xl" />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl"
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5">
              <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-white">
              Panel de Tasaciones
            </span>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
            2026
          </span>
        </div>

        {/* mini chart */}
        <div className="mt-5 flex h-32 items-end gap-2.5 rounded-xl bg-navy-950/40 p-4">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.9, delay: 0.7 + i * 0.08, ease: EASE }}
              className="flex-1 rounded-t bg-gradient-to-t from-gold-500 to-gold-300"
            />
          ))}
        </div>

        {/* rows */}
        <div className="mt-4 space-y-2.5">
          {[
            { icon: Building2, t: "Inmobiliaria", v: "En proceso" },
            { icon: ShieldCheck, t: "Informe IFRS", v: "Aprobado" },
            { icon: TrendingUp, t: "Avance de obra", v: "84%" },
          ].map((r) => (
            <div
              key={r.t}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/15 text-gold-400">
                <r.icon size={16} />
              </span>
              <span className="flex-1 text-sm text-white/85">{r.t}</span>
              <span className="text-xs font-medium text-emerald-300">{r.v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* badge flotante */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-8 bottom-10 flex items-center gap-2 rounded-xl border border-white/10 bg-navy-900/80 px-4 py-3 shadow-xl backdrop-blur-xl"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">+25.000</p>
          <p className="text-[11px] text-white/60">tasaciones</p>
        </div>
      </motion.div>
    </div>
  );
}

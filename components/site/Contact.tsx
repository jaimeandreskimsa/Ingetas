"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Reveal } from "./anim";

const CONTACT = [
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
    label: "Nos encuentras en",
    lines: ["Calle Limache 3421, edificio Reitz II", "Oficina 705, Viña del Mar"],
  },
];

export function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contacto" className="bg-white py-24">
      <div className="container-x">
        <Reveal className="overflow-hidden rounded-3xl border border-navy-100 bg-navy-50/40 shadow-xl shadow-navy-900/5">
          <div className="grid lg:grid-cols-2">
            {/* Info */}
            <div className="relative bg-navy-950 p-10 lg:p-12">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-400/20 blur-3xl" />
              <div className="relative">
                <p className="eyebrow mb-4">
                  <span className="h-px w-8 bg-gold-500" /> Contacto
                </p>
                <h2 className="font-display text-3xl font-bold text-white">
                  Queremos escucharte
                </h2>
                <p className="mt-4 text-white/70">
                  Envía tus dudas y consultas. Nuestro equipo se encargará de
                  responderte lo más pronto posible.
                </p>

                <div className="mt-10 space-y-6">
                  {CONTACT.map((c) => (
                    <div key={c.label} className="flex items-start gap-4">
                      <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-400">
                        <c.icon size={20} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gold-400">
                          {c.label}
                        </p>
                        {c.lines.map((l) =>
                          c.href ? (
                            <a
                              key={l}
                              href={c.href}
                              className="block text-white/85 transition hover:text-white"
                            >
                              {l}
                            </a>
                          ) : (
                            <p key={l} className="text-white/85">
                              {l}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-10 lg:p-12">
              {status === "ok" ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <CheckCircle2 className="mb-4 text-gold-500" size={56} />
                  <h3 className="font-display text-2xl font-bold text-navy-900">
                    ¡Mensaje enviado!
                  </h3>
                  <p className="mt-2 text-navy-600">
                    Gracias por contactarnos. Te responderemos pronto.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm font-semibold text-gold-600 hover:text-gold-500"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <Field label="Nombre" name="nombre" type="text" required />
                  <Field label="Teléfono" name="telefono" type="tel" />
                  <Field label="Email" name="email" type="email" required />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-navy-800">
                      Mensaje
                    </label>
                    <textarea
                      name="mensaje"
                      rows={4}
                      required
                      className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                      placeholder="Cuéntanos qué necesitas tasar…"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-red-600">
                      No se pudo enviar. Inténtalo de nuevo o escríbenos a
                      ingetas@vtr.net.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-gold w-full disabled:opacity-70"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Enviando…
                      </>
                    ) : (
                      <>
                        Enviar mensaje <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type,
  required,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy-800">
        {label}
        {required && <span className="text-gold-500"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
      />
    </div>
  );
}

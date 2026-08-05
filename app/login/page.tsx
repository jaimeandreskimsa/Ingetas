"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  ArrowLeft,
  ShieldCheck,
  HardDrive,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";

function LoginInner() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/panel");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos.");
    } else {
      router.replace("/panel");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel visual */}
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 to-navy-950" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -right-24 top-1/3 h-96 w-96 animate-float-slow rounded-full bg-gold-400/20 blur-[120px]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight text-white">
              Área interna
              <br />
              <span className="text-gold-400">Ingetas Ltda</span>
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Gestor de documentos conectado a Google Drive: explora, sube,
              descarga y comparte los archivos de tasaciones del equipo.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: HardDrive, t: "Integración directa con Google Drive" },
                { icon: ShieldCheck, t: "Acceso con usuarios y contraseña" },
              ].map((f) => (
                <li key={f.t} className="flex items-center gap-3 text-white/80">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-gold-400">
                    <f.icon size={18} />
                  </span>
                  {f.t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Ingetas Ltda
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-navy-900"
          >
            <ArrowLeft size={16} /> Volver al sitio
          </Link>

          <div className="lg:hidden">
            <Logo />
          </div>

          <h2 className="mt-6 font-display text-2xl font-bold text-navy-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-navy-600">
            Ingresa con tu usuario y contraseña.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy-800">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ingetas.cl"
                  className="w-full rounded-xl border border-navy-200 bg-white py-3 pl-11 pr-4 text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy-800">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-navy-200 bg-white py-3 pl-11 pr-11 text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-navy-400 transition hover:text-navy-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Ingresando…
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

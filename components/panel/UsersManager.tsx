"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  UserPlus,
  Users,
  Shield,
  Trash2,
  Pencil,
  ArrowLeft,
  Loader2,
  X,
  Check,
  Ban,
  LogOut,
  HardDrive,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";

type Row = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
  createdAt?: string;
};

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<null | Row>(null); // null=cerrado; sin id=nuevo
  const [creating, setCreating] = useState(false);

  const notify = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(u: Row) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) {
      setUsers((list) =>
        list.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x))
      );
      notify(u.active ? "Usuario desactivado" : "Usuario activado");
    }
  }

  async function remove(u: Row) {
    if (!confirm(`¿Eliminar a ${u.name} (${u.email})?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((list) => list.filter((x) => x.id !== u.id));
      notify("Usuario eliminado");
    } else {
      const d = await res.json();
      notify(d.error || "No se pudo eliminar");
    }
  }

  return (
    <div className="min-h-screen bg-navy-50/40">
      {/* Top bar */}
      <header className="flex h-16 items-center justify-between border-b border-navy-100 bg-white px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <Logo height={34} />
          <span className="hidden text-navy-300 sm:inline">/</span>
          <span className="hidden font-semibold text-navy-800 sm:inline">
            Gestión de usuarios
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/panel"
            className="inline-flex items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
          >
            <HardDrive size={16} /> Ir al Drive
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-600">
              <Users size={16} /> Usuarios del sistema
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-navy-900">
              {users.length} usuario{users.length === 1 ? "" : "s"}
            </h1>
          </div>
          <button
            onClick={() =>
              setForm({
                id: "",
                name: "",
                email: "",
                role: "USER",
                active: true,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 font-semibold text-navy-950 transition hover:bg-gold-300"
          >
            <UserPlus size={18} /> Nuevo usuario
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-navy-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60 text-left text-xs uppercase tracking-wider text-navy-400">
                  <th className="px-5 py-3 font-semibold">Usuario</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">
                    Rol
                  </th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-navy-50 last:border-0 hover:bg-navy-50/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-navy-900">
                            {u.name}
                            {u.id === currentUserId && (
                              <span className="ml-2 text-xs text-navy-400">
                                (tú)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-navy-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 sm:table-cell">
                      {u.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-700">
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-navy-600">
                          Usuario
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.active ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {u.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setForm(u)}
                          className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100"
                          title={u.active ? "Desactivar" : "Activar"}
                        >
                          {u.active ? <Ban size={16} /> : <Check size={16} />}
                        </button>
                        {u.id !== currentUserId && (
                          <button
                            onClick={() => remove(u)}
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Link
          href="/panel"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-navy-900"
        >
          <ArrowLeft size={16} /> Volver al Drive
        </Link>
      </main>

      {form && (
        <UserForm
          initial={form}
          busy={creating}
          onClose={() => setForm(null)}
          onSaved={(msg) => {
            setForm(null);
            load();
            notify(msg);
          }}
          setBusy={setCreating}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function UserForm({
  initial,
  onClose,
  onSaved,
  busy,
  setBusy,
}: {
  initial: Row;
  onClose: () => void;
  onSaved: (msg: string) => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const editing = Boolean(initial.id);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">(initial.role);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!name.trim() || (!editing && (!email.trim() || !password))) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setBusy(true);
    try {
      const res = editing
        ? await fetch(`/api/users/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              role,
              ...(password ? { password } : {}),
            }),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onSaved(editing ? "Usuario actualizado" : "Usuario creado");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">
            {editing ? "Editar usuario" : "Nuevo usuario"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Nombre" value={name} onChange={setName} />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            disabled={editing}
          />
          <Field
            label={editing ? "Nueva contraseña (opcional)" : "Contraseña"}
            value={password}
            onChange={setPassword}
            type="password"
            placeholder={editing ? "Dejar en blanco para no cambiar" : ""}
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy-800">
              Rol
            </label>
            <div className="flex gap-2">
              {(["USER", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    role === r
                      ? "border-gold-400 bg-gold-50 text-gold-700"
                      : "border-navy-200 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  {r === "ADMIN" ? "Administrador" : "Usuario"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={16} />}
            {editing ? "Guardar" : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy-800">
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 disabled:bg-navy-50 disabled:text-navy-400"
      />
    </div>
  );
}

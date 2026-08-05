"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Upload,
  FolderPlus,
  RefreshCw,
  ChevronRight,
  HardDrive,
  Home,
  LogOut,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
  X,
  Check,
  Copy,
  ArrowLeft,
  Users,
  Cloud,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { FileIcon } from "./FileIcon";
import { PreviewModal } from "./PreviewModal";
import { formatBytes, formatDate, fileKind, canPreview } from "@/lib/format";
import type { DriveFile } from "@/lib/drive";

type View = "grid" | "list";
type Sort = "folder" | "name_desc" | "modified";

export function DriveBrowser({
  user,
}: {
  user: { name: string; email: string; role: "ADMIN" | "USER" };
}) {
  const isAdmin = user.role === "ADMIN";
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>(
    []
  );
  const [folderId, setFolderId] = useState("root");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notConnected, setNotConnected] = useState(false);
  const [view, setView] = useState<View>("grid");
  const [sort, setSort] = useState<Sort>("folder");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [preview, setPreview] = useState<DriveFile | null>(null);
  const [shareState, setShareState] = useState<{
    file: DriveFile;
    link?: string;
    loading: boolean;
  } | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploads, setUploads] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Debounce de la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams({ sort });
      if (debounced) p.set("q", debounced);
      else p.set("folderId", folderId);
      const res = await fetch(`/api/drive/list?${p.toString()}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (res.status === 409 && data.notConnected) {
        setNotConnected(true);
        setFiles([]);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setNotConnected(false);
      setFiles(data.files || []);
      setBreadcrumb(debounced ? [] : data.breadcrumb || []);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los archivos");
    } finally {
      setLoading(false);
    }
  }, [folderId, debounced, sort]);

  useEffect(() => {
    load();
  }, [load]);

  function openFolder(id: string) {
    setSearch("");
    setDebounced("");
    setFolderId(id);
  }

  function onItemClick(file: DriveFile) {
    if (fileKind(file.mimeType) === "folder") openFolder(file.id!);
    else if (canPreview(file.mimeType)) setPreview(file);
    else if (file.webViewLink) window.open(file.webViewLink, "_blank");
  }

  // ---- Subida de archivos ----
  function triggerUpload() {
    fileInput.current?.click();
  }

  const uploadFiles = useCallback(
    (list: FileList | File[]) => {
      Array.from(list).forEach((file) => {
        const uid = `${file.name}-${file.size}-${Math.round(
          performance.now()
        )}`;
        setUploads((u) => [...u, { id: uid, name: file.name, progress: 0 }]);

        const form = new FormData();
        form.append("file", file);
        form.append("folderId", folderId);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/drive/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploads((u) =>
              u.map((x) => (x.id === uid ? { ...x, progress: pct } : x))
            );
          }
        };
        xhr.onload = () => {
          setUploads((u) => u.filter((x) => x.id !== uid));
          if (xhr.status >= 200 && xhr.status < 300) {
            notify(`"${file.name}" subido correctamente`);
            load();
          } else {
            notify(`Error al subir "${file.name}"`);
          }
        };
        xhr.onerror = () => {
          setUploads((u) => u.filter((x) => x.id !== uid));
          notify(`Error al subir "${file.name}"`);
        };
        xhr.send(form);
      });
    },
    [folderId, load, notify]
  );

  // ---- Compartir ----
  async function doShare(file: DriveFile) {
    setShareState({ file, loading: true });
    try {
      const res = await fetch("/api/drive/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShareState({ file, link: data.link, loading: false });
    } catch (e: any) {
      setShareState(null);
      notify("No se pudo generar el enlace");
    }
  }

  // ---- Eliminar ----
  async function doDelete(file: DriveFile) {
    if (!confirm(`¿Enviar "${file.name}" a la papelera de Google Drive?`))
      return;
    try {
      const res = await fetch("/api/drive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      if (!res.ok) throw new Error();
      notify(`"${file.name}" enviado a la papelera`);
      setFiles((f) => f.filter((x) => x.id !== file.id));
    } catch {
      notify("No se pudo eliminar");
    }
  }

  const folders = files.filter((f) => fileKind(f.mimeType) === "folder");
  const docs = files.filter((f) => fileKind(f.mimeType) !== "folder");

  return (
    <div
      className="flex h-screen bg-navy-50/40"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
      }}
    >
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-navy-100 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-navy-100 px-5">
          <Logo height={34} />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <SideItem
            active={folderId === "root" && !debounced}
            icon={HardDrive}
            label="Mi unidad"
            onClick={() => openFolder("root")}
          />
          {isAdmin && (
            <Link
              href="/panel/usuarios"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 transition hover:bg-navy-50"
            >
              <Users size={18} /> Usuarios
            </Link>
          )}
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 transition hover:bg-navy-50"
          >
            <ExternalLink size={18} /> Abrir Google Drive
          </a>
        </nav>
        <div className="border-t border-navy-100 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 transition hover:bg-navy-50"
          >
            <Home size={18} /> Ir al sitio
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-navy-100 bg-white px-4 sm:px-6">
          <div className="relative flex-1 max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en Google Drive…"
              className="w-full rounded-full border border-navy-200 bg-navy-50/50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-400/20"
            />
          </div>

          <AccountMenu user={user} />
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 bg-white px-4 py-3 sm:px-6">
          {/* Breadcrumb */}
          <div className="flex min-w-0 items-center gap-1 text-sm">
            {debounced ? (
              <span className="font-medium text-navy-900">
                Resultados para “{debounced}”
              </span>
            ) : (
              <>
                <button
                  onClick={() => openFolder("root")}
                  className="flex items-center gap-1.5 font-medium text-navy-700 hover:text-gold-600"
                >
                  <HardDrive size={16} /> Mi unidad
                </button>
                {breadcrumb.map((b) => (
                  <span key={b.id} className="flex items-center gap-1 truncate">
                    <ChevronRight size={15} className="text-navy-300" />
                    <button
                      onClick={() => openFolder(b.id)}
                      className="truncate font-medium text-navy-700 hover:text-gold-600"
                    >
                      {b.name}
                    </button>
                  </span>
                ))}
              </>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 outline-none focus:border-gold-400"
            >
              <option value="folder">Nombre (A-Z)</option>
              <option value="name_desc">Nombre (Z-A)</option>
              <option value="modified">Más recientes</option>
            </select>

            <div className="flex rounded-lg border border-navy-200 p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`rounded-md p-1.5 ${
                  view === "grid"
                    ? "bg-navy-900 text-white"
                    : "text-navy-500 hover:bg-navy-50"
                }`}
                aria-label="Vista de cuadrícula"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 ${
                  view === "list"
                    ? "bg-navy-900 text-white"
                    : "text-navy-500 hover:bg-navy-50"
                }`}
                aria-label="Vista de lista"
              >
                <ListIcon size={18} />
              </button>
            </div>

            <button
              onClick={load}
              className="rounded-lg border border-navy-200 p-2 text-navy-500 transition hover:bg-navy-50"
              aria-label="Actualizar"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={() => setNewFolderOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 sm:inline-flex"
            >
              <FolderPlus size={18} /> Carpeta
            </button>

            <button
              onClick={triggerUpload}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300"
            >
              <Upload size={18} /> Subir
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Contenido */}
        <main className="relative flex-1 overflow-auto p-4 sm:p-6">
          {dragOver && (
            <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50/80">
              <p className="font-semibold text-gold-700">
                Suelta los archivos para subirlos
              </p>
            </div>
          )}

          {!debounced && folderId !== "root" && (
            <button
              onClick={() =>
                openFolder(
                  breadcrumb.length > 1
                    ? breadcrumb[breadcrumb.length - 2].id
                    : "root"
                )
              }
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
            >
              <ArrowLeft size={16} /> Carpeta anterior
            </button>
          )}

          {notConnected ? (
            <NotConnected isAdmin={isAdmin} />
          ) : loading ? (
            <div className="flex h-64 items-center justify-center text-navy-400">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : error ? (
            <div className="mx-auto mt-10 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              <p className="font-semibold">No se pudieron cargar los archivos</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={load}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                Reintentar
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-navy-400">
              <FolderPlus size={48} className="mb-3 opacity-40" />
              <p className="font-medium text-navy-600">
                {debounced ? "Sin resultados" : "Esta carpeta está vacía"}
              </p>
              {!debounced && (
                <button
                  onClick={triggerUpload}
                  className="mt-3 text-sm font-semibold text-gold-600 hover:text-gold-500"
                >
                  Sube tu primer archivo
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <GridView
              folders={folders}
              docs={docs}
              menuFor={menuFor}
              setMenuFor={setMenuFor}
              onItemClick={onItemClick}
              onPreview={setPreview}
              onShare={doShare}
              onDelete={doDelete}
            />
          ) : (
            <TableView
              files={files}
              menuFor={menuFor}
              setMenuFor={setMenuFor}
              onItemClick={onItemClick}
              onPreview={setPreview}
              onShare={doShare}
              onDelete={doDelete}
            />
          )}
        </main>
      </div>

      {/* Progreso de subida */}
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 w-80 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-2xl">
          <div className="border-b border-navy-100 bg-navy-50 px-4 py-2.5 text-sm font-semibold text-navy-800">
            Subiendo {uploads.length} archivo(s)…
          </div>
          <div className="max-h-60 space-y-3 overflow-auto p-4">
            {uploads.map((u) => (
              <div key={u.id}>
                <div className="mb-1 flex justify-between text-xs text-navy-600">
                  <span className="truncate pr-2">{u.name}</span>
                  <span>{u.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-navy-100">
                  <div
                    className="h-full rounded-full bg-gold-400 transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Modales */}
      {preview && (
        <PreviewModal file={preview} onClose={() => setPreview(null)} />
      )}
      {shareState && (
        <ShareDialog state={shareState} onClose={() => setShareState(null)} />
      )}
      {newFolderOpen && (
        <NewFolderDialog
          parentId={folderId}
          onClose={() => setNewFolderOpen(false)}
          onCreated={() => {
            setNewFolderOpen(false);
            load();
            notify("Carpeta creada");
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */

function SideItem({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-navy-900 text-white"
          : "text-navy-600 hover:bg-navy-50"
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

function AccountMenu({
  user,
}: {
  user: { name: string; email: string; role: "ADMIN" | "USER" };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-navy-200 py-1 pl-1 pr-3 transition hover:bg-navy-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium text-navy-800 sm:inline">
          {user.name.split(" ")[0]}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-xl">
            <div className="border-b border-navy-100 p-4">
              <p className="font-semibold text-navy-900">{user.name}</p>
              <p className="truncate text-sm text-navy-500">{user.email}</p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.role === "ADMIN"
                    ? "bg-gold-100 text-gold-700"
                    : "bg-navy-100 text-navy-600"
                }`}
              >
                {user.role === "ADMIN" ? "Administrador" : "Usuario"}
              </span>
            </div>
            {user.role === "ADMIN" && (
              <Link
                href="/panel/usuarios"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
              >
                <Users size={16} /> Gestionar usuarios
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NotConnected({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
        <Cloud size={30} />
      </div>
      <h2 className="font-display text-xl font-bold text-navy-900">
        Google Drive no está conectado
      </h2>
      <p className="mx-auto mt-2 max-w-md text-navy-600">
        {isAdmin
          ? "Conecta la cuenta principal de Google Drive una sola vez. A partir de ahí, todos los usuarios verán y gestionarán los archivos."
          : "Un administrador debe conectar la cuenta de Google Drive antes de poder ver los archivos."}
      </p>
      {isAdmin && (
        <a
          href="/api/drive/oauth/start"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 font-semibold text-navy-950 transition hover:bg-gold-300"
        >
          <Cloud size={18} /> Conectar Google Drive
        </a>
      )}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-navy-400">
        <ShieldAlert size={13} /> Requiere configurar las credenciales de Google
        (ver README).
      </p>
    </div>
  );
}

function RowMenu({
  file,
  open,
  setOpen,
  onPreview,
  onShare,
  onDelete,
}: {
  file: DriveFile;
  open: boolean;
  setOpen: (v: string | null) => void;
  onPreview: (f: DriveFile) => void;
  onShare: (f: DriveFile) => void;
  onDelete: (f: DriveFile) => void;
}) {
  const isFolder = fileKind(file.mimeType) === "folder";
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(open ? null : file.id!);
        }}
        className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
        aria-label="Opciones"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(null)} />
          <div
            className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-navy-100 bg-white py-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!isFolder && canPreview(file.mimeType) && (
              <MenuBtn
                icon={Eye}
                label="Previsualizar"
                onClick={() => {
                  setOpen(null);
                  onPreview(file);
                }}
              />
            )}
            {!isFolder && (
              <a
                href={`/api/drive/download?fileId=${file.id}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 transition hover:bg-navy-50"
                onClick={() => setOpen(null)}
              >
                <Download size={16} /> Descargar
              </a>
            )}
            <MenuBtn
              icon={Share2}
              label="Compartir"
              onClick={() => {
                setOpen(null);
                onShare(file);
              }}
            />
            {file.webViewLink && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 transition hover:bg-navy-50"
                onClick={() => setOpen(null)}
              >
                <ExternalLink size={16} /> Abrir en Drive
              </a>
            )}
            <div className="my-1 h-px bg-navy-100" />
            <MenuBtn
              icon={Trash2}
              label="Eliminar"
              danger
              onClick={() => {
                setOpen(null);
                onDelete(file);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-navy-700 hover:bg-navy-50"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function GridView({
  folders,
  docs,
  menuFor,
  setMenuFor,
  onItemClick,
  onPreview,
  onShare,
  onDelete,
}: any) {
  return (
    <div className="space-y-8">
      {folders.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Carpetas
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {folders.map((f: DriveFile) => (
              <button
                key={f.id}
                onClick={() => onItemClick(f)}
                className="group flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3.5 text-left transition hover:border-gold-300 hover:shadow-md"
              >
                <FileIcon mimeType={f.mimeType} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-800">
                  {f.name}
                </span>
                <span onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    file={f}
                    open={menuFor === f.id}
                    setOpen={setMenuFor}
                    onPreview={onPreview}
                    onShare={onShare}
                    onDelete={onDelete}
                  />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {docs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Archivos
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {docs.map((f: DriveFile) => {
              const isImage = fileKind(f.mimeType) === "image";
              return (
                <div
                  key={f.id}
                  onClick={() => onItemClick(f)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-navy-100 bg-white transition hover:border-gold-300 hover:shadow-md"
                >
                  <div className="relative flex h-32 items-center justify-center overflow-hidden bg-navy-50">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://drive.google.com/thumbnail?id=${f.id}&sz=w400`}
                        alt={f.name || ""}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FileIcon mimeType={f.mimeType} size={34} />
                    )}
                    <span
                      className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowMenu
                        file={f}
                        open={menuFor === f.id}
                        setOpen={setMenuFor}
                        onPreview={onPreview}
                        onShare={onShare}
                        onDelete={onDelete}
                      />
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-navy-800">
                      {f.name}
                    </p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {formatBytes(f.size)} · {formatDate(f.modifiedTime)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function TableView({
  files,
  menuFor,
  setMenuFor,
  onItemClick,
  onPreview,
  onShare,
  onDelete,
}: any) {
  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-100 bg-navy-50/60 text-left text-xs uppercase tracking-wider text-navy-400">
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">
              Tamaño
            </th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              Modificado
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {files.map((f: DriveFile) => (
            <tr
              key={f.id}
              onClick={() => onItemClick(f)}
              className="cursor-pointer border-b border-navy-50 transition last:border-0 hover:bg-navy-50/50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon mimeType={f.mimeType} size={18} />
                  <span className="truncate font-medium text-navy-800">
                    {f.name}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-navy-500 sm:table-cell">
                {fileKind(f.mimeType) === "folder"
                  ? "—"
                  : formatBytes(f.size)}
              </td>
              <td className="hidden px-4 py-3 text-navy-500 md:table-cell">
                {formatDate(f.modifiedTime)}
              </td>
              <td className="px-4 py-3 text-right">
                <span onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    file={f}
                    open={menuFor === f.id}
                    setOpen={setMenuFor}
                    onPreview={onPreview}
                    onShare={onShare}
                    onDelete={onDelete}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShareDialog({
  state,
  onClose,
}: {
  state: { file: DriveFile; link?: string; loading: boolean };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal onClose={onClose} title="Compartir archivo">
      <p className="text-sm text-navy-600">
        <strong className="text-navy-900">{state.file.name}</strong>
      </p>
      {state.loading ? (
        <div className="flex items-center gap-2 py-6 text-navy-500">
          <Loader2 className="animate-spin" size={20} /> Generando enlace…
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-navy-600">
            Cualquier persona con este enlace podrá ver el archivo:
          </p>
          <div className="mt-2 flex gap-2">
            <input
              readOnly
              value={state.link || ""}
              className="w-full rounded-lg border border-navy-200 bg-navy-50 px-3 py-2 text-sm text-navy-700 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(state.link || "");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function NewFolderDialog({
  parentId,
  onClose,
  onCreated,
}: {
  parentId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/drive/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId }),
      });
      if (!res.ok) throw new Error();
      onCreated();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Nueva carpeta">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
        placeholder="Nombre de la carpeta"
        className="w-full rounded-lg border border-navy-200 px-3 py-2.5 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
      />
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
        >
          Cancelar
        </button>
        <button
          onClick={create}
          disabled={loading || !name.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300 disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin" size={16} />} Crear
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
  FolderUp,
  FolderDown,
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
  Pencil,
  FolderInput,
  CopyPlus,
  Info,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { FileIcon } from "./FileIcon";
import { PreviewModal } from "./PreviewModal";
import {
  Modal,
  RenameDialog,
  MoveDialog,
  DetailsModal,
} from "./DriveDialogs";
import {
  formatBytes,
  formatDate,
  fileKind,
  canPreview,
  effectiveId,
  effectiveMime,
} from "@/lib/format";
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
  const [renameFile, setRenameFile] = useState<DriveFile | null>(null);
  const [moveItems, setMoveItems] = useState<DriveFile[] | null>(null);
  const [detailsFile, setDetailsFile] = useState<DriveFile | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [trashMode, setTrashMode] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [storage, setStorage] = useState<{
    usage: number;
    limit: number | null;
  } | null>(null);
  const [uploads, setUploads] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
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
    setSelected(new Set());
    try {
      const p = new URLSearchParams({ sort });
      if (trashMode) p.set("trashed", "1");
      else if (debounced) p.set("q", debounced);
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
      setNextToken(data.nextPageToken || null);
      setBreadcrumb(debounced || trashMode ? [] : data.breadcrumb || []);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los archivos");
    } finally {
      setLoading(false);
    }
  }, [folderId, debounced, sort, trashMode]);

  useEffect(() => {
    load();
  }, [load]);

  // Uso de almacenamiento de la cuenta (sidebar)
  useEffect(() => {
    fetch("/api/drive/storage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.quota?.usage) {
          setStorage({
            usage: parseInt(d.quota.usage, 10),
            limit: d.quota.limit ? parseInt(d.quota.limit, 10) : null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const p = new URLSearchParams({ sort, pageToken: nextToken });
      if (trashMode) p.set("trashed", "1");
      else if (debounced) p.set("q", debounced);
      else p.set("folderId", folderId);
      const res = await fetch(`/api/drive/list?${p.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles((f) => [...f, ...(data.files || [])]);
      setNextToken(data.nextPageToken || null);
    } catch {
      notify("No se pudieron cargar más archivos");
    } finally {
      setLoadingMore(false);
    }
  }, [nextToken, loadingMore, sort, trashMode, debounced, folderId, notify]);

  function openFolder(id: string) {
    setSearch("");
    setDebounced("");
    setTrashMode(false);
    setFolderId(id);
  }

  function openTrash() {
    setSearch("");
    setDebounced("");
    setTrashMode(true);
  }

  function onItemClick(file: DriveFile) {
    const isFolder = fileKind(effectiveMime(file)) === "folder";
    if (trashMode) {
      // En la papelera no se navega dentro de carpetas
      if (!isFolder) setPreview(file);
      return;
    }
    // Los accesos directos a carpetas abren la carpeta de destino
    if (isFolder) openFolder(effectiveId(file));
    // Todo lo demás abre el visor (si no hay vista previa, ofrece descargar);
    // nunca se redirige a drive.google.com (pide sesión de Google).
    else setPreview(file);
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  // ---- Subida de archivos ----
  function triggerUpload() {
    fileInput.current?.click();
  }
  function triggerFolderUpload() {
    folderInput.current?.click();
  }

  /** Sube un archivo a la carpeta indicada, con barra de progreso. */
  const uploadOne = useCallback(
    (file: File, targetFolderId: string, displayName?: string) => {
      const name = displayName || file.name;
      const uid = `${name}-${file.size}-${Math.round(performance.now())}`;
      setUploads((u) => [...u, { id: uid, name, progress: 0 }]);

      const form = new FormData();
      form.append("file", file);
      form.append("folderId", targetFolderId);

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
          notify(`"${name}" subido correctamente`);
          load();
        } else {
          notify(`Error al subir "${name}"`);
        }
      };
      xhr.onerror = () => {
        setUploads((u) => u.filter((x) => x.id !== uid));
        notify(`Error al subir "${name}"`);
      };
      xhr.send(form);
    },
    [load, notify]
  );

  const uploadFiles = useCallback(
    (list: FileList | File[]) => {
      Array.from(list).forEach((file) => uploadOne(file, folderId));
    },
    [folderId, uploadOne]
  );

  /**
   * Sube una carpeta completa: crea (o reutiliza) la estructura de subcarpetas
   * en Drive y luego sube cada archivo en su carpeta correspondiente.
   */
  const uploadFolderEntries = useCallback(
    async (entries: { file: File; relPath: string }[]) => {
      if (!entries.length) return;
      const cache = new Map<string, string>(); // ruta relativa -> folderId

      const ensurePath = async (parts: string[]): Promise<string> => {
        let parent = folderId;
        let key = "";
        for (const part of parts) {
          key = key ? `${key}/${part}` : part;
          const hit = cache.get(key);
          if (hit) {
            parent = hit;
            continue;
          }
          const res = await fetch("/api/drive/create-folder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: part, parentId: parent, getOrCreate: true }),
          });
          const data = await res.json();
          if (!res.ok || !data.file?.id) {
            throw new Error(data.error || `No se pudo crear "${part}"`);
          }
          cache.set(key, data.file.id);
          parent = data.file.id;
        }
        return parent;
      };

      try {
        notify("Creando estructura de carpetas…");
        for (const e of entries) {
          const dirs = e.relPath.split("/").slice(0, -1);
          if (dirs.length) await ensurePath(dirs);
        }
      } catch (e: any) {
        notify(e.message || "No se pudo crear la estructura de carpetas");
        return;
      }
      load();

      entries.forEach((e) => {
        const parts = e.relPath.split("/");
        const dir = parts.slice(0, -1).join("/");
        const target = dir ? cache.get(dir) || folderId : folderId;
        uploadOne(e.file, target, e.relPath);
      });
    },
    [folderId, load, notify, uploadOne]
  );

  /** Recorre recursivamente una entrada arrastrada (archivo o carpeta). */
  async function traverseEntry(
    entry: any,
    path: string,
    out: { file: File; relPath: string }[]
  ) {
    if (entry.isFile) {
      const file: File = await new Promise((res, rej) => entry.file(res, rej));
      out.push({ file, relPath: path ? `${path}/${file.name}` : file.name });
    } else if (entry.isDirectory) {
      const dirPath = path ? `${path}/${entry.name}` : entry.name;
      const reader = entry.createReader();
      let batch: any[];
      do {
        batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        for (const child of batch) await traverseEntry(child, dirPath, out);
      } while (batch.length);
    }
  }

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

  // ---- Eliminar / restaurar / copiar ----
  async function deleteOne(fileId: string, permanent: boolean) {
    const res = await fetch("/api/drive/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, permanent }),
    });
    if (!res.ok) throw new Error();
  }

  async function doDelete(file: DriveFile) {
    const msg = trashMode
      ? `¿Eliminar "${file.name}" DEFINITIVAMENTE? Esta acción no se puede deshacer.`
      : `¿Enviar "${file.name}" a la papelera? Podrás restaurarlo desde la Papelera.`;
    if (!confirm(msg)) return;
    try {
      await deleteOne(file.id!, trashMode);
      notify(
        trashMode
          ? `"${file.name}" eliminado definitivamente`
          : `"${file.name}" enviado a la papelera`
      );
      setFiles((f) => f.filter((x) => x.id !== file.id));
    } catch {
      notify("No se pudo eliminar");
    }
  }

  async function doRestore(file: DriveFile) {
    try {
      const res = await fetch("/api/drive/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      if (!res.ok) throw new Error();
      notify(`"${file.name}" restaurado`);
      setFiles((f) => f.filter((x) => x.id !== file.id));
    } catch {
      notify("No se pudo restaurar");
    }
  }

  async function doCopy(file: DriveFile) {
    notify(`Creando copia de "${file.name}"…`);
    try {
      const res = await fetch("/api/drive/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      if (!res.ok) throw new Error();
      notify("Copia creada");
      load();
    } catch {
      notify("No se pudo copiar");
    }
  }

  async function emptyTrash() {
    if (
      !confirm(
        "¿Vaciar la papelera? TODOS los elementos se eliminarán definitivamente. Esta acción no se puede deshacer."
      )
    )
      return;
    try {
      const res = await fetch("/api/drive/empty-trash", { method: "POST" });
      if (!res.ok) throw new Error();
      notify("Papelera vaciada");
      load();
    } catch {
      notify("No se pudo vaciar la papelera");
    }
  }

  // ---- Acciones en lote sobre la selección ----
  const selectedFiles = files.filter((f) => selected.has(f.id!));

  function bulkDownload() {
    const ids = Array.from(selected).join(",");
    window.location.href = `/api/drive/download-zip?ids=${ids}`;
  }

  async function bulkDelete() {
    const n = selected.size;
    const msg = trashMode
      ? `¿Eliminar ${n} elemento(s) DEFINITIVAMENTE? No se puede deshacer.`
      : `¿Enviar ${n} elemento(s) a la papelera?`;
    if (!confirm(msg)) return;
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => deleteOne(id, trashMode))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    notify(
      failed
        ? `${n - failed} eliminados, ${failed} con error`
        : trashMode
        ? `${n} elemento(s) eliminados definitivamente`
        : `${n} elemento(s) enviados a la papelera`
    );
    load();
  }

  async function bulkRestore() {
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch("/api/drive/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: id }),
        }).then((r) => {
          if (!r.ok) throw new Error();
        })
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    notify(failed ? `Restaurados con ${failed} error(es)` : "Elementos restaurados");
    load();
  }

  const folders = files.filter((f) => fileKind(effectiveMime(f)) === "folder");
  const docs = files.filter((f) => fileKind(effectiveMime(f)) !== "folder");

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
        // webkitGetAsEntry debe llamarse de forma síncrona durante el evento
        const entries = Array.from(e.dataTransfer.items || [])
          .map((i) => (i as any).webkitGetAsEntry?.())
          .filter(Boolean);
        if (entries.length) {
          (async () => {
            const out: { file: File; relPath: string }[] = [];
            for (const en of entries) await traverseEntry(en, "", out);
            uploadFolderEntries(out);
          })();
        } else if (e.dataTransfer.files.length) {
          uploadFiles(e.dataTransfer.files);
        }
      }}
    >
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-navy-100 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-navy-100 px-5">
          <Logo height={34} />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <SideItem
            active={!trashMode && folderId === "root" && !debounced}
            icon={HardDrive}
            label="Mi unidad"
            onClick={() => openFolder("root")}
          />
          <SideItem
            active={trashMode}
            icon={Trash2}
            label="Papelera"
            onClick={openTrash}
          />
          {isAdmin && (
            <Link
              href="/panel/usuarios"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 transition hover:bg-navy-50"
            >
              <Users size={18} /> Usuarios
            </Link>
          )}
        </nav>
        <div className="border-t border-navy-100 p-4">
          {storage && (
            <div className="mb-3 rounded-lg bg-navy-50/60 p-3">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-navy-600">
                <Cloud size={14} className="text-navy-400" /> Almacenamiento
              </div>
              {storage.limit ? (
                <>
                  <div className="h-1.5 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className={`h-full rounded-full ${
                        storage.usage / storage.limit > 0.9
                          ? "bg-red-500"
                          : "bg-gold-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (storage.usage / storage.limit) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-navy-500">
                    {formatBytes(storage.usage)} de {formatBytes(storage.limit)}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-navy-500">
                  {formatBytes(storage.usage)} usados
                </p>
              )}
            </div>
          )}
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
            {trashMode ? (
              <span className="flex items-center gap-1.5 font-medium text-navy-900">
                <Trash2 size={16} /> Papelera
              </span>
            ) : debounced ? (
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

            {trashMode ? (
              isAdmin && (
                <button
                  onClick={emptyTrash}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} /> Vaciar papelera
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => setNewFolderOpen(true)}
                  className="hidden items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 sm:inline-flex"
                >
                  <FolderPlus size={18} /> Carpeta
                </button>

                <button
                  onClick={triggerFolderUpload}
                  className="hidden items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 sm:inline-flex"
                  title="Sube una carpeta con sus subcarpetas. Para subir varias carpetas a la vez, arrástralas juntas a esta ventana."
                >
                  <FolderUp size={18} /> Subir carpeta
                </button>

                <button
                  onClick={triggerUpload}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300"
                >
                  <Upload size={18} /> Subir
                </button>
              </>
            )}
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
            <input
              ref={folderInput}
              type="file"
              hidden
              // @ts-expect-error: atributo no estándar soportado por los navegadores
              webkitdirectory=""
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) {
                  uploadFolderEntries(
                    files.map((f) => ({
                      file: f,
                      relPath: (f as any).webkitRelativePath || f.name,
                    }))
                  );
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Contenido */}
        <main className="relative flex-1 overflow-auto p-4 sm:p-6">
          {dragOver && (
            <div className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50/80 text-center">
              <p className="font-semibold text-gold-700">
                Suelta archivos o carpetas para subirlos
              </p>
              <p className="mt-1 text-sm text-gold-700/80">
                Puedes soltar varias carpetas a la vez: se suben con sus subcarpetas
              </p>
            </div>
          )}

          {!debounced && !trashMode && folderId !== "root" && (
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
              {trashMode ? (
                <Trash2 size={48} className="mb-3 opacity-40" />
              ) : (
                <FolderPlus size={48} className="mb-3 opacity-40" />
              )}
              <p className="font-medium text-navy-600">
                {trashMode
                  ? "La papelera está vacía"
                  : debounced
                  ? "Sin resultados"
                  : "Esta carpeta está vacía"}
              </p>
              {!debounced && !trashMode && (
                <button
                  onClick={triggerUpload}
                  className="mt-3 text-sm font-semibold text-gold-600 hover:text-gold-500"
                >
                  Sube tu primer archivo
                </button>
              )}
            </div>
          ) : (
            <>
              {view === "grid" ? (
                <GridView
                  folders={folders}
                  docs={docs}
                  menuFor={menuFor}
                  setMenuFor={setMenuFor}
                  onItemClick={onItemClick}
                  onPreview={setPreview}
                  onShare={doShare}
                  onDelete={doDelete}
                  trashMode={trashMode}
                  onRename={setRenameFile}
                  onMove={(f: DriveFile) => setMoveItems([f])}
                  onCopy={doCopy}
                  onDetails={setDetailsFile}
                  onRestore={doRestore}
                  selected={selected}
                  toggleSelect={toggleSelect}
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
                  trashMode={trashMode}
                  onRename={setRenameFile}
                  onMove={(f: DriveFile) => setMoveItems([f])}
                  onCopy={doCopy}
                  onDetails={setDetailsFile}
                  onRestore={doRestore}
                  selected={selected}
                  toggleSelect={toggleSelect}
                />
              )}
              {nextToken && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    Cargar más archivos
                  </button>
                </div>
              )}
            </>
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

      {/* Barra de selección múltiple */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-navy-100 bg-white px-2 py-1.5 shadow-2xl">
          <span className="px-3 text-sm font-semibold text-navy-800">
            {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
          </span>
          {!trashMode && (
            <>
              <button
                onClick={bulkDownload}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
              >
                <FolderDown size={16} /> ZIP
              </button>
              <button
                onClick={() => setMoveItems(selectedFiles)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
              >
                <FolderInput size={16} /> Mover
              </button>
            </>
          )}
          {trashMode && (
            <button
              onClick={bulkRestore}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
            >
              <RotateCcw size={16} /> Restaurar
            </button>
          )}
          <button
            onClick={bulkDelete}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} /> Eliminar
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-full p-2 text-navy-400 transition hover:bg-navy-50"
            aria-label="Cancelar selección"
          >
            <X size={16} />
          </button>
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
      {renameFile && (
        <RenameDialog
          file={renameFile}
          onClose={() => setRenameFile(null)}
          onDone={() => {
            setRenameFile(null);
            load();
            notify("Renombrado correctamente");
          }}
        />
      )}
      {moveItems && (
        <MoveDialog
          items={moveItems}
          onClose={() => setMoveItems(null)}
          onMoved={(moved, errors) => {
            setMoveItems(null);
            load();
            notify(
              errors
                ? `${moved} movidos, ${errors} con error`
                : `${moved} elemento(s) movidos`
            );
          }}
        />
      )}
      {detailsFile && (
        <DetailsModal file={detailsFile} onClose={() => setDetailsFile(null)} />
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
  trashMode,
  onRename,
  onMove,
  onCopy,
  onDetails,
  onRestore,
}: {
  file: DriveFile;
  open: boolean;
  setOpen: (v: string | null) => void;
  onPreview: (f: DriveFile) => void;
  onShare: (f: DriveFile) => void;
  onDelete: (f: DriveFile) => void;
  trashMode?: boolean;
  onRename?: (f: DriveFile) => void;
  onMove?: (f: DriveFile) => void;
  onCopy?: (f: DriveFile) => void;
  onDetails?: (f: DriveFile) => void;
  onRestore?: (f: DriveFile) => void;
}) {
  const isFolder = fileKind(effectiveMime(file)) === "folder";
  const close = () => setOpen(null);
  const item = (fn?: (f: DriveFile) => void) => () => {
    close();
    fn?.(file);
  };
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
          <div className="fixed inset-0 z-30" onClick={close} />
          <div
            className="absolute right-0 top-9 z-40 w-48 overflow-hidden rounded-xl border border-navy-100 bg-white py-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {trashMode ? (
              <>
                <MenuBtn
                  icon={RotateCcw}
                  label="Restaurar"
                  onClick={item(onRestore)}
                />
                <MenuBtn icon={Info} label="Detalles" onClick={item(onDetails)} />
                <div className="my-1 h-px bg-navy-100" />
                <MenuBtn
                  icon={Trash2}
                  label="Eliminar definitivo"
                  danger
                  onClick={item(onDelete)}
                />
              </>
            ) : (
              <>
                {!isFolder && canPreview(effectiveMime(file)) && (
                  <MenuBtn
                    icon={Eye}
                    label="Previsualizar"
                    onClick={item(onPreview)}
                  />
                )}
                {!isFolder && (
                  <a
                    href={`/api/drive/download?fileId=${file.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 transition hover:bg-navy-50"
                    onClick={close}
                  >
                    <Download size={16} /> Descargar
                  </a>
                )}
                {isFolder && (
                  <a
                    href={`/api/drive/download-folder?folderId=${file.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 transition hover:bg-navy-50"
                    onClick={close}
                  >
                    <FolderDown size={16} /> Descargar (ZIP)
                  </a>
                )}
                <MenuBtn
                  icon={Pencil}
                  label="Renombrar"
                  onClick={item(onRename)}
                />
                <MenuBtn
                  icon={FolderInput}
                  label="Mover a…"
                  onClick={item(onMove)}
                />
                {!isFolder && (
                  <MenuBtn
                    icon={CopyPlus}
                    label="Hacer una copia"
                    onClick={item(onCopy)}
                  />
                )}
                <MenuBtn
                  icon={Share2}
                  label="Compartir"
                  onClick={item(onShare)}
                />
                <MenuBtn icon={Info} label="Detalles" onClick={item(onDetails)} />
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 transition hover:bg-navy-50"
                    onClick={close}
                  >
                    <ExternalLink size={16} /> Abrir en Drive
                  </a>
                )}
                <div className="my-1 h-px bg-navy-100" />
                <MenuBtn
                  icon={Trash2}
                  label="Eliminar"
                  danger
                  onClick={item(onDelete)}
                />
              </>
            )}
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

function SelectBox({
  checked,
  onToggle,
  className = "",
}: {
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      onClick={(e) => e.stopPropagation()}
      className={`h-4 w-4 cursor-pointer rounded border-navy-300 accent-gold-500 ${className}`}
      aria-label="Seleccionar"
    />
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
  trashMode,
  onRename,
  onMove,
  onCopy,
  onDetails,
  onRestore,
  selected,
  toggleSelect,
}: any) {
  const menuProps = {
    onPreview,
    onShare,
    onDelete,
    trashMode,
    onRename,
    onMove,
    onCopy,
    onDetails,
    onRestore,
  };
  return (
    <div className="space-y-8">
      {folders.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Carpetas
          </h2>
          {/* Columnas adaptables: cada tarjeta con ancho mínimo para que el
              nombre completo (con año) no se corte, incluso con zoom alto */}
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
            {folders.map((f: DriveFile) => (
              <button
                key={f.id}
                onClick={() => onItemClick(f)}
                className={`group flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition hover:border-gold-300 hover:shadow-md ${
                  selected.has(f.id)
                    ? "border-gold-400 ring-1 ring-gold-400/40"
                    : "border-navy-100"
                }`}
              >
                <SelectBox
                  checked={selected.has(f.id)}
                  onToggle={() => toggleSelect(f.id)}
                />
                <FileIcon mimeType={effectiveMime(f)} />
                <span
                  className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-medium leading-snug text-navy-800"
                  title={f.name || ""}
                >
                  {f.name}
                </span>
                <span onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    file={f}
                    open={menuFor === f.id}
                    setOpen={setMenuFor}
                    {...menuProps}
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
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
            {docs.map((f: DriveFile) => {
              const isImage = fileKind(effectiveMime(f)) === "image";
              return (
                <div
                  key={f.id}
                  onClick={() => onItemClick(f)}
                  className={`group cursor-pointer overflow-hidden rounded-xl border bg-white transition hover:border-gold-300 hover:shadow-md ${
                    selected.has(f.id)
                      ? "border-gold-400 ring-1 ring-gold-400/40"
                      : "border-navy-100"
                  }`}
                >
                  <div className="relative flex h-32 items-center justify-center overflow-hidden bg-navy-50">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/drive/thumb?fileId=${f.id}&sz=w400`}
                        alt={f.name || ""}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FileIcon mimeType={effectiveMime(f)} size={34} />
                    )}
                    <span
                      className="absolute left-1.5 top-1.5 rounded-md bg-white/90 p-1 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectBox
                        checked={selected.has(f.id)}
                        onToggle={() => toggleSelect(f.id)}
                        className="block"
                      />
                    </span>
                    <span
                      className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowMenu
                        file={f}
                        open={menuFor === f.id}
                        setOpen={setMenuFor}
                        {...menuProps}
                      />
                    </span>
                  </div>
                  <div className="p-3">
                    <p
                      className="line-clamp-2 break-words text-sm font-medium leading-snug text-navy-800"
                      title={f.name || ""}
                    >
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
  trashMode,
  onRename,
  onMove,
  onCopy,
  onDetails,
  onRestore,
  selected,
  toggleSelect,
}: any) {
  const menuProps = {
    onPreview,
    onShare,
    onDelete,
    trashMode,
    onRename,
    onMove,
    onCopy,
    onDetails,
    onRestore,
  };
  const allSelected =
    files.length > 0 && files.every((f: DriveFile) => selected.has(f.id));
  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-100 bg-navy-50/60 text-left text-xs uppercase tracking-wider text-navy-400">
            <th className="w-10 px-4 py-3">
              <SelectBox
                checked={allSelected}
                onToggle={() =>
                  files.forEach((f: DriveFile) => {
                    if (allSelected === selected.has(f.id)) toggleSelect(f.id);
                  })
                }
              />
            </th>
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
              className={`cursor-pointer border-b border-navy-50 transition last:border-0 hover:bg-navy-50/50 ${
                selected.has(f.id) ? "bg-gold-50/50" : ""
              }`}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <SelectBox
                  checked={selected.has(f.id)}
                  onToggle={() => toggleSelect(f.id)}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon mimeType={effectiveMime(f)} size={18} />
                  <span
                    className="truncate font-medium text-navy-800"
                    title={f.name || ""}
                  >
                    {f.name}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-navy-500 sm:table-cell">
                {fileKind(effectiveMime(f)) === "folder"
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
                    {...menuProps}
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


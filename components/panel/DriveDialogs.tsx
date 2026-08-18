"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Loader2,
  Folder,
  ChevronRight,
  HardDrive,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { FileIcon } from "./FileIcon";
import { formatBytes, formatDate, fileKind, effectiveMime, isShortcut } from "@/lib/format";
import type { DriveFile } from "@/lib/drive";

/* ---------------- Modal base ---------------- */

export function Modal({
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

/* ---------------- Renombrar ---------------- */

export function RenameDialog({
  file,
  onClose,
  onDone,
}: {
  file: DriveFile;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(file.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function rename() {
    if (!name.trim() || name.trim() === file.name) return onClose();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drive/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      onDone();
    } catch {
      setError("No se pudo renombrar");
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Renombrar">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && rename()}
        onFocus={(e) => {
          // Selecciona el nombre sin la extensión
          const dot = e.target.value.lastIndexOf(".");
          e.target.setSelectionRange(0, dot > 0 ? dot : e.target.value.length);
        }}
        className="w-full rounded-lg border border-navy-200 px-3 py-2.5 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
        >
          Cancelar
        </button>
        <button
          onClick={rename}
          disabled={loading || !name.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300 disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin" size={16} />} Guardar
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Mover a… ---------------- */

export function MoveDialog({
  items,
  onClose,
  onMoved,
}: {
  items: DriveFile[];
  onClose: () => void;
  onMoved: (movedCount: number, errorCount: number) => void;
}) {
  const [cur, setCur] = useState("root");
  const [crumb, setCrumb] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");
  const excluded = new Set(items.map((i) => i.id));

  const loadFolder = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/drive/list?folderId=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFolders(
        (data.files || []).filter(
          (f: DriveFile) =>
            // Solo carpetas reales (no accesos directos: no se puede mover dentro)
            f.mimeType === "application/vnd.google-apps.folder"
        )
      );
      setCrumb(data.breadcrumb || []);
      setCur(id);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar las carpetas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolder("root");
  }, [loadFolder]);

  async function move() {
    setMoving(true);
    setError("");
    try {
      const res = await fetch("/api/drive/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: items.map((i) => i.id),
          targetId: cur,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onMoved(data.moved?.length || 0, data.errors?.length || 0);
    } catch (e: any) {
      setError(e.message || "No se pudo mover");
      setMoving(false);
    }
  }

  const title =
    items.length === 1 ? `Mover "${items[0].name}"` : `Mover ${items.length} elementos`;

  return (
    <Modal onClose={onClose} title={title}>
      {/* Migas de pan */}
      <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-navy-500">
        <button
          onClick={() => loadFolder("root")}
          className="flex items-center gap-1 font-medium hover:text-gold-600"
        >
          <HardDrive size={13} /> Mi unidad
        </button>
        {crumb.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-navy-300" />
            <button
              onClick={() => loadFolder(b.id)}
              className="font-medium hover:text-gold-600"
            >
              {b.name}
            </button>
          </span>
        ))}
      </div>

      {/* Lista de carpetas */}
      <div className="h-56 overflow-auto rounded-lg border border-navy-100">
        {loading ? (
          <div className="flex h-full items-center justify-center text-navy-400">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : folders.filter((f) => !excluded.has(f.id!)).length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-navy-400">
            Sin subcarpetas — puedes mover aquí
          </div>
        ) : (
          folders
            .filter((f) => !excluded.has(f.id!))
            .map((f) => (
              <button
                key={f.id}
                onClick={() => loadFolder(f.id!)}
                className="flex w-full items-center gap-3 border-b border-navy-50 px-3 py-2.5 text-left text-sm text-navy-800 transition last:border-0 hover:bg-navy-50"
              >
                <Folder size={16} className="flex-shrink-0 text-gold-500" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <ChevronRight size={14} className="text-navy-300" />
              </button>
            ))
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center justify-between gap-2">
        {crumb.length > 0 ? (
          <button
            onClick={() =>
              loadFolder(crumb.length > 1 ? crumb[crumb.length - 2].id : "root")
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
          >
            <ArrowLeft size={15} /> Atrás
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
          >
            Cancelar
          </button>
          <button
            onClick={move}
            disabled={moving}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300 disabled:opacity-50"
          >
            {moving && <Loader2 className="animate-spin" size={16} />} Mover aquí
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Detalles ---------------- */

export function DetailsModal({
  file,
  onClose,
}: {
  file: DriveFile;
  onClose: () => void;
}) {
  const kind = fileKind(effectiveMime(file));
  const KIND_LABEL: Record<string, string> = {
    folder: "Carpeta",
    image: "Imagen",
    video: "Video",
    audio: "Audio",
    pdf: "Documento PDF",
    doc: "Documento",
    sheet: "Planilla",
    slide: "Presentación",
    archive: "Archivo comprimido",
    other: "Archivo",
  };

  const rows: { label: string; value: string }[] = [
    {
      label: "Tipo",
      value: `${KIND_LABEL[kind] || "Archivo"}${
        isShortcut(file) ? " (acceso directo)" : ""
      }`,
    },
    ...(kind !== "folder"
      ? [{ label: "Tamaño", value: formatBytes(file.size) }]
      : []),
    { label: "Modificado", value: formatDate(file.modifiedTime) },
    ...(file.createdTime
      ? [{ label: "Creado", value: formatDate(file.createdTime) }]
      : []),
    { label: "Compartido", value: file.shared ? "Sí (con enlace)" : "No" },
  ];

  return (
    <Modal onClose={onClose} title="Detalles">
      <div className="mb-4 flex items-center gap-3">
        <FileIcon mimeType={effectiveMime(file)} size={28} />
        <p className="min-w-0 flex-1 break-words font-medium text-navy-900">
          {file.name}
        </p>
      </div>
      <dl className="divide-y divide-navy-50 rounded-lg border border-navy-100">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4 px-3 py-2.5 text-sm">
            <dt className="text-navy-500">{r.label}</dt>
            <dd className="text-right font-medium text-navy-800">{r.value}</dd>
          </div>
        ))}
      </dl>
      {file.webViewLink && (
        <a
          href={file.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-500"
        >
          <ExternalLink size={15} /> Abrir en Google Drive
        </a>
      )}
    </Modal>
  );
}

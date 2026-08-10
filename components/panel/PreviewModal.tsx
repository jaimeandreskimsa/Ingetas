"use client";

import { useEffect, useState } from "react";
import { X, Download, ExternalLink, Loader2, FileWarning } from "lucide-react";
import { fileKind } from "@/lib/format";
import type { DriveFile } from "@/lib/drive";

/**
 * Visor propio: el contenido se sirve desde /api/drive/preview con las
 * credenciales del servidor, por lo que el usuario NO necesita tener sesión
 * de Google en su navegador (antes los iframes de drive.google.com pedían
 * acceso y obligaban a descargar).
 */
export function PreviewModal({
  file,
  onClose,
}: {
  file: DriveFile;
  onClose: () => void;
}) {
  const kind = fileKind(file.mimeType);
  const streamUrl = `/api/drive/preview?fileId=${file.id}`;

  // Para imágenes y documentos se descarga como blob (permite detectar
  // errores y mostrar un mensaje claro). Video/audio usan la URL directa.
  const needsBlob = ["image", "pdf", "doc", "sheet", "slide"].includes(kind);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!needsBlob) return;
    let url: string | null = null;
    let cancelled = false;
    setBlobUrl(null);
    setError(false);
    (async () => {
      try {
        const res = await fetch(streamUrl);
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [streamUrl, needsBlob]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-navy-950/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Barra superior */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="truncate font-medium">{file.name}</p>
        <div className="flex items-center gap-2">
          <a
            href={`/api/drive/download?fileId=${file.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
          </a>
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              <ExternalLink size={16} />{" "}
              <span className="hidden sm:inline">Abrir en Drive</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {error ? (
          <div className="max-w-sm rounded-2xl bg-white p-8 text-center">
            <FileWarning size={40} className="mx-auto mb-3 text-navy-300" />
            <p className="font-medium text-navy-900">
              No se pudo previsualizar este archivo
            </p>
            <a
              href={`/api/drive/download?fileId=${file.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-gold-300"
            >
              <Download size={16} /> Descargar
            </a>
          </div>
        ) : needsBlob && !blobUrl ? (
          <div className="flex flex-col items-center gap-3 text-white/80">
            <Loader2 className="animate-spin" size={36} />
            <p className="text-sm">Cargando vista previa…</p>
          </div>
        ) : kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl!}
            alt={file.name || ""}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
        ) : kind === "video" ? (
          <video
            src={streamUrl}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg bg-black shadow-2xl"
          />
        ) : kind === "audio" ? (
          <div className="w-full max-w-xl rounded-2xl bg-white p-8">
            <p className="mb-4 truncate font-medium text-navy-900">{file.name}</p>
            <audio src={streamUrl} controls autoPlay className="w-full" />
          </div>
        ) : (
          // PDF (y Docs/Sheets/Office convertidos a PDF por el servidor)
          <iframe
            src={blobUrl!}
            className="h-full w-full rounded-lg bg-white shadow-2xl"
            title={file.name || "preview"}
          />
        )}
      </div>
    </div>
  );
}

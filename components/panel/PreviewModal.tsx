"use client";

import { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { fileKind } from "@/lib/format";
import type { DriveFile } from "@/lib/drive";

export function PreviewModal({
  file,
  onClose,
}: {
  file: DriveFile;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const kind = fileKind(file.mimeType);
  const previewUrl = `https://drive.google.com/file/d/${file.id}/preview`;

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
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`}
            alt={file.name || ""}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
        ) : kind === "audio" ? (
          <div className="w-full max-w-xl rounded-2xl bg-white p-8">
            <p className="mb-4 truncate font-medium text-navy-900">{file.name}</p>
            <iframe
              src={previewUrl}
              className="h-24 w-full"
              allow="autoplay"
              title={file.name || "audio"}
            />
          </div>
        ) : (
          <iframe
            src={previewUrl}
            className="h-full w-full rounded-lg bg-white shadow-2xl"
            allow="autoplay; fullscreen"
            title={file.name || "preview"}
          />
        )}
      </div>
    </div>
  );
}

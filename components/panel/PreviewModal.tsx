"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  Loader2,
  FileWarning,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { fileKind, canPreview, effectiveId, effectiveMime } from "@/lib/format";
import { FileIcon } from "./FileIcon";
import { SheetViewer } from "./SheetViewer";
import type { DriveFile } from "@/lib/drive";

/**
 * Visor propio: el contenido se sirve desde /api/drive/preview con las
 * credenciales del servidor, por lo que el usuario NO necesita tener sesión
 * de Google en su navegador.
 *
 *  - Imágenes: zoom (botones, rueda, doble clic) y rotación.
 *  - Planillas: visor nativo con pestañas y zoom (SheetViewer).
 *  - PDF / Docs / Office: PDF en el visor del navegador.
 *  - Video / audio: reproductor nativo en streaming.
 *  - Otros: tarjeta con descarga (nunca redirige a Google).
 */
export function PreviewModal({
  file,
  onClose,
}: {
  file: DriveFile;
  onClose: () => void;
}) {
  const id = effectiveId(file);
  const mime = effectiveMime(file);
  const kind = fileKind(mime);
  const previewable = canPreview(mime);
  const streamUrl = `/api/drive/preview?fileId=${id}`;
  const downloadUrl = `/api/drive/download?fileId=${id}`;

  const [error, setError] = useState(false);
  const onSheetError = useCallback(() => setError(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
            href={downloadUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
          </a>
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 sm:inline-flex"
              title="Requiere sesión de Google"
            >
              <ExternalLink size={16} /> Abrir en Drive
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
        className="flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {error || !previewable ? (
          <NoPreview
            file={file}
            mime={mime}
            downloadUrl={downloadUrl}
            reason={error ? "error" : "unsupported"}
          />
        ) : kind === "image" ? (
          <ImageViewer url={streamUrl} name={file.name || ""} onError={() => setError(true)} />
        ) : kind === "sheet" ? (
          <SheetViewer url={`${streamUrl}&format=xlsx`} onError={onSheetError} />
        ) : kind === "video" ? (
          <video
            src={streamUrl}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg bg-black shadow-2xl"
            onError={() => setError(true)}
          />
        ) : kind === "audio" ? (
          <div className="w-full max-w-xl rounded-2xl bg-white p-8">
            <p className="mb-4 truncate font-medium text-navy-900">{file.name}</p>
            <audio src={streamUrl} controls autoPlay className="w-full" />
          </div>
        ) : (
          <PdfViewer url={streamUrl} name={file.name || ""} onError={() => setError(true)} />
        )}
      </div>
    </div>
  );
}

/* ---------------- Sin vista previa ---------------- */

function NoPreview({
  file,
  mime,
  downloadUrl,
  reason,
}: {
  file: DriveFile;
  mime: string;
  downloadUrl: string;
  reason: "error" | "unsupported";
}) {
  return (
    <div className="max-w-sm rounded-2xl bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex justify-center">
        {reason === "error" ? (
          <FileWarning size={40} className="text-navy-300" />
        ) : (
          <FileIcon mimeType={mime} size={44} />
        )}
      </div>
      <p className="font-medium text-navy-900">
        {reason === "error"
          ? "No se pudo previsualizar este archivo"
          : "Este tipo de archivo no tiene vista previa"}
      </p>
      <p className="mt-1 text-sm text-navy-500">
        Descárgalo para abrirlo en tu equipo.
      </p>
      <a
        href={downloadUrl}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-300"
      >
        <Download size={16} /> Descargar {file.name ? "" : "archivo"}
      </a>
    </div>
  );
}

/* ---------------- PDF ---------------- */

function PdfViewer({
  url,
  name,
  onError,
}: {
  url: string;
  name: string;
  onError: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let objUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok || !res.body) throw new Error();
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total) setProgress(Math.round((received / total) * 100));
        }
        if (cancelled) return;
        const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
        objUrl = URL.createObjectURL(blob);
        setBlobUrl(objUrl);
      } catch {
        if (!cancelled) onError();
      }
    })();
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [url, onError]);

  if (!blobUrl) {
    return (
      <div className="flex flex-col items-center gap-3 text-white/80">
        <Loader2 className="animate-spin" size={36} />
        <p className="text-sm">
          Cargando documento{progress !== null ? ` · ${progress}%` : "…"}
        </p>
      </div>
    );
  }
  return (
    <iframe
      src={`${blobUrl}#zoom=page-width`}
      className="h-full w-full rounded-lg bg-white shadow-2xl"
      title={name || "preview"}
    />
  );
}

/* ---------------- Imagen con zoom ---------------- */

const IMG_ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

function ImageViewer({
  url,
  name,
  onError,
}: {
  url: string;
  name: string;
  onError: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [fit, setFit] = useState(true); // ajustar a pantalla
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const step = (dir: 1 | -1) => {
    setFit(false);
    setZoom((z) => {
      const i = IMG_ZOOMS.findIndex((v) => v >= z - 1e-6);
      const next = IMG_ZOOMS[Math.min(IMG_ZOOMS.length - 1, Math.max(0, (i < 0 ? 3 : i) + dir))];
      return next;
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Controles */}
      <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-navy-900/80 p-1 text-white shadow-lg backdrop-blur">
        <button
          onClick={() => step(-1)}
          className="rounded-full p-2 hover:bg-white/15"
          aria-label="Alejar"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => {
            setFit(true);
            setZoom(1);
          }}
          className="min-w-[3.5rem] rounded-full px-2 py-1 text-xs font-semibold tabular-nums hover:bg-white/15"
          title="Ajustar a pantalla"
        >
          {fit ? "Ajustar" : `${Math.round(zoom * 100)}%`}
        </button>
        <button
          onClick={() => step(1)}
          className="rounded-full p-2 hover:bg-white/15"
          aria-label="Acercar"
        >
          <ZoomIn size={16} />
        </button>
        <span className="mx-0.5 h-5 w-px bg-white/20" />
        <button
          onClick={() => setRot((r) => (r + 90) % 360)}
          className="rounded-full p-2 hover:bg-white/15"
          aria-label="Rotar"
        >
          <RotateCw size={16} />
        </button>
      </div>

      {/* Lienzo desplazable */}
      <div
        ref={boxRef}
        className={`flex-1 overflow-auto rounded-lg ${
          fit ? "flex items-center justify-center" : ""
        }`}
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          step(e.deltaY < 0 ? 1 : -1);
        }}
        onDoubleClick={() => (fit ? step(1) : (setFit(true), setZoom(1)))}
      >
        {!loaded && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/80">
            <Loader2 className="animate-spin" size={36} />
            <p className="text-sm">Cargando imagen…</p>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={`select-none rounded-lg shadow-2xl transition-transform ${
            loaded ? "" : "hidden"
          } ${fit ? "max-h-full max-w-full object-contain" : "max-w-none"}`}
          style={{
            transform: `rotate(${rot}deg)`,
            ...(fit ? {} : { width: `${zoom * 100}%`, height: "auto" }),
          }}
        />
      </div>
    </div>
  );
}

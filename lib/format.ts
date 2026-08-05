export function formatBytes(bytes?: string | number | null): string {
  if (bytes === undefined || bytes === null || bytes === "") return "—";
  const n = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (isNaN(n) || n === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export type FileKind =
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "doc"
  | "sheet"
  | "slide"
  | "archive"
  | "other";

export function fileKind(mimeType?: string | null): FileKind {
  const m = mimeType || "";
  if (m === "application/vnd.google-apps.folder") return "folder";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/") || m === "application/vnd.google-apps.video")
    return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (
    m.includes("word") ||
    m === "application/vnd.google-apps.document" ||
    m === "text/plain"
  )
    return "doc";
  if (
    m.includes("sheet") ||
    m.includes("excel") ||
    m === "application/vnd.google-apps.spreadsheet"
  )
    return "sheet";
  if (
    m.includes("presentation") ||
    m.includes("powerpoint") ||
    m === "application/vnd.google-apps.presentation"
  )
    return "slide";
  if (m.includes("zip") || m.includes("rar") || m.includes("compressed"))
    return "archive";
  return "other";
}

/** ¿Se puede previsualizar dentro del panel? */
export function canPreview(mimeType?: string | null): boolean {
  const k = fileKind(mimeType);
  return ["image", "video", "audio", "pdf", "doc", "sheet", "slide"].includes(k);
}

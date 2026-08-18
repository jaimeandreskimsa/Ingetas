import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";
import { effectiveId, effectiveMime, SHORTCUT_MIME } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/drive/preview?fileId=<id>[&format=xlsx]
 * Sirve el contenido para verlo DENTRO del panel (inline), autenticado con la
 * cuenta principal — el usuario no necesita sesión de Google en su navegador.
 *
 *  - Imágenes, PDF, video, audio, texto -> bytes originales en streaming, con
 *    soporte de Range (PDFs/videos grandes cargan progresivamente).
 *  - format=xlsx: planillas (Google Sheets, Excel, CSV) -> bytes xlsx/csv para
 *    el visor de planillas del panel.
 *  - Docs/Slides de Google                -> exportados a PDF.
 *  - Office (docx/pptx, etc.)             -> convertidos a PDF al vuelo.
 *  - Accesos directos                     -> se resuelven a su destino.
 */

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** MIME de Google nativo al que se puede convertir un archivo de Office. */
function officeToGoogleMime(m: string): string | null {
  if (m.includes("word") || m === "application/rtf" || m === "text/rtf")
    return "application/vnd.google-apps.document";
  if (m.includes("sheet") || m.includes("excel") || m === "text/csv")
    return "application/vnd.google-apps.spreadsheet";
  if (m.includes("presentation") || m.includes("powerpoint"))
    return "application/vnd.google-apps.presentation";
  return null;
}

const GOOGLE_NATIVE = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.drawing",
];

function isSpreadsheet(m: string) {
  return (
    m === "application/vnd.google-apps.spreadsheet" ||
    m.includes("sheet") ||
    m.includes("excel") ||
    m === "text/csv"
  );
}

export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const url = new URL(req.url);
    const requestedId = url.searchParams.get("fileId");
    const format = url.searchParams.get("format");
    if (!requestedId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    // Resuelve accesos directos a su destino real
    let meta = await drive.files.get({
      fileId: requestedId,
      fields: "id, name, mimeType, size, shortcutDetails(targetId,targetMimeType)",
      supportsAllDrives: true,
    });
    let fileId = requestedId;
    if (meta.data.mimeType === SHORTCUT_MIME) {
      fileId = effectiveId(meta.data);
      meta = await drive.files.get({
        fileId,
        fields: "id, name, mimeType, size",
        supportsAllDrives: true,
      });
    }
    const name = meta.data.name || "archivo";
    const mimeType = effectiveMime(meta.data) || "application/octet-stream";

    const headers = (mime: string, filename: string, extra: Record<string, string> = {}) => ({
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "private, max-age=300",
      ...extra,
    });

    // 0) Planillas para el visor nativo del panel
    if (format === "xlsx" && isSpreadsheet(mimeType)) {
      if (mimeType === "application/vnd.google-apps.spreadsheet") {
        const res = await drive.files.export(
          { fileId, mimeType: XLSX_MIME },
          { responseType: "arraybuffer" }
        );
        return new NextResponse(Buffer.from(res.data as ArrayBuffer), {
          headers: headers(XLSX_MIME, `${name}.xlsx`),
        });
      }
      const res = await drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" }
      );
      return new NextResponse(Buffer.from(res.data as ArrayBuffer), {
        headers: headers(mimeType, name),
      });
    }

    // 1) Archivos nativos de Google -> PDF
    if (GOOGLE_NATIVE.includes(mimeType)) {
      const res = await drive.files.export(
        { fileId, mimeType: "application/pdf" },
        { responseType: "arraybuffer" }
      );
      return new NextResponse(Buffer.from(res.data as ArrayBuffer), {
        headers: headers("application/pdf", `${name}.pdf`),
      });
    }

    // 2) Office -> copia convertida a Google -> PDF -> se borra la copia
    const googleMime = officeToGoogleMime(mimeType);
    if (googleMime) {
      let copyId: string | undefined;
      try {
        const copy = await drive.files.copy({
          fileId,
          requestBody: { name: `~preview-${name}`, mimeType: googleMime },
          fields: "id",
          supportsAllDrives: true,
        });
        copyId = copy.data.id || undefined;
        if (!copyId) throw new Error("No se pudo convertir");
        const res = await drive.files.export(
          { fileId: copyId, mimeType: "application/pdf" },
          { responseType: "arraybuffer" }
        );
        return new NextResponse(Buffer.from(res.data as ArrayBuffer), {
          headers: headers("application/pdf", `${name}.pdf`),
        });
      } finally {
        if (copyId) {
          drive.files
            .delete({ fileId: copyId, supportsAllDrives: true })
            .catch(() => {});
        }
      }
    }

    // 3) Resto (imágenes, PDF, video, audio, texto) -> streaming con Range
    const range = req.headers.get("range") || undefined;
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      {
        responseType: "stream",
        headers: range ? { Range: range } : undefined,
      }
    );
    const upstream = res.data as unknown as Readable;
    const status = (res as any).status === 206 ? 206 : 200;
    const passthrough: Record<string, string> = { "Accept-Ranges": "bytes" };
    for (const h of ["content-length", "content-range"]) {
      const v = (res as any).headers?.[h];
      if (v) passthrough[h] = String(v);
    }
    if (!passthrough["content-length"] && meta.data.size && status === 200) {
      passthrough["content-length"] = String(meta.data.size);
    }

    const webStream = Readable.toWeb(upstream) as unknown as ReadableStream;
    return new NextResponse(webStream, {
      status,
      headers: headers(mimeType, name, passthrough),
    });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

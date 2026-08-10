import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/drive/preview?fileId=<id>
 * Sirve el contenido para verlo DENTRO del panel (inline), autenticado con la
 * cuenta principal — el usuario no necesita sesión de Google en su navegador.
 *
 *  - Imágenes, PDF, video, audio, texto -> bytes originales inline.
 *  - Docs/Sheets/Slides de Google       -> exportados a PDF.
 *  - Office (docx/xlsx/pptx, etc.)      -> convertidos a PDF al vuelo
 *    (copia temporal convertida a formato Google, exportada y eliminada).
 */

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

export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const fileId = new URL(req.url).searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    const meta = await drive.files.get({
      fileId,
      fields: "name, mimeType, size",
      supportsAllDrives: true,
    });
    const name = meta.data.name || "archivo";
    const mimeType = meta.data.mimeType || "application/octet-stream";

    const headers = (mime: string, filename: string) => ({
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "private, max-age=300",
    });

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

    // 3) Resto (imágenes, PDF, video, audio, texto) -> bytes originales
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    return new NextResponse(Buffer.from(res.data as ArrayBuffer), {
      headers: headers(mimeType, name),
    });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

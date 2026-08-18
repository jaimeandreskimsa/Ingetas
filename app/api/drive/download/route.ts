import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";
import { effectiveId, SHORTCUT_MIME } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/drive/download?fileId=<id>
 * Transmite el contenido del archivo autenticado como descarga.
 * Los archivos nativos de Google (Docs/Sheets/Slides) se exportan a
 * formatos de Office.
 */
const EXPORT_MAP: Record<string, { mime: string; ext: string }> = {
  "application/vnd.google-apps.document": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ext: "pptx",
  },
};

export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    let fileId = new URL(req.url).searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    let meta = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, shortcutDetails(targetId,targetMimeType)",
      supportsAllDrives: true,
    });
    // Accesos directos: descarga el destino real
    if (meta.data.mimeType === SHORTCUT_MIME) {
      fileId = effectiveId(meta.data);
      meta = await drive.files.get({
        fileId,
        fields: "id, name, mimeType",
        supportsAllDrives: true,
      });
    }
    const name = meta.data.name || "archivo";
    const mimeType = meta.data.mimeType || "application/octet-stream";

    let data: ArrayBuffer;
    let outName = name;
    let outMime = mimeType;

    if (EXPORT_MAP[mimeType]) {
      const exp = EXPORT_MAP[mimeType];
      const res = await drive.files.export(
        { fileId, mimeType: exp.mime },
        { responseType: "arraybuffer" }
      );
      data = res.data as ArrayBuffer;
      outMime = exp.mime;
      outName = `${name}.${exp.ext}`;
    } else {
      const res = await drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" }
      );
      data = res.data as ArrayBuffer;
    }

    return new NextResponse(Buffer.from(data), {
      headers: {
        "Content-Type": outMime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          outName
        )}"`,
      },
    });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

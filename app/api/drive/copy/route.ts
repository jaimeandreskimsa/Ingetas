import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/copy  { fileId }
 * Crea una copia del archivo en la misma carpeta ("Copia de ...").
 * Las carpetas no se pueden copiar (limitación de la API de Drive).
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    const meta = await drive.files.get({
      fileId,
      fields: "name, mimeType, parents",
      supportsAllDrives: true,
    });
    if (meta.data.mimeType === "application/vnd.google-apps.folder") {
      return NextResponse.json(
        { error: "Las carpetas no se pueden copiar" },
        { status: 400 }
      );
    }

    const res = await drive.files.copy({
      fileId,
      requestBody: {
        name: `Copia de ${meta.data.name || "archivo"}`,
        parents: meta.data.parents || undefined,
      },
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });

    return NextResponse.json({ file: res.data });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

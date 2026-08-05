import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/drive/upload  (multipart/form-data)
 *   file      -> el archivo a subir
 *   folderId  -> carpeta destino
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folderId = (form.get("folderId") as string) || "root";

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: folderId && folderId !== "root" ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: stream,
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

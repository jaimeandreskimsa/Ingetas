import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/create-folder  { name, parentId, getOrCreate? }
 * Con getOrCreate, si ya existe una carpeta con ese nombre en el destino la
 * reutiliza (se usa al subir carpetas para no duplicar la estructura).
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { name, parentId, getOrCreate } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    }

    if (getOrCreate) {
      const parent = parentId && parentId !== "root" ? parentId : "root";
      const escaped = String(name).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const existing = await drive.files.list({
        q: `'${parent}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: `files(${FILE_FIELDS})`,
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      if (existing.data.files?.length) {
        return NextResponse.json({ file: existing.data.files[0] });
      }
    }

    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId && parentId !== "root" ? [parentId] : undefined,
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

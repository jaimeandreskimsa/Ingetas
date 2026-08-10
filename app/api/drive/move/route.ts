import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/move  { fileIds: string[], targetId }
 * Mueve uno o varios archivos/carpetas a la carpeta de destino.
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileIds, targetId } = await req.json();
    const ids: string[] = Array.isArray(fileIds) ? fileIds.filter(Boolean) : [];
    if (!ids.length || !targetId) {
      return NextResponse.json(
        { error: "Faltan fileIds o targetId" },
        { status: 400 }
      );
    }

    const rootId = process.env.DRIVE_ROOT_FOLDER_ID || "root";
    const target = targetId === "root" ? rootId : targetId;

    const moved: string[] = [];
    const errors: { id: string; error: string }[] = [];
    for (const id of ids) {
      if (id === target) {
        errors.push({ id, error: "No se puede mover a sí mismo" });
        continue;
      }
      try {
        const meta = await drive.files.get({
          fileId: id,
          fields: "parents",
          supportsAllDrives: true,
        });
        await drive.files.update({
          fileId: id,
          addParents: target,
          removeParents: (meta.data.parents || []).join(","),
          fields: "id",
          supportsAllDrives: true,
        });
        moved.push(id);
      } catch (e: any) {
        errors.push({ id, error: e?.message || "Error al mover" });
      }
    }

    return NextResponse.json({ moved, errors });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

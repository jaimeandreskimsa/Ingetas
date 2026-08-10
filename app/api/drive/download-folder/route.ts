import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";
import { zipResponse } from "@/lib/drive-zip";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * GET /api/drive/download-folder?folderId=<id>
 * Descarga una carpeta completa (con subcarpetas) como archivo ZIP.
 */
export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const folderId = new URL(req.url).searchParams.get("folderId");
    if (!folderId) {
      return NextResponse.json({ error: "Falta folderId" }, { status: 400 });
    }
    return await zipResponse(drive, [folderId]);
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

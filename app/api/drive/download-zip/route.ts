import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";
import { zipResponse } from "@/lib/drive-zip";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * GET /api/drive/download-zip?ids=<id1,id2,...>
 * Descarga una selección de archivos y/o carpetas como un solo ZIP.
 */
export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const ids = (new URL(req.url).searchParams.get("ids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      return NextResponse.json({ error: "Falta ids" }, { status: 400 });
    }
    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Demasiados elementos seleccionados" },
        { status: 400 }
      );
    }
    return await zipResponse(drive, ids);
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

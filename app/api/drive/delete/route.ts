import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/delete  { fileId }
 * Envía el archivo a la papelera (no lo elimina de forma permanente).
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    await drive.files.update({
      fileId,
      requestBody: { trashed: true },
      supportsAllDrives: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

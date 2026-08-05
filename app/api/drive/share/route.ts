import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/share  { fileId }
 * Crea un permiso de lectura para "cualquiera con el enlace" y devuelve
 * el enlace para compartir.
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });

    const res = await drive.files.get({
      fileId,
      fields: "webViewLink",
      supportsAllDrives: true,
    });

    return NextResponse.json({ link: res.data.webViewLink });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

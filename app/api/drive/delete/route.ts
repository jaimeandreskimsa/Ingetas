import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/delete  { fileId, permanent? }
 * Sin permanent: envía el archivo a la papelera (recuperable).
 * Con permanent (desde la vista Papelera): lo elimina definitivamente.
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileId, permanent } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    if (permanent) {
      await drive.files.delete({ fileId, supportsAllDrives: true });
    } else {
      await drive.files.update({
        fileId,
        requestBody: { trashed: true },
        supportsAllDrives: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

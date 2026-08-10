import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/restore  { fileId }
 * Restaura un archivo desde la papelera.
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    const res = await drive.files.update({
      fileId,
      requestBody: { trashed: false },
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });

    return NextResponse.json({ file: res.data });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

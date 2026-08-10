import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/rename  { fileId, name }
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { fileId, name } = await req.json();
    if (!fileId || !name?.trim()) {
      return NextResponse.json(
        { error: "Faltan fileId o name" },
        { status: 400 }
      );
    }

    const res = await drive.files.update({
      fileId,
      requestBody: { name: name.trim() },
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });

    return NextResponse.json({ file: res.data });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

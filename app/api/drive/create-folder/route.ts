import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/create-folder  { name, parentId }
 */
export async function POST(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { name, parentId } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
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

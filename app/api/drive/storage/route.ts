import { NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * GET /api/drive/storage
 * Uso de almacenamiento de la cuenta principal de Drive.
 */
export async function GET() {
  try {
    const drive = await getDriveClient();
    const res = await drive.about.get({
      fields: "storageQuota(limit,usage,usageInDrive,usageInDriveTrash), user(emailAddress,displayName)",
    });
    return NextResponse.json({
      quota: res.data.storageQuota || null,
      user: res.data.user || null,
    });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

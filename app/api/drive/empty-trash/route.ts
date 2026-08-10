import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/drive/empty-trash
 * Vacía la papelera de Drive de forma permanente. Solo administradores.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Solo administradores pueden vaciar la papelera" },
        { status: 403 }
      );
    }
    const drive = await getDriveClient();
    await drive.files.emptyTrash({});
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

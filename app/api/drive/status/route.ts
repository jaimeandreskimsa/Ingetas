import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVE_TOKEN_KEY, DRIVE_ACCOUNT_KEY } from "@/lib/drive";

export const dynamic = "force-dynamic";

/** GET /api/drive/status — indica si la cuenta de Drive está conectada. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const [token, account] = await Promise.all([
    prisma.setting.findUnique({ where: { key: DRIVE_TOKEN_KEY } }),
    prisma.setting.findUnique({ where: { key: DRIVE_ACCOUNT_KEY } }),
  ]);

  const hasCreds = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    connected: Boolean(token?.value) && hasCreds,
    account: account?.value || null,
    hasCredentials: hasCreds,
    isAdmin: isAdmin(session),
  });
}

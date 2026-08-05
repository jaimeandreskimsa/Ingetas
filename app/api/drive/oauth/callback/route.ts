import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVE_TOKEN_KEY, DRIVE_ACCOUNT_KEY } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * GET /api/drive/oauth/callback — recibe el código de Google, obtiene el
 * refresh_token de la cuenta principal y lo guarda en la base de datos.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/panel?drive=forbidden`
    );
  }

  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/panel?drive=error`);
  }

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/drive/oauth/callback`
    );

    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    // Email de la cuenta conectada.
    let account = "";
    try {
      const oauth2api = google.oauth2({ version: "v2", auth: oauth2 });
      const info = await oauth2api.userinfo.get();
      account = info.data.email || "";
    } catch {
      /* no bloqueante */
    }

    if (tokens.refresh_token) {
      await prisma.setting.upsert({
        where: { key: DRIVE_TOKEN_KEY },
        create: { key: DRIVE_TOKEN_KEY, value: tokens.refresh_token },
        update: { value: tokens.refresh_token },
      });
    }
    if (account) {
      await prisma.setting.upsert({
        where: { key: DRIVE_ACCOUNT_KEY },
        create: { key: DRIVE_ACCOUNT_KEY, value: account },
        update: { value: account },
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/panel?drive=connected`
    );
  } catch (err) {
    console.error("drive oauth callback", err);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/panel?drive=error`);
  }
}

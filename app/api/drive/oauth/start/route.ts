import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/drive/oauth/start — (solo admin) inicia el flujo para conectar la
 * cuenta principal de Google Drive. Redirige a la pantalla de consentimiento.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/panel?drive=forbidden`
    );
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/panel?drive=nocreds`
    );
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/drive/oauth/callback`
  );

  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });

  return NextResponse.redirect(url);
}

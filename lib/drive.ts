import { google, drive_v3 } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DRIVE_TOKEN_KEY = "google_refresh_token";
export const DRIVE_ACCOUNT_KEY = "google_account";

/**
 * Cliente de Google Drive usando el token de servicio de la cuenta principal
 * (conectada una sola vez por el admin). Requiere que haya una sesión activa.
 *
 * Lanza:
 *  - "NO_SESSION"    si el usuario no ha iniciado sesión.
 *  - "NOT_CONNECTED" si aún no se ha conectado la cuenta de Google Drive.
 */
export async function getDriveClient(): Promise<drive_v3.Drive> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("NO_SESSION");

  const setting = await prisma.setting.findUnique({
    where: { key: DRIVE_TOKEN_KEY },
  });
  const refreshToken = setting?.value;

  if (
    !refreshToken ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    throw new Error("NOT_CONNECTED");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/drive/oauth/callback`
  );
  oauth2.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth: oauth2 });
}

/** Maneja de forma uniforme los errores de las rutas de Drive. */
export function driveErrorResponse(err: any) {
  if (err?.message === "NO_SESSION") {
    return { status: 401, body: { error: "No autenticado" } };
  }
  if (err?.message === "NOT_CONNECTED") {
    return {
      status: 409,
      body: { error: "Google Drive no está conectado", notConnected: true },
    };
  }
  console.error("drive error", err);
  return { status: 500, body: { error: err?.message || "Error de Drive" } };
}

export const FILE_FIELDS =
  "id, name, mimeType, iconLink, thumbnailLink, webViewLink, webContentLink, size, modifiedTime, shared, parents, imageMediaMetadata(width,height), videoMediaMetadata";

export type DriveFile = drive_v3.Schema$File;

export function isFolder(file: DriveFile): boolean {
  return file.mimeType === "application/vnd.google-apps.folder";
}

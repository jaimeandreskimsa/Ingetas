import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, driveErrorResponse } from "@/lib/drive";
import { effectiveId, SHORTCUT_MIME } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * GET /api/drive/thumb?fileId=<id>&sz=w400
 * Proxy autenticado de las miniaturas de Drive (thumbnailLink no funciona
 * directo en el navegador del usuario porque no tiene sesión de Google).
 */
export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const url = new URL(req.url);
    let fileId = url.searchParams.get("fileId");
    const sz = url.searchParams.get("sz") || "w400";
    if (!fileId) {
      return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
    }

    let meta = await drive.files.get({
      fileId,
      fields: "id, thumbnailLink, mimeType, size, shortcutDetails(targetId,targetMimeType)",
      supportsAllDrives: true,
    });
    if (meta.data.mimeType === SHORTCUT_MIME) {
      fileId = effectiveId(meta.data);
      meta = await drive.files.get({
        fileId,
        fields: "id, thumbnailLink, mimeType, size",
        supportsAllDrives: true,
      });
    }

    let link = meta.data.thumbnailLink;
    if (link) {
      // Ajusta el tamaño solicitado (por defecto Drive entrega =s220)
      link = link.replace(/=s\d+(-c)?$/, `=${sz}`);
      const auth = (drive as any).context._options.auth;
      const { token } = await auth.getAccessToken();
      const res = await fetch(link, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        return new NextResponse(buf, {
          headers: {
            "Content-Type": res.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    // Sin miniatura: si es una imagen razonablemente liviana, sirve el original
    const isImage = (meta.data.mimeType || "").startsWith("image/");
    const size = parseInt(meta.data.size || "0", 10);
    if (isImage && size > 0 && size < 8 * 1024 * 1024) {
      const res = await drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" }
      );
      return new NextResponse(Buffer.from(res.data as ArrayBuffer), {
        headers: {
          "Content-Type": meta.data.mimeType || "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "Sin miniatura" }, { status: 404 });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

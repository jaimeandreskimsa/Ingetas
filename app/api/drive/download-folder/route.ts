import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import * as archiverNS from "archiver";

const archiver = (archiverNS as any).default || archiverNS;
import { getDriveClient, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * GET /api/drive/download-folder?folderId=<id>
 * Descarga una carpeta completa (con subcarpetas) como archivo ZIP.
 * Los archivos nativos de Google se exportan a formatos de Office.
 */

const EXPORT_MAP: Record<string, { mime: string; ext: string }> = {
  "application/vnd.google-apps.document": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ext: "pptx",
  },
};

const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_FILES = 2000;

type Entry = { id: string; path: string; mimeType: string };

/** Recorre la carpeta recursivamente y devuelve la lista de archivos con su ruta. */
async function collectFiles(
  drive: Awaited<ReturnType<typeof getDriveClient>>,
  folderId: string,
  prefix: string,
  out: Entry[]
) {
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files || []) {
      if (!f.id) continue;
      const path = prefix ? `${prefix}/${f.name}` : f.name || f.id;
      if (f.mimeType === FOLDER_MIME) {
        await collectFiles(drive, f.id, path, out);
      } else {
        out.push({ id: f.id, path, mimeType: f.mimeType || "" });
      }
      if (out.length > MAX_FILES) {
        throw new Error(`La carpeta tiene demasiados archivos (más de ${MAX_FILES})`);
      }
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
}

export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const folderId = new URL(req.url).searchParams.get("folderId");
    if (!folderId) {
      return NextResponse.json({ error: "Falta folderId" }, { status: 400 });
    }

    const meta = await drive.files.get({
      fileId: folderId,
      fields: "name, mimeType",
      supportsAllDrives: true,
    });
    if (meta.data.mimeType !== FOLDER_MIME) {
      return NextResponse.json({ error: "No es una carpeta" }, { status: 400 });
    }
    const folderName = meta.data.name || "carpeta";

    const entries: Entry[] = [];
    await collectFiles(drive, folderId, "", entries);
    if (entries.length === 0) {
      return NextResponse.json({ error: "La carpeta está vacía" }, { status: 404 });
    }

    // ZIP sin recompresión (las fotos/PDF ya vienen comprimidos): más rápido.
    const archive = archiver("zip", { zlib: { level: 0 } });
    archive.on("error", (err: Error) => {
      console.error("zip error", err);
    });

    // Agrega los archivos secuencialmente en segundo plano mientras se
    // transmite el ZIP al navegador.
    (async () => {
      for (const entry of entries) {
        try {
          const exp = EXPORT_MAP[entry.mimeType];
          if (exp) {
            const res = await drive.files.export(
              { fileId: entry.id, mimeType: exp.mime },
              { responseType: "arraybuffer" }
            );
            archive.append(Buffer.from(res.data as ArrayBuffer), {
              name: `${entry.path}.${exp.ext}`,
            });
          } else if (entry.mimeType.startsWith("application/vnd.google-apps")) {
            continue; // otros tipos nativos sin exportación directa
          } else {
            const res = await drive.files.get(
              { fileId: entry.id, alt: "media", supportsAllDrives: true },
              { responseType: "stream" }
            );
            archive.append(res.data as unknown as Readable, { name: entry.path });
            // Espera a que archiver consuma este stream antes de pedir el siguiente
            await new Promise<void>((resolve) => {
              (res.data as unknown as Readable).on("end", resolve);
              (res.data as unknown as Readable).on("error", () => resolve());
            });
          }
        } catch (e) {
          console.error(`zip: no se pudo agregar ${entry.path}`, e);
        }
      }
      archive.finalize();
    })();

    const webStream = Readable.toWeb(
      archive as unknown as Readable
    ) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          folderName
        )}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

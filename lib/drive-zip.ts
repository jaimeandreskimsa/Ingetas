import { NextResponse } from "next/server";
import { Readable } from "stream";
import type { drive_v3 } from "googleapis";
import * as archiverNS from "archiver";

const archiver = (archiverNS as any).default || archiverNS;

/**
 * Utilidades compartidas para descargar archivos/carpetas de Drive como ZIP
 * (usadas por /api/drive/download-folder y /api/drive/download-zip).
 */

export const ZIP_EXPORT_MAP: Record<string, { mime: string; ext: string }> = {
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

export type ZipEntry = { id: string; path: string; mimeType: string };

/** Recorre una carpeta recursivamente y agrega sus archivos con ruta. */
export async function collectFolder(
  drive: drive_v3.Drive,
  folderId: string,
  prefix: string,
  out: ZipEntry[]
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
        await collectFolder(drive, f.id, path, out);
      } else {
        out.push({ id: f.id, path, mimeType: f.mimeType || "" });
      }
      if (out.length > MAX_FILES) {
        throw new Error(
          `La selección tiene demasiados archivos (más de ${MAX_FILES})`
        );
      }
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
}

/**
 * Resuelve una lista de ids (archivos y/o carpetas) a entradas de ZIP y
 * devuelve la respuesta que transmite el ZIP al navegador.
 */
export async function zipResponse(
  drive: drive_v3.Drive,
  ids: string[],
  fallbackName = "archivos-ingetas"
): Promise<NextResponse> {
  const entries: ZipEntry[] = [];
  let zipName = fallbackName;

  for (const id of ids) {
    const meta = await drive.files.get({
      fileId: id,
      fields: "id, name, mimeType",
      supportsAllDrives: true,
    });
    const name = meta.data.name || id;
    if (meta.data.mimeType === FOLDER_MIME) {
      if (ids.length === 1) zipName = name;
      await collectFolder(drive, id, ids.length === 1 ? "" : name, entries);
    } else {
      entries.push({ id, path: name, mimeType: meta.data.mimeType || "" });
    }
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No hay archivos para descargar" },
      { status: 404 }
    );
  }

  // ZIP sin recompresión (fotos/PDF ya vienen comprimidos): más rápido.
  const archive = archiver("zip", { zlib: { level: 0 } });
  archive.on("error", (err: Error) => {
    console.error("zip error", err);
  });

  // Agrega los archivos secuencialmente mientras el ZIP se transmite.
  (async () => {
    for (const entry of entries) {
      try {
        const exp = ZIP_EXPORT_MAP[entry.mimeType];
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
          const stream = res.data as unknown as Readable;
          archive.append(stream, { name: entry.path });
          // Espera a que archiver consuma este stream antes del siguiente
          await new Promise<void>((resolve) => {
            stream.on("end", resolve);
            stream.on("error", () => resolve());
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
        zipName
      )}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, FILE_FIELDS, driveErrorResponse } from "@/lib/drive";

export const dynamic = "force-dynamic";

/**
 * GET /api/drive/list
 *   ?folderId=<id|root>   carpeta a listar (por defecto la raíz configurada)
 *   ?q=<texto>            búsqueda por nombre en todo el Drive
 *   ?sort=name|modified   orden
 */
export async function GET(req: NextRequest) {
  try {
    const drive = await getDriveClient();
    const { searchParams } = new URL(req.url);

    const rootId = process.env.DRIVE_ROOT_FOLDER_ID || "root";
    const folderId = searchParams.get("folderId") || rootId;
    const search = (searchParams.get("q") || "").trim();
    const sort = searchParams.get("sort") || "folder";

    let query: string;
    if (search) {
      const safe = search.replace(/'/g, "\\'");
      query = `name contains '${safe}' and trashed = false`;
    } else {
      query = `'${folderId}' in parents and trashed = false`;
    }

    const orderBy =
      sort === "modified"
        ? "folder,modifiedTime desc"
        : sort === "name_desc"
        ? "folder,name desc"
        : "folder,name";

    const res = await drive.files.list({
      q: query,
      fields: `files(${FILE_FIELDS}), nextPageToken`,
      orderBy,
      pageSize: 200,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    // Construimos las migas de pan (breadcrumb) subiendo por los padres.
    const breadcrumb: { id: string; name: string }[] = [];
    if (!search && folderId !== "root" && folderId !== rootId) {
      let current: string | undefined = folderId;
      let guard = 0;
      while (current && guard < 20) {
        const meta: any = await drive.files.get({
          fileId: current,
          fields: "id, name, parents",
          supportsAllDrives: true,
        });
        breadcrumb.unshift({ id: meta.data.id, name: meta.data.name });
        current = meta.data.parents?.[0];
        guard++;
        if (current === rootId || current === "root") break;
      }
    }

    return NextResponse.json({
      files: res.data.files || [],
      breadcrumb,
      folderId,
    });
  } catch (err: any) {
    const { status, body } = driveErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

type Sheet = { name: string; rows: (string | number)[][]; merges: MergeSpec[] };
type MergeSpec = { r0: number; c0: number; r1: number; c1: number };

const ZOOMS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];
const MAX_ROWS = 3000;
const MAX_COLS = 100;

/** Letra(s) de columna estilo Excel: 0 -> A, 26 -> AA */
function colLabel(i: number) {
  let s = "";
  i++;
  while (i > 0) {
    const m = (i - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

/**
 * Visor de planillas dentro del panel: recibe la URL de un .xlsx/.csv, lo
 * parsea en el navegador (SheetJS) y lo muestra como una grilla con pestañas
 * por hoja, encabezados fijos y control de zoom.
 */
export function SheetViewer({
  url,
  onError,
}: {
  url: string;
  onError: () => void;
}) {
  const [sheets, setSheets] = useState<Sheet[] | null>(null);
  const [active, setActive] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(3); // 100%
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, XLSX] = await Promise.all([fetch(url), import("xlsx")]);
        if (!res.ok) throw new Error();
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: true });
        let cut = false;
        const parsed: Sheet[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
            header: 1,
            raw: false, // usa el texto formateado (fechas, %, miles)
            defval: "",
            blankrows: false,
          });
          if (rows.length > MAX_ROWS) cut = true;
          const trimmed = rows.slice(0, MAX_ROWS).map((r) => {
            if (r.length > MAX_COLS) cut = true;
            return r.slice(0, MAX_COLS);
          });
          const merges: MergeSpec[] = (ws["!merges"] || []).map((m: any) => ({
            r0: m.s.r,
            c0: m.s.c,
            r1: m.e.r,
            c1: m.e.c,
          }));
          return { name, rows: trimmed, merges };
        });
        if (cancelled) return;
        setTruncated(cut);
        setSheets(parsed);
      } catch {
        if (!cancelled) onError();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, onError]);

  const sheet = sheets?.[active];
  const zoom = ZOOMS[zoomIdx];

  // Celdas ocultas por combinaciones (merges) + spans
  const { hidden, spans, colCount } = useMemo(() => {
    const hidden = new Set<string>();
    const spans = new Map<string, { rs: number; cs: number }>();
    let colCount = 0;
    if (sheet) {
      for (const r of sheet.rows) colCount = Math.max(colCount, r.length);
      for (const m of sheet.merges) {
        spans.set(`${m.r0}:${m.c0}`, {
          rs: m.r1 - m.r0 + 1,
          cs: m.c1 - m.c0 + 1,
        });
        for (let r = m.r0; r <= m.r1; r++)
          for (let c = m.c0; c <= m.c1; c++)
            if (r !== m.r0 || c !== m.c0) hidden.add(`${r}:${c}`);
      }
    }
    return { hidden, spans, colCount };
  }, [sheet]);

  if (!sheets) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/80">
        <Loader2 className="animate-spin" size={36} />
        <p className="text-sm">Cargando planilla…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      {/* Barra: pestañas de hojas + zoom */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-navy-100 bg-navy-50/60 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActive(i)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                i === active
                  ? "bg-navy-900 text-white"
                  : "text-navy-600 hover:bg-navy-100"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-navy-200 bg-white p-0.5">
          <button
            onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
            disabled={zoomIdx === 0}
            className="rounded-md p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-40"
            aria-label="Alejar"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoomIdx(3)}
            className="min-w-[3.25rem] rounded-md px-1 py-1 text-xs font-semibold tabular-nums text-navy-700 hover:bg-navy-50"
            title="Restablecer zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))}
            disabled={zoomIdx === ZOOMS.length - 1}
            className="rounded-md p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-40"
            aria-label="Acercar"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Grilla */}
      <div className="flex-1 overflow-auto">
        {sheet && sheet.rows.length > 0 ? (
          <table
            className="border-collapse text-navy-800"
            style={{ fontSize: `${13 * zoom}px` }}
          >
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 border border-navy-200 bg-navy-100 px-2 py-1 text-[0.8em] font-semibold text-navy-500" />
                {Array.from({ length: colCount }).map((_, c) => (
                  <th
                    key={c}
                    className="border border-navy-200 bg-navy-100 px-2 py-1 text-center text-[0.8em] font-semibold text-navy-500"
                    style={{ minWidth: `${6 * zoom}rem` }}
                  >
                    {colLabel(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, r) => (
                <tr key={r} className="even:bg-navy-50/30">
                  <th className="sticky left-0 z-10 border border-navy-200 bg-navy-100 px-2 py-1 text-right text-[0.8em] font-semibold tabular-nums text-navy-500">
                    {r + 1}
                  </th>
                  {Array.from({ length: colCount }).map((_, c) => {
                    const key = `${r}:${c}`;
                    if (hidden.has(key)) return null;
                    const sp = spans.get(key);
                    const v = row[c] ?? "";
                    const isNum =
                      typeof v === "number" ||
                      (typeof v === "string" &&
                        v.trim() !== "" &&
                        /^-?[\d.,$%\s]+$/.test(v.trim()));
                    return (
                      <td
                        key={c}
                        rowSpan={sp?.rs}
                        colSpan={sp?.cs}
                        className={`whitespace-pre border border-navy-100 px-2 py-1 align-top ${
                          isNum ? "text-right tabular-nums" : ""
                        } ${sp ? "bg-gold-50/40 font-medium" : ""}`}
                      >
                        {String(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-navy-400">
            Esta hoja está vacía
          </div>
        )}
      </div>

      {truncated && (
        <div className="flex-shrink-0 border-t border-navy-100 bg-gold-50 px-3 py-1.5 text-center text-xs text-gold-800">
          Vista previa limitada a {MAX_ROWS} filas × {MAX_COLS} columnas — descarga el
          archivo para verlo completo.
        </div>
      )}
    </div>
  );
}

export const SheetViewerIcon = Maximize2;

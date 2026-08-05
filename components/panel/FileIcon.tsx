import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Presentation,
  File as FileGeneric,
} from "lucide-react";
import { fileKind } from "@/lib/format";

const MAP = {
  folder: { Icon: Folder, color: "text-gold-500", bg: "bg-gold-100" },
  image: { Icon: FileImage, color: "text-emerald-600", bg: "bg-emerald-50" },
  video: { Icon: FileVideo, color: "text-rose-600", bg: "bg-rose-50" },
  audio: { Icon: FileAudio, color: "text-purple-600", bg: "bg-purple-50" },
  pdf: { Icon: FileText, color: "text-red-600", bg: "bg-red-50" },
  doc: { Icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  sheet: { Icon: FileSpreadsheet, color: "text-green-600", bg: "bg-green-50" },
  slide: { Icon: Presentation, color: "text-orange-600", bg: "bg-orange-50" },
  archive: { Icon: FileArchive, color: "text-amber-700", bg: "bg-amber-50" },
  other: { Icon: FileGeneric, color: "text-navy-500", bg: "bg-navy-100" },
} as const;

export function FileIcon({
  mimeType,
  size = 22,
  withBg = true,
}: {
  mimeType?: string | null;
  size?: number;
  withBg?: boolean;
}) {
  const kind = fileKind(mimeType);
  const { Icon, color, bg } = MAP[kind];
  if (!withBg) return <Icon size={size} className={color} />;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg ${bg}`}
      style={{ width: size + 18, height: size + 18 }}
    >
      <Icon size={size} className={color} />
    </span>
  );
}

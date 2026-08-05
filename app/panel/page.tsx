import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DriveBrowser } from "@/components/panel/DriveBrowser";

export const metadata = {
  title: "Panel · Gestor de Drive | Ingetas",
};

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  const user = {
    name: session?.user?.name || "Usuario",
    email: session?.user?.email || "",
    role: ((session?.user as any)?.role as "ADMIN" | "USER") || "USER",
  };
  return <DriveBrowser user={user} />;
}

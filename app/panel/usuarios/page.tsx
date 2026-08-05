import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { UsersManager } from "@/components/panel/UsersManager";

export const metadata = { title: "Usuarios · Ingetas" };

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isAdmin(session)) redirect("/panel");

  return <UsersManager currentUserId={(session.user as any).id} />;
}

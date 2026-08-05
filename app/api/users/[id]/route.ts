import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado", status: 401 };
  if (!isAdmin(session)) return { error: "No autorizado", status: 403 };
  return { session };
}

/** PATCH /api/users/[id] — edita nombre, rol, estado o contraseña. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json();
  const data: any = {};
  if (typeof body.name === "string" && body.name.trim())
    data.name = body.name.trim();
  if (body.role === "ADMIN" || body.role === "USER") data.role = body.role;
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.password === "string" && body.password.length >= 6) {
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return NextResponse.json({ user });
}

/** DELETE /api/users/[id] — elimina un usuario. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  // Evita que el admin se elimine a sí mismo.
  if ((guard.session!.user as any).id === params.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

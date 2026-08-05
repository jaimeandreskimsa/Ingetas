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

/** GET /api/users — lista de usuarios (solo admin). */
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}

/** POST /api/users — crea un usuario (solo admin). */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nombre, email y contraseña son obligatorios" },
      { status: 400 }
    );
  }
  if (String(password).length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese email" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return NextResponse.json({ user });
}

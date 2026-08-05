import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = {
    name: "Administrador",
    email: "admin@ingetas.cl",
    password: "Ingetas2026",
    role: "ADMIN",
  };
  const demo = {
    name: "Usuario Demo",
    email: "usuario@ingetas.cl",
    password: "Demo2026",
    role: "USER",
  };

  for (const u of [admin, demo]) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      },
    });
    console.log(`✔ ${u.role.padEnd(5)} ${u.email}  (contraseña: ${u.password})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

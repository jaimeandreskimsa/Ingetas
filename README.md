# Ingetas 2026 — Sitio web + Panel con Google Drive

Rediseño de **ingetas.cl** en **Next.js 14** (App Router) + **Tailwind** +
**TypeScript** + **Framer Motion**, con un **área interna** de gestión de
documentos de Google Drive al estilo del plugin *Integrate Google Drive*.

**Modelo de acceso (como el WordPress):**
- Los **usuarios son propios del sistema** (email + contraseña), creados por un
  **administrador**. No se inicia sesión con Google.
- **Una sola cuenta de Google Drive** se conecta una vez (la principal,
  `gerente@ingetas.cl`); su token se guarda en el servidor y **todas** las
  operaciones de archivos usan esa conexión.
- Roles: **ADMIN** (gestiona usuarios y conecta Drive) y **USER** (accede a los
  archivos). Todos ven todo el Drive.

---

## 1. Requisitos

- Node.js 18.17+ (probado con Node 20)
- Una base de datos **PostgreSQL** (local con Docker, o Railway en producción)
- Credenciales OAuth de Google (para conectar Drive)

## 2. Puesta en marcha local

```bash
# 1) Base de datos local (Docker)
docker run -d --name ingetas-pg \
  -e POSTGRES_USER=ingetas -e POSTGRES_PASSWORD=ingetas -e POSTGRES_DB=ingetas \
  -p 5544:5432 postgres:16

# 2) Dependencias
npm install

# 3) Variables de entorno
cp .env.example .env.local     # completa NEXTAUTH_SECRET (openssl rand -base64 32)
# el archivo .env ya trae el DATABASE_URL local

# 4) Crear tablas y usuarios de prueba
npx prisma migrate dev
node prisma/seed.mjs

# 5) Levantar
npm run dev                    # http://localhost:3000
```

**Cuentas de prueba (creadas por el seed):**

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@ingetas.cl | Ingetas2026 |
| Usuario | usuario@ingetas.cl | Demo2026 |

> Cámbialas o elimínalas en producción.

## 3. Variables de entorno

`.env` (lo lee Prisma):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión Postgres. Local: la de Docker. Producción: la de Railway. |

`.env.local` (lo lee Next.js):

| Variable | Descripción |
|---|---|
| `NEXTAUTH_URL` | URL base. `http://localhost:3000` en local; la URL pública en producción. |
| `NEXTAUTH_SECRET` | Secreto de sesión. `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales OAuth (para conectar Drive). |

## 4. Conectar Google Drive (una vez)

1. Crea las credenciales OAuth en Google Cloud Console (Drive API habilitada,
   tipo *Aplicación web*). Redirección autorizada:
   `<NEXTAUTH_URL>/api/drive/oauth/callback`
   (local: `http://localhost:3000/api/drive/oauth/callback`).
2. Pon `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env.local`.
3. Inicia sesión como **admin**, entra al panel y pulsa **"Conectar Google
   Drive"**. Autoriza con la cuenta principal (`gerente@ingetas.cl`).
4. Listo: el `refresh_token` queda guardado y todos los usuarios ven el Drive.

> El Drive principal de Ingetas es una **Unidad Compartida**. El explorador ya
> soporta Unidades Compartidas.

## 5. Estructura

```
app/
  page.tsx                 → Sitio público (landing con animaciones)
  login/                   → Login usuario/contraseña
  panel/                   → Área interna (Drive) — protegida
  panel/usuarios/          → Gestión de usuarios (solo admin)
  api/
    auth/[...nextauth]/    → NextAuth (Credentials)
    users/ · users/[id]/   → CRUD de usuarios (admin)
    drive/                 → list · upload · download · share · delete · create-folder · status
    drive/oauth/           → start · callback (conectar la cuenta de Drive)
    contact/               → Formulario de contacto
components/site/           → Landing (Header, Hero, About, Services, Projects, Contact, Footer, anim)
components/panel/          → DriveBrowser, UsersManager, PreviewModal, FileIcon
lib/                       → auth.ts · prisma.ts · drive.ts · format.ts
prisma/                    → schema.prisma · seed.mjs
```

## 6. Despliegue en Railway

1. Sube el proyecto a un repositorio y créalo en [railway.app](https://railway.app).
2. Agrega el plugin **PostgreSQL**; copia su `DATABASE_URL` a las variables.
3. Define también `NEXTAUTH_URL` (la URL pública), `NEXTAUTH_SECRET`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
4. Comando de build: `npm run build` (Prisma genera el cliente en `postinstall`
   automático). Migraciones en producción: `npx prisma migrate deploy`.
5. Ejecuta el seed una vez para crear el admin inicial (o crea el admin a mano).
6. Agrega la redirección de producción en las credenciales de Google.

## 7. Formulario de contacto

Las consultas se registran en el log; para enviarlas por correo define
`RESEND_API_KEY` y `CONTACT_TO_EMAIL` (ver `app/api/contact/route.ts`).

---

© Ingetas Ltda — *Aplicamos ingeniería a los procesos de tasación.*

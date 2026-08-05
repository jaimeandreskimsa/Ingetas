import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/contact  { nombre, telefono, email, mensaje }
 *
 * Envía la consulta por SMTP (configurado para Google Workspace:
 * smtp.gmail.com con una contraseña de aplicación). Si no hay SMTP
 * configurado, registra la consulta en el log para no perderla.
 */
export async function POST(req: NextRequest) {
  try {
    const { nombre, telefono, email, mensaje } = await req.json();

    if (!nombre || !email || !mensaje) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.CONTACT_TO_EMAIL || user || "ingetas@vtr.net";
    const fromName = "Web Ingetas";

    if (host && user && pass) {
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${user}>`, // Gmail exige que "from" sea la cuenta autenticada
        to,
        replyTo: `"${nombre}" <${email}>`,
        subject: `Nueva consulta web de ${nombre}`,
        text: `Nombre: ${nombre}\nTeléfono: ${telefono || "-"}\nEmail: ${email}\n\n${mensaje}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px">
            <h2 style="color:#0f2740">Nueva consulta desde el sitio</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(telefono || "-")}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-wrap">${escapeHtml(mensaje)}</p>
          </div>
        `,
      });

      return NextResponse.json({ ok: true });
    }

    // Sin SMTP configurado: no se pierde la consulta.
    console.log("[contacto] Nueva consulta (configurar SMTP):", {
      nombre,
      telefono,
      email,
      mensaje,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("api/contact", err);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje" },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

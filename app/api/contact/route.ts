import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact  { nombre, telefono, email, mensaje }
 *
 * Si existe RESEND_API_KEY se envía el correo con Resend (https://resend.com,
 * sin dependencias extra, vía su API HTTP). En caso contrario, la consulta se
 * registra en el log del servidor para no perderla mientras se configura el
 * envío de correo.
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

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL || "ingetas@vtr.net";
    const from = process.env.CONTACT_FROM_EMAIL || "Ingetas <onboarding@resend.dev>";

    if (apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          reply_to: email,
          subject: `Nueva consulta web de ${nombre}`,
          html: `
            <h2>Nueva consulta desde ingetas.cl</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(telefono || "-")}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${escapeHtml(mensaje).replace(/\n/g, "<br/>")}</p>
          `,
        }),
      });
      if (!res.ok) {
        console.error("Resend error", await res.text());
        return NextResponse.json({ error: "No se pudo enviar" }, { status: 502 });
      }
    } else {
      console.log("[contacto] Nueva consulta (configurar RESEND_API_KEY):", {
        nombre,
        telefono,
        email,
        mensaje,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("api/contact", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

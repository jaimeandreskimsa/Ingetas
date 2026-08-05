/* eslint-disable @next/next/no-img-element */

/**
 * Logo oficial de Ingetas (public/logo.png — imagen original con fondo
 * transparente). Se apoya directamente sobre cualquier fondo.
 */
export function Logo({
  className = "",
  height = 48,
}: {
  className?: string;
  /** compat: ya no se usa, el logo tiene sus propios colores */
  variant?: "light" | "dark";
  height?: number;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/logo.png"
        alt="Ingetas — Ingeniería en Tasaciones"
        style={{ height }}
        className="block w-auto"
      />
    </span>
  );
}

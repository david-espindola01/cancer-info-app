import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const metadata: Metadata = {
  title: `${SITE_NAME} · ${SITE_TAGLINE}`,
  description:
    "Información clara y sencilla sobre el cáncer, basada en artículos científicos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

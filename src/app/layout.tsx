import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TrainerIA", template: "%s · TrainerIA" },
  description:
    "Dashboard personal de training: Whoop + Garmin + plan del entrenador.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dark mode por defecto: la clase `dark` va fija en <html>.
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TrainerIA", template: "%s · TrainerIA" },
  description:
    "Dashboard personal de training: Whoop + Garmin + plan del entrenador.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "TrainerIA" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
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

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "CLOSER — Trainiere Einwandbehandlung wie ein Profi",
  description:
    "Simuliere realistische High-Ticket-Verkaufsgespräche, trainiere Einwandbehandlung mit KI und werde Schritt für Schritt zum sicheren Closer.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F6F3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

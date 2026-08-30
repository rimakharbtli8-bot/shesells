import { SettingsClient } from "./SettingsClient";
import { FEATURES } from "@/lib/config";

export const metadata = { title: "Einstellungen — CLOSER" };

export default function EinstellungenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Einstellungen</h1>
        <p className="mt-1 text-sm text-ink-muted">Dein Training, dein Tempo.</p>
      </div>
      <SettingsClient features={FEATURES} />
    </div>
  );
}

import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_COMMUNITY_URL } from "@/lib/config";

export const metadata = { title: "Community — CLOSER" };

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Community</h1>
        <p className="mt-1 text-sm text-ink-muted">Du clost nicht allein.</p>
      </div>

      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
          <MessageCircle size={26} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">Werde Teil der Community</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Tausche dich mit anderen Closern aus, teile Erfahrungen und entwickle dich gemeinsam weiter.
          </p>
        </div>
        <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
          <Button size="lg">WhatsApp Community beitreten →</Button>
        </a>
      </Card>
    </div>
  );
}

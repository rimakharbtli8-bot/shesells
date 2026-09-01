import { Lightbulb, Workflow, Megaphone, MessagesSquare, Rocket } from "lucide-react";
import type { PlaybookModule } from "@/lib/types";

export const PLAYBOOK: PlaybookModule[] = [
  {
    id: "angebot",
    slug: "angebot-waehlen",
    order: 1,
    icon: Lightbulb,
    title: "Ein Angebot wählen, das sich verkaufen lässt",
    summary:
      "Bevor du an Funnel oder Content denkst: ohne ein konkretes Angebot verkaufst du Luft.",
    whatYouNeed: [
      "Ein Problem, das du selbst gelöst hast oder sehr genau verstehst",
      "5 echte Gespräche oder Kommentare/DMs von Menschen mit genau diesem Problem",
      "Den Mut, dafür von Tag eins an Geld zu verlangen",
    ],
    steps: [
      "Schreib 5 Probleme auf, die Leute in deiner Nische wirklich googeln oder in Kommentaren/DMs fragen — nicht, was du für wichtig hältst.",
      "Wähle das Problem mit dem klarsten, messbaren Ergebnis (Zeit sparen, Geld verdienen, eine konkrete Angst loswerden). Je greifbarer das Ergebnis, desto leichter der Verkauf.",
      "Definiere das kleinstmögliche Produkt, das genau dieses eine Ergebnis liefert. Kein „Rundum-Sorglos-Kurs“ mit 40 Modulen — ein E-Book, eine Vorlage, ein Mini-Kurs oder ein 1:1-Slot.",
      "Verlange von Anfang an Geld dafür, und sei es 9€. Kostenlos verteilt sagt dir nichts darüber, ob wirklich jemand kaufen würde.",
    ],
    mistakes: [
      "Ein Produkt monatelang bauen, bevor du mit 5 echten Menschen darüber gesprochen hast",
      "Ein Angebot „für alle“ statt für eine sehr eng definierte Zielgruppe",
      "Erst das perfekte Produkt, dann erst die Frage, ob es überhaupt jemand kauft",
    ],
    example:
      "Bau nicht sofort einen „90-Tage-Insta-Wachstums-Kurs“. Bau ein 15-seitiges PDF: „Die 7 Hooks, mit denen Coaches in den ersten 3 Sekunden Aufmerksamkeit bekommen“ — für 17€. Wenn das 20 Leute kaufen, weißt du, dass die Nachfrage echt ist.",
    ctaLabel: "Weiter: Funnel-Grundgerüst",
    ctaHref: "/leitfaden/funnel-grundgeruest",
  },
  {
    id: "funnel",
    slug: "funnel-grundgeruest",
    order: 2,
    icon: Workflow,
    title: "Dein Funnel-Grundgerüst — ohne Werbebudget",
    summary:
      "„Funnel“ klingt kompliziert. In Wirklichkeit sind es drei Bausteine, die du an einem Nachmittag aufsetzen kannst.",
    whatYouNeed: [
      "Ein Freebie (Lead-Magnet), das in unter 10 Minuten konsumierbar ist",
      "Einen einfachen Ort für den Kontakt (kostenloses E-Mail-Tool oder Instagram-Broadcast-Liste reicht am Anfang)",
      "Eine 3-teilige Nachrichten-Sequenz mit genau einer Handlungsaufforderung am Ende",
    ],
    steps: [
      "Baue EIN Freebie, das ein kleines Teilproblem sofort löst — keine 50-seitige Mappe, die niemand fertig liest.",
      "Biete es im Austausch gegen Kontakt an: E-Mail-Adresse oder Instagram-DM (Schlüsselwort-Automatisierung reicht am Anfang völlig).",
      "Schreib eine Sequenz von 3 Nachrichten: (1) Freebie liefern + dich kurz vorstellen, (2) eine Geschichte oder ein Ergebnis zeigen, das beweist, dass du das Problem lösen kannst, (3) dein bezahltes Angebot mit klarer, einziger Handlungsaufforderung.",
      "Verlinke am Ende jeder Nachricht auf GENAU eine Aktion — Kauf-Link oder Termin-Link. Nicht fünf Optionen, die zur Entscheidungslähmung führen.",
    ],
    mistakes: [
      "10 Lead-Magnete gleichzeitig bauen, statt einen fertigzustellen",
      "Teure Funnel-Software kaufen, bevor du einen einzigen Verkauf gemacht hast — ein Linktree oder eine simple Notion-Seite reicht am Anfang",
      "Die Sequenz nie fertigschreiben, weil sie „noch nicht perfekt“ ist",
    ],
    example:
      "Nachricht 3 deiner Sequenz, konkret: „Du hast gesehen, wie [Ergebnis] bei [Beispielperson] funktioniert hat. Wenn du das für dich willst, zeige ich dir in [Produktname] genau die Schritte dahinter. Hier ist der Link: [Link]. Fragen? Schreib mir einfach zurück.“",
    ctaLabel: "Weiter: Content, der Leads bringt",
    ctaHref: "/leitfaden/content-das-leads-bringt",
  },
  {
    id: "content",
    slug: "content-das-leads-bringt",
    order: 3,
    icon: Megaphone,
    title: "Content, der wirklich Leads bringt (ganz ohne Ads)",
    summary:
      "Nicht mehr posten ist die Lösung, sondern jeder Post braucht einen Job im Funnel.",
    whatYouNeed: [
      "3–5 wiederkehrende Content-Themen (Content-Säulen), die direkt zu deinem Angebot passen",
      "Einen klaren Call-to-Action in jedem Post und in der Bio",
      "Die Bereitschaft, in fremden Kommentarspalten und Gruppen sichtbar zu werden",
    ],
    steps: [
      "Lege 3–5 Content-Säulen fest, die direkt mit dem Problem zusammenhängen, das dein Angebot löst — nicht generische Motivation.",
      "Jeder Post bekommt EINEN Job: Aufmerksamkeit (Hook zu einem konkreten Problem), Vertrauen (zeigen, dass du es gelöst hast) oder Handlung (klarer CTA zum Freebie).",
      "Setz einen einzigen, immer gleichen CTA in die Bio: Link zum Freebie, nicht zu fünf verschiedenen Zielen.",
      "Werde dort sichtbar, wo deine Zielgruppe bereits ist — sinnvolle Kommentare unter größeren Accounts, Antworten in Gruppen — statt nur auf deinem eigenen Feed zu warten.",
    ],
    mistakes: [
      "Posts ohne erkennbaren CTA — Follower wissen nicht, was sie als Nächstes tun sollen",
      "Nur über dich und dein Produkt reden, statt über das Ergebnis, das die Zielgruppe will",
      "Aufhören, nachdem 3 Posts keine Leads gebracht haben — Vertrauen braucht Wiederholung",
    ],
    example:
      "Hook, der funktioniert: „Warum deine Freebies niemand herunterlädt (und was stattdessen funktioniert)“ → Post liefert 2 konkrete Tipps → letzter Satz: „Die komplette Anleitung inkl. Vorlage bekommst du kostenlos — Link in Bio.“",
    ctaLabel: "Weiter: Vom Kommentar zum Kauf",
    ctaHref: "/leitfaden/verkaufsgespraech",
  },
  {
    id: "verkaufsgespraech",
    slug: "verkaufsgespraech",
    order: 4,
    icon: MessagesSquare,
    title: "Vom Kommentar zum Kauf — das eigentliche Verkaufsgespräch",
    summary:
      "Hier scheitern die meisten Funnels: Interesse ist da, aber niemand traut sich, das Gespräch zum Abschluss zu führen.",
    whatYouNeed: [
      "2–3 Qualifizierungsfragen, die du in jedem DM-Gespräch stellst",
      "Die Bereitschaft, aktiv nach dem Kauf oder Termin zu fragen",
      "Ruhe im Umgang mit Einwänden statt sofortiger Rabatte",
    ],
    steps: [
      "Stell im DM-Gespräch 2–3 Fragen, bevor du verkaufst: Was ist die aktuelle Situation? Was wurde schon versucht? Was wäre das gewünschte Ergebnis?",
      "Fasse das Problem der Person in einem Satz zusammen, bevor du dein Angebot erwähnst — das zeigt, dass du zugehört hast.",
      "Mach ein konkretes, einziges Angebot mit klarem nächsten Schritt (Kauf-Link oder Termin) — keine „meld dich, wenn du Interesse hast“-Formulierung.",
      "Wenn ein Einwand kommt (zu teuer, muss nachdenken, keine Zeit), reagiere nicht mit Rabatt oder Rechtfertigung, sondern mit einer Verständnisfrage, die den echten Grund dahinter klärt.",
    ],
    mistakes: [
      "Nach dem Freebie nie aktiv nach dem Verkauf fragen, aus Angst „aufdringlich“ zu wirken",
      "Bei jedem Einwand sofort den Preis senken — das untergräbt den Wert des gesamten Angebots",
      "Das Gespräch beenden, sobald ein Einwand kommt, statt den eigentlichen Zweifel zu verstehen",
    ],
    example:
      "Genau diese Situation — ein „zu teuer“ oder „ich muss nachdenken“ im DM oder am Telefon souverän aufzulösen — ist der Kern dieser App. Trainiere sie im Simulator, bevor du sie mit echten Interessent:innen übst.",
    ctaLabel: "Einwand jetzt trainieren",
    ctaHref: "/trainieren",
  },
  {
    id: "launch",
    slug: "launch-ohne-ads",
    order: 5,
    icon: Rocket,
    title: "Launch ohne Ads — deine ersten 10 Verkäufe",
    summary:
      "Die ersten Verkäufe kommen fast nie über Werbeanzeigen, sondern über warme Kontakte und sichtbare Beweise.",
    whatYouNeed: [
      "Eine Liste von 20–30 Menschen aus deinem bestehenden Netzwerk, die potenziell passen",
      "Bereitschaft, persönlich statt nur über Posts zu verkaufen",
      "Einen Plan, wie du die ersten Käufer:innen um Feedback/Testimonial bittest",
    ],
    steps: [
      "Schreib 20–30 Menschen aus deinem bestehenden Netzwerk (Follower, Kontakte, alte Kund:innen) persönlich an — kein Massenpost, sondern eine echte Nachricht pro Person.",
      "Biete den ersten 5–10 Käufer:innen einen fairen Preis im Austausch für ehrliches Feedback und im besten Fall ein Testimonial an.",
      "Sammle jedes Ergebnis, jede Rückmeldung und jeden Erfolg sofort als Content — das wird dein Beweis-Material für zukünftige Verkäufe.",
      "Wiederhole den Funnel-Kreislauf (Content → Freebie → Gespräch → Verkauf) wöchentlich, statt nach dem ersten Launch aufzuhören.",
    ],
    mistakes: [
      "Direkt mit bezahlten Ads starten, bevor organisch überhaupt ein Verkauf stattgefunden hat",
      "Nach dem Launch-Tag aufhören, statt den Funnel dauerhaft laufen zu lassen",
      "Kein Feedback von den ersten Käufer:innen einholen — dadurch fehlt dir Beweis-Material für die nächsten Verkäufe",
    ],
    example:
      "Eine einzige persönliche Nachricht bringt oft mehr als 100 Post-Impressions: „Hey [Name], ich hab gerade [Produkt] fertiggestellt, das genau [Problem] löst. Ich weiß, dass du gerade [Situation] hast — willst du es dir anschauen? Für die ersten paar Leute mache ich einen fairen Preis im Austausch für ehrliches Feedback.“",
    ctaLabel: "Zur Einwand-Bibliothek",
    ctaHref: "/einwaende",
  },
];

export function getPlaybookModuleBySlug(slug: string): PlaybookModule | undefined {
  return PLAYBOOK.find((m) => m.slug === slug);
}

export function getAdjacentPlaybookModules(order: number) {
  return {
    previous: PLAYBOOK.find((m) => m.order === order - 1),
    next: PLAYBOOK.find((m) => m.order === order + 1),
  };
}

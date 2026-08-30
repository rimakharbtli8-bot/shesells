import type { Objection, ObjectionCategoryId } from "@/lib/types";

export const OBJECTION_CATEGORIES: { id: ObjectionCategoryId; label: string; icon: string }[] = [
  { id: "preis", label: "Preis", icon: "💰" },
  { id: "timing", label: "Timing", icon: "⏳" },
  { id: "vertrauen", label: "Vertrauen", icon: "🤝" },
  { id: "produkt", label: "Produkt", icon: "🧩" },
  { id: "commitment", label: "Commitment", icon: "🔒" },
];

export const OBJECTIONS: Objection[] = [
  {
    id: "zu-teuer",
    slug: "zu-teuer",
    category: "preis",
    text: "Das ist mir zu teuer.",
    why: "Der Kunde vergleicht den Preis mit einem Referenzwert, der ihm bekannt ist — meistens ohne den vollen Wert deines Angebots zu kennen.",
    behind: "Oft steckt dahinter Unsicherheit über den ROI, nicht der absolute Preis. Der Kunde hat noch nicht verstanden, was er konkret dafür bekommt.",
    avoid: "Sofort einen Rabatt anbieten oder dich rechtfertigen. Das bestätigt, dass der Preis tatsächlich das Problem ist.",
    goodExample:
      "„Verstehe ich gut — darf ich fragen, im Vergleich zu was fühlt sich der Preis zu hoch an? Geht es um das Budget generell oder um den erwarteten Nutzen?“",
    followUps: [
      "Ich weiß nicht, ob sich das für mich rechnet.",
      "Andere Anbieter sind günstiger.",
    ],
  },
  {
    id: "kann-mir-nicht-leisten",
    slug: "kann-mir-das-gerade-nicht-leisten",
    category: "preis",
    text: "Ich kann mir das gerade nicht leisten.",
    why: "Signalisiert eine echte oder gefühlte Budget-Grenze — oft eine Priorisierungsfrage, kein absolutes Nein.",
    behind: "Häufig fehlt eine klare Vorstellung davon, was die Investition langfristig zurückbringt, oder es gibt gerade andere Prioritäten.",
    avoid: "Druck aufbauen oder den Kunden für seine finanzielle Situation infrage stellen.",
    goodExample:
      "„Das kann ich nachvollziehen. Wenn das Budget aktuell nicht das Thema wäre — wäre die Lösung dann die richtige für dich?“",
    followUps: ["Ich müsste erst andere Dinge zurückstellen.", "Vielleicht in ein paar Monaten."],
  },
  {
    id: "warum-so-teuer",
    slug: "warum-kostet-das-so-viel",
    category: "preis",
    text: "Warum kostet das so viel?",
    why: "Der Kunde sucht nach einer nachvollziehbaren Begründung für den Preis — er ist offener als ein pauschales „zu teuer“.",
    behind: "Meist fehlt noch die klare Verbindung zwischen Preis und konkretem Ergebnis für seine Situation.",
    avoid: "Eine reine Liste von Features aufzählen, ohne den Bezug zum Nutzen des Kunden herzustellen.",
    goodExample:
      "„Gute Frage. Der Preis spiegelt [konkretes Ergebnis] wider. Darf ich kurz zeigen, wie sich das für dich konkret rechnet?“",
    followUps: ["Das klingt nach viel für das, was ich bekomme.", "Gibt es eine günstigere Variante?"],
  },
  {
    id: "keine-zeit",
    slug: "ich-habe-gerade-keine-zeit",
    category: "timing",
    text: "Ich habe gerade keine Zeit.",
    why: "Zeit wird oft als sicherer, unangreifbarer Einwand genutzt — er ist leicht auszusprechen und schwer zu widerlegen.",
    behind: "Häufig fehlt die Priorität, nicht die Zeit selbst. Der Nutzen ist noch nicht dringend genug.",
    avoid: "Den Kunden bedrängen oder sofort einen neuen Termin aufzwingen.",
    goodExample:
      "„Verstehe ich. Darf ich fragen — ist es eher, dass gerade zu viel los ist, oder dass das Thema aktuell keine Priorität hat?“",
    followUps: ["Ruf mich nächsten Monat nochmal an.", "Ich melde mich, wenn ich Zeit habe."],
  },
  {
    id: "spaeter-starten",
    slug: "ich-moechte-spaeter-starten",
    category: "timing",
    text: "Ich möchte später starten.",
    why: "Der Kunde schiebt die Entscheidung auf, oft weil die Dringlichkeit fehlt oder Zweifel bestehen.",
    behind: "Manchmal ist es echte Terminplanung, häufig aber eine sanfte Vertagung, um sich nicht festlegen zu müssen.",
    avoid: "Das „später“ einfach akzeptieren, ohne den Grund zu verstehen.",
    goodExample:
      "„Was müsste bis dahin passieren, damit ein späterer Start für dich Sinn ergibt? Und was würde dich heute schon überzeugen, früher zu starten?“",
    followUps: ["Nach dem Sommer passt es besser.", "Ich will erst das Quartal abschließen."],
  },
  {
    id: "muss-nachdenken",
    slug: "ich-muss-darueber-nachdenken",
    category: "vertrauen",
    text: "Ich muss darüber nachdenken.",
    why: "Einer der häufigsten und vagsten Einwände — oft ein Signal für ungeklärte Zweifel statt echten Bedenkzeitbedarf.",
    behind: "Der Kunde ist unsicher, ob die Entscheidung richtig ist, traut sich aber nicht, das offen zu sagen.",
    avoid: "Das Gespräch sofort beenden mit „Kein Problem, melden Sie sich“ — damit verlierst du den Kontakt zum eigentlichen Zweifel.",
    goodExample:
      "„Gerne. Damit ich dich beim Nachdenken unterstützen kann — was ist der Punkt, bei dem du dir noch nicht sicher bist?“",
    followUps: ["Ich will nichts überstürzen.", "Das ist eine große Entscheidung."],
  },
  {
    id: "erstmal-vergleichen",
    slug: "ich-moechte-erstmal-vergleichen",
    category: "vertrauen",
    text: "Ich möchte erstmal vergleichen.",
    why: "Ein rationaler, verständlicher Wunsch — der Kunde will Sicherheit über die beste Entscheidung.",
    behind: "Oft fehlt ein klares Unterscheidungsmerkmal, warum dein Angebot die richtige Wahl ist.",
    avoid: "Konkurrenten schlechtreden — das wirkt unsouverän und unglaubwürdig.",
    goodExample:
      "„Macht total Sinn. Worauf schaust du beim Vergleich am meisten — Preis, Ergebnis oder Betreuung? Dann kann ich dir zeigen, wo wir uns unterscheiden.“",
    followUps: ["Was unterscheidet euch von anderen?", "Ich hole noch ein zweites Angebot ein."],
  },
  {
    id: "partner-fragen",
    slug: "ich-muss-mit-meinem-partner-sprechen",
    category: "vertrauen",
    text: "Ich muss mit meinem Partner sprechen.",
    why: "Kann ein echter Entscheidungsprozess sein oder ein Ausweichmanöver, um keine Antwort geben zu müssen.",
    behind: "Häufig ist der Kunde selbst noch nicht zu 100% überzeugt und nutzt den Partner als Absicherung.",
    avoid: "Die Aussage einfach so stehen lassen, ohne herauszufinden, wie der Kunde selbst dazu steht.",
    goodExample:
      "„Sehr sinnvoll, das gemeinsam zu entscheiden. Mal unabhängig davon — wie stehst du selbst gerade dazu?“",
    followUps: ["Wir müssen das gemeinsam besprechen.", "Ohne Rücksprache entscheide ich nichts."],
  },
  {
    id: "funktioniert-das",
    slug: "ich-weiss-nicht-ob-das-funktioniert",
    category: "produkt",
    text: "Ich weiß nicht, ob das funktioniert.",
    why: "Der Kunde zweifelt am Ergebnis, nicht zwingend am Preis oder Timing.",
    behind: "Oft fehlende Beweise (Referenzen, Ergebnisse), oder eine frühere schlechte Erfahrung mit einem ähnlichen Angebot.",
    avoid: "Nur Versprechen machen, ohne konkrete Belege oder Referenzen zu nennen.",
    goodExample:
      "„Verständlich. Darf ich fragen, was genau dich unsicher macht — ist es die Umsetzung bei dir konkret, oder generelle Zweifel am Ansatz?“",
    followUps: ["Ich habe Angst, dass es nicht funktioniert.", "Habt ihr Referenzen aus meiner Branche?"],
  },
  {
    id: "unterschied-zu-anderen",
    slug: "was-unterscheidet-euch-von-anderen",
    category: "produkt",
    text: "Was unterscheidet euch von anderen?",
    why: "Eine offene, faire Frage — der Kunde gibt dir aktiv die Chance, dich zu positionieren.",
    behind: "Meist fehlt dem Kunden ein klares Bild, warum er sich für dich statt für die Konkurrenz entscheiden sollte.",
    avoid: "Vage, austauschbare Antworten wie „bessere Qualität“ ohne Substanz.",
    goodExample:
      "„Gute Frage. Der größte Unterschied ist [konkretes Merkmal]. Was ist dir bei der Auswahl besonders wichtig, dann kann ich gezielt darauf eingehen?“",
    followUps: ["Klingt ähnlich wie bei anderen Anbietern.", "Warum sollte ich mich für euch entscheiden?"],
  },
  {
    id: "noch-nicht-festlegen",
    slug: "ich-moechte-mich-noch-nicht-festlegen",
    category: "commitment",
    text: "Ich möchte mich noch nicht festlegen.",
    why: "Der Kunde scheut die Verbindlichkeit einer Entscheidung — oft aus Angst vor einer falschen Wahl.",
    behind: "Häufig fehlendes Vertrauen in die eigene Entscheidungsfähigkeit oder unklare Erwartungen an das Ergebnis.",
    avoid: "Druck aufbauen oder künstliche Verknappung erfinden, die nicht stimmt.",
    goodExample:
      "„Verstehe ich. Was würde dir helfen, dich sicherer zu fühlen — mehr Informationen, ein kleinerer erster Schritt, oder etwas anderes?“",
    followUps: ["Ich will erst sehen, wie es läuft.", "Gibt es eine Möglichkeit, es erstmal zu testen?"],
  },
  {
    id: "schau-mich-noch-um",
    slug: "ich-schaue-erstmal-weiter",
    category: "commitment",
    text: "Ich schaue erstmal weiter.",
    why: "Ein klassischer Vermeidungs-Einwand — der Kunde will das Gespräch ohne Entscheidung beenden.",
    behind: "Oft ein Zeichen, dass der wahrgenommene Nutzen noch nicht groß genug ist, um jetzt zu handeln.",
    avoid: "Das Gespräch resigniert beenden, ohne den eigentlichen Zweifel zu klären.",
    goodExample:
      "„Klar, verständlich. Bevor du weiterschaust — was müsste ein Angebot erfüllen, damit es für dich passt? Vielleicht haben wir das schon.“",
    followUps: ["Schick mir erstmal Infos.", "Ich melde mich, falls ich Interesse habe."],
  },
  {
    id: "infos-schicken",
    slug: "schick-mir-erstmal-infos",
    category: "commitment",
    text: "Schick mir erstmal Infos.",
    why: "Häufig eine höfliche Art, das Gespräch ohne Verbindlichkeit zu beenden.",
    behind: "Der Kunde ist noch nicht überzeugt genug, um sich jetzt festzulegen, möchte das aber nicht direkt sagen.",
    avoid: "Einfach unkommentiert Infos schicken und das Gespräch beenden — damit verlierst du den Gesprächsfaden.",
    goodExample:
      "„Mache ich gerne. Damit ich dir die relevanten Infos schicke — worauf sollte ich dabei besonders eingehen?“",
    followUps: ["Ich habe gerade keine Zeit.", "Ich melde mich, wenn ich es mir angeschaut habe."],
  },
  {
    id: "angst-funktioniert-nicht",
    slug: "ich-habe-angst-dass-es-nicht-funktioniert",
    category: "produkt",
    text: "Ich habe Angst, dass es nicht funktioniert.",
    why: "Ein sehr ehrlicher Einwand — der Kunde öffnet sich emotional, was eine Chance für echte Verbindung ist.",
    behind: "Meist eine frühere Enttäuschung oder die Sorge, Zeit/Geld in etwas zu investieren, das keinen Erfolg bringt.",
    avoid: "Die Angst kleinreden oder ungeduldig reagieren — das zerstört Vertrauen sofort.",
    goodExample:
      "„Das ist eine total berechtigte Sorge. Darf ich fragen, was konkret dazu geführt hat — eine frühere Erfahrung, oder allgemeine Unsicherheit?“",
    followUps: ["Was, wenn es bei mir nicht klappt?", "Gibt es eine Garantie?"],
  },
];

export function getObjectionBySlug(slug: string): Objection | undefined {
  return OBJECTIONS.find((o) => o.slug === slug);
}

export function getObjectionsByCategory(category: ObjectionCategoryId): Objection[] {
  return OBJECTIONS.filter((o) => o.category === category);
}

# Trackstar – Hausregeln

## Über das Projekt
KI-Songcheck-Tool: Nutzer laden einen Track hoch, bekommen einen kostenlosen
Kurzcheck (Sound, Star-Potential, Hook) und eine kostenpflichtige Tiefenanalyse
(Frequenzen, Tipps, KI-Einordnung, Titel-Ideen, Songtext-Verbesserung).
Bewusst **eigenständig** von Nachtfahrt Records/EZY, bis explizit anders
entschieden – kein Cross-Branding, keine gemeinsamen Inhalte.

## Das Team
| Name | Rolle |
|---|---|
| Finn | Technik & Deploys – Website, Worker, Cloudflare, Bugfixing |
| Carla | Recht & Datenschutz – Impressum, DSGVO, AGB |
| Malik | Finanzen & Zahlungen – Stripe, Preisgestaltung, Kosten |
| Pia | Wachstum & Markt – Positionierung, Konkurrenz, Sprachen/Expansion |
| Timo | Qualität & Nutzererfahrung – Testing, Feedback-Kriterien, UX |

Bei größeren Aufgaben kurz sagen, wer "dran" ist (z. B. "Finn hier, deploye
den Fix"), sonst normal antworten – kein Zwang, das bei jeder Kleinigkeit
durchzuziehen.

## Technischer Aufbau
- `website/` – statische Seite (HTML/CSS/JS, kein Build-Step), deployt über
  ein an dieses Repo angebundenes Cloudflare-Projekt (nicht GitHub Pages –
  das hat sich bei privaten Repos als Sackgasse erwiesen)
- `worker/` – Cloudflare Worker (`songtext-worker.js`), hält Anthropic- und
  Stripe-Secrets serverseitig, macht KI-Einschätzung + Zahlungsprüfung
- Beide Cloudflare-Projekte ziehen sich den Code automatisch bei jedem Push
  auf `main` – nach jedem Feature-Branch-Commit auch nach `main` mergen und
  pushen, sonst passiert auf Cloudflare nichts

## Harte Regeln
- **Keine Secrets im Code oder Chat.** API-Keys nur als verschlüsselte
  Cloudflare-Variable, nie in Dateien, nie in Commits.
- **Kein Cross-Branding mit Nachtfahrt Records**, bis der Nutzer das
  ausdrücklich freigibt.
- Preis-/Rechtstexte (`impressum.html`, `datenschutz.html`) enthalten echte
  Kontaktdaten – bei Änderungen an der Datenverarbeitung (neue Dienste,
  neue Zahlungsanbieter) den Datenschutztext mit aktualisieren.
- Vor jedem "fertig" kurz selbst im Browser testen (Playwright), nicht nur
  auf Codeebene behaupten, dass es funktioniert.

## Kommunikation
Kurz, deutsch, direkt. Ehrlich sagen, wenn was (noch) nicht sauber lösbar
ist, statt es zu beschönigen.

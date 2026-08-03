# Offene Punkte

Stand: 2026-08-03. Kurzer Überblick, was als Nächstes ansteht – damit
egal, wann wir weitermachen, jeder (Team und Claude) direkt weiß, wo wir
stehen.

## Größte Baustelle: Konten, Credits, Abo
Aktuelles Preismodell (fest entschieden):
- **Free:** Ampel-Urteil + größtes Problem, aber ohne Lösung (Verkaufshebel)
- **Credits:** 5 Checks für 7 € einmalig, kein Abo
- **Pro:** 9,50 €/Monat, 50 Checks, voller Report (Hook/Titel/Lyrics/
  Platzierungstipps), Album-Upload inklusive
- **Jährlich:** 79 €

Dafür fehlt noch komplett:
- Nutzerkonten (Login/Registrierung)
- Datenbank (Credits-Stand, Abo-Status pro Nutzer)
- Stripe Subscriptions + Webhooks + Customer Portal (bisher nur einfache
  Payment-Link-Verifizierung gebaut, passt nicht mehr zum neuen Modell)
- Free-Tier-UX umbauen: Problem zeigen, Lösung hinter Bezahlschranke

→ bewusst auf eine ausgeruhte Session verschoben, da grundlegend andere
Architektur als der Rest der App.

## Rebrand: Trackstar → Overhertz
Entschieden, Name steht. Noch zu tun:
- Codebase durchgehen (Titel, Texte, Variablennamen wo sinnvoll)
- Neue Cloudflare-Projekte/URLs (Finn: in einem Rutsch machen, nicht
  schrittweise)
- Logo einbauen: **Der Wellenstern** als Hauptlogo/Favicon
- **Das Siegel** als spätere Verifizierungs-Badge-Funktion vormerken
- Social-Handles reservieren (Instagram/TikTok/X)
- Marke „Overhertz" beim DPMA anmelden (nur empfohlen, noch nicht
  eingereicht)

## Feature-Rückstand
- Album-Upload (Teil vom Pro-Plan, noch nicht gebaut)
- Genre-adaptive Referenzwerte (aktuell ein fixer Referenzbereich für alle
  Genres)
- „Fazit als Wegweiser zum Werkzeug" – zusammenfassender Abschnitt am Ende
  der Tiefenanalyse, der Fakten + Tipps bündelt und Richtung Lösung zeigt

## Rechtliches / Zahlungen
- Umsatzsteuer-ID in impressum.html ergänzen, falls vorhanden
- Beide Rechtstexte (impressum.html, datenschutz.html) vor echtem
  kommerziellen Start von einem Anwalt prüfen lassen
- Datenschutztext bei neuen Diensten (Stripe, ggf. Auth-Provider) aktuell
  halten
- Stripe-Zahlungsfluss ans neue Credits/Abo-Modell anpassen (alter
  Payment-Link-Ansatz ist überholt)

## Team-Zuordnung (grob)
- Finn: Rebrand-Deploy, Konten/DB-Infrastruktur
- Malik: Stripe Subscriptions/Webhooks, Preislogik
- Carla: USt-ID, Anwaltsprüfung, Datenschutz-Updates
- Pia: Marke/Handles, Positionierung Free-vs-Paid
- Timo: Testing der neuen Flows, UX vom Free-Tier-Umbau

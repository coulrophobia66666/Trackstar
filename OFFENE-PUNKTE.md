# Offene Punkte

Stand: 2026-08-03 (nach dem großen Konten/Credits/Abo-Umbau). Code für alle
Features unten ist geschrieben, committed und im Browser client-seitig
getestet (Playwright, siehe Testprotokoll unten). Was noch fehlt, ist reine
Cloudflare/Stripe-Dashboard-Konfiguration – kann ich nicht von hier aus
machen, da ich keinen Zugriff auf eure Dashboards habe.

## ⚠️ Damit Konten/Credits/Abo live gehen: manuelle Schritte (Finn + Malik)

1. **D1-Datenbank anlegen**: Cloudflare-Dashboard → Workers & Pages → D1 →
   "Create database", Name z. B. `overhertz-db`.
2. Die erzeugte `database_id` in `worker/wrangler.toml` eintragen (ersetzt
   `REPLACE_WITH_REAL_D1_DATABASE_ID`) und committen/pushen.
3. Im D1-Dashboard → Datenbank → "Console"-Tab den Inhalt von
   `worker/schema.sql` einfügen und ausführen (legt die Tabellen an).
4. Im Worker unter "Bindings" prüfen, dass D1-Binding `DB` mit der
   Datenbank verknüpft ist (passiert meist automatisch über wrangler.toml).
5. **Stripe-Produkte anlegen** (3 Stück, je mit eigener Price-ID):
   - Credits: 7 € einmalig
   - Pro: 9,50 € / Monat (wiederkehrend)
   - Pro jährlich: 79 € / Jahr (wiederkehrend)
6. Die drei Price-IDs (`price_...`, nicht geheim) als Klartext-Variablen im
   Worker eintragen: `STRIPE_PRICE_CREDITS`, `STRIPE_PRICE_PRO_MONTHLY`,
   `STRIPE_PRICE_PRO_ANNUAL`.
7. **Stripe-Webhook einrichten**: Stripe-Dashboard → Developers → Webhooks →
   "Add endpoint", URL `https://<worker-url>/stripe-webhook`, Events:
   `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`.
8. Das dabei erzeugte Webhook-Signing-Secret als verschlüsseltes Secret
   `STRIPE_WEBHOOK_SECRET` im Worker hinterlegen (gleiches Vorgehen wie bei
   `ANTHROPIC_API_KEY`/`STRIPE_SECRET_KEY`: Encrypt-Toggle an, nie im Klartext).
9. Kurzer Testkauf (Stripe-Testmodus) durchspielen: Registrieren → Credits
   kaufen → prüfen, ob Credits im Konto ankommen.

Bis Schritt 1–4 erledigt sind, geben `/auth/*`, `/consume-credit` und
`/create-checkout-session` einen sauberen "noch nicht eingerichtet"-Fehler
zurück (kein Absturz) – die Website bleibt nutzbar, nur Login/Kauf gehen
noch nicht.

## Was in diesem Durchgang fertig gebaut wurde
- Konten (Registrierung/Login, Passwort gehasht mit PBKDF2, Session-Token)
- Credits-System (5 für 7 €) + Pro-Abo (9,50 €/Monat, 50 Checks) + Pro
  jährlich (79 €), inkl. Stripe Checkout Sessions & Webhook-Handler im Worker
- Free-Tier zeigt jetzt Ampel-Urteil + größtes Problem **ohne** Lösung –
  die Lösung/Tipps gibt's erst nach Freischaltung (Verkaufshebel wie besprochen)
- Rebrand zu **Overhertz** im gesamten Website-/Rechtstext-Code (Titel,
  Überschriften, Impressum, Datenschutz)
- Datenschutzerklärung um Konten-Datenverarbeitung (D1, Local-Storage-Token)
  und Zahlungsabwicklung (Stripe) ergänzt – Pflicht laut Hausregeln
- Genre-adaptive Referenzwerte (Hip-Hop/Pop/EDM/Rock/Akustik/Allgemein) für
  Frequenzbalance und Lautheits-Ziel
- "Fazit als Wegweiser": zusammenfassender Abschnitt am Ende der
  Tiefenanalyse mit den 3 wichtigsten nächsten Schritten
- Album-Check (Pro-Feature): mehrere Tracks am Stück hochladen und je Track
  einen Kurz-Score bekommen, verbraucht Checks aus dem Pro-Kontingent

## Getestet (Playwright, lokal gegen die Website-Dateien)
- Formular → Analyse → Free-Ergebnis rendert, Teaser zeigt nur das Problem,
  keine Lösung
- "Vollanalyse ansehen" ohne Login → Login/Registrieren-Karte öffnet sich
  mit passendem Hinweistext
- Pricing-Karte zeigt alle 3 Pläne; Plan-Auswahl ohne Login → Login-Prompt
- Album-Check ohne Login → Login-Prompt
- Keine JavaScript-Fehler im Browser (nur erwarteter Netzwerkfehler durch
  die Sandbox-Firewall beim Google-Fonts-Request, kein Website-Bug)
- **Nicht testbar von hier**: der komplette Login→Kauf→Freischaltung-Flow
  gegen echtes D1/Stripe, weil ich keinen Zugriff auf eure Cloudflare-/
  Stripe-Dashboards habe. Bitte nach den Schritten oben einmal echt
  durchklicken (Registrieren, Credits kaufen im Stripe-Testmodus, prüfen ob
  Tiefenanalyse freigeschaltet wird).

## ⚠️ Vocals-Check: unbedingt live testen (Timo)
Neues Beta-Feature (Whisper-Transkription der Vocals im Browser, Abgleich mit
dem eingegebenen Songtext). Ich konnte den eigentlichen Transkriptions-Lauf
**nicht** selbst im Browser testen – meine Sandbox blockiert den Zugriff auf
das externe CDN (jsDelivr/Hugging Face), von dem das Whisper-Modell geladen
wird. Getestet habe ich nur, dass die UI korrekt reagiert (Button erscheint
nur bei vorhandenem Songtext, Fehler werden sauber abgefangen statt die Seite
abstürzen zu lassen). Bitte einmal echt durchklicken: Track mit Songtext
hochladen, Tiefenanalyse freischalten, "Vocals transkribieren & vergleichen"
klicken, prüfen ob das Modell lädt und ein sinnvolles Transkript rauskommt
(erster Aufruf lädt ~140MB Modell, kann etwas dauern). Funktioniert es nicht,
liegt es vermutlich an der genauen CDN-URL/Paketversion in `app.js`
(`getTranscriber`) – dann Bescheid geben, dann justiere ich das nach.

## Weiterhin offen
- **Cloudflare-Projekte umbenennen/neu anlegen** für die eigentliche
  Overhertz-Domain (aktuell läuft alles noch unter den `trackstar-*`
  workers.dev-URLs – funktioniert, ist aber nicht die Ziel-URL)
- Logo einbauen: **Der Wellenstern** als Hauptlogo/Favicon,
  **Das Siegel** als spätere Verifizierungs-Badge-Funktion
- Social-Handles reservieren (Instagram/TikTok/X), Marke „Overhertz" beim
  DPMA anmelden
- Umsatzsteuer-ID in impressum.html ergänzen, falls vorhanden
- Beide Rechtstexte vor echtem kommerziellen Start von einem Anwalt prüfen
  lassen (Hinweis steht bereits als Entwurfs-Notiz in den Seiten selbst)
- Stripe "Zahlungsbeschreibung"/Statement-Descriptor final im Dashboard
  setzen, falls noch nicht geschehen

## Team-Zuordnung (grob)
- Finn: D1/Stripe-Einrichtung (Schritte 1–9 oben), Cloudflare-Rebrand
- Malik: Stripe-Produkte/Preise anlegen, Webhook-Test
- Carla: USt-ID, Anwaltsprüfung, Datenschutz-Feinschliff
- Pia: Marke/Handles, Logo-Einbau
- Timo: Kompletten Kauf-Flow einmal live durchklicken, Feedback zur
  Free-vs-Premium-Balance (zeigt der Free-Teil genug, um zu überzeugen?)

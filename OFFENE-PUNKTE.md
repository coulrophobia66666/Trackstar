# Offene Punkte

Stand: 2026-08-04. Code für alle Features unten ist geschrieben, committed
und im Browser client-seitig getestet (Playwright, siehe Testprotokoll
unten).

## ⚠️ NEU: Pro-Upgrade-Rabatt für Credits-Kunden – 2 manuelle Schritte (Malik)
Wer schon Credits gekauft hat und danach zu Pro wechselt, bekommt automatisch
einen pauschalen Rabatt auf die erste Pro-Zahlung (kein Verrechnen von
Rest-Credits, bewusst einfach gehalten). Damit das greift:

1. **D1-Spalte nachziehen** (die Datenbank existiert schon, `CREATE TABLE`
   legt die neue Spalte nicht automatisch nach): im D1-Dashboard →
   `overhertz-db` → Console →
   ```sql
   ALTER TABLE users ADD COLUMN has_bought_credits INTEGER NOT NULL DEFAULT 0;
   ```
   einmalig ausführen.
2. **Stripe-Coupon anlegen** (im selben Stripe-Konto/Modus wie die Produkte!):
   Produktkatalog → Gutscheine → neuer Coupon, z. B. „5 € Rabatt", Dauer
   **„Einmalig"** (wichtig – sonst gilt der Rabatt auch für spätere
   Verlängerungen). Die erzeugte Coupon-ID als Klartext-Variable
   `STRIPE_COUPON_CREDITS_UPGRADE` im Worker eintragen. Ohne diese Variable
   passiert einfach nichts (kein Rabatt, aber auch kein Fehler) – kann also
   auch später nachgezogen werden.

## ✅ Zahlungssystem ist live (Stand 04.08., Testmodus)
D1, Stripe Checkout (Credits/Pro/Pro jährlich) und der Webhook sind
eingerichtet und mit einem echten Testkauf (Stripe-Testkarte 4242...)
durchgespielt – Credits kommen nach Kauf korrekt im Konto an. Zwei
Stolperfallen für später (falls das Setup nochmal neu gemacht werden muss,
z. B. beim Umstieg auf Live-Zahlungen):
- **Stripe hat getrennte "Konten"**: die normale Kontoansicht mit
  Testmodus-Umschalter ist NICHT dasselbe wie ein separates "Sandbox"-Konto
  (falls eins existiert) – Produkte/Preise/Webhooks müssen alle im selben
  Konto+Modus liegen wie der `STRIPE_SECRET_KEY`, sonst "No such price" /
  "No such customer".
- **Webhooks sind pro Modus getrennt**: ein im Live-Modus angelegter Webhook
  feuert nicht bei Testmodus-Zahlungen (und umgekehrt) – im Zweifel unter
  Workbench → Webhooks auf "Import" prüfen, ob ein bestehender Webhook aus
  dem jeweils anderen Modus importiert werden kann, statt neu anzulegen.

Beim Umstieg auf **Live-Zahlungen** (echtes Geld) müssen Produkte, Preise,
Webhook und alle drei `STRIPE_PRICE_*`/`STRIPE_SECRET_KEY`/
`STRIPE_WEBHOOK_SECRET`-Werte im Worker nochmal im **Live-Modus** neu
angelegt/eingetragen werden – das Testmodus-Setup gilt nur fürs Testen.

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

## Englische Version (i18n) – neu in diesem Durchgang
Ganze Seite jetzt zweisprachig (DE/EN): Umschalter oben rechts, Sprache wird
gemerkt (localStorage) und lässt sich per Link direkt setzen
(`index.html?lang=en` bzw. `?lang=de`) – so kann man beide Sprachversionen
unter eigener URL verlinken/veröffentlichen, ohne zwei HTML-Dateien parallel
pflegen zu müssen. Übersetzt: komplette statische UI (Labels, Buttons,
Hinweise) **und** alle dynamisch erzeugten Analyse-Texte (Tipps, Fazit,
Status-Meldungen, Achievements, Einreich-Empfehlungen, Fehlermeldungen).
Getestet per Playwright: Umschalten live und nach Reload, Analyse-Durchlauf
komplett auf Englisch, Pricing-Karte, EQ-Editor-Labels.

**Bewusst NICHT übersetzt: Impressum und Datenschutzerklärung.** Beide
bleiben nur Deutsch – eine automatische/eigene Übersetzung von Rechtstexten
ist ein Haftungsrisiko (Impressumspflicht, DSGVO-Formulierungen), das sollte
wenn dann von einem Anwalt geprüft übersetzt werden, nicht einfach mitgebaut
werden. Steht auch schon so auf der Seite (kleiner Hinweis im Footer, nur im
EN-Modus sichtbar). Bitte auf dem Schirm behalten (Carla), falls eine
englischsprachige Rechtstext-Version für den internationalen Auftritt
irgendwann gebraucht wird.

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

# Offene Punkte

Stand: 2026-08-05. Code für alle Features unten ist geschrieben, committed
und im Browser client-seitig getestet (Playwright, siehe Testprotokoll
unten).

## ✅ NEU (05.08., sechster Durchgang): Wordmark-Logo, Text-Feinschliff
- **Neues Logo im Seitenkopf**: Der quadratische Frequenzlinien-Icon vor
  dem Schriftzug ist raus, stattdessen nur noch "Overhertz" mit einer
  ruhigen, einzelnen Frequenzlinie direkt darunter (statt einer geraden
  Linie) – zurückhaltender, wirkt wie ein Fachlabel statt wie eine App.
  Aus einem frueher gezeigten Logo-Pitch mit drei Konzepten ("Wellenstern",
  "Die Type", "Das Siegel") ausgewaehlt. Favicon/App-Icons bleiben unveraendert
  beim bisherigen Frequenzlinien-Mark, da nur der Seitenkopf gemeint war.
- **Weiterer Text-Feinschliff**: Genre-Hinweis "(wird automatisch geschätzt
  – hier überschreibbar)" komplett entfernt, Songtext-Platzhalter im
  Textfeld weiter gekürzt (endet jetzt nach "Vocals-Check.").

## ✅ NEU (05.08., fünfter Durchgang): Finale Farbpalette
Nach Rückmeldung, dass der bisherige Blau-/Braunton auf Dauer nicht "elegant
Plattenlabel" genug wirkt: Hintergrund von warmem Braunschwarz auf ein
kühleres Navy-Schwarz umgestellt (angelehnt an einen Referenzscreenshot),
zweiter Farbakzent (bisher Blau/Teal) komplett durch Weiß ersetzt – Gold
bleibt wie immer für Branding/Buttons/Logo. Betrifft Hintergrundlinien,
Frequenzband-Spektrogramm im EQ-Editor, Glanzeffekte, Logo-Akzentlinie,
App-Icons/OG-Bild. Auch das Konfetti beim Top-Ergebnis hatte einen
Grünton drin – rausgenommen, jetzt nur noch Gold-Töne. Keine Braun-/
Grüntöne mehr irgendwo im Interface (Rot-Grün-Sehschwäche).

## ✅ NEU (05.08., vierter Durchgang): Album-Check-Akkordeon, EQ-Reihenfolge, Kleinkram
- **Album-Check: volle Tiefenanalyse pro Track.** Jeder Track im
  Album-Check hat jetzt einen "Details & Verbessern"-Button – klappt
  Frequenzchart, alle Tipps und Fazit auf, genau wie bei der Einzelanalyse.
  Kein Zusatz-Credit, ist ja pro Track schon mit dem Album-Check bezahlt.
  Im aufgeklappten Bereich steht auch der volle EQ-Editor zum tatsächlichen
  Bearbeiten (Regler, De-Esser, Lautheit, Download) – für genau diesen
  Track. Immer nur ein Track gleichzeitig offen (Akkordeon), damit die
  Seite bei vielen Tracks nicht endlos lang wird; ein Klick auf einen
  anderen Track klappt den vorherigen automatisch zu. **Ausnahme:**
  KI-Einschätzung und Vocals-Check bleiben Einzeltrack-only, weil der
  Album-Check keine Songtexte pro Track einsammelt – das ist eine bewusste
  Grenze, keine Baustelle.
  Technischer Hinweis: Nach einem Seiten-Reload (z. B. mitten in einem
  Stripe-Checkout) bleiben Frequenzchart/Tipps/Fazit sichtbar, aber die
  Audiodatei selbst ist weg (wie beim Einzeltrack-EQ-Editor nach
  Checkout-Redirect auch) – zum Abspielen/Bearbeiten muss das Album dann
  erneut hochgeladen werden, ein Hinweistext erklärt das an Ort und Stelle.
- **EQ-Editor-Reihenfolge angepasst**: "Vorschlag übernehmen",
  "Zurücksetzen" und "Bearbeitete Version herunterladen" stehen jetzt
  direkt unter Player/Frequenzband (vorher ganz unten nach allen Reglern)
  – dann kommt der De-Esser. Kürzerer Weg zu den wichtigsten Aktionen.
- **Datei-Auswahl-Hinweis**: Bei Handys, die im Datei-Dialog erst nur
  Fotos/Videos anzeigen, steht jetzt ein Hinweistext unter dem
  Datei-Feld ("Dateien"/"Durchsuchen" antippen).
- **Bugfix Album-Check-Persistenz**: Ergebnisse gingen bisher bei jedem
  Reload verloren (z. B. mitten im Stripe-Checkout für ein Pro-Upgrade),
  obwohl die Credits schon verbraucht waren. Überleben jetzt einen Reload.

## ✅ NEU (05.08., dritter Durchgang): PWA, EQ-Editor-Redesign, Farbmix
- **App-Installierbarkeit (PWA)**: Die Seite lässt sich jetzt auf dem Handy/
  Desktop als App-Icon installieren ("Zum Startbildschirm hinzufügen") –
  öffnet dann ohne Browserleiste, fühlt sich wie eine echte App an. Kein
  App-Store nötig. **Android/Chrome**: zeigt oft automatisch einen
  Install-Hinweis, sonst über Browser-Menü → "App installieren".
  **iPhone/Safari**: nur manuell über Teilen-Symbol → "Zum
  Home-Bildschirm" (Apple erlaubt keinen Automatismus). Technisch: neue
  `manifest.json`, ein schlanker Service Worker (`sw.js`, Netzwerk-first
  mit Cache-Fallback – Nutzer bekommen bei bestehender Verbindung immer die
  aktuellste Version), Icons in mehreren Größen. Kein manueller
  Cloudflare-Schritt nötig, funktioniert automatisch mit dem nächsten
  Deploy.
- **EQ-Editor umsortiert**: Play-Button, Frequenzband-Anzeige und
  Seek-Leiste liegen jetzt direkt zusammen oben im Editor statt über die
  Seite verteilt – Abspielen, Scrubben und Anzeige gleichzeitig sichtbar,
  ohne zu scrollen.
- **Neues Frequenzband statt vertikaler Balken**: läuft während der
  Vorschau von links nach rechts (Canvas-Spektrogramm), dunkler
  Hintergrund, metallic Blau je nach Pegel.
- **Farbpalette angepasst**: Auf Hinweis eines Nutzers mit
  Rot-Grün-Sehschwäche (der bisherige Goldton war teils nicht sicher von
  Grün zu unterscheiden) gibt's jetzt zwei bewusst unterscheidbare Akzente
  – Gold bleibt für Buttons/Logo/Branding, ein neuer Blauton für
  Hintergrund-Wash/Glanzeffekte und das neue Frequenzband.

## ✅ NEU (05.08., zweiter Durchgang): Automatischer Flow, Verlauf, Logo zurückgesetzt
- **Vocals-Check läuft jetzt automatisch** direkt nach der Freischaltung, ohne
  Klick und ohne dass ein Songtext eingegeben sein muss – kein Warten mehr auf
  einen Button. Ein "Abbrechen"-Button während des Ladens beendet Download/
  Berechnung wirklich (nicht nur die Anzeige), wichtig für Handy-Nutzer, die
  sich das ~140-MB-Modell sparen wollen. "Erneut transkribieren" bleibt als
  manueller Retry.
- **KI-Einschätzung läuft jetzt automatisch** nach der Freischaltung, ohne
  Klick auf "KI-Einschätzung anzeigen". Mit Songtext läuft sie sofort; **ohne
  Songtext** wartet sie auf das Vocals-Transkript und nutzt es als Basis – die
  KI rekonstruiert zuerst einen wahrscheinlichen Songtext (klar als Schätzung
  gekennzeichnet, kein Fakt) und baut Einordnung/Titel-Ideen/verbesserten Text
  darauf auf. Der Vocals-Vergleich zeigt in diesem Fall die KI-Rekonstruktion
  statt eines echten Songtexts als Referenz, ebenfalls klar markiert.
- **Neu: Ausspracheeinschätzung.** Wenn sowohl echter Songtext als auch
  Vocals-Transkript vorliegen, schätzt die KI zusätzlich ein, ob Abweichungen
  eher an Aussprache/Diktion oder an KI-Gesangs-/ASR-Artefakten liegen.
- **Songtitel ist jetzt Pflichtfeld** (nötig für die Zuordnung im neuen
  Verlauf, siehe unten).
- **Neu: "Meine Checks" (Ergebnis-Verlauf)** im Konto-Bereich. Nach jeder
  freigeschalteten Tiefenanalyse wird das fertige Ergebnis (Titel, Genre,
  Score, Einordnung, Titel-Ideen, verbesserter Songtext, Tipps, Fazit)
  kontogebunden gespeichert – **nie die Audiodatei selbst**, die bleibt wie
  immer nur auf dem Gerät. So kann man die Seite schließen, woanders am Track
  weiterarbeiten und später nachschauen, was noch zu verbessern war. Wird bei
  Konto-Löschung automatisch mitgelöscht. Datenschutzerklärung entsprechend
  ergänzt. **Manueller Schritt nötig, siehe unten.**
- **Logo zurückgesetzt**: auf ausdrücklichen Wunsch wieder das ursprüngliche
  Frequenzlinien-Motiv (drei ineinanderlaufende Linien) statt der Wellenform,
  jetzt klein **über** dem "Overhertz"-Schriftzug statt darunter. Überall
  konsistent: Header, Favicon, App-Icon, Link-Vorschaubild.
- **Bugfix Vocals-Check-Retry**: Ein fehlgeschlagener erster Transkriptions-
  versuch (z. B. Abbruch durch Speicherdruck auf dem Handy) machte den
  Vocals-Check für den Rest der Session komplett unbrauchbar – jeder weitere
  Versuch bekam sofort wieder denselben alten Fehler statt neu zu laden.
  Behoben (Worker wird nach jedem Fehlschlag verworfen und beim nächsten
  Versuch frisch gestartet).

## ✅ D1-Spalten für "Meine Checks" sind live nachgezogen
Die acht neuen Ergebnis-Spalten (`title`, `genre`, `overall_score`,
`classification`, `title_ideas`, `improved_lyrics`, `tips`, `fazit`) auf der
`checks`-Tabelle sind in der Live-D1-Datenbank angelegt. "Meine Checks"
speichert und lädt Ergebnisse jetzt korrekt.

## ⚠️ Datenschutzerklärung: neue Datenverarbeitung seit dem letzten Anwalts-Check
Die "Meine Checks"-Funktion ist eine **neue Datenverarbeitung** (gespeicherte
Analyseergebnisse, kontogebunden), die erst NACH dem Stand kam, den Jeff als
"vom Anwalt final geprüft" bestätigt hat. Der Datenschutztext ist bereits
entsprechend ergänzt (Abschnitt "Gespeicherte Analyseergebnisse"), aber bitte
kurz von Carla gegenchecken lassen, ob das noch unter die bestehende Freigabe
fällt oder eine erneute kurze Prüfung braucht.

## ✅ NEU (05.08.): Rechtliches, Kündigung, Sicherheit, Sharing
- **Dateigrößen-Limit beim Upload**: 100 MB pro Track (Einzel-Check und
  Album-Check), verhindert dass riesige Dateien den Browser beim Decodieren
  zum Absturz bringen. Sauber abgefangene Fehlermeldung, kein Credit-Verbrauch
  bei Ablehnung.
- **Kündigungsbutton** ("Abo verwalten/kündigen"): Pro-Kunden bekommen im
  Konto-Bereich einen Button, der sie zum **Stripe Customer Portal**
  weiterleitet – dort können sie jederzeit kündigen (Abo läuft dann bis zum
  Ende der bezahlten Periode weiter, keine Teilrückerstattung) oder die
  Zahlungsmethode ändern. Ohne aktive Kündigung verlängert sich das Abo
  automatisch. **Manueller Schritt nötig, siehe unten.**
- **AGB-Seite** (`website/agb.html`) und **Widerrufsbelehrung**
  (`website/widerruf.html`) neu gebaut, im Footer verlinkt. **Entwurf,
  noch nicht anwaltlich geprüft** – siehe Rechtstexte-Abschnitt unten.
- **Konto-Löschfunktion** (DSGVO "Recht auf Löschung"): Button im
  Konto-Bereich, löscht nach Bestätigung Nutzer, Sessions, Checks, Ratings
  und Passwort-Reset-Tokens aus D1 und kündigt automatisch ein laufendes
  Stripe-Abo, bevor der Account gelöscht wird.
- **Open-Graph/Twitter-Meta-Tags + Share-Bild**: Links zu overhertz.app
  zeigen jetzt bei WhatsApp/X/Discord/Slack etc. eine Vorschau mit Titel,
  Beschreibung und einem eigens gerendertem 1200×630-Bild
  (`website/og-image.png`).
- **`robots.txt` und `sitemap.xml`** ergänzt für bessere Auffindbarkeit bei
  Google & Co.

## ✅ Erledigt seit dem letzten Stand
- **Domain `overhertz.app` ist verbunden** (Cloudflare Custom Domain am
  `trackstar-web`-Worker) und live erreichbar.
- **"Passwort vergessen"-Funktion gebaut** (D1-Tabelle `password_resets`,
  Worker-Endpunkte, Formulare im Frontend) – siehe nächster Punkt für den
  einen noch fehlenden manuellen Schritt.
- **Logo eingebaut**: eigenes Wellenform-Motiv (`website/logo.svg`, bewusst
  ohne Stern) als Header-Mark, Favicon und Apple-Touch-Icon
  (`apple-touch-icon.png`).
- **Stripe läuft jetzt live** (echtes Geld): Produkte, Preise, Webhook und
  alle Worker-Variablen (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_*`) im Live-Modus neu eingerichtet, mit echtem Testkauf
  (Credits, 7 €) erfolgreich durchgespielt. Der alte `sk_live_...`-Schlüssel
  wurde dabei rotiert (alter Wert ungültig, kein Sicherheitsrisiko mehr).
- **Bewertungs-Pop-up nach Download**: Nach dem Herunterladen der bearbeiteten
  Version (EQ-Editor, Pro-Feature) fragt ein Pop-up nach einer 1-5-Sterne-
  Bewertung + optionalem Kommentar, landet in D1-Tabelle `ratings`.
  D1-Tabelle ist angelegt, Feature ist voll einsatzbereit.
- **D1-Tabelle `password_resets` angelegt** – "Passwort vergessen" erzeugt
  jetzt fehlerfrei Reset-Tokens. Fehlt nur noch der E-Mail-Versand, siehe
  nächster Punkt.

## ⚠️ NEU: Passwort-Reset – E-Mail-Versand fehlt noch (Finn)
Tokens werden erzeugt, aber es wird **keine E-Mail verschickt** (kein Fehler
für den Nutzer, aber auch kein Link bei ihm – der Worker loggt das
serverseitig):
1. Konto bei **resend.com** anlegen (kostenloses Kontingent reicht für
   den Start).
2. Absender-Domain verifizieren: Resend zeigt DNS-Einträge (SPF/DKIM)
   an, die bei `overhertz.app` im Cloudflare-DNS eingetragen werden
   müssen (Cloudflare verwaltet die Domain ja jetzt schon).
3. API-Key erzeugen, als verschlüsseltes Secret `RESEND_API_KEY` im
   Worker hinterlegen (gleiches Vorgehen wie bei `ANTHROPIC_API_KEY`).
4. Klartext-Variable `RESEND_FROM_EMAIL` im Worker setzen, z. B.
   `Overhertz <noreply@overhertz.app>`.
5. Kurzer Test: "Passwort vergessen" mit echter E-Mail durchklicken,
   prüfen ob die Mail ankommt und der Link funktioniert (1 Stunde
   gültig).

## ⚠️ NEU: Stripe Customer Portal aktivieren – manueller Schritt (Finn/Malik)
Der neue Kündigungsbutton ruft die Stripe-Billing-Portal-API auf – die muss
im Stripe-Dashboard einmalig **im Live-Modus** konfiguriert werden, sonst
kommt ein Fehler statt des Portals:
1. Stripe-Dashboard → Einstellungen → **Billing → Customer Portal**
   (bzw. "Kundenportal").
2. Portal aktivieren, erlaubte Aktionen festlegen: mindestens "Abo
   kündigen" (`Cancel subscriptions`) anhaken. Empfehlung: Kündigung zum
   Ende der aktuellen Periode ("At period end"), nicht sofort – passt zu
   dem, was in der AGB steht.
3. Optional: Zahlungsmethode ändern, Rechnungshistorie einsehen ebenfalls
   erlauben (macht das Portal für Kunden nützlicher).
4. Einmal kurz selbst testen: als Pro-Kunde einloggen, "Abo
   verwalten/kündigen" klicken, prüfen ob das Portal aufgeht und eine
   Kündigung tatsächlich durchgeht.

Ohne diesen Schritt bekommt der Nutzer beim Klick auf den Button eine
Fehlermeldung ("Konnte nicht geöffnet werden") statt des Portals.

## ⚠️ Rechtstexte: Anwaltsprüfung (Carla)
**Impressum und Datenschutzerklärung sind laut Jeff jetzt final vom Anwalt
geprüft** ("Anwalt kann jetzt abgehakt werden") – der Prüfen-Hinweis kann
aus `impressum.html`/`datenschutz.html` raus, sobald das nochmal von Carla
gegengecheckt wurde.

**Neu und ausdrücklich noch NICHT anwaltlich geprüft**: `agb.html` und
`widerruf.html` (beide als Entwurf gekennzeichnet, mit Hinweisbox auf der
Seite). Bitte vor breitem kommerziellen Einsatz mitprüfen lassen – gleiche
Prüfung wie damals bei Impressum/Datenschutz.

**Offener Lücke in `widerruf.html` selbst dokumentiert**: Der Passus zum
vorzeitigen Erlöschen des Widerrufsrechts bei digitalen Inhalten setzt eine
ausdrückliche Zustimmungs-Checkbox **vor** Kaufabschluss voraus – die gibt
es im aktuellen Stripe-Checkout-Flow noch nicht. Bis das nachgezogen ist,
gilt sicherheitshalber die volle 14-tägige Frist ohne Einschränkung (steht
so auch auf der Seite). Muss vor dem "richtig scharf stellen" der
Sonderregel noch gebaut werden (Checkbox im Checkout-Vorlauf).

Offene Detailfrage in der Datenschutz-Notiz: ob mit Cloudflare und Anthropic
ein Auftragsverarbeitungsvertrag (AVV) abgeschlossen ist.

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

## Getestet (05.08., Playwright, lokal gegen die Website-Dateien)
- `agb.html`/`widerruf.html` laden fehlerfrei, Footer-Links vorhanden und
  verlinken korrekt.
- OG/Twitter-Meta-Tags stehen im HTML (`og:title`, `og:image`,
  `twitter:card`), `og-image.png` lädt (200, `image/png`).
- `robots.txt`/`sitemap.xml` laden (200).
- Upload einer 101-MB-Testdatei wird sauber mit Fehlermeldung abgelehnt
  ("File is too large (101 MB) – 100 MB maximum."), kein Absturz.
- Konto-Bereich (mit gemocktem eingeloggtem Pro-Nutzer): "Abo
  verwalten/kündigen"- und "Konto löschen"-Button erscheinen, Klick auf
  "Konto löschen" zeigt den Bestätigungsdialog mit korrektem Warntext.
- Keine neuen JavaScript-Fehler im Browser (nur die bekannten, harmlosen
  Google-Fonts-Netzwerkfehler durch die Sandbox-Firewall).
- **Nicht testbar von hier**: der echte Stripe-Portal-Aufruf und die echte
  Konto-Löschung gegen das Live-Backend (kein Zugriff auf Cloudflare/Stripe
  von der Sandbox aus) – bitte einmal live durchklicken.

## Weiterhin offen
- **Das Siegel** als spätere Verifizierungs-Badge-Funktion (eigenes Feature,
  noch nicht gebaut) – das Hauptlogo/Favicon ist erledigt (siehe oben)
- Social-Handles reservieren (Instagram/TikTok/X), Marke „Overhertz" beim
  DPMA anmelden
- Umsatzsteuer-ID in impressum.html ergänzen, falls vorhanden
- Stripe "Zahlungsbeschreibung"/Statement-Descriptor final im Dashboard
  setzen, falls noch nicht geschehen

## Team-Zuordnung (grob)
- Finn: D1/Stripe-Einrichtung (Schritte 1–9 oben), Cloudflare-Rebrand
- Malik: Stripe-Produkte/Preise anlegen, Webhook-Test
- Carla: USt-ID, Anwaltsprüfung, Datenschutz-Feinschliff
- Pia: Marke/Handles, Logo-Einbau
- Timo: Kompletten Kauf-Flow einmal live durchklicken, Feedback zur
  Free-vs-Premium-Balance (zeigt der Free-Teil genug, um zu überzeugen?)

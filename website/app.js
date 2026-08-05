"use strict";

/* ---------- i18n: Sprachumschalter DE/EN ----------
   Statische Texte laufen ueber data-i18n-Attribute im HTML (applyStaticTranslations), alle
   dynamisch generierten Texte (Tipps, Fazit, Status-Meldungen etc.) ueber t(key, vars). Sprache
   wird per ?lang= URL-Parameter, danach localStorage, danach Browsersprache bestimmt - so lassen
   sich beide Sprachversionen unter eigener URL verlinken/veroeffentlichen, ohne zwei HTML-Dateien
   parallel pflegen zu muessen. Rechtstexte (Impressum/Datenschutz) bleiben bewusst nur Deutsch. */

const LANG_KEY = "overhertz_lang";

const I18N = {
  de: {
    pageTitle: "Overhertz – Hat dein Track Star Potential?",
    pageDescription: "Lad deinen Track hoch und finde heraus, ob er Star Potential hat – Kurzcheck gratis, Tiefenanalyse optional.",
    authHeading: "Konto",
    authHint: "Login oder neues Konto anlegen, um Credits/Pro-Abo zu nutzen.",
    loginHeading: "Login",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    loginBtn: "Einloggen",
    registerHeading: "Registrieren",
    passwordHint: "(mind. 8 Zeichen)",
    registerBtn: "Konto erstellen",
    forgotPasswordLink: "Passwort vergessen?",
    backToLoginLink: "Zurück zum Login",
    resetRequestHeading: "Passwort zurücksetzen",
    resetRequestHint: "Gib deine E-Mail ein, wir schicken dir einen Link zum Zurücksetzen.",
    resetRequestBtn: "Link anfordern",
    resetPasswordHeading: "Neues Passwort setzen",
    newPasswordLabel: "Neues Passwort",
    resetPasswordBtn: "Passwort setzen",
    pricingHeading: "Preise",
    pricingHint: "Der Kurzcheck (Ampel-Urteil + größtes Problem) ist immer kostenlos. Für die Tiefenanalyse:",
    planCreditsTitle: "Credits",
    planCreditsUnit: "einmalig",
    planCreditsDesc: "5 Tiefenanalysen, kein Abo",
    planSelectBtn: "Auswählen",
    planProTitle: "Pro",
    planProUnit: "/ Monat",
    planProDesc: "50 Checks/Monat, voller Report, Hook/Titel/Lyrics/Platzierungstipps, Album-Upload",
    planProAnnualTitle: "Pro jährlich",
    planProAnnualUnit: "/ Jahr",
    planProAnnualDesc: "Wie Pro, mit Rabatt im Jahresabo",
    eyebrow: "KI Songcheck",
    subtitle: "Lad deinen Track hoch und finde heraus, ob er Star Potential hat. Der Kurzcheck ist kostenlos.",
    trackLabel: "Dein Track",
    titleLabel: "Songtitel",
    titlePlaceholder: "z. B. Natriumlicht",
    lyricsLabel: "Songtext",
    lyricsOptional: "(optional – für den Hook-Check)",
    lyricsPlaceholder: "Text reinkopieren, dann prüfen wir auch, ob dein Titel in der Hook hängen bleibt…",
    genreLabel: "Genre",
    genreOptional: "(wird automatisch geschätzt – hier überschreibbar)",
    genreGeneral: "Allgemein / kein Genre",
    genreHiphop: "Hip-Hop / Rap",
    genrePop: "Pop",
    genreEdm: "Electronic / EDM",
    genreTechno: "Techno",
    genreRock: "Rock",
    genreMetal: "Metal",
    genreAcoustic: "Akustik / Singer-Songwriter",
    genreReggae: "Reggae",
    genreLatin: "Latin",
    genreJazz: "Jazz",
    genreKlassik: "Klassik",
    genreVolksmusik: "Volksmusik",
    analyzeBtn: "Analyse starten",
    albumHeading: "Album-Check",
    albumHint: "Mehrere Tracks auf einmal prüfen (Kurz-Check: Klangqualität, Lautheit, Frequenzbalance). Teil des Pro-Plans – jeder Track zählt als ein Check von deinem Monats-Kontingent.",
    albumFilesLabel: "Tracks auswählen",
    albumAnalyzeBtn: "Album analysieren",
    heroEyebrow: "Dein Ergebnis",
    shareBtn: "Ergebnis teilen",
    shareText: "Mein Track hat auf Overhertz {stars}/5 Sterne erreicht – „{title}“ ({score}/100). Check deinen Track auch kostenlos:",
    shareCopied: "Link kopiert!",
    unlockTitle: "Willst du wissen, woran's genau liegt – und wie du's behebst?",
    unlockDesc: "Frequenzkurve im Detail, alle Verbesserungstipps und wohin du den Track am besten einreichst.",
    unlockBtn: "Vollanalyse ansehen",
    unlockNote: "5 Credits für 7 € oder Pro-Abo ab 9,50 €/Monat",
    premiumHeading: "Die Tiefenanalyse",
    zoneFacts: "Die Fakten — objektiv gemessen",
    freqBlockHeading: "Frequenzbalance",
    freqBlockHint: "Anteil der Energie je Frequenzband, verglichen mit einem ausgewogenen Referenzbereich (graue Zone).",
    eqHeading: "EQ-Editor",
    eqIntro: "Passe die Frequenzen deines Tracks direkt hier an und hör dir das Ergebnis sofort an. Läuft komplett in deinem Browser, deine Audiodatei verlässt dabei nie dein Gerät.",
    eqLockedHint: "Das Beheben (EQ, De-Esser, Lautheit angleichen, Stille kürzen, Fade-out) ist Teil des Pro-Plans. Die Vollanalyse siehst du auch mit Credits – fürs direkte Bearbeiten hier brauchst du Pro.",
    eqUpgradeBtn: "Auf Pro upgraden",
    eqDeesserToggle: "Zischlaute reduzieren (De-Esser)",
    eqDeesserStrength: "Stärke",
    eqDeesserHint: "Reduziert scharfe Zischlaute (typ. 5–8 kHz) nur dann, wenn sie tatsächlich spitzen – im Gegensatz zu den Reglern oben, die pauschal einen Bereich absenken.",
    eqGainLabel: "Lautheit anpassen",
    eqGainMatchBtn: "Auf Zielwert angleichen",
    eqTrimIntro: "Stille am Anfang entfernen",
    eqFadeout: "Fade-out am Ende hinzufügen",
    eqFadeoutHint: "(Vorschau spielt dann einmalig statt in Schleife)",
    eqLimitsHint: "Clipping und Überkomprimierung lassen sich nachträglich nicht reparieren – das steckt schon fest im Signal. Dafür müsste der Track aus dem unkomprimierten Original neu gemastert werden.",
    eqMetaHint: "Titel/Künstler werden in den Dateinamen und als Tags in die heruntergeladene Datei geschrieben – nützlich, wenn die Metadaten deiner Originaldatei nicht stimmen.",
    eqMetaTitleLabel: "Titel für den Download",
    eqMetaArtistLabel: "Künstler",
    eqMetaArtistHint: "(optional)",
    eqMetaArtistPlaceholder: "Dein Künstlername",
    eqSuggestBtn: "Vorschlag übernehmen",
    eqResetBtn: "Zurücksetzen",
    eqPlayBtn: "▶ Vorschau abspielen",
    eqPlayBtnStop: "⏸ Stop",
    eqDownloadBtn: "Bearbeitete Version herunterladen",
    zoneTips: "Tipps dazu — unsere Einschätzung",
    tipsHeading: "Verbesserungsvorschläge",
    fazitHeading: "Fazit — dein Wegweiser",
    rewriteHeading: "KI-Einschätzung",
    rewriteHint: "Lass dir eine Einordnung, Titel-Ideen und einen verfeinerten Songtext von der KI erstellen – Stil, Sprache und Aussage bleiben erhalten.",
    rewriteBtn: "KI-Einschätzung anzeigen",
    rewriteClassificationHeading: "Einordnung",
    rewriteTitleIdeasHeading: "Titel-Ideen",
    rewriteOutputHeading: "Verbesserter Songtext",
    vocalsHeading: "Vocals-Check",
    vocalsIntro: "Transkribiert die gesungenen Vocals per KI direkt in deinem Browser (Audio verlässt dabei nie dein Gerät) und vergleicht sie mit deinem eingegebenen Songtext – praktisch, um Aussprache-/Text-Artefakte von KI-Gesang (z. B. Suno, Udio) aufzuspüren. Automatische Spracherkennung von Gesang ist selbst fehleranfällig (Autotune, Beat im Hintergrund, Slang) – als Hinweis lesen, nicht als harten Fakt.",
    vocalsChoiceHint: "Lädt einmalig ein KI-Modell (~140 MB) herunter und rechnet direkt auf diesem Gerät – auf dem Handy kann das dauern und Datenvolumen/Akku kosten. Am Laptop/PC läuft's meist schneller.",
    vocalsSkipBtn: "Auf dem Handy bleiben",
    vocalsCheckBtn: "Trotzdem transkribieren",
    vocalsResultHeading: "Textabgleich",
    vocalsTranscriptHeading: "Rohes Transkript",
    vocalsTranscriptHint: "(automatisch, KI-generiert)",
    submitHeading: "Wo einreichen?",
    disclaimer: "Diese Analyse basiert auf automatischer Signalverarbeitung (Frequenzspektrum, Lautheit, Dynamik) sowie einer einfachen Textanalyse deines Songtexts. Sie ersetzt kein professionelles Mastering-Ohr oder A&R-Urteil, gibt dir aber eine schnelle Ersteinschätzung.",
    footerImpressum: "Impressum",
    footerDatenschutz: "Datenschutz",
    footerLegalNote: "",

    statusGood: "Gut",
    statusOk: "Ausbaufähig",
    statusWeak: "Schwach",

    gradeTopTitle: "Star Potential",
    gradeTopDesc: "Richtig stark! Dein Track ist bereit für die große Bühne – so kannst du ihn einreichen.",
    gradeHighTitle: "Fast am Ziel",
    gradeHighDesc: "Du bist auf einem richtig guten Weg – mit ein paar Handgriffen holst du das letzte Stück raus.",
    gradeMidTitle: "Noch Feinschliff nötig",
    gradeMidDesc: "Die Basis stimmt schon – mit den Tipps unten machst du daraus einen echten Kracher.",
    gradeLowTitle: "Baustelle",
    gradeLowDesc: "Der Kern ist da, jetzt geht's ans Feilen – jeder Hit hat mal so angefangen.",

    badgeMissingInfo: "Fehlt Info",
    badgeStrong: "Stark",
    badgeSolid: "Solide",
    badgeNeedsWork: "Ausbaufähig",

    band_subbass: "Sub-Bass",
    band_bass: "Bass",
    band_lowmid: "Low-Mid",
    band_mid: "Mid",
    band_highmid: "High-Mid",
    band_presence: "Presence",
    band_brilliance: "Brillanz",

    tipClipCriticalProblem: "Der Track clippt hörbar ({pct}% der Samples am Limit).",
    tipClipCriticalFix: "Reduziere den Gain vor dem Limiter oder senke das Limiter-Ceiling auf ca. -1 dBTP.",
    tipClipWarningProblem: "Vereinzelte Samples liegen am Limit.",
    tipClipWarningFix: "Für Streaming-Plattformen etwas mehr Headroom lassen (True-Peak-Limiter, Ceiling ca. -1 dBTP).",
    tipCrestLowProblem: "Der Track ist stark überkomprimiert (Crest Factor {db} dB).",
    tipCrestLowDetail: "Das killt Dynamik und wirkt beim Mastering oft müde.",
    tipCrestLowFix: "Etwas lockerer limitieren, damit mehr Dynamik erhalten bleibt.",
    tipCrestHighProblem: "Der Track ist sehr dynamisch (Crest Factor {db} dB).",
    tipCrestHighFix: "Ggf. etwas mehr komprimieren, damit leise Parts auf kleinen Boxen nicht untergehen.",
    tipLoudnessLowProblem: "Der Track ist recht leise (~{db} dB).",
    tipLoudnessLowDetail: "Spotify, Apple Music & Co. normalisieren zwar automatisch auf ein Zielniveau, aber wenn dein Master schon sehr leise angeliefert wird, verlierst du dabei Punch im Vergleich zu lauter gemasterten Tracks in derselben Playlist.",
    tipLoudnessLowFix: "Auf ca. {target} dB zumastern.",
    tipLoudnessHighProblem: "Der Track ist sehr laut ausgesteuert (~{db} dB).",
    tipLoudnessHighDetail: "Streaming-Plattformen wie Spotify (Ziel ca. -14 LUFS) und YouTube normalisieren automatisch nach unten.",
    tipLoudnessHighFix: "Beim Mastern nicht zusätzlich lauter fahren - die Extra-Lautheit wird eh weggenormalisiert, kostet nur Dynamik.",
    tipIntroSilenceProblem: "Der Track startet mit ca. {sec} Sekunden Stille.",
    tipIntroSilenceDetail: "Auf Playlists/Radio, wo Tracks oft direkt ineinander übergehen, kann das wie ein Fehler wirken oder Hörer verlieren, bevor überhaupt was passiert.",
    tipIntroSilenceFix: "Stille am Anfang kürzen oder direkt mit Sound starten.",
    tipOutroAbruptProblem: "Der Track endet abrupt/hart, ohne Fade-out oder klaren Schluss.",
    tipOutroAbruptDetail: "Für saubere Übergänge (Playlists, DJ-Sets, Radio) wirkt das professioneller.",
    tipOutroAbruptFix: "Ein bewusstes Ende setzen oder ein kurzes Fade-out einbauen.",
    tipFreqOffBandsProblem: "Frequenzbalance weicht in {count} {unit} vom Referenzbereich ab ({bands}).",
    tipFreqOffBandsFix: "Nutze den EQ-Editor weiter unten – dort ist schon ein Vorschlag aus dieser Analyse vorausgefüllt, du kannst live reinhören und direkt anpassen.",
    tipFreqUnitSingular: "Bereich",
    tipFreqUnitPlural: "Bereichen",
    tipBandTooLow: "{band} (zu wenig)",
    tipBandTooHigh: "{band} (zu viel)",
    tipNoLyricsProblem: "Kein Songtext eingegeben – Hook- und Songtitel-Erkennbarkeit konnten nicht geprüft werden.",
    tipNoLyricsFix: "Songtext ergänzen, dann können Hook & Songtitel mitbewertet werden.",
    tipHookWeakProblem: "Im Text ist keine klar wiederholte Hookline erkennbar.",
    tipHookWeakDetail: "Das erhöht den Wiedererkennungswert.",
    tipHookWeakFix: "Eine Zeile (idealerweise mit dem Songtitel) 2–3x wiederholen, um eine klare Hook zu schaffen.",
    tipTitleMissingProblem: "Der Songtitel taucht im Text gar nicht auf.",
    tipTitleMissingDetail: "Hörer erinnern sich deutlich leichter, wenn der Titel tatsächlich gesungen wird.",
    tipTitleMissingFix: "Den Songtitel tatsächlich im Text singen/erwähnen.",
    tipTitleNotInHookProblem: "Der Songtitel kommt zwar im Text vor, aber nicht in der Hook.",
    tipTitleNotInHookDetail: "Das stärkt den Wiedererkennungswert.",
    tipTitleNotInHookFix: "Den Titel in die am häufigsten wiederholte Zeile (Hook) holen.",
    tipAllGood: "Keine größeren technischen oder inhaltlichen Auffälligkeiten gefunden – solide Basis.",

    fazitIntroGood: "Dein Track steht technisch und inhaltlich solide da (Score {score}/100).",
    fazitIntroMid: "Dein Track hat eine gute Basis, aber noch Luft nach oben (Score {score}/100).",
    fazitIntroLow: "Dein Track braucht vor einer Einreichung noch Arbeit (Score {score}/100).",
    fazitStepsIntro: "So gehst du vor, der Reihe nach:",
    fazitClosingSteps: "Arbeite die Punkte einfach von oben nach unten ab, dann bist du dem einreichfertigen Ergebnis jedes Mal ein Stück näher – dein Fahrplan, kein Grund zur Sorge.",
    fazitClosingDone: "Keine größeren offenen Punkte – dein Track ist bereit für die Einreichung.",

    achClean: "Kristallklar",
    achOnTarget: "Punktgenau",
    achHook: "Hook sitzt",
    achBalanced: "Ausgewogen",
    achRecognizable: "Wiedererkennbar",

    streakFirst: "✦ Dein erster Check auf Overhertz – willkommen!",
    streakN: "🔥 Das ist bereits dein {n}. Check auf Overhertz!",

    submitGrooverName: "Groover",
    submitGrooverReasonReady: "Score {score}/100{genreSuffix} ist stark genug, um bezahltes Kuratoren-Feedback wirklich auszunutzen.",
    submitGrooverReasonNotReady: "Bei {score}/100 lohnt sich das bezahlte Feedback erst, nachdem die Tipps oben umgesetzt sind – sonst zahlst du für Hinweise, die du hier schon kostenlos hast.",
    submitHubName: "SubmitHub",
    submitHubReasonGenre: "Kuratoren lassen sich dort nach Genre filtern – für {genre} findest du gezielt passende.",
    submitHubReasonNoGenre: "Kuratoren lassen sich dort nach Genre filtern, sobald eins feststeht (oben im Formular wählbar).",
    submitMusoSoupName: "MusoSoup",
    submitMusoSoupReason: "Guter Zweitkanal parallel zu SubmitHub – andere Kuratoren-Datenbank, kostet nichts extra, sich bei beiden einzutragen.",
    submitSpotifyName: "Spotify for Artists – Playlist-Einreichung",
    submitSpotifyReasonReady: "Bei {score}/100 realistische Chance auf redaktionelle Playlists – kostet nichts, unbedingt mitnehmen.",
    submitSpotifyReasonMid: "Bei {score}/100 ist die Chance auf redaktionelle Playlists noch begrenzt, aber die Einreichung ist kostenlos – schadet nicht, auch parallel an den Tipps oben zu arbeiten.",
    submitSpotifyReasonLow: "Bei {score}/100 realistisch eher nicht – Einreichung ist zwar kostenlos, aber die Tipps oben zuerst umsetzen erhöht die Chancen deutlich.",
    submitNoteReady: "Der technische und inhaltliche Score ist solide ({score}/100){genreSuffix} – eine Einreichung ist aus heutiger Sicht realistisch.",
    submitNoteMid: "Der Track ist einreichbar ({score}/100){genreSuffix}, hat aber noch Luft nach oben – die Verbesserungsvorschläge oben zuerst umsetzen erhöht die Chancen.",
    submitNoteLow: "Vor einer Einreichung (aktuell {score}/100{genreSuffix}) lohnt es sich, erst die wichtigsten Verbesserungsvorschläge oben umzusetzen.",

    meterTechnik: "Klangqualität / Sauberkeit",
    meterLautheit: "Lautheit / Star-Potential",
    meterFrequenz: "Frequenzbalance",
    meterHook: "Hook",
    meterTitel: "Songtitel erkennbar",
    meterLyricsMissing: "Songtext fehlt",
    meterTitleMissing: "Songtitel fehlt",
    badgeSound: "Sound",
    badgeStarPotential: "Star-Potential",
    badgeHook: "Hook",
    teaserProblem: "Größtes Problem",
    teaserStrength: "Stärke",

    detectedGenreAuto: "Automatisch erkannt: {genre}{bpm} (Schätzung anhand Tempo, Klangfarbe & Bassanteil – oben im Formular korrigierbar).",
    detectedGenreBpmOnly: "Tempo gemessen: ~{bpm} BPM. Genre nicht eindeutig automatisch bestimmbar – oben im Formular manuell wählen für passendere Referenzwerte.",

    rewriteNotConfigured: "Diese Funktion ist noch nicht eingerichtet (Backend fehlt noch).",
    rewriteLoading: "KI erstellt Einordnung, Titel-Ideen und verfeinerten Text…",
    rewriteNoClassification: "Keine Einordnung erhalten.",
    rewriteError: "Fehler: {msg}",
    unknownError: "Unbekannter Fehler.",
    kiRequestUnknownError: "Unbekannter Fehler bei der KI-Anfrage.",

    unlockNeedLogin: "Bitte zuerst einloggen oder registrieren, um die Vollanalyse freizuschalten.",
    unlockNoCredits: "Keine Credits mehr übrig – wähle ein Paket, um die Vollanalyse freizuschalten.",

    statusLoadingAudio: "Lade Audio…",
    statusDecoding: "Decodiere Audio…",
    statusAnalyzing: "Analysiere Frequenzen, Lautheit & Genre…",
    statusAnalyzeFailed: "Analyse fehlgeschlagen: {msg}",

    accountLoginRegisterBtn: "Login / Registrieren",
    accountLogoutBtn: "Abmelden",
    accountFreePlanLabel: "Free",
    accountProLabel: "Pro",
    accountProAnnualLabel: "Pro (jährlich)",
    accountChecksThisMonth: "{remaining}/{quota} Checks diesen Monat",
    accountCreditsOne: "{n} Credit",
    accountCreditsMany: "{n} Credits",

    authLoggingIn: "Einloggen…",
    authLoginFailed: "Login fehlgeschlagen.",
    authRegistering: "Konto wird erstellt…",
    authRegisterFailed: "Registrierung fehlgeschlagen.",
    authPleaseLoginFirst: "Bitte zuerst einloggen oder registrieren.",
    resetRequestSending: "Wird angefordert…",
    resetRequestFailed: "Anfrage fehlgeschlagen.",
    resetPasswordSetting: "Wird gesetzt…",
    resetPasswordFailed: "Zurücksetzen fehlgeschlagen.",
    resetPasswordSuccess: "Neues Passwort gesetzt, du bist eingeloggt.",

    pricingRedirecting: "Weiterleitung zur Zahlung…",
    pricingFailed: "Zahlung konnte nicht gestartet werden.",
    serverUnreachable: "Server nicht erreichbar.",

    eqGainMatched: "Lautheit an Zielwert angeglichen.",
    eqSuggestionApplied: "Vorschlag aus der Analyse übernommen.",
    eqResetDone: "Zurückgesetzt.",
    eqNeedTrackFirst: "Bitte zuerst einen Track analysieren.",
    eqPreviewPlaying: "Vorschau läuft (in Schleife) – Slider bewegen für Live-Vergleich.",
    eqPreviewFailed: "Vorschau fehlgeschlagen: {msg}",
    eqRendering: "Bearbeitete Version wird gerendert…",
    eqDownloadStarted: "Download gestartet.",
    eqRenderFailed: "Rendern fehlgeschlagen: {msg}",
    eqEditorProOnlyMsg: "Das Beheben (EQ-Editor, De-Esser) ist Teil des Pro-Plans.",

    vocalsSkipMsg: "Kein Problem – lässt sich jederzeit später (z. B. am Laptop) nachholen.",
    vocalsNoAudio: "Kein Audio verfügbar – bitte Track erneut analysieren.",
    vocalsNoLyrics: "Kein Songtext eingegeben – nichts zum Abgleichen.",
    vocalsLoadingModel: "Lade Transkriptions-Modell (einmalig, danach gecacht)…",
    vocalsLoadingModelProgress: "Lade Transkriptions-Modell… {pct}%",
    vocalsPreparingAudio: "Bereite Audio auf (16kHz Mono)…",
    vocalsTranscribing: "Transkribiere Vocals (kann bei längeren Tracks etwas dauern)…",
    vocalsNoUsableTranscript: "Keine verwertbare Transkription erhalten (evtl. sehr leiser/instrumentaler Track).",
    vocalsFailed: "Transkription fehlgeschlagen: {msg}",
    vocalsNoLyricsForCompare: "Kein Songtext zum Abgleich vorhanden.",
    vocalsSummaryHigh: "{pct}% deines Songtexts finden sich im automatischen Vocal-Transkript wieder – kein Hinweis auf grobe Aussprache-Artefakte.",
    vocalsSummaryMid: "{pct}% deines Songtexts finden sich im Transkript wieder. Die markierten Stellen unten kommen im Gesang anders/unklar rüber – kann an der KI-Aussprache liegen, kann aber auch ein Transkriptionsfehler sein (bei Gesang normal).",
    vocalsSummaryLow: "Nur {pct}% deines Songtexts finden sich im Transkript wieder. Entweder hat die Spracherkennung hier größere Probleme (Autotune, Beat, Slang), oder die Vocals weichen stark vom Text ab – lohnt sich, dir das Rohtranskript unten anzuhören/anzusehen.",
    vocalsNoText: "(kein Text)",

    albumNeedFile: "Bitte mindestens einen Track auswählen.",
    albumNeedLogin: "Bitte zuerst einloggen oder registrieren.",
    albumProOnly: "Album-Check ist Teil des Pro-Plans.",
    albumChecking: "Track {i}/{total}: „{name}“ wird geprüft…",
    albumQuotaExhausted: "Kontingent aufgebraucht bei Track {i}/{total} ({err}).",
    albumNoChecksLeft: "keine Checks mehr übrig",
    albumTrackError: "Fehler: {msg}",
    albumAnalysisFailed: "Analyse fehlgeschlagen.",

    checkoutProcessing: "Zahlung wird verarbeitet…",
    checkoutStillProcessing: "Zahlung wird noch verarbeitet ({err}) – gleich nochmal auf 'Vollanalyse ansehen' klicken.",
    checkoutPleaseWait: "bitte kurz warten",

    freqRefZoneTitle: "Referenzbereich: {lo}–{hi}%",
    freqBarTitle: "{name}: {val}% (Referenz {lo}–{hi}%)",
  },
  en: {
    pageTitle: "Overhertz – Does Your Track Have Star Potential?",
    pageDescription: "Upload your track and find out if it has star potential – free quick check, in-depth analysis optional.",
    authHeading: "Account",
    authHint: "Log in or create an account to use Credits/Pro plan.",
    loginHeading: "Log in",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginBtn: "Log in",
    registerHeading: "Sign up",
    passwordHint: "(min. 8 characters)",
    registerBtn: "Create account",
    forgotPasswordLink: "Forgot password?",
    backToLoginLink: "Back to login",
    resetRequestHeading: "Reset password",
    resetRequestHint: "Enter your email and we'll send you a reset link.",
    resetRequestBtn: "Request link",
    resetPasswordHeading: "Set new password",
    newPasswordLabel: "New password",
    resetPasswordBtn: "Set password",
    pricingHeading: "Pricing",
    pricingHint: "The quick check (traffic-light verdict + biggest problem) is always free. For the in-depth analysis:",
    planCreditsTitle: "Credits",
    planCreditsUnit: "one-time",
    planCreditsDesc: "5 in-depth analyses, no subscription",
    planSelectBtn: "Select",
    planProTitle: "Pro",
    planProUnit: "/ month",
    planProDesc: "50 checks/month, full report, hook/title/lyrics/placement tips, album upload",
    planProAnnualTitle: "Pro annual",
    planProAnnualUnit: "/ year",
    planProAnnualDesc: "Same as Pro, discounted annual plan",
    eyebrow: "AI Song Check",
    subtitle: "Upload your track and find out if it has star potential. The quick check is free.",
    trackLabel: "Your track",
    titleLabel: "Song title",
    titlePlaceholder: "e.g. Sodium Light",
    lyricsLabel: "Lyrics",
    lyricsOptional: "(optional – for the hook check)",
    lyricsPlaceholder: "Paste your lyrics here, and we'll also check whether your title sticks in the hook…",
    genreLabel: "Genre",
    genreOptional: "(auto-detected – can be overridden here)",
    genreGeneral: "General / no genre",
    genreHiphop: "Hip-Hop / Rap",
    genrePop: "Pop",
    genreEdm: "Electronic / EDM",
    genreTechno: "Techno",
    genreRock: "Rock",
    genreMetal: "Metal",
    genreAcoustic: "Acoustic / Singer-Songwriter",
    genreReggae: "Reggae",
    genreLatin: "Latin",
    genreJazz: "Jazz",
    genreKlassik: "Classical",
    genreVolksmusik: "Folk / Traditional",
    analyzeBtn: "Start analysis",
    albumHeading: "Album check",
    albumHint: "Check multiple tracks at once (quick check: sound quality, loudness, frequency balance). Part of the Pro plan – each track counts as one check from your monthly quota.",
    albumFilesLabel: "Select tracks",
    albumAnalyzeBtn: "Analyze album",
    heroEyebrow: "Your result",
    shareBtn: "Share result",
    shareText: "My track scored {stars}/5 stars on Overhertz – “{title}” ({score}/100). Check your track for free too:",
    shareCopied: "Link copied!",
    unlockTitle: "Want to know exactly what's wrong – and how to fix it?",
    unlockDesc: "Detailed frequency curve, all improvement tips, and where best to submit your track.",
    unlockBtn: "View full analysis",
    unlockNote: "5 credits for €7 or Pro plan from €9.50/month",
    premiumHeading: "The in-depth analysis",
    zoneFacts: "The facts — objectively measured",
    freqBlockHeading: "Frequency balance",
    freqBlockHint: "Share of energy per frequency band, compared with a balanced reference range (grey zone).",
    eqHeading: "EQ editor",
    eqIntro: "Adjust your track's frequencies right here and hear the result instantly. Runs entirely in your browser, your audio file never leaves your device.",
    eqLockedHint: "Fixing things (EQ, de-esser, loudness matching, trimming silence, fade-out) is part of the Pro plan. You can see the full analysis with Credits too – editing directly here needs Pro.",
    eqUpgradeBtn: "Upgrade to Pro",
    eqDeesserToggle: "Reduce sibilance (de-esser)",
    eqDeesserStrength: "Strength",
    eqDeesserHint: "Reduces sharp sibilance (typ. 5–8 kHz) only when it actually spikes – unlike the sliders above, which flatly lower a whole range.",
    eqGainLabel: "Adjust loudness",
    eqGainMatchBtn: "Match to target",
    eqTrimIntro: "Remove silence at the start",
    eqFadeout: "Add fade-out at the end",
    eqFadeoutHint: "(preview then plays once instead of looping)",
    eqLimitsHint: "Clipping and over-compression can't be fixed after the fact – they're already baked into the signal. That would require remastering from the uncompressed original.",
    eqMetaHint: "Title/artist get written into the file name and as tags in the downloaded file – useful when your original file's metadata is wrong.",
    eqMetaTitleLabel: "Title for the download",
    eqMetaArtistLabel: "Artist",
    eqMetaArtistHint: "(optional)",
    eqMetaArtistPlaceholder: "Your artist name",
    eqSuggestBtn: "Apply suggestion",
    eqResetBtn: "Reset",
    eqPlayBtn: "▶ Play preview",
    eqPlayBtnStop: "⏸ Stop",
    eqDownloadBtn: "Download edited version",
    zoneTips: "Tips on this — our assessment",
    tipsHeading: "Improvement suggestions",
    fazitHeading: "Summary — your roadmap",
    rewriteHeading: "AI assessment",
    rewriteHint: "Get an assessment, title ideas, and a refined lyric version from the AI – style, language, and meaning are preserved.",
    rewriteBtn: "Show AI assessment",
    rewriteClassificationHeading: "Assessment",
    rewriteTitleIdeasHeading: "Title ideas",
    rewriteOutputHeading: "Improved lyrics",
    vocalsHeading: "Vocals check",
    vocalsIntro: "Transcribes the sung vocals via AI directly in your browser (audio never leaves your device) and compares them with the lyrics you entered – useful for spotting pronunciation/text artifacts from AI vocals (e.g. Suno, Udio). Automatic speech recognition on singing is itself error-prone (autotune, background beat, slang) – read it as a hint, not a hard fact.",
    vocalsChoiceHint: "Downloads an AI model (~140 MB) once and runs it right on this device – on mobile this can take a while and cost data/battery. Usually faster on laptop/desktop.",
    vocalsSkipBtn: "Stay on mobile",
    vocalsCheckBtn: "Transcribe anyway",
    vocalsResultHeading: "Lyrics comparison",
    vocalsTranscriptHeading: "Raw transcript",
    vocalsTranscriptHint: "(automatic, AI-generated)",
    submitHeading: "Where to submit?",
    disclaimer: "This analysis is based on automatic signal processing (frequency spectrum, loudness, dynamics) plus a simple text analysis of your lyrics. It doesn't replace a professional mastering ear or A&R judgment, but gives you a quick first assessment.",
    footerImpressum: "Legal notice",
    footerDatenschutz: "Privacy policy",
    footerLegalNote: "(legally binding version: German only)",

    statusGood: "Good",
    statusOk: "Needs work",
    statusWeak: "Weak",

    gradeTopTitle: "Star Potential",
    gradeTopDesc: "Really strong! Your track is ready for the big stage – here's how to submit it.",
    gradeHighTitle: "Almost there",
    gradeHighDesc: "You're on a really good path – a few tweaks and you'll get that last bit out.",
    gradeMidTitle: "Needs some polish",
    gradeMidDesc: "The foundation is solid – with the tips below you'll turn this into a real banger.",
    gradeLowTitle: "Work in progress",
    gradeLowDesc: "The core is there, now it's time to refine – every hit started somewhere.",

    badgeMissingInfo: "Missing info",
    badgeStrong: "Strong",
    badgeSolid: "Solid",
    badgeNeedsWork: "Needs work",

    band_subbass: "Sub-Bass",
    band_bass: "Bass",
    band_lowmid: "Low-Mid",
    band_mid: "Mid",
    band_highmid: "High-Mid",
    band_presence: "Presence",
    band_brilliance: "Air",

    tipClipCriticalProblem: "The track audibly clips ({pct}% of samples at the limit).",
    tipClipCriticalFix: "Reduce the gain before the limiter or lower the limiter ceiling to about -1 dBTP.",
    tipClipWarningProblem: "A few isolated samples sit right at the limit.",
    tipClipWarningFix: "Leave a bit more headroom for streaming platforms (true-peak limiter, ceiling around -1 dBTP).",
    tipCrestLowProblem: "The track is heavily over-compressed (crest factor {db} dB).",
    tipCrestLowDetail: "This kills dynamics and often sounds tired after mastering.",
    tipCrestLowFix: "Limit a bit more loosely so more dynamics survive.",
    tipCrestHighProblem: "The track is very dynamic (crest factor {db} dB).",
    tipCrestHighFix: "Consider compressing a bit more so quiet parts don't disappear on small speakers.",
    tipLoudnessLowProblem: "The track is quite quiet (~{db} dB).",
    tipLoudnessLowDetail: "Spotify, Apple Music & co. do normalize automatically to a target level, but if your master arrives very quiet to begin with, you lose punch compared to louder-mastered tracks in the same playlist.",
    tipLoudnessLowFix: "Master up to about {target} dB.",
    tipLoudnessHighProblem: "The track is driven very loud (~{db} dB).",
    tipLoudnessHighDetail: "Streaming platforms like Spotify (target around -14 LUFS) and YouTube normalize downward automatically.",
    tipLoudnessHighFix: "Don't push it louder during mastering – the extra loudness gets normalized away anyway and only costs you dynamics.",
    tipIntroSilenceProblem: "The track starts with about {sec} seconds of silence.",
    tipIntroSilenceDetail: "On playlists/radio, where tracks often flow directly into each other, this can look like an error or lose listeners before anything even happens.",
    tipIntroSilenceFix: "Trim the silence at the start or start right with sound.",
    tipOutroAbruptProblem: "The track ends abruptly/hard, without a fade-out or clear ending.",
    tipOutroAbruptDetail: "For clean transitions (playlists, DJ sets, radio), that looks more professional.",
    tipOutroAbruptFix: "Set a deliberate ending or add a short fade-out.",
    tipFreqOffBandsProblem: "Frequency balance is off in {count} {unit} from the reference range ({bands}).",
    tipFreqOffBandsFix: "Use the EQ editor further down – a suggestion from this analysis is already pre-filled there, you can listen live and adjust directly.",
    tipFreqUnitSingular: "area",
    tipFreqUnitPlural: "areas",
    tipBandTooLow: "{band} (too little)",
    tipBandTooHigh: "{band} (too much)",
    tipNoLyricsProblem: "No lyrics entered – hook and song-title recognizability couldn't be checked.",
    tipNoLyricsFix: "Add lyrics so the hook and song title can be scored too.",
    tipHookWeakProblem: "No clearly repeated hook line is recognizable in the lyrics.",
    tipHookWeakDetail: "This boosts memorability.",
    tipHookWeakFix: "Repeat one line (ideally containing the song title) 2–3 times to create a clear hook.",
    tipTitleMissingProblem: "The song title doesn't appear in the lyrics at all.",
    tipTitleMissingDetail: "Listeners remember much more easily when the title is actually sung.",
    tipTitleMissingFix: "Actually sing/mention the song title in the lyrics.",
    tipTitleNotInHookProblem: "The song title appears in the lyrics, but not in the hook.",
    tipTitleNotInHookDetail: "This strengthens memorability.",
    tipTitleNotInHookFix: "Move the title into the most frequently repeated line (the hook).",
    tipAllGood: "No major technical or content issues found – solid foundation.",

    fazitIntroGood: "Your track is technically and content-wise solid (score {score}/100).",
    fazitIntroMid: "Your track has a good foundation, but still room to grow (score {score}/100).",
    fazitIntroLow: "Your track needs more work before submitting (score {score}/100).",
    fazitStepsIntro: "Here's how to proceed, step by step:",
    fazitClosingSteps: "Just work through the points from top to bottom, and you'll get a step closer to submission-ready each time – your roadmap, nothing to worry about.",
    fazitClosingDone: "No major open points – your track is ready for submission.",

    achClean: "Crystal clear",
    achOnTarget: "Right on target",
    achHook: "Hook lands",
    achBalanced: "Balanced",
    achRecognizable: "Recognizable",

    streakFirst: "✦ Your first check on Overhertz – welcome!",
    streakN: "🔥 This is already check #{n} on Overhertz!",

    submitGrooverName: "Groover",
    submitGrooverReasonReady: "A score of {score}/100{genreSuffix} is strong enough to really make paid curator feedback worth it.",
    submitGrooverReasonNotReady: "At {score}/100, paid feedback is only worth it once you've applied the tips above – otherwise you're paying for pointers you already have here for free.",
    submitHubName: "SubmitHub",
    submitHubReasonGenre: "Curators there can be filtered by genre – for {genre} you'll find a good match.",
    submitHubReasonNoGenre: "Curators there can be filtered by genre once one is set (selectable in the form above).",
    submitMusoSoupName: "MusoSoup",
    submitMusoSoupReason: "A good second channel alongside SubmitHub – a different curator database, and it costs nothing extra to sign up for both.",
    submitSpotifyName: "Spotify for Artists – Playlist Submission",
    submitSpotifyReasonReady: "At {score}/100 you have a realistic shot at editorial playlists – costs nothing, definitely worth it.",
    submitSpotifyReasonMid: "At {score}/100 your odds for editorial playlists are still limited, but submitting is free – doesn't hurt to work on the tips above in parallel.",
    submitSpotifyReasonLow: "At {score}/100 realistically unlikely – submission is free, but applying the tips above first significantly improves your odds.",
    submitNoteReady: "The technical and content score is solid ({score}/100){genreSuffix} – submitting looks realistic at this point.",
    submitNoteMid: "The track is submittable ({score}/100){genreSuffix}, but still has room to grow – applying the improvement tips above first increases your odds.",
    submitNoteLow: "Before submitting (currently {score}/100{genreSuffix}), it's worth applying the most important improvement tips above first.",

    meterTechnik: "Sound quality / cleanliness",
    meterLautheit: "Loudness / star potential",
    meterFrequenz: "Frequency balance",
    meterHook: "Hook",
    meterTitel: "Song title recognizable",
    meterLyricsMissing: "Lyrics missing",
    meterTitleMissing: "Song title missing",
    badgeSound: "Sound",
    badgeStarPotential: "Star potential",
    badgeHook: "Hook",
    teaserProblem: "Biggest problem",
    teaserStrength: "Strength",

    detectedGenreAuto: "Auto-detected: {genre}{bpm} (estimate based on tempo, tone, and bass ratio – adjustable in the form above).",
    detectedGenreBpmOnly: "Tempo measured: ~{bpm} BPM. Genre couldn't be determined automatically with confidence – select manually in the form above for more accurate reference values.",

    rewriteNotConfigured: "This feature isn't set up yet (backend missing).",
    rewriteLoading: "AI is creating an assessment, title ideas, and a refined lyric version…",
    rewriteNoClassification: "No assessment received.",
    rewriteError: "Error: {msg}",
    unknownError: "Unknown error.",
    kiRequestUnknownError: "Unknown error during the AI request.",

    unlockNeedLogin: "Please log in or register first to unlock the full analysis.",
    unlockNoCredits: "No credits left – choose a plan to unlock the full analysis.",

    statusLoadingAudio: "Loading audio…",
    statusDecoding: "Decoding audio…",
    statusAnalyzing: "Analyzing frequencies, loudness & genre…",
    statusAnalyzeFailed: "Analysis failed: {msg}",

    accountLoginRegisterBtn: "Log in / Sign up",
    accountLogoutBtn: "Log out",
    accountFreePlanLabel: "Free",
    accountProLabel: "Pro",
    accountProAnnualLabel: "Pro (annual)",
    accountChecksThisMonth: "{remaining}/{quota} checks this month",
    accountCreditsOne: "{n} credit",
    accountCreditsMany: "{n} credits",

    authLoggingIn: "Logging in…",
    authLoginFailed: "Login failed.",
    authRegistering: "Creating account…",
    authRegisterFailed: "Registration failed.",
    authPleaseLoginFirst: "Please log in or register first.",
    resetRequestSending: "Requesting…",
    resetRequestFailed: "Request failed.",
    resetPasswordSetting: "Setting…",
    resetPasswordFailed: "Reset failed.",
    resetPasswordSuccess: "New password set, you're logged in.",

    pricingRedirecting: "Redirecting to payment…",
    pricingFailed: "Payment couldn't be started.",
    serverUnreachable: "Server unreachable.",

    eqGainMatched: "Loudness matched to target.",
    eqSuggestionApplied: "Suggestion from the analysis applied.",
    eqResetDone: "Reset.",
    eqNeedTrackFirst: "Please analyze a track first.",
    eqPreviewPlaying: "Preview playing (looping) – move the sliders for a live comparison.",
    eqPreviewFailed: "Preview failed: {msg}",
    eqRendering: "Rendering edited version…",
    eqDownloadStarted: "Download started.",
    eqRenderFailed: "Rendering failed: {msg}",
    eqEditorProOnlyMsg: "Fixing things (EQ editor, de-esser) is part of the Pro plan.",

    vocalsSkipMsg: "No problem – you can do this later (e.g. on a laptop).",
    vocalsNoAudio: "No audio available – please analyze the track again.",
    vocalsNoLyrics: "No lyrics entered – nothing to compare.",
    vocalsLoadingModel: "Loading transcription model (one-time, then cached)…",
    vocalsLoadingModelProgress: "Loading transcription model… {pct}%",
    vocalsPreparingAudio: "Preparing audio (16kHz mono)…",
    vocalsTranscribing: "Transcribing vocals (can take a while for longer tracks)…",
    vocalsNoUsableTranscript: "No usable transcription received (maybe a very quiet/instrumental track).",
    vocalsFailed: "Transcription failed: {msg}",
    vocalsNoLyricsForCompare: "No lyrics available to compare.",
    vocalsSummaryHigh: "{pct}% of your lyrics show up in the automatic vocal transcript – no sign of major pronunciation artifacts.",
    vocalsSummaryMid: "{pct}% of your lyrics show up in the transcript. The highlighted spots below come across differently/unclearly in the vocals – could be the AI pronunciation, but could also just be a transcription error (normal for singing).",
    vocalsSummaryLow: "Only {pct}% of your lyrics show up in the transcript. Either speech recognition is struggling here (autotune, beat, slang), or the vocals deviate significantly from the lyrics – worth checking the raw transcript below.",
    vocalsNoText: "(no text)",

    albumNeedFile: "Please select at least one track.",
    albumNeedLogin: "Please log in or register first.",
    albumProOnly: "Album check is part of the Pro plan.",
    albumChecking: "Track {i}/{total}: “{name}” being checked…",
    albumQuotaExhausted: "Quota used up at track {i}/{total} ({err}).",
    albumNoChecksLeft: "no checks left",
    albumTrackError: "Error: {msg}",
    albumAnalysisFailed: "Analysis failed.",

    checkoutProcessing: "Processing payment…",
    checkoutStillProcessing: "Payment is still processing ({err}) – try clicking 'View full analysis' again in a moment.",
    checkoutPleaseWait: "please wait a moment",

    freqRefZoneTitle: "Reference range: {lo}–{hi}%",
    freqBarTitle: "{name}: {val}% (reference {lo}–{hi}%)",
  },
};

function detectLang() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get("lang");
  if (urlLang === "en" || urlLang === "de") return urlLang;
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "de") return stored;
  return navigator.language && navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

let currentLang = detectLang();
localStorage.setItem(LANG_KEY, currentLang);

function t(key, vars) {
  const table = I18N[currentLang] || I18N.de;
  let str = key in table ? table[key] : key in I18N.de ? I18N.de[key] : key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
    });
  }
  return str;
}

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.title = t("pageTitle");
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", t("pageDescription"));
  document.documentElement.lang = currentLang;
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === currentLang));
  });
}

function setLang(lang) {
  if (lang !== "de" && lang !== "en") return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyStaticTranslations();
  if (typeof currentAnalysisSnapshot !== "undefined" && currentAnalysisSnapshot) {
    const unlockedNow = premiumResultsEl && !premiumResultsEl.hidden;
    renderAnalysis(currentAnalysisSnapshot, { unlockedPremium: unlockedNow });
  }
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});
applyStaticTranslations();

/* ---------- Icons (inline SVG, currentColor, always paired with a text label) ---------- */

const ICONS = {
  good: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2l6.9 12H1.1L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5v3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>`,
  critical: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

function statusForScore(score) {
  if (score >= 75) return { key: "good", color: "var(--status-good)", label: t("statusGood") };
  if (score >= 50) return { key: "warning", color: "var(--status-warning)", label: t("statusOk") };
  return { key: "critical", color: "var(--status-critical)", label: t("statusWeak") };
}

/* ---------- Entertainment layer: grades, badges, teaser (for the free view) ---------- */

function gradeForScore(score) {
  if (score >= 80) {
    return {
      stars: 5,
      title: t("gradeTopTitle"),
      desc: t("gradeTopDesc"),
      color: "var(--status-good)",
      celebrate: true,
    };
  }
  if (score >= 60) {
    return {
      stars: 4,
      title: t("gradeHighTitle"),
      desc: t("gradeHighDesc"),
      color: "var(--status-good)",
    };
  }
  if (score >= 40) {
    return {
      stars: 3,
      title: t("gradeMidTitle"),
      desc: t("gradeMidDesc"),
      color: "var(--status-warning)",
    };
  }
  return {
    stars: 2,
    title: t("gradeLowTitle"),
    desc: t("gradeLowDesc"),
    color: "var(--status-critical)",
  };
}

function starRatingHtml(stars) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += i <= stars ? "★" : `<span class="star-empty">★</span>`;
  }
  return html;
}

function badgeTier(score) {
  if (score === null || score === undefined) return { dots: "○ ○ ○", label: t("badgeMissingInfo") };
  if (score >= 75) return { dots: "● ● ●", label: t("badgeStrong") };
  if (score >= 50) return { dots: "● ● ○", label: t("badgeSolid") };
  return { dots: "● ○ ○", label: t("badgeNeedsWork") };
}

function combineScores(scores) {
  const vals = scores.filter((v) => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const TIP_LEVEL_RANK = { critical: 0, warning: 1, good: 2 };

function pickTopTip(tips) {
  let best = tips[0];
  for (const tip of tips) {
    if (TIP_LEVEL_RANK[tip.level] < TIP_LEVEL_RANK[best.level]) best = tip;
  }
  return best;
}

/* ---------- FFT (iterative radix-2 Cooley-Tukey) ---------- */

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curWr = 1, curWi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const idx = i + k + len / 2;
        const vr = re[idx] * curWr - im[idx] * curWi;
        const vi = re[idx] * curWi + im[idx] * curWr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[idx] = ur - vr; im[idx] = ui - vi;
        const nwr = curWr * wr - curWi * wi;
        const nwi = curWr * wi + curWi * wr;
        curWr = nwr; curWi = nwi;
      }
    }
  }
}

const FFT_SIZE = 4096;
const MAX_FRAMES = 200;

const FREQ_BANDS = [
  { key: "subbass", range: [20, 60] },
  { key: "bass", range: [60, 250] },
  { key: "lowmid", range: [250, 500] },
  { key: "mid", range: [500, 2000] },
  { key: "highmid", range: [2000, 4000] },
  { key: "presence", range: [4000, 6000] },
  { key: "brilliance", range: [6000, 16000] },
];

function bandLabel(band) {
  return t("band_" + band.key);
}

const GENRE_LABEL_KEYS = {
  "": "genreGeneral",
  hiphop: "genreHiphop",
  pop: "genrePop",
  edm: "genreEdm",
  rock: "genreRock",
  acoustic: "genreAcoustic",
  techno: "genreTechno",
  metal: "genreMetal",
  reggae: "genreReggae",
  latin: "genreLatin",
  jazz: "genreJazz",
  klassik: "genreKlassik",
  volksmusik: "genreVolksmusik",
};

function genreLabel(genreKey) {
  return t(GENRE_LABEL_KEYS[genreKey] || "genreGeneral");
}

/* Referenzbereiche (% Energieanteil je Band) und Lautheits-Ziel je Genre. "" = allgemeiner
   Referenzbereich, wenn kein Genre gewählt wurde. Grobe, praxisnahe Richtwerte, keine exakte
   Norm - dienen als Orientierung, nicht als harte Regel. */
const GENRE_PROFILES = {
  "": { key: "", loudnessTarget: -14, refs: [[2, 8], [14, 26], [10, 18], [20, 32], [10, 18], [5, 12], [4, 12]] },
  hiphop: {
    key: "hiphop",
    loudnessTarget: -9,
    refs: [[4, 10], [18, 30], [9, 16], [18, 28], [9, 16], [5, 11], [3, 9]],
    fingerprint: { bpmRange: [70, 100], brightnessRange: [700, 1800], bassRatioRange: [20, 38], crestRange: [6, 15] },
  },
  pop: {
    key: "pop",
    loudnessTarget: -11,
    refs: [[2, 7], [13, 22], [10, 18], [22, 34], [11, 19], [6, 13], [5, 13]],
    fingerprint: { bpmRange: [95, 130], brightnessRange: [1100, 2300], bassRatioRange: [14, 27], crestRange: [7, 16] },
  },
  edm: {
    key: "edm",
    loudnessTarget: -8,
    refs: [[6, 14], [20, 32], [8, 15], [16, 26], [9, 15], [4, 10], [4, 11]],
    fingerprint: { bpmRange: [118, 150], brightnessRange: [900, 2000], bassRatioRange: [24, 42], crestRange: [5, 11] },
  },
  rock: {
    key: "rock",
    loudnessTarget: -9,
    refs: [[2, 6], [12, 20], [12, 20], [22, 32], [12, 20], [6, 13], [3, 9]],
    fingerprint: { bpmRange: [95, 145], brightnessRange: [1000, 2100], bassRatioRange: [13, 25], crestRange: [8, 17] },
  },
  acoustic: {
    key: "acoustic",
    loudnessTarget: -16,
    refs: [[1, 5], [10, 18], [12, 20], [22, 34], [12, 20], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [55, 115], brightnessRange: [850, 1900], bassRatioRange: [9, 22], crestRange: [10, 22] },
  },
  techno: {
    key: "techno",
    loudnessTarget: -7,
    refs: [[7, 15], [20, 32], [7, 14], [15, 25], [9, 15], [4, 10], [4, 11]],
    fingerprint: { bpmRange: [120, 145], brightnessRange: [1000, 2200], bassRatioRange: [26, 45], crestRange: [4, 10] },
  },
  metal: {
    key: "metal",
    loudnessTarget: -8,
    refs: [[1, 4], [10, 17], [14, 22], [24, 34], [13, 21], [6, 13], [3, 9]],
    fingerprint: { bpmRange: [100, 180], brightnessRange: [1300, 2500], bassRatioRange: [12, 22], crestRange: [5, 11] },
  },
  reggae: {
    key: "reggae",
    loudnessTarget: -11,
    refs: [[5, 12], [20, 32], [9, 16], [16, 26], [9, 16], [5, 11], [3, 9]],
    fingerprint: { bpmRange: [60, 90], brightnessRange: [800, 1800], bassRatioRange: [22, 38], crestRange: [7, 15] },
  },
  latin: {
    key: "latin",
    loudnessTarget: -10,
    refs: [[2, 6], [14, 24], [10, 18], [20, 30], [11, 18], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [90, 130], brightnessRange: [1000, 2100], bassRatioRange: [16, 28], crestRange: [7, 15] },
  },
  jazz: {
    key: "jazz",
    loudnessTarget: -15,
    refs: [[0, 3], [9, 17], [12, 20], [22, 33], [12, 20], [6, 13], [4, 11]],
    fingerprint: { bpmRange: [60, 140], brightnessRange: [900, 2000], bassRatioRange: [9, 20], crestRange: [11, 20] },
  },
  klassik: {
    key: "klassik",
    loudnessTarget: -20,
    refs: [[0, 2], [6, 14], [10, 18], [22, 34], [14, 22], [7, 14], [5, 13]],
    fingerprint: { bpmRange: [40, 160], brightnessRange: [900, 2000], bassRatioRange: [4, 14], crestRange: [14, 26] },
  },
  volksmusik: {
    key: "volksmusik",
    loudnessTarget: -16,
    refs: [[0, 3], [8, 16], [14, 22], [24, 36], [12, 20], [6, 13], [3, 10]],
    fingerprint: { bpmRange: [80, 140], brightnessRange: [900, 1900], bassRatioRange: [8, 20], crestRange: [11, 22] },
  },
};

function genreProfile(genreKey) {
  return GENRE_PROFILES[genreKey] || GENRE_PROFILES[""];
}

/* ---------- Automatische Genre-Schätzung (Tempo, Klangfarbe, Bassanteil, Dynamik) ----------
   Kein trainiertes ML-Modell, sondern ein grober Signal-Fingerabdruck-Vergleich mit den
   Genre-Referenzwerten oben. Läuft komplett lokal, ohne dass Audio das Gerät verlässt. */

function estimateTempoBpm(mono, sampleRate) {
  const windowSamples = Math.max(1, Math.round(sampleRate * 0.01)); // 10ms Fenster
  const envLen = Math.floor(mono.length / windowSamples);
  if (envLen < 50) return { bpm: null, confidence: 0 };

  const env = new Float64Array(envLen);
  for (let i = 0; i < envLen; i++) {
    const start = i * windowSamples;
    const end = Math.min(start + windowSamples, mono.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += Math.abs(mono[j]);
    env[i] = sum / (end - start);
  }

  const onset = new Float64Array(envLen);
  for (let i = 1; i < envLen; i++) onset[i] = Math.max(0, env[i] - env[i - 1]);

  const envRate = 1 / 0.01;
  const minLag = Math.max(1, Math.round((envRate * 60) / 180)); // 180 BPM
  const maxLag = Math.round((envRate * 60) / 60); // 60 BPM

  let bestLag = 0;
  let bestScore = -Infinity;
  let scoreSum = 0;
  let lagCount = 0;
  for (let lag = minLag; lag <= maxLag && lag < envLen; lag++) {
    let score = 0;
    for (let i = lag; i < envLen; i++) score += onset[i] * onset[i - lag];
    scoreSum += score;
    lagCount++;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  if (bestLag === 0 || lagCount === 0) return { bpm: null, confidence: 0 };

  const avgScore = scoreSum / lagCount || 1;
  const confidence = Math.max(0, Math.min(1, (bestScore / avgScore - 1) / 3));
  const bpm = 60 / (bestLag / envRate);
  return { bpm, confidence };
}

function bandCenterHz(band) {
  return Math.sqrt(band.range[0] * band.range[1]);
}

function normDist(val, [lo, hi]) {
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2 || 1;
  return Math.max(0, Math.abs(val - mid) / half - 1);
}

function estimateGenre({ bpm, brightnessHz, bassRatioPercent, crestFactorDb }) {
  let best = null;
  let bestDist = Infinity;
  for (const [key, profile] of Object.entries(GENRE_PROFILES)) {
    if (!profile.fingerprint) continue;
    const fp = profile.fingerprint;
    let dist = normDist(brightnessHz, fp.brightnessRange) + normDist(bassRatioPercent, fp.bassRatioRange) + normDist(crestFactorDb, fp.crestRange);
    dist += bpm !== null ? normDist(bpm, fp.bpmRange) : 0.5;
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  const lowConfidence = best === null || bestDist > 3.5;
  return { key: lowConfidence ? "" : best, bpm, lowConfidence };
}

function hann(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

// Ungegatete Ganzsong-RMS zieht den Durchschnitt bei jedem Track mit Intro/Outro/Pausen
// systematisch nach unten (fast jeder Song hat davon etwas) - das fuehrte dazu, dass praktisch
// jeder Track als "zu leise" markiert wurde, unabhaengig vom tatsaechlichen Master. Eine grobe
// Annaeherung an gegatete Lautheit (aehnlich dem Prinzip hinter LUFS-Messung, ohne vollstaendige
// K-Gewichtung) behebt den systematischen Bias: nur Passagen mit tatsaechlichem Signal zaehlen.
function computeGatedLoudnessDb(mono, sampleRate) {
  const blockSamples = Math.max(1, Math.round(sampleRate * 0.4));
  const blocks = [];
  for (let i = 0; i + blockSamples <= mono.length; i += blockSamples) {
    let sum = 0;
    for (let j = i; j < i + blockSamples; j++) sum += mono[j] * mono[j];
    blocks.push(sum / blockSamples);
  }
  if (blocks.length === 0) {
    let sum = 0;
    for (let i = 0; i < mono.length; i++) sum += mono[i] * mono[i];
    return 10 * Math.log10(sum / Math.max(1, mono.length) || 1e-18);
  }

  const absoluteGateMS = Math.pow(10, -70 / 10);
  const afterAbsolute = blocks.filter((ms) => ms > absoluteGateMS);
  const gated1 = afterAbsolute.length > 0 ? afterAbsolute : blocks;

  const meanMS = gated1.reduce((a, b) => a + b, 0) / gated1.length;
  const relativeGateMS = meanMS * Math.pow(10, -20 / 10);
  const afterRelative = gated1.filter((ms) => ms > relativeGateMS);
  const finalBlocks = afterRelative.length > 0 ? afterRelative : gated1;

  const finalMeanMS = finalBlocks.reduce((a, b) => a + b, 0) / finalBlocks.length;
  return 10 * Math.log10(finalMeanMS || 1e-18);
}

function analyzeAudioBuffer(buffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;

  const mono = new Float32Array(length);
  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / numChannels;
  }

  let peak = 0;
  let sumSquares = 0;
  let clippedSamples = 0;
  for (let i = 0; i < length; i++) {
    const abs = Math.abs(mono[i]);
    if (abs > peak) peak = abs;
    if (abs >= 0.999) clippedSamples++;
    sumSquares += mono[i] * mono[i];
  }
  const rms = Math.sqrt(sumSquares / length);
  const clippingRatio = clippedSamples / length;
  const loudnessDb = computeGatedLoudnessDb(mono, sampleRate);
  const crestFactorDb = 20 * Math.log10((peak || 1e-9) / (rms || 1e-9));

  const window = hann(FFT_SIZE);
  const bandEnergy = new Array(FREQ_BANDS.length).fill(0);
  let framesUsed = 0;

  const maxStart = Math.max(0, length - FFT_SIZE);
  const frameCount = Math.min(MAX_FRAMES, Math.max(1, Math.floor(length / FFT_SIZE)));
  const step = frameCount > 1 ? maxStart / (frameCount - 1) : 0;

  for (let f = 0; f < frameCount; f++) {
    const start = Math.round(f * step);
    const re = new Float64Array(FFT_SIZE);
    const im = new Float64Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      const s = start + i < length ? mono[start + i] : 0;
      re[i] = s * window[i];
    }
    fft(re, im);

    const binHz = sampleRate / FFT_SIZE;
    for (let bin = 1; bin < FFT_SIZE / 2; bin++) {
      const freq = bin * binHz;
      const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
      const energy = mag * mag;
      for (let b = 0; b < FREQ_BANDS.length; b++) {
        const [lo, hi] = FREQ_BANDS[b].range;
        if (freq >= lo && freq < hi) {
          bandEnergy[b] += energy;
          break;
        }
      }
    }
    framesUsed++;
  }

  const totalEnergy = bandEnergy.reduce((a, b) => a + b, 0) || 1;
  const bandPercents = bandEnergy.map((e) => (e / totalEnergy) * 100);

  const edgeSilence = analyzeEdgeSilence(mono, sampleRate);

  const tempo = estimateTempoBpm(mono, sampleRate);
  const brightnessHz = bandPercents.reduce((sum, pct, i) => sum + (pct / 100) * bandCenterHz(FREQ_BANDS[i]), 0);
  const bassRatioPercent = bandPercents[0] + bandPercents[1];
  const genreGuess = estimateGenre({
    bpm: tempo.confidence > 0.15 ? tempo.bpm : null,
    brightnessHz,
    bassRatioPercent,
    crestFactorDb,
  });

  return {
    duration: buffer.duration,
    peak,
    rms,
    clippingRatio,
    loudnessDb,
    crestFactorDb,
    bandPercents,
    framesUsed,
    introSilenceMs: edgeSilence.introSilenceMs,
    outroEndsAbruptly: edgeSilence.outroEndsAbruptly,
    estimatedBpm: tempo.bpm,
    estimatedGenre: genreGuess.key,
    estimatedGenreLowConfidence: genreGuess.lowConfidence,
  };
}

function analyzeEdgeSilence(mono, sampleRate) {
  const silenceThreshold = 0.02;
  const windowSamples = Math.max(1, Math.round(sampleRate * 0.05));

  let leadingSilentWindows = 0;
  for (let i = 0; i < mono.length; i += windowSamples) {
    const end = Math.min(i + windowSamples, mono.length);
    let sum = 0;
    for (let j = i; j < end; j++) sum += Math.abs(mono[j]);
    const avg = sum / (end - i);
    if (avg > silenceThreshold) break;
    leadingSilentWindows++;
  }
  const introSilenceMs = (leadingSilentWindows * windowSamples * 1000) / sampleRate;

  const tailSamples = Math.min(mono.length, Math.round(sampleRate * 0.3));
  let tailSum = 0;
  for (let j = mono.length - tailSamples; j < mono.length; j++) tailSum += Math.abs(mono[j]);
  const tailAvg = tailSamples > 0 ? tailSum / tailSamples : 0;
  const outroEndsAbruptly = tailAvg > silenceThreshold * 1.5;

  return { introSilenceMs, outroEndsAbruptly };
}

/* ---------- Lyrics / hook analysis ---------- */

function normalizeText(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9äöüß\s]/gi, "")
    // "&" wird beim Saeubern oben schon entfernt - "und"/"and" als eigene Woerter aber nicht.
    // Titel wie "Asozial & Echt" vs. eingetippt "Asozial und Echt" wuerden sonst nicht als
    // Treffer erkannt, obwohl inhaltlich dasselbe gemeint ist - beide Schreibweisen auf dieselbe
    // Form bringen, damit der Songtitel-im-Text-Abgleich das nicht als Nicht-Treffer wertet.
    .replace(/\b(und|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeLyrics(lyricsRaw, titleRaw) {
  const hasLyrics = !!lyricsRaw && lyricsRaw.trim().length > 0;
  const hasTitle = !!titleRaw && titleRaw.trim().length > 0;
  if (!hasLyrics) {
    return { hasLyrics: false, hasTitle };
  }

  const lines = lyricsRaw
    .split("\n")
    .map((l) => normalizeText(l))
    .filter((l) => l.length > 2);

  const counts = new Map();
  for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);

  let hookLine = "";
  let hookRepeatCount = 0;
  for (const [line, count] of counts) {
    if (count > hookRepeatCount) {
      hookRepeatCount = count;
      hookLine = line;
    }
  }

  const normLyrics = normalizeText(lyricsRaw);
  const normTitle = hasTitle ? normalizeText(titleRaw) : "";

  const titleInLyrics = hasTitle && normTitle.length > 0 && normLyrics.includes(normTitle);
  const titleInHook = hasTitle && normTitle.length > 0 && hookLine.includes(normTitle);

  return {
    hasLyrics: true,
    hasTitle,
    hookLine,
    hookRepeatCount,
    titleInLyrics,
    titleInHook,
  };
}

/* ---------- Scoring ---------- */

function scoreTechnik(a, profile) {
  // Bewertung um einen Idealpunkt statt einem "Idealfenster" - ein flacher Bereich, in dem
  // jeder Wert 100% gibt, wirkt schnell unglaubwuerdig grob (fast jeder saubere Track landet
  // sonst exakt bei 100%). So gibt's fast nie eine glatte Bestnote, sondern einen nuancierten Wert.
  const clipPenalty = Math.min(60, a.clippingRatio * 2800);

  // Genre-abhaengiger Idealwert statt einem starren 12.5 dB fuer alle: Hip-Hop/EDM-Masters
  // liegen genretypisch im niedrigeren Crest-Factor-Bereich, ohne dass das technisch schlechter
  // waere - ein fixer Wert wuerde das systematisch abstrafen.
  const fp = profile && profile.fingerprint;
  const idealCrest = fp ? (fp.crestRange[0] + fp.crestRange[1]) / 2 : 12.5;
  const crestDeviation = Math.abs(a.crestFactorDb - idealCrest);
  const crestPenalty = crestDeviation * crestDeviation * 0.22;

  return Math.max(0, Math.min(100, 100 - clipPenalty - crestPenalty));
}

function scoreLautheit(a, loudnessTarget) {
  const diff = Math.abs(a.loudnessDb - loudnessTarget);
  let score = 100 - diff * 6;
  return Math.max(0, Math.min(100, score));
}

function scoreFrequenz(a, refs) {
  // Derselbe Fehler wie vorher bei scoreTechnik: eine Nullstrafe ueberall im Referenzbereich
  // fuehrt dazu, dass viele Tracks eine glatte 100 bekommen. Jetzt kontinuierlich um die Mitte
  // jedes Bandes bewertet, mit sanfter Abstufung innerhalb des Referenzbereichs statt Nullzone.
  let penalty = 0;
  refs.forEach(([lo, hi], i) => {
    const val = a.bandPercents[i];
    const mid = (lo + hi) / 2;
    const halfWidth = (hi - lo) / 2 || 1;
    const dist = Math.abs(val - mid);
    if (dist <= halfWidth) {
      penalty += (dist / halfWidth) * 3;
    } else {
      penalty += 3 + (dist - halfWidth) * 1.8;
    }
  });
  return Math.max(0, Math.min(100, 100 - penalty));
}

function scoreHook(lyrics) {
  if (!lyrics.hasLyrics) return null;
  if (lyrics.hookRepeatCount >= 3) return 100;
  if (lyrics.hookRepeatCount === 2) return 70;
  return 30;
}

function scoreTitel(lyrics) {
  if (!lyrics.hasLyrics || !lyrics.hasTitle) return null;
  if (lyrics.titleInHook) return 100;
  if (lyrics.titleInLyrics) return 55;
  return 15;
}

/* ---------- Tips ---------- */

function tipText(problem, detail, fix) {
  return detail ? `${problem} ${detail} ${fix}`.trim() : `${problem}${fix ? " " + fix : ""}`.trim();
}

function buildTips(a, lyrics, scores, profile) {
  const tips = [];
  const loudnessTarget = profile.loudnessTarget;

  if (a.clippingRatio > 0.005) {
    const problem = t("tipClipCriticalProblem", { pct: (a.clippingRatio * 100).toFixed(2) });
    const fix = t("tipClipCriticalFix");
    tips.push({ level: "critical", problem, fix, text: tipText(problem, null, fix) });
  } else if (a.clippingRatio > 0.0005) {
    const problem = t("tipClipWarningProblem");
    const fix = t("tipClipWarningFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, null, fix) });
  }

  if (a.crestFactorDb < 6) {
    const problem = t("tipCrestLowProblem", { db: a.crestFactorDb.toFixed(1) });
    const detail = t("tipCrestLowDetail");
    const fix = t("tipCrestLowFix");
    tips.push({ level: "critical", problem, fix, text: tipText(problem, detail, fix) });
  } else if (a.crestFactorDb > 22) {
    const problem = t("tipCrestHighProblem", { db: a.crestFactorDb.toFixed(1) });
    const fix = t("tipCrestHighFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, null, fix) });
  }

  if (a.loudnessDb < loudnessTarget - 4) {
    const problem = t("tipLoudnessLowProblem", { db: a.loudnessDb.toFixed(1) });
    const detail = t("tipLoudnessLowDetail");
    const fix = t("tipLoudnessLowFix", { target: loudnessTarget });
    tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
  } else if (a.loudnessDb > loudnessTarget + 4) {
    const problem = t("tipLoudnessHighProblem", { db: a.loudnessDb.toFixed(1) });
    const detail = t("tipLoudnessHighDetail");
    const fix = t("tipLoudnessHighFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
  }

  if (a.introSilenceMs > 1500) {
    const problem = t("tipIntroSilenceProblem", { sec: (a.introSilenceMs / 1000).toFixed(1) });
    const detail = t("tipIntroSilenceDetail");
    const fix = t("tipIntroSilenceFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
  }
  if (a.outroEndsAbruptly) {
    const problem = t("tipOutroAbruptProblem");
    const detail = t("tipOutroAbruptDetail");
    const fix = t("tipOutroAbruptFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
  }

  // Statt fuenf fast identischen "probier X dB bei Y Hz"-Tipps hintereinander (unverstaendlich
  // ohne EQ-Vorwissen): ein einziger zusammenfassender Tipp, der auf den EQ-Editor verweist, wo
  // die konkreten Werte bereits als Vorschlag vorausgefuellt sind und live anhoerbar.
  const offBands = [];
  FREQ_BANDS.forEach((band, i) => {
    const val = a.bandPercents[i];
    const [lo, hi] = profile.refs[i];
    if (val < lo - 3) offBands.push(t("tipBandTooLow", { band: bandLabel(band) }));
    else if (val > hi + 3) offBands.push(t("tipBandTooHigh", { band: bandLabel(band) }));
  });
  if (offBands.length > 0) {
    const unit = t(offBands.length > 1 ? "tipFreqUnitPlural" : "tipFreqUnitSingular");
    const problem = t("tipFreqOffBandsProblem", { count: offBands.length, unit, bands: offBands.join(", ") });
    const fix = t("tipFreqOffBandsFix");
    tips.push({ level: offBands.length >= 4 ? "critical" : "warning", problem, fix, text: tipText(problem, null, fix) });
  }

  if (!lyrics.hasLyrics) {
    const problem = t("tipNoLyricsProblem");
    const fix = t("tipNoLyricsFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, null, fix) });
  } else {
    if (scores.hook !== null && scores.hook < 70) {
      const problem = t("tipHookWeakProblem");
      const detail = t("tipHookWeakDetail");
      const fix = t("tipHookWeakFix");
      tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
    }
    if (lyrics.hasTitle && scores.titel !== null && scores.titel < 100) {
      if (!lyrics.titleInLyrics) {
        const problem = t("tipTitleMissingProblem");
        const detail = t("tipTitleMissingDetail");
        const fix = t("tipTitleMissingFix");
        tips.push({ level: "critical", problem, fix, text: tipText(problem, detail, fix) });
      } else {
        const problem = t("tipTitleNotInHookProblem");
        const detail = t("tipTitleNotInHookDetail");
        const fix = t("tipTitleNotInHookFix");
        tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
      }
    }
  }

  if (tips.length === 0) {
    const problem = t("tipAllGood");
    tips.push({ level: "good", problem, fix: "", text: problem });
  }

  return tips;
}

/* ---------- Fazit als Wegweiser ---------- */

function buildFazit(overallScore, tips) {
  const actionable = tips
    .filter((tip) => tip.level !== "good")
    .sort((a, b) => TIP_LEVEL_RANK[a.level] - TIP_LEVEL_RANK[b.level])
    .slice(0, 5);

  let intro;
  if (overallScore >= 70) intro = t("fazitIntroGood", { score: overallScore });
  else if (overallScore >= 45) intro = t("fazitIntroMid", { score: overallScore });
  else intro = t("fazitIntroLow", { score: overallScore });

  const stepsIntro = actionable.length > 0 ? t("fazitStepsIntro") : "";

  const closing = actionable.length > 0 ? t("fazitClosingSteps") : t("fazitClosingDone");

  // fix statt text: nur die Handlungsanweisung, ohne die Diagnose aus der Tipps-Liste oben
  // wortgleich zu wiederholen - macht den Wegweiser zu einer eigenstaendigen Checkliste.
  return { intro, stepsIntro, steps: actionable.map((tip) => tip.fix || tip.problem), closing };
}

function renderFazit(container, fazit) {
  const stepsIntroHtml = fazit.stepsIntro ? `<p class="fazit-steps-intro">${fazit.stepsIntro}</p>` : "";
  const stepsHtml =
    fazit.steps.length > 0 ? `<ol class="fazit-steps">${fazit.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : "";
  container.innerHTML = `<p>${fazit.intro}</p>${stepsIntroHtml}${stepsHtml}<p class="fazit-closing">${fazit.closing}</p>`;
}

/* ---------- Submission recommendations ---------- */

/* ---------- Erfolge & Belohnung ---------- */

function buildAchievements(audioMetrics, scores, loudnessTarget) {
  const list = [];
  if (audioMetrics.clippingRatio < 0.0005) list.push({ emoji: "🧼", label: t("achClean") });
  if (Math.abs(audioMetrics.loudnessDb - loudnessTarget) <= 1) list.push({ emoji: "🎯", label: t("achOnTarget") });
  if (scores.hook === 100) list.push({ emoji: "🪝", label: t("achHook") });
  if (scores.frequenz >= 85) list.push({ emoji: "🌈", label: t("achBalanced") });
  if (scores.titel === 100) list.push({ emoji: "🏷️", label: t("achRecognizable") });
  return list;
}

function renderAchievements(container, achievements) {
  if (!container) return;
  if (!achievements.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  container.innerHTML = achievements.map((a) => `<span class="achievement-badge">${a.emoji} ${a.label}</span>`).join("");
}

function fireConfetti(container) {
  if (!container) return;
  const colors = ["#cda86b", "#e8caa0", "#4cc38a", "#f3efe6"];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.25 + "s";
    piece.style.setProperty("--rot", Math.round(Math.random() * 360) + "deg");
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

const CHECK_COUNT_KEY = "overhertz_checks_done";

function incrementCheckCount() {
  const n = parseInt(localStorage.getItem(CHECK_COUNT_KEY) || "0", 10) + 1;
  localStorage.setItem(CHECK_COUNT_KEY, String(n));
  return n;
}

function renderStreakNote(n) {
  const el = document.getElementById("streak-note");
  if (!el) return;
  if (!n || n < 1) {
    el.textContent = "";
    return;
  }
  el.textContent = n === 1 ? t("streakFirst") : t("streakN", { n });
}

function buildSubmissions(overallScore, genreKey) {
  const hasGenre = !!genreKey;
  const genre = genreLabel(genreKey);
  const genreSuffix = hasGenre ? ` (${genre})` : "";
  const ready = overallScore >= 70;
  const mid = overallScore >= 45;

  const items = [
    {
      name: t("submitGrooverName"),
      reason: ready
        ? t("submitGrooverReasonReady", { score: overallScore, genreSuffix })
        : t("submitGrooverReasonNotReady", { score: overallScore }),
    },
    {
      name: t("submitHubName"),
      reason: hasGenre ? t("submitHubReasonGenre", { genre }) : t("submitHubReasonNoGenre"),
    },
    {
      name: t("submitMusoSoupName"),
      reason: t("submitMusoSoupReason"),
    },
    {
      name: t("submitSpotifyName"),
      reason: ready
        ? t("submitSpotifyReasonReady", { score: overallScore })
        : mid
          ? t("submitSpotifyReasonMid", { score: overallScore })
          : t("submitSpotifyReasonLow", { score: overallScore }),
    },
  ];

  let note;
  if (ready) {
    note = t("submitNoteReady", { score: overallScore, genreSuffix });
  } else if (mid) {
    note = t("submitNoteMid", { score: overallScore, genreSuffix });
  } else {
    note = t("submitNoteLow", { score: overallScore, genreSuffix });
  }

  return { items, note };
}

/* ---------- Rendering ---------- */

function iconFor(level) {
  return ICONS[level] || ICONS.warning;
}

function renderMeter(container, { name, score, statusText }) {
  if (score === null) {
    const el = document.createElement("div");
    el.className = "meter";
    el.innerHTML = `
      <div class="meter-head">
        <span class="meter-name">${name}</span>
        <span class="meter-status">${statusText}</span>
      </div>
      <div class="meter-track"><div class="meter-fill" style="width:0%;background:var(--gridline)"></div></div>
    `;
    container.appendChild(el);
    return;
  }
  const status = statusForScore(score);
  const el = document.createElement("div");
  el.className = "meter";
  el.innerHTML = `
    <div class="meter-head">
      <span class="meter-name">${name}</span>
      <span class="meter-status" style="color:${status.color}">${iconFor(status.key)} ${status.label} · ${score.toFixed(1)}/100</span>
    </div>
    <div class="meter-track"><div class="meter-fill" style="width:0%;background:${status.color}"></div></div>
  `;
  container.appendChild(el);
  const fill = el.querySelector(".meter-fill");
  requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = score + "%")));
}

function renderFreqChart(container, bandPercents, refs) {
  container.innerHTML = "";
  const maxVal = Math.max(...bandPercents, ...refs.map((r) => r[1])) * 1.15;

  FREQ_BANDS.forEach((band, i) => {
    const val = bandPercents[i];
    const [refLo, refHi] = refs[i];
    const wrap = document.createElement("div");
    wrap.className = "freq-bar-wrap";

    const refZone = document.createElement("div");
    refZone.className = "freq-ref-zone";
    refZone.style.bottom = `${(refLo / maxVal) * 100}%`;
    refZone.style.height = `${((refHi - refLo) / maxVal) * 100}%`;
    refZone.title = t("freqRefZoneTitle", { lo: refLo, hi: refHi });

    const valueLabel = document.createElement("div");
    valueLabel.className = "freq-value";
    valueLabel.textContent = `${val.toFixed(1)}%`;

    const bar = document.createElement("div");
    bar.className = "freq-bar";
    bar.style.height = `${Math.max(2, (val / maxVal) * 100)}%`;
    bar.title = t("freqBarTitle", { name: bandLabel(band), val: val.toFixed(1), lo: refLo, hi: refHi });

    const label = document.createElement("div");
    label.className = "freq-label";
    label.textContent = `${bandLabel(band)}\n${band.range[0]}-${band.range[1]}Hz`;

    wrap.appendChild(refZone);
    wrap.appendChild(valueLabel);
    wrap.appendChild(bar);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

function renderTips(container, tips) {
  container.innerHTML = "";
  for (const tip of tips) {
    const li = document.createElement("li");
    const color =
      tip.level === "good" ? "var(--status-good)" : tip.level === "critical" ? "var(--status-critical)" : "var(--status-warning)";
    li.innerHTML = `<span style="color:${color}">${iconFor(tip.level)}</span><span>${tip.text}</span>`;
    container.appendChild(li);
  }
}

function renderSubmissions(listEl, hintEl, { items, note }) {
  hintEl.textContent = note;
  listEl.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "submit-row";
    li.innerHTML = `<span class="submit-row-name">${item.name}</span><span class="submit-row-reason">${item.reason}</span>`;
    listEl.appendChild(li);
  }
}

function renderBadges(container, badgeDefs) {
  container.innerHTML = "";
  for (const { label, score, mutedNote } of badgeDefs) {
    const tier = score === null ? { dots: "○ ○ ○", label: mutedNote || t("badgeMissingInfo") } : badgeTier(score);
    const dotColor = score === null ? "var(--text-muted)" : statusForScore(score).color;
    const el = document.createElement("div");
    el.className = "badge";
    el.innerHTML = `
      <span class="badge-dots" style="color:${dotColor}">${tier.dots}</span>
      <span class="badge-text">
        <span class="badge-label">${label}</span>
        <span class="badge-tier">${tier.label}</span>
      </span>
    `;
    container.appendChild(el);
  }
}

/* ---------- KI-Songtextverbesserung (Cloudflare Worker, hält den API-Key serverseitig) ---------- */

// Nach dem Deploy des Workers (siehe worker/songtext-worker.js) die Worker-URL eintragen,
// z. B. "https://trackstar-songtext-worker.<dein-account>.workers.dev". Leer = Funktion deaktiviert.
const SONGTEXT_WORKER_URL = "https://trackstar.coulrophobia66666.workers.dev/";

let lastAnalysis = null;
let lastShareInfo = null;

const shareResultBtn = document.getElementById("share-result-btn");
if (shareResultBtn) {
  shareResultBtn.addEventListener("click", async () => {
    if (!lastShareInfo) return;
    const shareText = t("shareText", { stars: lastShareInfo.stars, title: lastShareInfo.title, score: lastShareInfo.score });
    const shareUrl = window.location.origin + window.location.pathname;
    const labelSpan = shareResultBtn.querySelector("span");
    const originalLabel = labelSpan ? labelSpan.textContent : "";
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      if (labelSpan) {
        labelSpan.textContent = t("shareCopied");
        setTimeout(() => (labelSpan.textContent = originalLabel), 2200);
      }
    } catch {
      // Abbruch durch Nutzer (z.B. Share-Dialog geschlossen) oder Clipboard nicht verfuegbar -
      // kein Fehler-Status noetig, das ist kein kritischer Vorgang.
    }
  });
}

// Der Worker streamt die Anthropic-Antwort als Klartext im
// ###EINORDNUNG###/###TITEL###/###TEXT###-Format (siehe songtext-worker.js), statt auf die
// komplette Antwort zu warten - fuehlt sich dadurch spuerbar schneller an. parseKiStream() wird
// bei jedem neu angekommenen Chunk erneut ueber den bisher gesammelten Text aufgerufen.
function parseKiStream(raw) {
  const MARK_EINORDNUNG = "###EINORDNUNG###";
  const MARK_TITEL = "###TITEL###";
  const MARK_TEXT = "###TEXT###";

  const einordnungStart = raw.indexOf(MARK_EINORDNUNG);
  const titelStart = raw.indexOf(MARK_TITEL);
  const textStart = raw.indexOf(MARK_TEXT);

  let classification = "";
  if (einordnungStart !== -1) {
    const end = titelStart !== -1 ? titelStart : raw.length;
    classification = raw.slice(einordnungStart + MARK_EINORDNUNG.length, end).trim();
  }

  let titleIdeas = [];
  if (titelStart !== -1) {
    const end = textStart !== -1 ? textStart : raw.length;
    titleIdeas = raw
      .slice(titelStart + MARK_TITEL.length, end)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  const improved = textStart !== -1 ? raw.slice(textStart + MARK_TEXT.length).trim() : "";

  return { classification, titleIdeas, improved };
}

async function streamKiEinschaetzung(title, lyrics, metrics, genre, onUpdate) {
  const res = await fetch(SONGTEXT_WORKER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, lyrics, metrics, genre: genre ? genreLabel(genre) : "" }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || t("kiRequestUnknownError"));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
    onUpdate(parseKiStream(raw));
  }
  raw += decoder.decode();
  const final = parseKiStream(raw);
  if (!final.improved) throw new Error(t("kiRequestUnknownError"));
  return final;
}

/* ---------- Konten, Credits & Pro-Abo (D1 + Stripe über den Worker) ---------- */

const WORKER_BASE = SONGTEXT_WORKER_URL.replace(/\/?$/, "/");
const TOKEN_KEY = "overhertz_token";
const ANALYSIS_SNAPSHOT_KEY = "overhertz_analysis_snapshot";

let currentAnalysisSnapshot = null;
let currentUser = null; // { email, plan, credits, checksUsedPeriod, planRenewsAt, proQuota } oder null

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ "content-type": "application/json" }, options.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  let res;
  try {
    res = await fetch(WORKER_BASE + path, Object.assign({}, options, { headers }));
  } catch {
    return { ok: false, status: 0, data: { error: t("serverUnreachable") } };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const accountBar = document.getElementById("account-bar");
const authCard = document.getElementById("auth-card");
const authStatus = document.getElementById("auth-status");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authToggleBtn = document.getElementById("account-toggle");
const logoutBtn = document.getElementById("logout-btn");
const pricingCard = document.getElementById("pricing-card");
const pricingStatus = document.getElementById("pricing-status");

function renderAccountBar() {
  if (!accountBar) return;
  accountBar.innerHTML = "";
  if (currentUser) {
    const quotaText =
      currentUser.plan === "pro" || currentUser.plan === "pro_annual"
        ? t("accountChecksThisMonth", { remaining: currentUser.proQuota - currentUser.checksUsedPeriod, quota: currentUser.proQuota })
        : t(currentUser.credits === 1 ? "accountCreditsOne" : "accountCreditsMany", { n: currentUser.credits });
    const planLabel =
      { free: t("accountFreePlanLabel"), pro: t("accountProLabel"), pro_annual: t("accountProAnnualLabel") }[currentUser.plan] ||
      currentUser.plan;
    accountBar.innerHTML = `
      <span class="account-info"><strong>${currentUser.email}</strong> · ${planLabel} · ${quotaText}</span>
      <button type="button" id="logout-btn" class="account-btn">${t("accountLogoutBtn")}</button>
    `;
    document.getElementById("logout-btn").addEventListener("click", handleLogout);
  } else {
    accountBar.innerHTML = `<button type="button" id="account-toggle" class="account-btn">${t("accountLoginRegisterBtn")}</button>`;
    document.getElementById("account-toggle").addEventListener("click", () => toggleAuthCard());
  }
}

function toggleAuthCard(forceOpen) {
  if (!authCard) return;
  authCard.hidden = forceOpen === true ? false : !authCard.hidden;
  if (!authCard.hidden) authCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function refreshAccount() {
  if (!getToken()) {
    currentUser = null;
    renderAccountBar();
    return;
  }
  const { ok, data } = await apiFetch("auth/me", { method: "GET" });
  if (ok) {
    currentUser = data.user;
  } else {
    currentUser = null;
    setToken("");
  }
  renderAccountBar();
}

async function handleLogout() {
  await apiFetch("auth/logout", { method: "POST" });
  setToken("");
  currentUser = null;
  renderAccountBar();
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    authStatus.textContent = t("authLoggingIn");
    const { ok, data } = await apiFetch("auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (ok) {
      setToken(data.token);
      currentUser = data.user;
      renderAccountBar();
      authCard.hidden = true;
      authStatus.textContent = "";
    } else {
      authStatus.textContent = data.error || t("authLoginFailed");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    authStatus.textContent = t("authRegistering");
    const { ok, data } = await apiFetch("auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
    if (ok) {
      setToken(data.token);
      currentUser = data.user;
      renderAccountBar();
      authCard.hidden = true;
      authStatus.textContent = "";
    } else {
      authStatus.textContent = data.error || t("authRegisterFailed");
    }
  });
}

/* ---------- Passwort vergessen / zuruecksetzen ---------- */

const forgotPasswordLink = document.getElementById("forgot-password-link");
const backToLoginLink = document.getElementById("back-to-login-link");
const requestResetForm = document.getElementById("request-reset-form");
const resetPasswordForm = document.getElementById("reset-password-form");

function showAuthForm(formToShow) {
  [loginForm, registerForm, requestResetForm, resetPasswordForm].forEach((f) => {
    if (f) f.hidden = f !== formToShow;
  });
  authStatus.textContent = "";
}

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", () => showAuthForm(requestResetForm));
}
if (backToLoginLink) {
  backToLoginLink.addEventListener("click", () => showAuthForm(loginForm));
}

if (requestResetForm) {
  requestResetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("reset-request-email").value;
    authStatus.textContent = t("resetRequestSending");
    const { ok, data } = await apiFetch("auth/request-password-reset", { method: "POST", body: JSON.stringify({ email }) });
    if (ok) {
      authStatus.textContent = data.message || "";
      requestResetForm.reset();
    } else {
      authStatus.textContent = data.error || t("resetRequestFailed");
    }
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = resetPasswordForm.dataset.token || "";
    const password = document.getElementById("reset-new-password").value;
    authStatus.textContent = t("resetPasswordSetting");
    const { ok, data } = await apiFetch("auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
    if (ok) {
      setToken(data.token);
      currentUser = data.user;
      renderAccountBar();
      authStatus.textContent = t("resetPasswordSuccess");
      resetPasswordForm.hidden = true;
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("reset");
      window.history.replaceState({}, "", cleanUrl);
    } else {
      authStatus.textContent = data.error || t("resetPasswordFailed");
    }
  });
}

// Reset-Link (?reset=<token>) direkt beim Laden erkennen und die passende Karte oeffnen.
const resetTokenFromUrl = new URLSearchParams(window.location.search).get("reset");
if (resetTokenFromUrl && resetPasswordForm) {
  resetPasswordForm.dataset.token = resetTokenFromUrl;
  toggleAuthCard(true);
  showAuthForm(resetPasswordForm);
}

document.querySelectorAll(".plan-select-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!currentUser) {
      toggleAuthCard(true);
      pricingStatus.textContent = t("authPleaseLoginFirst");
      return;
    }
    pricingStatus.textContent = t("pricingRedirecting");
    if (currentAnalysisSnapshot) sessionStorage.setItem(ANALYSIS_SNAPSHOT_KEY, JSON.stringify(currentAnalysisSnapshot));
    const { ok, data } = await apiFetch("create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ plan: btn.dataset.plan }),
    });
    if (ok && data.url) {
      window.location.href = data.url;
    } else {
      pricingStatus.textContent = data.error || t("pricingFailed");
    }
  });
});

function openPricing(message) {
  if (pricingCard) {
    pricingCard.hidden = false;
    pricingStatus.textContent = message || "";
    pricingCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function tryConsumeCredit() {
  return apiFetch("consume-credit", { method: "POST" });
}

/* ---------- Main flow ---------- */

const form = document.getElementById("analyze-form");
const statusLine = document.getElementById("status-line");
const analyzeBtn = document.getElementById("analyze-btn");
const freeResultsEl = document.getElementById("free-results");
const premiumResultsEl = document.getElementById("premium-results");
const unlockBtn = document.getElementById("unlock-btn");
const rewriteBtn = document.getElementById("rewrite-btn");
const rewriteStatus = document.getElementById("rewrite-status");
const rewriteResult = document.getElementById("rewrite-result");
const rewriteOutput = document.getElementById("rewrite-output");
const rewriteClassification = document.getElementById("rewrite-classification");
const rewriteTitleIdeas = document.getElementById("rewrite-title-ideas");

let genreManuallySet = false;
const trackGenreSelect = document.getElementById("track-genre");
trackGenreSelect.addEventListener("change", () => {
  genreManuallySet = true;
  if (currentAnalysisSnapshot) {
    const unlockedNow = !premiumResultsEl.hidden;
    renderAnalysis(Object.assign({}, currentAnalysisSnapshot, { genre: trackGenreSelect.value }), { unlockedPremium: unlockedNow });
  }
});

function renderAnalysis({ title, lyricsRaw, audioMetrics, genre }, { unlockedPremium }) {
  const lyrics = analyzeLyrics(lyricsRaw, title);
  const profile = genreProfile(genre);

  const scores = {
    technik: scoreTechnik(audioMetrics, profile),
    lautheit: scoreLautheit(audioMetrics, profile.loudnessTarget),
    frequenz: scoreFrequenz(audioMetrics, profile.refs),
    hook: scoreHook(lyrics),
    titel: scoreTitel(lyrics),
  };

  // Hook & Songtitel sind die wichtigsten Wiedererkennungs-Hebel, deshalb zusammen die Haelfte
  // des Gesamtscores - nicht nur ein Nebenaspekt neben den technischen Werten.
  const weighted = [
    { score: scores.technik, weight: 18 },
    { score: scores.lautheit, weight: 12 },
    { score: scores.frequenz, weight: 20 },
    { score: scores.hook, weight: 25 },
    { score: scores.titel, weight: 25 },
  ].filter((x) => x.score !== null);

  const totalWeight = weighted.reduce((a, x) => a + x.weight, 0);
  const overallScore = Math.round(weighted.reduce((a, x) => a + x.score * x.weight, 0) / totalWeight);

  const soundScore = combineScores([scores.technik, scores.frequenz]);
  const starPotentialScore = scores.lautheit;
  const hookScore = combineScores([scores.hook, scores.titel]);

  const grade = gradeForScore(overallScore);
  document.getElementById("star-rating").innerHTML = starRatingHtml(grade.stars);
  const heroTitleEl = document.getElementById("hero-title");
  heroTitleEl.textContent = grade.title;
  heroTitleEl.style.color = grade.color;
  document.getElementById("hero-desc").textContent = grade.desc;
  lastShareInfo = { stars: grade.stars, title: grade.title, score: overallScore };
  const shareBtnEl = document.getElementById("share-result-btn");
  if (shareBtnEl) shareBtnEl.hidden = false;

  if (grade.celebrate) {
    fireConfetti(document.getElementById("confetti-layer"));
  }

  renderBadges(document.getElementById("badges"), [
    { label: t("badgeSound"), score: soundScore },
    { label: t("badgeStarPotential"), score: starPotentialScore },
    { label: t("badgeHook"), score: hookScore, mutedNote: t("meterLyricsMissing") },
  ]);

  const achievements = buildAchievements(audioMetrics, scores, profile.loudnessTarget);
  renderAchievements(document.getElementById("achievements"), achievements);

  initEqEditor(audioMetrics, profile);

  const tips = buildTips(audioMetrics, lyrics, scores, profile);
  const topTip = pickTopTip(tips);
  const teaserLabel = topTip.level === "good" ? t("teaserStrength") : t("teaserProblem");
  document.getElementById("teaser-tip").innerHTML = `<span class="mark">✦ ${teaserLabel}</span> ${topTip.problem}`;

  lastAnalysis = {
    overallScore,
    soundScore,
    starPotentialScore,
    hookScore,
    topIssues: tips.filter((tip) => tip.level !== "good").map((tip) => tip.text),
  };

  currentAnalysisSnapshot = { title, lyricsRaw, audioMetrics, genre };

  premiumResultsEl.hidden = !unlockedPremium;

  const metersEl = document.getElementById("meters");
  metersEl.innerHTML = "";
  renderMeter(metersEl, { name: t("meterTechnik"), score: scores.technik });
  renderMeter(metersEl, { name: t("meterLautheit"), score: scores.lautheit });
  renderMeter(metersEl, { name: t("meterFrequenz"), score: scores.frequenz });
  renderMeter(metersEl, {
    name: t("meterHook"),
    score: scores.hook,
    statusText: scores.hook === null ? t("meterLyricsMissing") : "",
  });
  renderMeter(metersEl, {
    name: t("meterTitel"),
    score: scores.titel,
    statusText: scores.titel === null ? (lyrics.hasLyrics ? t("meterTitleMissing") : t("meterLyricsMissing")) : "",
  });

  const detectedGenreEl = document.getElementById("detected-genre");
  if (audioMetrics.estimatedGenre && !audioMetrics.estimatedGenreLowConfidence) {
    const bpmText = audioMetrics.estimatedBpm ? `, ~${Math.round(audioMetrics.estimatedBpm)} BPM` : "";
    detectedGenreEl.textContent = t("detectedGenreAuto", { genre: genreLabel(audioMetrics.estimatedGenre), bpm: bpmText });
  } else if (audioMetrics.estimatedBpm) {
    detectedGenreEl.textContent = t("detectedGenreBpmOnly", { bpm: Math.round(audioMetrics.estimatedBpm) });
  } else {
    detectedGenreEl.textContent = "";
  }

  renderFreqChart(document.getElementById("freq-chart"), audioMetrics.bandPercents, profile.refs);
  renderTips(document.getElementById("tips-list"), tips);

  renderFazit(document.getElementById("fazit-block"), buildFazit(overallScore, tips));

  const rewriteBlock = document.getElementById("rewrite-block");
  rewriteBlock.hidden = !lyrics.hasLyrics;
  document.getElementById("rewrite-status").textContent = "";
  document.getElementById("rewrite-result").hidden = true;

  const vocalsBlockEl = document.getElementById("vocals-block");
  if (vocalsBlockEl) {
    vocalsBlockEl.hidden = !lyrics.hasLyrics;
    document.getElementById("vocals-status").textContent = "";
    document.getElementById("vocals-result").hidden = true;
    document.getElementById("vocals-choice").hidden = false;
  }

  const submissions = buildSubmissions(overallScore, genre);
  renderSubmissions(document.getElementById("submit-list"), document.getElementById("submit-hint"), submissions);

  freeResultsEl.hidden = false;
}

rewriteBtn.addEventListener("click", async () => {
  if (!SONGTEXT_WORKER_URL) {
    rewriteStatus.textContent = t("rewriteNotConfigured");
    return;
  }
  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;

  rewriteBtn.disabled = true;
  rewriteStatus.textContent = t("rewriteLoading");
  rewriteResult.hidden = false;
  rewriteClassification.textContent = "";
  rewriteTitleIdeas.innerHTML = "";
  rewriteOutput.textContent = "";

  const renderTitleIdeas = (ideas) => {
    rewriteTitleIdeas.innerHTML = "";
    for (const idea of ideas) {
      const li = document.createElement("li");
      li.textContent = idea;
      rewriteTitleIdeas.appendChild(li);
    }
  };

  try {
    const result = await streamKiEinschaetzung(
      title,
      lyricsRaw,
      lastAnalysis || {},
      currentAnalysisSnapshot ? currentAnalysisSnapshot.genre : "",
      (partial) => {
        if (partial.classification) rewriteClassification.textContent = partial.classification;
        if (partial.titleIdeas.length > 0) renderTitleIdeas(partial.titleIdeas);
        if (partial.improved) rewriteOutput.textContent = partial.improved;
      }
    );
    if (!result.classification) rewriteClassification.textContent = t("rewriteNoClassification");
    rewriteStatus.textContent = "";
  } catch (err) {
    rewriteResult.hidden = true;
    rewriteStatus.textContent = t("rewriteError", { msg: err && err.message ? err.message : t("unknownError") });
  } finally {
    rewriteBtn.disabled = false;
  }
});

unlockBtn.addEventListener("click", async () => {
  if (!currentAnalysisSnapshot) return;
  if (!currentUser) {
    toggleAuthCard(true);
    statusLine.textContent = t("unlockNeedLogin");
    return;
  }
  unlockBtn.disabled = true;
  const { ok, data } = await tryConsumeCredit();
  unlockBtn.disabled = false;
  if (ok) {
    currentUser = Object.assign({}, currentUser, { credits: data.credits, plan: data.plan });
    renderAccountBar();
    renderAnalysis(currentAnalysisSnapshot, { unlockedPremium: true });
    renderStreakNote(incrementCheckCount());
    premiumResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    openPricing(t("unlockNoCredits"));
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("audio-file");
  const file = fileInput.files[0];
  if (!file) return;

  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;
  const genreSelectEl = document.getElementById("track-genre");

  analyzeBtn.disabled = true;
  statusLine.textContent = t("statusLoadingAudio");

  try {
    const arrayBuffer = await file.arrayBuffer();
    statusLine.textContent = t("statusDecoding");
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    lastAudioBuffer = audioBuffer;

    statusLine.textContent = t("statusAnalyzing");
    await new Promise((r) => setTimeout(r, 10));
    const audioMetrics = analyzeAudioBuffer(audioBuffer);

    const genre = genreManuallySet ? genreSelectEl.value : audioMetrics.estimatedGenre || "";
    genreSelectEl.value = genre;

    renderAnalysis({ title, lyricsRaw, audioMetrics, genre }, { unlockedPremium: false });
    freeResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    statusLine.textContent = "";
    ctx.close();
  } catch (err) {
    console.error(err);
    statusLine.textContent = t("statusAnalyzeFailed", { msg: err && err.message ? err.message : t("unknownError") });
  } finally {
    analyzeBtn.disabled = false;
  }
});

/* ---------- Vocals-Check: Transkription der Gesangsspur im Browser (kein Upload) ----------
   Läuft komplett client-seitig über ein Whisper-Modell (transformers.js), das erst bei Klick
   nachgeladen wird (kein Effekt auf die normale Ladezeit der Seite). Das Audio verlässt dabei
   nie das Gerät - nur die Modell-Datei kommt von einem externen CDN (Hugging Face/jsDelivr),
   das ist keine Nutzerdaten-Übertragung. Transkription von Gesang ist von Natur aus
   fehleranfällig (Autotune, Beat, Slang) - Ergebnis wird bewusst als Hinweis, nicht als Fakt
   dargestellt. */

let lastAudioBuffer = null;
let vocalsWorker = null;

function getVocalsWorker() {
  if (!vocalsWorker) {
    vocalsWorker = new Worker("vocals-worker.js", { type: "module" });
  }
  return vocalsWorker;
}

// Transkribiert in einem eigenen Thread (vocals-worker.js) statt im UI-Thread - das Laden und
// Ausfuehren des Whisper-Modells wuerde sonst die ganze Seite blockieren/haengen lassen, bis es
// fertig ist (spuerbar vor allem auf dem Handy).
function transcribeInWorker(audioData, language, onProgress, onTranscribing) {
  return new Promise((resolve, reject) => {
    const worker = getVocalsWorker();
    const handleMessage = (event) => {
      const msg = event.data || {};
      if (msg.type === "progress") {
        onProgress(msg.progress);
      } else if (msg.type === "transcribing") {
        if (onTranscribing) onTranscribing();
      } else if (msg.type === "result") {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        resolve(msg.text);
      } else if (msg.type === "error") {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        reject(new Error(msg.message));
      }
    };
    const handleError = (err) => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      reject(new Error(err && err.message ? err.message : "Worker-Fehler"));
    };
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage({ audioData, language }, [audioData.buffer]);
  });
}

async function resampleTo16kMono(audioBuffer) {
  const targetRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetRate), targetRate);
  const src = offlineCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(offlineCtx.destination);
  src.start();
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

function tokenizeWords(text) {
  return normalizeText(text || "").split(/\s+/).filter(Boolean);
}

// Laengste gemeinsame Teilfolge (LCS) auf Wortebene: markiert, welche Woerter aus den
// eingegebenen Lyrics sich (in Reihenfolge) auch im Transkript wiederfinden lassen.
function lcsMatchedMask(intendedWords, transcribedWords) {
  const n = intendedWords.length;
  const m = transcribedWords.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        intendedWords[i - 1] === transcribedWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matched = new Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (intendedWords[i - 1] === transcribedWords[j - 1]) {
      matched[i - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matched;
}

function renderVocalsComparison(lyricsRaw, transcribedText) {
  const intendedWords = tokenizeWords(lyricsRaw);
  const transcribedWords = tokenizeWords(transcribedText);
  const matched = lcsMatchedMask(intendedWords, transcribedWords);
  const matchedCount = matched.filter(Boolean).length;
  const ratio = intendedWords.length > 0 ? matchedCount / intendedWords.length : 1;

  let summary;
  if (intendedWords.length === 0) {
    summary = t("vocalsNoLyricsForCompare");
  } else if (ratio >= 0.85) {
    summary = t("vocalsSummaryHigh", { pct: Math.round(ratio * 100) });
  } else if (ratio >= 0.6) {
    summary = t("vocalsSummaryMid", { pct: Math.round(ratio * 100) });
  } else {
    summary = t("vocalsSummaryLow", { pct: Math.round(ratio * 100) });
  }

  const highlighted = intendedWords
    .map((w, idx) => (matched[idx] ? w : `<mark>${w}</mark>`))
    .join(" ");

  return { summary, highlightedHtml: highlighted || t("vocalsNoText") };
}

const vocalsCheckBtn = document.getElementById("vocals-check-btn");
const vocalsSkipBtn = document.getElementById("vocals-skip-btn");
const vocalsChoice = document.getElementById("vocals-choice");
const vocalsStatus = document.getElementById("vocals-status");
const vocalsResult = document.getElementById("vocals-result");

if (vocalsSkipBtn) {
  vocalsSkipBtn.addEventListener("click", () => {
    vocalsChoice.hidden = true;
    vocalsStatus.textContent = t("vocalsSkipMsg");
  });
}

if (vocalsCheckBtn) {
  vocalsCheckBtn.addEventListener("click", async () => {
    if (!lastAudioBuffer) {
      vocalsStatus.textContent = t("vocalsNoAudio");
      return;
    }
    const lyricsRaw = document.getElementById("track-lyrics").value;
    if (!lyricsRaw.trim()) {
      vocalsStatus.textContent = t("vocalsNoLyrics");
      return;
    }

    vocalsChoice.hidden = true;
    vocalsCheckBtn.disabled = true;
    vocalsResult.hidden = true;
    vocalsStatus.textContent = t("vocalsLoadingModel");

    try {
      vocalsStatus.textContent = t("vocalsPreparingAudio");
      const audioData = await resampleTo16kMono(lastAudioBuffer);

      const transcribedRaw = await transcribeInWorker(
        audioData,
        "german",
        (progress) => {
          vocalsStatus.textContent = t("vocalsLoadingModelProgress", { pct: Math.round(progress) });
        },
        () => {
          vocalsStatus.textContent = t("vocalsTranscribing");
        }
      );
      const transcribedText = (transcribedRaw || "").trim();

      if (!transcribedText) {
        vocalsStatus.textContent = t("vocalsNoUsableTranscript");
        vocalsChoice.hidden = false;
        return;
      }

      const { summary, highlightedHtml } = renderVocalsComparison(lyricsRaw, transcribedText);
      document.getElementById("vocals-summary").textContent = summary;
      document.getElementById("vocals-lyrics-highlighted").innerHTML = highlightedHtml;
      document.getElementById("vocals-transcript").textContent = transcribedText;
      vocalsResult.hidden = false;
      vocalsStatus.textContent = "";
    } catch (err) {
      vocalsStatus.textContent = t("vocalsFailed", { msg: err && err.message ? err.message : t("unknownError") });
      vocalsChoice.hidden = false;
    } finally {
      vocalsCheckBtn.disabled = false;
    }
  });
}

/* ---------- EQ-Editor: Frequenzen direkt im Browser anpassen (kein Mastering) ----------
   Peaking-Filter (BiquadFilterNode) pro Frequenzband, live vorhoerbar und als WAV exportierbar.
   Alles client-seitig ueber Web Audio, kein Upload noetig - passt zur bestehenden
   "Audio verlaesst nie dein Geraet"-Architektur. */

function suggestedEqGainDb(val, lo, hi) {
  if (val < lo - 3) return +(10 * Math.log10(Math.max(lo, 0.5) / Math.max(val, 0.1))).toFixed(1);
  if (val > hi + 3) return -(10 * Math.log10(Math.max(val, 0.1) / Math.max(hi, 0.5))).toFixed(1);
  return 0;
}

const EQ_BAND_Q = 1;
let eqAudioCtx = null;
let eqSourceNode = null;
let eqFilters = [];
let eqPlaying = false;
let eqGains = FREQ_BANDS.map(() => 0);
let eqDeEsserEnabled = false;
let eqDeEsserAmount = 0.5;
let eqDeEsserNodes = null;
let eqGainDb = 0;
let eqGainNode = null;
let eqTrimIntroEnabled = false;
let eqFadeOutEnabled = false;
let eqLastMetrics = null;
let eqLastProfile = null;

function ensureEqAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!eqAudioCtx) eqAudioCtx = new Ctx();
  if (eqAudioCtx.state === "suspended") eqAudioCtx.resume();
  return eqAudioCtx;
}

// Gibt die Filterkette zurueck, OHNE sie ans Ziel anzuschliessen - der Aufrufer haengt je
// nach De-Esser-Status entweder direkt destination oder den De-Esser-Signalpfad dahinter.
function buildEqFilterChain(ctx, gains) {
  const filters = FREQ_BANDS.map((band, i) => {
    const f = ctx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = bandCenterHz(band);
    f.Q.value = EQ_BAND_Q;
    f.gain.value = gains[i] || 0;
    return f;
  });
  for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
  return filters;
}

// Echter De-Esser statt statischem EQ-Cut: eine feste Grund-Absenkung im Zischlaut-Bereich
// (Notch) wird durch einen dynamisch komprimierten Anteil desselben Bereichs wieder aufgefuellt.
// Bei ruhigen Passagen gleicht sich das etwa aus, bei einer lauten Zischlaut-Spitze komprimiert
// der Compressor den zurueckgemischten Anteil staerker weg - Nettoeffekt: Reduktion genau dann,
// wenn's tatsaechlich zischt, nicht pauschal wie ein normaler EQ-Cut.
// Verbindet NICHT selbst ans Ziel - gibt stattdessen den Ausgabeknoten zurueck, damit der
// Aufrufer die Kette flexibel weiterfuehren kann (z.B. noch eine Gain-Stufe danach).
function attachDeEsser(ctx, inputNode, amount) {
  const notch = ctx.createBiquadFilter();
  notch.type = "peaking";
  notch.frequency.value = 6500;
  notch.Q.value = 1.1;
  notch.gain.value = -12 * amount;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 6500;
  bandpass.Q.value = 1.1;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -32;
  compressor.knee.value = 6;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.12;

  const sidechainGain = ctx.createGain();
  sidechainGain.gain.value = amount;

  const sumGain = ctx.createGain();
  sumGain.gain.value = 1;

  inputNode.connect(notch);
  notch.connect(sumGain);

  inputNode.connect(bandpass);
  bandpass.connect(compressor);
  compressor.connect(sidechainGain);
  sidechainGain.connect(sumGain);

  return { output: sumGain, notch, sidechainGain };
}

// Erstellt bei Bedarf eine gekuerzte Kopie des Buffers (Intro-Stille entfernt). Braucht einen
// AudioContext/OfflineAudioContext zum Anlegen des neuen Buffers.
function getEqSourceBuffer(ctx) {
  if (!eqTrimIntroEnabled || !eqLastMetrics || !eqLastMetrics.introSilenceMs || eqLastMetrics.introSilenceMs < 50) {
    return lastAudioBuffer;
  }
  const sampleRate = lastAudioBuffer.sampleRate;
  const trimSamples = Math.min(lastAudioBuffer.length - 1, Math.round((eqLastMetrics.introSilenceMs / 1000) * sampleRate));
  const newLength = lastAudioBuffer.length - trimSamples;
  const trimmed = ctx.createBuffer(lastAudioBuffer.numberOfChannels, newLength, sampleRate);
  for (let ch = 0; ch < lastAudioBuffer.numberOfChannels; ch++) {
    trimmed.getChannelData(ch).set(lastAudioBuffer.getChannelData(ch).subarray(trimSamples));
  }
  return trimmed;
}

function scheduleFadeOut(gainNode, startTime, duration, fadeSeconds) {
  const fadeStart = startTime + Math.max(0, duration - fadeSeconds);
  gainNode.gain.setValueAtTime(gainNode.gain.value, fadeStart);
  gainNode.gain.linearRampToValueAtTime(0.0001, fadeStart + fadeSeconds);
}

function updateDeEsserAmount(nodes, amount) {
  if (!nodes) return;
  nodes.notch.gain.value = -12 * amount;
  nodes.sidechainGain.gain.value = amount;
}

function stopEqPreview() {
  if (eqSourceNode) {
    try {
      eqSourceNode.stop();
    } catch {
      /* schon gestoppt */
    }
    eqSourceNode.disconnect();
    eqSourceNode = null;
  }
  eqFilters = [];
  eqDeEsserNodes = null;
  eqGainNode = null;
  eqPlaying = false;
  const btn = document.getElementById("eq-play-btn");
  if (btn) btn.textContent = t("eqPlayBtn");
}

function startEqPreview() {
  if (!lastAudioBuffer) return;
  stopEqPreview();
  const ctx = ensureEqAudioCtx();
  const sourceBuffer = getEqSourceBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = sourceBuffer;
  // Mit Fade-out ergibt eine Endlos-Schleife keinen Sinn (man wuerde den harten Sprung nach
  // dem Fade hoeren) - dann einmalig abspielen statt loopen.
  source.loop = !eqFadeOutEnabled;

  const filters = buildEqFilterChain(ctx, eqGains);
  source.connect(filters[0]);
  let chainOutput = filters[filters.length - 1];

  if (eqDeEsserEnabled) {
    const de = attachDeEsser(ctx, chainOutput, eqDeEsserAmount);
    eqDeEsserNodes = de;
    chainOutput = de.output;
  } else {
    eqDeEsserNodes = null;
  }

  const gainNode = ctx.createGain();
  gainNode.gain.value = Math.pow(10, eqGainDb / 20);
  chainOutput.connect(gainNode);
  gainNode.connect(ctx.destination);
  eqGainNode = gainNode;

  if (eqFadeOutEnabled) {
    scheduleFadeOut(gainNode, ctx.currentTime, sourceBuffer.duration, Math.min(2.5, sourceBuffer.duration / 3));
  }

  source.start();
  eqSourceNode = source;
  eqFilters = filters;
  eqPlaying = true;
  const btn = document.getElementById("eq-play-btn");
  if (btn) btn.textContent = t("eqPlayBtnStop");
}

function updateEqFilterGains() {
  eqFilters.forEach((f, i) => {
    f.gain.value = eqGains[i] || 0;
  });
}

// WAV hat kein ID3, aber einen offiziellen LIST/INFO-Chunk fuer Metadaten (Titel/Kuenstler),
// den gaengige Player und DAWs auslesen - so kommt eine korrekt beschriftete Datei raus, auch
// wenn die Original-Metadaten des hochgeladenen Tracks nicht stimmten.
function buildWavListInfoChunk(tags) {
  const entries = [];
  if (tags && tags.title) entries.push(["INAM", tags.title]);
  if (tags && tags.artist) entries.push(["IART", tags.artist]);
  if (entries.length === 0) return new Uint8Array(0);

  const encoder = new TextEncoder();
  const subchunks = entries.map(([id, text]) => {
    const bytes = encoder.encode(text);
    const declaredSize = bytes.length + 1; // + Null-Terminator
    const paddedLength = declaredSize % 2 === 0 ? declaredSize : declaredSize + 1;
    const data = new Uint8Array(paddedLength);
    data.set(bytes, 0);
    return { id, data, declaredSize };
  });

  const infoBodySize = 4 + subchunks.reduce((sum, s) => sum + 8 + s.data.length, 0); // "INFO" + je Subchunk
  const total = 8 + infoBodySize; // "LIST" + Groessenfeld + infoBodySize
  const buf = new Uint8Array(total);
  const view = new DataView(buf.buffer);
  let offset = 0;
  function writeStr(str) {
    for (let i = 0; i < str.length; i++) buf[offset + i] = str.charCodeAt(i);
    offset += str.length;
  }
  writeStr("LIST");
  view.setUint32(offset, infoBodySize, true);
  offset += 4;
  writeStr("INFO");
  for (const s of subchunks) {
    writeStr(s.id);
    view.setUint32(offset, s.declaredSize, true);
    offset += 4;
    buf.set(s.data, offset);
    offset += s.data.length;
  }
  return buf;
}

function audioBufferToWavBlob(buffer, tags) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const listChunk = buildWavListInfoChunk(tags);
  const arr = new ArrayBuffer(44 + dataSize + listChunk.length);
  const view = new DataView(arr);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize + listChunk.length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }
  if (listChunk.length > 0) {
    new Uint8Array(arr, 44 + dataSize, listChunk.length).set(listChunk);
  }
  return new Blob([arr], { type: "audio/wav" });
}

function sanitizeFilename(str) {
  return str
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function renderEqSliders() {
  const container = document.getElementById("eq-sliders");
  if (!container) return;
  container.innerHTML = "";
  FREQ_BANDS.forEach((band, i) => {
    const wrap = document.createElement("div");
    wrap.className = "eq-slider";
    wrap.innerHTML = `
      <span class="eq-value" id="eq-value-${i}">${eqGains[i].toFixed(1)} dB</span>
      <input type="range" id="eq-band-${i}" min="-12" max="12" step="0.5" value="${eqGains[i]}" />
      <label for="eq-band-${i}">${bandLabel(band)}</label>
    `;
    container.appendChild(wrap);
    const input = wrap.querySelector("input");
    input.addEventListener("input", () => {
      eqGains[i] = Number(input.value);
      document.getElementById(`eq-value-${i}`).textContent = `${eqGains[i].toFixed(1)} dB`;
      if (eqPlaying) updateEqFilterGains();
    });
  });
}

function initEqEditor(audioMetrics, profile) {
  eqLastMetrics = audioMetrics;
  eqLastProfile = profile;
  eqGains = FREQ_BANDS.map(() => 0);
  eqDeEsserEnabled = false;
  eqDeEsserAmount = 0.5;
  eqGainDb = 0;
  eqTrimIntroEnabled = false;
  eqFadeOutEnabled = false;
  stopEqPreview();
  renderEqSliders();
  const status = document.getElementById("eq-status");
  if (status) status.textContent = "";
  const deEsserCheckbox = document.getElementById("eq-deesser-enabled");
  if (deEsserCheckbox) deEsserCheckbox.checked = false;
  const strengthWrap = document.getElementById("eq-deesser-strength-wrap");
  if (strengthWrap) strengthWrap.hidden = true;
  const strengthSlider = document.getElementById("eq-deesser-strength");
  if (strengthSlider) strengthSlider.value = 50;
  const strengthValue = document.getElementById("eq-deesser-strength-value");
  if (strengthValue) strengthValue.textContent = "50%";
  const gainSlider = document.getElementById("eq-gain");
  if (gainSlider) gainSlider.value = 0;
  const gainValue = document.getElementById("eq-gain-value");
  if (gainValue) gainValue.textContent = "0.0 dB";
  const trimCheckbox = document.getElementById("eq-trim-intro");
  if (trimCheckbox) trimCheckbox.checked = false;
  const fadeCheckbox = document.getElementById("eq-fadeout");
  if (fadeCheckbox) fadeCheckbox.checked = false;
  const metaTitleEl = document.getElementById("eq-meta-title");
  if (metaTitleEl) metaTitleEl.value = document.getElementById("track-title").value || "";
  const metaArtistEl = document.getElementById("eq-meta-artist");
  if (metaArtistEl) metaArtistEl.value = "";

  // Beheben (EQ/De-Esser/Lautheit/Trim/Fade) ist Pro-exklusiv - die Vollanalyse selbst bleibt
  // fuer jede freigeschaltete Analyse verfuegbar (Credits oder Pro).
  const isPro = !!currentUser && (currentUser.plan === "pro" || currentUser.plan === "pro_annual");
  const lockedEl = document.getElementById("eq-editor-locked");
  const bodyEl = document.getElementById("eq-editor-body");
  if (lockedEl) lockedEl.hidden = isPro;
  if (bodyEl) bodyEl.hidden = !isPro;
}

const eqEditorUpgradeBtn = document.getElementById("eq-editor-upgrade-btn");
if (eqEditorUpgradeBtn) {
  eqEditorUpgradeBtn.addEventListener("click", () => {
    openPricing(t("eqEditorProOnlyMsg"));
  });
}

const eqSuggestBtn = document.getElementById("eq-suggest-btn");
const eqResetBtn = document.getElementById("eq-reset-btn");
const eqPlayBtn = document.getElementById("eq-play-btn");
const eqDownloadBtn = document.getElementById("eq-download-btn");
const eqStatus = document.getElementById("eq-status");
const eqDeEsserEnabledEl = document.getElementById("eq-deesser-enabled");
const eqDeEsserStrengthWrap = document.getElementById("eq-deesser-strength-wrap");
const eqDeEsserStrengthEl = document.getElementById("eq-deesser-strength");
const eqDeEsserStrengthValueEl = document.getElementById("eq-deesser-strength-value");

if (eqDeEsserEnabledEl) {
  eqDeEsserEnabledEl.addEventListener("change", () => {
    eqDeEsserEnabled = eqDeEsserEnabledEl.checked;
    if (eqDeEsserStrengthWrap) eqDeEsserStrengthWrap.hidden = !eqDeEsserEnabled;
    if (eqPlaying) startEqPreview(); // Graph neu aufbauen, damit De-Esser sauber rein/raus geschaltet wird
  });
}

if (eqDeEsserStrengthEl) {
  eqDeEsserStrengthEl.addEventListener("input", () => {
    eqDeEsserAmount = Number(eqDeEsserStrengthEl.value) / 100;
    if (eqDeEsserStrengthValueEl) eqDeEsserStrengthValueEl.textContent = `${eqDeEsserStrengthEl.value}%`;
    if (eqPlaying && eqDeEsserNodes) updateDeEsserAmount(eqDeEsserNodes, eqDeEsserAmount);
  });
}

const eqGainEl = document.getElementById("eq-gain");
const eqGainValueEl = document.getElementById("eq-gain-value");
const eqGainMatchBtn = document.getElementById("eq-gain-match-btn");
const eqTrimIntroEl = document.getElementById("eq-trim-intro");
const eqFadeOutEl = document.getElementById("eq-fadeout");

if (eqGainEl) {
  eqGainEl.addEventListener("input", () => {
    eqGainDb = Number(eqGainEl.value);
    if (eqGainValueEl) eqGainValueEl.textContent = `${eqGainDb.toFixed(1)} dB`;
    if (eqPlaying && eqGainNode) eqGainNode.gain.value = Math.pow(10, eqGainDb / 20);
  });
}

if (eqGainMatchBtn) {
  eqGainMatchBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    const suggested = Math.max(-12, Math.min(12, eqLastProfile.loudnessTarget - eqLastMetrics.loudnessDb));
    eqGainDb = Math.round(suggested * 2) / 2;
    if (eqGainEl) eqGainEl.value = eqGainDb;
    if (eqGainValueEl) eqGainValueEl.textContent = `${eqGainDb.toFixed(1)} dB`;
    if (eqPlaying && eqGainNode) eqGainNode.gain.value = Math.pow(10, eqGainDb / 20);
    if (eqStatus) eqStatus.textContent = t("eqGainMatched");
  });
}

if (eqTrimIntroEl) {
  eqTrimIntroEl.addEventListener("change", () => {
    eqTrimIntroEnabled = eqTrimIntroEl.checked;
    if (eqPlaying) startEqPreview();
  });
}

if (eqFadeOutEl) {
  eqFadeOutEl.addEventListener("change", () => {
    eqFadeOutEnabled = eqFadeOutEl.checked;
    if (eqPlaying) startEqPreview();
  });
}

if (eqSuggestBtn) {
  eqSuggestBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    eqGains = FREQ_BANDS.map((band, i) => {
      const [lo, hi] = eqLastProfile.refs[i];
      const suggested = suggestedEqGainDb(eqLastMetrics.bandPercents[i], lo, hi);
      return Math.max(-12, Math.min(12, suggested));
    });
    renderEqSliders();
    if (eqPlaying) updateEqFilterGains();
    if (eqStatus) eqStatus.textContent = t("eqSuggestionApplied");
  });
}

if (eqResetBtn) {
  eqResetBtn.addEventListener("click", () => {
    eqGains = FREQ_BANDS.map(() => 0);
    eqGainDb = 0;
    eqDeEsserEnabled = false;
    eqTrimIntroEnabled = false;
    eqFadeOutEnabled = false;
    renderEqSliders();
    if (eqGainEl) eqGainEl.value = 0;
    if (eqGainValueEl) eqGainValueEl.textContent = "0.0 dB";
    if (eqDeEsserEnabledEl) eqDeEsserEnabledEl.checked = false;
    if (eqDeEsserStrengthWrap) eqDeEsserStrengthWrap.hidden = true;
    if (eqTrimIntroEl) eqTrimIntroEl.checked = false;
    if (eqFadeOutEl) eqFadeOutEl.checked = false;
    if (eqPlaying) startEqPreview();
    if (eqStatus) eqStatus.textContent = t("eqResetDone");
  });
}

if (eqPlayBtn) {
  eqPlayBtn.addEventListener("click", () => {
    if (!lastAudioBuffer) {
      if (eqStatus) eqStatus.textContent = t("eqNeedTrackFirst");
      return;
    }
    try {
      if (eqPlaying) {
        stopEqPreview();
        if (eqStatus) eqStatus.textContent = "";
      } else {
        startEqPreview();
        if (eqStatus) eqStatus.textContent = t("eqPreviewPlaying");
      }
    } catch (err) {
      if (eqStatus) eqStatus.textContent = t("eqPreviewFailed", { msg: err && err.message ? err.message : t("unknownError") });
    }
  });
}

if (eqDownloadBtn) {
  eqDownloadBtn.addEventListener("click", async () => {
    if (!lastAudioBuffer) {
      if (eqStatus) eqStatus.textContent = t("eqNeedTrackFirst");
      return;
    }
    eqDownloadBtn.disabled = true;
    if (eqStatus) eqStatus.textContent = t("eqRendering");
    try {
      const helperCtx = ensureEqAudioCtx();
      const sourceBuffer = getEqSourceBuffer(helperCtx);
      const offlineCtx = new OfflineAudioContext(
        sourceBuffer.numberOfChannels,
        sourceBuffer.length,
        sourceBuffer.sampleRate
      );
      const source = offlineCtx.createBufferSource();
      source.buffer = sourceBuffer;
      const filters = buildEqFilterChain(offlineCtx, eqGains);
      source.connect(filters[0]);
      let chainOutput = filters[filters.length - 1];
      if (eqDeEsserEnabled) {
        const de = attachDeEsser(offlineCtx, chainOutput, eqDeEsserAmount);
        chainOutput = de.output;
      }
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = Math.pow(10, eqGainDb / 20);
      chainOutput.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      if (eqFadeOutEnabled) {
        scheduleFadeOut(gainNode, 0, sourceBuffer.duration, Math.min(2.5, sourceBuffer.duration / 3));
      }
      source.start();
      const rendered = await offlineCtx.startRendering();
      const metaTitleEl = document.getElementById("eq-meta-title");
      const metaArtistEl = document.getElementById("eq-meta-artist");
      const tagTitle = metaTitleEl ? metaTitleEl.value.trim() : "";
      const tagArtist = metaArtistEl ? metaArtistEl.value.trim() : "";
      const blob = audioBufferToWavBlob(rendered, { title: tagTitle, artist: tagArtist });
      const baseName = sanitizeFilename(tagTitle) || "overhertz-eq-bearbeitet";
      downloadBlob(blob, `${baseName}.wav`);
      if (eqStatus) eqStatus.textContent = t("eqDownloadStarted");
    } catch (err) {
      if (eqStatus) eqStatus.textContent = t("eqRenderFailed", { msg: err && err.message ? err.message : t("unknownError") });
    } finally {
      eqDownloadBtn.disabled = false;
    }
  });
}

/* ---------- Album-Check (Pro-Feature: mehrere Tracks am Stück pruefen) ---------- */

const albumBtn = document.getElementById("album-analyze-btn");
const albumFilesInput = document.getElementById("album-files");
const albumStatus = document.getElementById("album-status");
const albumResults = document.getElementById("album-results");

if (albumBtn) {
  albumBtn.addEventListener("click", async () => {
    const files = Array.from((albumFilesInput && albumFilesInput.files) || []);
    if (files.length === 0) {
      albumStatus.textContent = t("albumNeedFile");
      return;
    }
    if (!currentUser) {
      toggleAuthCard(true);
      albumStatus.textContent = t("albumNeedLogin");
      return;
    }
    if (currentUser.plan !== "pro" && currentUser.plan !== "pro_annual") {
      openPricing(t("albumProOnly"));
      return;
    }

    albumBtn.disabled = true;
    albumResults.innerHTML = "";
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const profile = genreProfile("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      albumStatus.textContent = t("albumChecking", { i: i + 1, total: files.length, name: file.name });

      const { ok, data } = await tryConsumeCredit();
      if (!ok) {
        albumStatus.textContent = t("albumQuotaExhausted", { i: i + 1, total: files.length, err: data.error || t("albumNoChecksLeft") });
        break;
      }
      currentUser = Object.assign({}, currentUser, { credits: data.credits, plan: data.plan });
      renderAccountBar();

      const card = document.createElement("div");
      card.className = "album-track";
      albumResults.appendChild(card);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const audioMetrics = analyzeAudioBuffer(audioBuffer);
        ctx.close();

        const scores = {
          technik: scoreTechnik(audioMetrics, profile),
          lautheit: scoreLautheit(audioMetrics, profile.loudnessTarget),
          frequenz: scoreFrequenz(audioMetrics, profile.refs),
          hook: null,
          titel: null,
        };
        const weighted = [
          { score: scores.technik, weight: 40 },
          { score: scores.lautheit, weight: 30 },
          { score: scores.frequenz, weight: 30 },
        ];
        const overallScore = Math.round(weighted.reduce((a, x) => a + x.score * x.weight, 0) / 100);
        const grade = gradeForScore(overallScore);
        const tips = buildTips(audioMetrics, { hasLyrics: false, hasTitle: false }, scores, profile);
        const topTip = pickTopTip(tips);

        card.innerHTML = `
          <div class="album-track-head">
            <span class="album-track-name">${file.name}</span>
            <span class="album-track-score" style="color:${grade.color}">${overallScore}/100 · ${grade.title}</span>
          </div>
          <p class="album-track-tip">${topTip.text}</p>
        `;
      } catch (err) {
        card.innerHTML = `
          <div class="album-track-head"><span class="album-track-name">${file.name}</span></div>
          <p class="album-track-tip">${t("albumTrackError", { msg: err && err.message ? err.message : t("albumAnalysisFailed") })}</p>
        `;
      }
    }

    albumStatus.textContent = "";
    albumBtn.disabled = false;
  });
}

/* ---------- Seitenweiter Frequenzlinien-Hintergrund (Canvas) ----------
   Laeuft durchgehend hinter dem gesamten Inhalt, nicht nur in einem kleinen Header-Widget -
   das war explizites Feedback ("die ganze Seite soll in Bewegung sein"). */

// Der einmalige Glanzstreifen wird nach seiner Animation wieder aus dem DOM entfernt -
// er wird nur beim ersten Seitenaufruf gebraucht, danach ist er nur totes Gewicht.
(function cleanupPageShineStreak() {
  const streak = document.getElementById("page-shine-streak");
  if (!streak) return;
  streak.addEventListener("animationend", () => streak.remove());
  setTimeout(() => streak.remove(), 4000);
})();

(function initBgWaves() {
  const canvas = document.getElementById("bg-waves");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const waves = [
    { amp: 30, freq: 0.0016, speed: 0.35, phase: 0, yRatio: 0.14, color: "205,168,107", widthPx: 1.6, alpha: 0.55 },
    { amp: 18, freq: 0.0024, speed: 0.5, phase: 2.1, yRatio: 0.24, color: "95,184,199", widthPx: 1.4, alpha: 0.42 },
    { amp: 38, freq: 0.0011, speed: -0.28, phase: 4.2, yRatio: 0.42, color: "205,168,107", widthPx: 1.3, alpha: 0.3 },
    { amp: 16, freq: 0.0028, speed: 0.6, phase: 1.3, yRatio: 0.66, color: "95,184,199", widthPx: 1.2, alpha: 0.24 },
    { amp: 24, freq: 0.0018, speed: -0.4, phase: 5.5, yRatio: 0.86, color: "205,168,107", widthPx: 1.2, alpha: 0.2 },
    { amp: 20, freq: 0.0021, speed: 0.45, phase: 3.3, yRatio: 1.05, color: "95,184,199", widthPx: 1.1, alpha: 0.16 },
  ];

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const step = width > 900 ? 5 : 8;
    for (const w of waves) {
      ctx.beginPath();
      const y0 = height * w.yRatio;
      for (let x = 0; x <= width; x += step) {
        const y = y0 + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${w.color}, ${w.alpha})`;
      ctx.lineWidth = w.widthPx;
      ctx.stroke();
    }
    t += 0.016;
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------- Nach Rückkehr von der Stripe-Zahlung: Konto aktualisieren und Analyse freischalten ---------- */

(async function init() {
  await refreshAccount();

  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");
  if (!checkout) return;
  history.replaceState({}, "", window.location.pathname);

  const snapshotRaw = sessionStorage.getItem(ANALYSIS_SNAPSHOT_KEY);
  if (!snapshotRaw) return;
  const snapshot = JSON.parse(snapshotRaw);

  if (checkout !== "success") {
    renderAnalysis(snapshot, { unlockedPremium: false });
    return;
  }

  statusLine.textContent = t("checkoutProcessing");
  let unlocked = false;
  let lastData = null;
  for (let attempt = 0; attempt < 6 && !unlocked; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      await refreshAccount();
    }
    const result = await tryConsumeCredit();
    lastData = result.data;
    if (result.ok) {
      currentUser = Object.assign({}, currentUser, { credits: result.data.credits, plan: result.data.plan });
      renderAccountBar();
      unlocked = true;
    }
  }

  renderAnalysis(snapshot, { unlockedPremium: unlocked });
  if (unlocked) {
    renderStreakNote(incrementCheckCount());
    statusLine.textContent = "";
    premiumResultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    statusLine.textContent = t("checkoutStillProcessing", {
      err: lastData && lastData.error ? lastData.error : t("checkoutPleaseWait"),
    });
  }
})();

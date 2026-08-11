"use strict";

/* ---------- i18n: Sprachumschalter DE/EN ----------
   Statische Texte laufen ueber data-i18n-Attribute im HTML (applyStaticTranslations), alle
   dynamisch generierten Texte (Tipps, Fazit, Status-Meldungen etc.) ueber t(key, vars). Sprache
   wird per ?lang= URL-Parameter, danach localStorage, danach Browsersprache bestimmt - so lassen
   sich beide Sprachversionen unter eigener URL verlinken/veroeffentlichen, ohne zwei HTML-Dateien
   parallel pflegen zu muessen. Rechtstexte (Impressum/Datenschutz) bleiben bewusst nur Deutsch. */

const LANG_KEY = "overhertz_lang";
// 100 MB deckt auch unkomprimiertes WAV bei ueblicher Songlaenge grosszuegig ab, verhindert aber,
// dass der Browser (v.a. auf dem Handy) an einer versehentlich riesigen Datei haengen bleibt oder
// abstuerzt - decodeAudioData laedt die komplette Datei unkomprimiert in den Speicher.
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

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
    passwordShowLabel: "Passwort anzeigen",
    passwordHideLabel: "Passwort verbergen",
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
    lyricsPlaceholder: "Songtext eintragen für präzisen Vergleich beim Vocals-Check.",
    genreLabel: "Genre",
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
    genreDeutschrap: "Deutschrap",
    genreTrap: "Trap",
    genreDrill: "Drill",
    genreRnb: "R&B",
    genreHouse: "House",
    genrePhonk: "Phonk",
    genreCountry: "Country",
    analyzeBtn: "Analyse starten",
    albumHeading: "Album-Check",
    albumHint: "Mehrere Tracks auf einmal prüfen (Kurz-Check: Klangqualität, Lautheit, Frequenzbalance). Teil des Pro-Plans – jeder Track zählt als ein Check von deinem Monats-Kontingent.",
    albumFilesLabel: "Tracks auswählen",
    albumAnalyzeBtn: "Album analysieren",
    heroEyebrow: "Dein Ergebnis",
    shareBtn: "Ergebnis teilen",
    shareText: "Mein Track hat auf Overhertz {stars}/5 Sterne erreicht – „{title}“ ({score}/100). Check deinen Track auch kostenlos:",
    shareCopied: "Link kopiert!",
    shareCardCta: "Kostenlosen Kurzcheck auf overhertz.app",
    unlockTitle: "Willst du wissen, woran's genau liegt – und wie du's behebst?",
    unlockDesc: "Frequenzkurve im Detail, alle Verbesserungstipps und wohin du den Track am besten einreichst.",
    unlockBtn: "Vollanalyse ansehen",
    unlockNote: "5 Credits für 7 € oder Pro-Abo ab 9,50 €/Monat",
    premiumHeading: "Die Tiefenanalyse",
    exportPdfBtn: "Als PDF exportieren",
    zoneFacts: "Die Fakten — objektiv gemessen",
    freqBlockHeading: "Frequenzbalance",
    freqBlockHint: "Anteil der Energie je Frequenzband. Grün = im Referenzbereich, Gelb/Rot = spürbar drüber oder drunter.",
    refCompareLabel: "Mit einem Referenz-Track vergleichen (optional)",
    refCompareHint: "Lad z. B. einen Hit aus deinem Genre hoch – bleibt nur in deinem Browser, wird nirgends hochgeladen.",
    refCompareOwn: "Dein Track",
    refCompareRef: "Referenz-Track",
    refCompareMore: "Größter Unterschied: {band} ist bei dir {diff} Prozentpunkte stärker vertreten als beim Referenz-Track.",
    refCompareLess: "Größter Unterschied: {band} ist bei dir {diff} Prozentpunkte schwächer vertreten als beim Referenz-Track.",
    refCompareEqual: "Deine Frequenzbalance ist der des Referenz-Tracks sehr ähnlich.",
    refCompareNoOwnTrack: "Erst deinen eigenen Track analysieren, dann vergleichen.",
    refCompareError: "Referenz-Track konnte nicht gelesen werden – anderes Format probieren.",
    formatCheckHeading: "Formatcheck",
    formatCheckHint: "Technische Anforderungen und Titel-Metadaten, wie sie Distributoren prüfen – unabhängig vom Klang.",
    formatTitleEmoji: "Titel enthält Emojis – bei den meisten Distributoren nicht erlaubt.",
    formatTitleAllCaps: "Titel steht komplett in Großbuchstaben – viele Distributoren normalisieren oder lehnen das ab.",
    formatTitleFeat: "„feat.“ ist nicht im üblichen Format – gängig ist „Songtitel (feat. Name)“.",
    formatTitleChars: "Titel enthält Sonderzeichen, die bei manchen Distributoren Probleme machen: {chars}",
    formatTitleOk: "Titel-Format sieht sauber aus.",
    formatDurationTooShort: "Track ist nur {s}s lang – unter 30 Sekunden zählt laut Spotify kein Stream.",
    formatDurationOk: "Länge ({time}) ist für die Einreichung unproblematisch.",
    formatSampleRateLow: "Samplerate ({hz} Hz) liegt unter dem Distributor-Standard von 44.1 kHz.",
    formatSampleRateOk: "Samplerate ({hz} Hz) erfüllt den Standard.",
    formatBitDepthLow: "Bittiefe ({bits} Bit) liegt unter dem Distributor-Standard von 16 Bit.",
    formatBitDepthOk: "Bittiefe ({bits} Bit) erfüllt den Standard.",
    formatLossyUpload: "Hochgeladen als komprimiertes {ext}-Format – zum Prüfen hier okay, für die tatsächliche Einreichung bei Distributoren meist eine unkomprimierte WAV-Datei nötig.",
    eqHeading: "EQ-Editor",
    eqIntro: "Passe die Frequenzen deines Tracks direkt hier an und hör dir das Ergebnis sofort an. Läuft komplett in deinem Browser, deine Audiodatei verlässt dabei nie dein Gerät.",
    eqSpectrumHint: "Wellenform deines Tracks – die goldene Markierung zeigt die Abspielposition, die goldene Kurve darüber deine aktuelle EQ-Einstellung und reagiert sofort, wenn du an den Reglern unten drehst.",
    eqLockedHint: "Das Beheben (EQ, De-Esser, Lautheit angleichen, Stille kürzen, Fade-out) ist Teil des Pro-Plans. Die Vollanalyse siehst du auch mit Credits – fürs direkte Bearbeiten hier brauchst du Pro.",
    eqUpgradeBtn: "Auf Pro upgraden",
    eqDeesserToggle: "Zischlaute reduzieren (De-Esser)",
    eqDeesserAutoBtn: "Nach unserer Empfehlung",
    eqDeesserAutoApplied: "Empfohlene De-Esser-Einstellung für diesen Track übernommen.",
    eqDeesserAutoNotNeeded: "Kein spürbares Zischeln erkannt – De-Esser ist bei diesem Track nicht nötig.",
    eqDeesserStrength: "Stärke",
    eqDeesserHint: "Reduziert scharfe Zischlaute (typ. 5–8 kHz) nur dann, wenn sie tatsächlich spitzen – im Gegensatz zu den Reglern oben, die pauschal einen Bereich absenken. „Nach unserer Empfehlung“ setzt Stärke automatisch anhand deines Tracks, du kannst danach jederzeit selbst nachjustieren.",
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
    rewriteHint: "Läuft automatisch: Einordnung, Titel-Ideen und ein verfeinerter Songtext von der KI – Stil, Sprache und Aussage bleiben erhalten.",
    rewriteBtn: "KI-Einschätzung anzeigen",
    rewriteRegenerateBtn: "Neu generieren",
    rewriteReconstructionHeading: "Geschätzter Songtext",
    rewriteReconstructionHint: "Kein Songtext eingegeben – die KI hat diesen Text aus dem automatischen Vocals-Transkript rekonstruiert. Schätzung, kein Fakt.",
    rewriteClassificationHeading: "Einordnung",
    rewriteTitleIdeasHeading: "Titel-Ideen",
    rewriteOutputHeading: "Verbesserter Songtext",
    rewritePronunciationHeading: "Aussprache-Einschätzung",
    vocalsHeading: "Vocals-Check",
    vocalsIntro: "Transkribiert die gesungenen Vocals automatisch per KI direkt in deinem Browser (Audio verlässt dabei nie dein Gerät) und vergleicht sie mit deinem Songtext (oder, falls keiner eingegeben wurde, mit einer KI-Schätzung des Texts) – praktisch, um Aussprache-/Text-Artefakte von KI-Gesang (z. B. Suno, Udio) aufzuspüren. Automatische Spracherkennung von Gesang ist selbst fehleranfällig (Autotune, Beat im Hintergrund, Slang) – als Hinweis lesen, nicht als harten Fakt. Lädt einmalig ein KI-Modell (~140 MB) herunter – auf dem Handy kann das Datenvolumen/Akku kosten.",
    vocalsCancelBtn: "Abbrechen",
    vocalsCancelled: "Abgebrochen – kein Datenvolumen/Akku mehr verbraucht.",
    vocalsRetryBtn: "Erneut transkribieren",
    vocalsEstimatedNote: "Kein Songtext eingegeben – Vergleich läuft gegen eine KI-Schätzung des Texts, nicht gegen einen echten Songtext.",
    vocalsResultHeading: "Textabgleich",
    vocalsTranscriptHeading: "Rohes Transkript",
    vocalsTranscriptHint: "(automatisch, KI-generiert)",
    submitHeading: "Wo einreichen?",
    disclaimer: "Diese Analyse basiert auf automatischer Signalverarbeitung (Frequenzspektrum, Lautheit, Dynamik) sowie einer einfachen Textanalyse deines Songtexts. Sie ersetzt kein professionelles Mastering-Ohr oder A&R-Urteil, gibt dir aber eine schnelle Ersteinschätzung.",
    footerImpressum: "Impressum",
    footerDatenschutz: "Datenschutz",
    footerAgb: "AGB",
    footerWiderruf: "Widerrufsbelehrung",
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
    tipMonoCancelProblem: "Phasenauslöschung erkannt (Korrelation {corr}).",
    tipMonoCancelDetail: "Auf Handylautsprechern und in vielen TikTok-/Reels-Playern läuft der Ton mono – Teile deines Tracks (im schlimmsten Fall die Hook) können sich dabei ganz oder teilweise auslöschen.",
    tipMonoCancelFix: "Stereo-Verbreiterung/Panning der betroffenen Elemente reduzieren und in Mono gegenhören.",
    tipMonoWeakProblem: "Eingeschränkte Mono-Kompatibilität (Korrelation {corr}).",
    tipMonoWeakDetail: "Kein akuter Fehler, aber auf mono wiedergebenden Geräten (Handylautsprecher, viele TikTok-/Reels-Player) kann der Track dadurch spürbar dünner wirken.",
    tipMonoWeakFix: "Wichtige Elemente (v. a. die Hook) etwas mittiger/weniger breit mischen.",
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
    tipNoLyricsInstrumentalNote: "Kein Songtext – bei diesem Genre ist ein rein instrumentaler Track normal, Hook & Songtitel fließen deshalb nicht in die Bewertung ein.",
    tipHookWeakProblem: "Im Text ist keine klar wiederholte Hookline erkennbar.",
    tipHookWeakDetail: "Erhöht meist den Wiedererkennungswert – bei bewusst storytelling-lastigen Texten (Spoken-Word, erzählende Strophen ohne Refrain) ist das Fehlen einer Hook aber stilistisch normal, kein Fehler.",
    tipHookWeakFix: "Falls gewollt: eine Zeile (idealerweise mit dem Songtitel) 2–3x wiederholen, um eine klare Hook zu schaffen.",
    tipTitleMissingProblem: "Der Songtitel taucht im Text gar nicht auf.",
    tipTitleMissingDetail: "Hörer erinnern sich deutlich leichter, wenn der Titel tatsächlich gesungen wird.",
    tipTitleMissingFix: "Den Songtitel tatsächlich im Text singen/erwähnen.",
    tipTitleRepeatProblem: "Der Songtitel kommt im Text vor, aber bisher nur {count}x.",
    tipTitleRepeatDetail: "Ab {count}x Wiederholung (z. B. durchgehend im Refrain) gilt der Titel als richtig wiedererkennbar.",
    tipTitleRepeatFix: "Den Titel öfter singen/erwähnen, am besten in der am häufigsten wiederholten Zeile (Hook).",
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
    submitBeatportName: "Beatport",
    submitBeatportReason: "Die Leitplattform für {genre} – Labels und DJs kaufen und entdecken dort gezielt elektronische Tracks.",
    submitAudiomackName: "Audiomack",
    submitAudiomackReason: "In der {genre}-Szene sehr verbreitet für Uploads, Mixtapes und direktes Fan-Feedback, unabhängig vom Score.",
    submitIdagioName: "IDAGIO",
    submitIdagioReason: "Streaming-Plattform speziell für {genre} – Hörer:innen suchen dort gezielt nach klassischer Musik statt in einem Pop-Katalog unterzugehen.",
    submitBandcampName: "Bandcamp",
    submitBandcampReason: "Starke, zahlungsbereite Fan-Community gerade im {genre}-Bereich – gut geeignet, um Musik direkt zu verkaufen und Fans aufzubauen, unabhängig vom Score.",
    submitDistroKidName: "DistroKid",
    submitDistroKidReason: "Kein Kuratoren-Feedback, sondern der Vertrieb selbst: bringt deinen Track unabhängig vom Score auf Spotify, Apple Music & Co. – gegen jährliche Gebühr, dafür planbar und schnell.",

    meterTechnik: "Klangqualität / Sauberkeit",
    meterLautheit: "Lautheit / Star-Potential",
    meterFrequenz: "Frequenzbalance",
    meterHook: "Hook",
    meterTitel: "Songtitel erkennbar",
    meterDynamik: "Dynamikumfang ({db} dB)",
    meterMonoCompat: "Mono-Kompatibilität (Korrelation {corr})",
    meterLyricsMissing: "Songtext fehlt",
    meterInstrumentalGenre: "Instrumental (genretypisch)",
    meterTitleMissing: "Songtitel fehlt",
    badgeSound: "Sound",
    badgeStarPotential: "Star-Potential",
    badgeHook: "Hook",
    teaserProblem: "Größtes Problem",
    teaserStrength: "Stärke",

    genreCompareTitle: "Im Vergleich zu {n} geprüften {genre}-Tracks",
    genreCompareLoudness: "Lautheit",
    genreCompareDynamics: "Dynamikumfang",
    genreCompareBandLow: "unteres Viertel",
    genreCompareBandMid: "mittlerer Bereich",
    genreCompareBandHigh: "oberes Viertel",

    detectedGenreAuto: "Automatisch erkannt: {genre}{bpm} (Schätzung anhand Tempo, Klangfarbe & Bassanteil – oben im Formular korrigierbar).",
    detectedGenreBpmOnly: "Tempo gemessen: ~{bpm} BPM. Genre nicht eindeutig automatisch bestimmbar – oben im Formular manuell wählen für passendere Referenzwerte.",

    rewriteNotConfigured: "Diese Funktion ist noch nicht eingerichtet (Backend fehlt noch).",
    rewriteLoading: "KI erstellt Einordnung, Titel-Ideen und verfeinerten Text…",
    rewriteWaitingForTranscript: "Noch in Bearbeitung: Kein Songtext eingegeben – wartet auf die automatische Vocals-Transkription. Sobald die fertig ist, folgen Einordnung, Titel-Ideen und ein rekonstruierter Songtext hier automatisch.",
    rewriteNoTranscriptAvailable: "Die automatische Transkription hat keinen verwertbaren Text geliefert – ohne Songtext oder Transkript kann die KI-Einschätzung hier leider nicht laufen. Songtext nachtragen oder Vocals-Check unten erneut versuchen.",
    rewriteNoClassification: "Keine Einordnung erhalten.",
    rewriteError: "Fehler: {msg}",
    unknownError: "Unbekannter Fehler.",
    kiRequestUnknownError: "Unbekannter Fehler bei der KI-Anfrage.",

    unlockNeedLogin: "Bitte zuerst einloggen oder registrieren, um die Vollanalyse freizuschalten.",
    unlockNoCredits: "Keine Credits mehr übrig – wähle ein Paket, um die Vollanalyse freizuschalten.",

    statusLoadingAudio: "Lade Audio…",
    fileTooLarge: "Datei ist zu groß ({size} MB) – maximal 100 MB erlaubt.",
    statusDecoding: "Decodiere Audio…",
    statusAnalyzing: "Analysiere Frequenzen, Lautheit & Genre…",
    statusAnalyzeFailed: "Analyse fehlgeschlagen: {msg}",

    accountMenuLabel: "Konto",
    accountLoginRegisterBtn: "Login / Registrieren",
    accountLogoutBtn: "Abmelden",
    accountManageSubscriptionBtn: "Abo verwalten/kündigen",
    manageSubscriptionFailed: "Konnte nicht geöffnet werden.",
    accountDeleteBtn: "Konto löschen",
    accountDeleteConfirm: "Konto und alle zugehörigen Daten unwiderruflich löschen? Ein aktives Abo wird dabei automatisch gekündigt.",
    accountDeleteSuccess: "Konto wurde gelöscht.",
    accountDeleteFailed: "Konto konnte nicht gelöscht werden.",
    verifyEmailBanner: "Bitte bestätige deine E-Mail-Adresse (Link wurde dir zugeschickt).",
    verifyEmailResendBtn: "Erneut senden",
    verifyEmailResendSending: "Wird verschickt…",
    verifyEmailResendSuccess: "Neue Bestätigungsmail verschickt.",
    verifyEmailResendFailed: "Konnte nicht verschickt werden. Bitte später erneut versuchen.",
    verifyEmailLinkSuccess: "E-Mail-Adresse bestätigt!",
    verifyEmailLinkFailed: "Bestätigungslink ist ungültig oder abgelaufen.",
    historyToggleBtn: "Meine Checks",
    historyHeading: "Meine Checks",
    historyHint: "Deine bisherigen Tiefenanalysen – nur die Ergebnisse (Tipps, Fazit, Einordnung), nicht die Audiodateien selbst.",
    historyBackBtn: "← Zurück zur Liste",
    historyLoading: "Lädt…",
    historyLoadFailed: "Konnte nicht geladen werden.",
    historyEmpty: "Noch keine Tiefenanalysen gespeichert.",
    historyUntitled: "Unbenannt",
    historyTrendTitle: "Dein Score-Verlauf ({delta})",
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
    eqScorePreviewCalculating: "Berechne Score nach deiner Bearbeitung …",
    eqScorePreviewWaitingForStop: "Score-Vorschau folgt, sobald die Wiedergabe pausiert (läuft im Hintergrund weiter ruckelfrei).",
    eqScorePreviewResult: "Nach deiner Bearbeitung: {before} → {after}/100 ({delta})",
    eqScorePreviewNoChange: "±0",
    eqScorePreviewFailed: "Vorschau konnte nicht berechnet werden.",
    eqPreviewPlaying: "Vorschau läuft (in Schleife) – Slider bewegen für Live-Vergleich.",
    eqPreviewFailed: "Vorschau fehlgeschlagen: {msg}",
    eqRendering: "Bearbeitete Version wird gerendert…",
    eqDownloadStarted: "Download gestartet.",
    eqRenderFailed: "Rendern fehlgeschlagen: {msg}",
    eqEditorProOnlyMsg: "Das Beheben (EQ-Editor, De-Esser) ist Teil des Pro-Plans.",
    ratingModalHeading: "Wie zufrieden bist du mit dem Ergebnis?",
    ratingModalHint: "Dein Feedback hilft uns, Overhertz zu verbessern.",
    ratingCommentPlaceholder: "Optional: was können wir besser machen? (freiwillig)",
    ratingSkipBtn: "Später",
    ratingSubmitBtn: "Absenden",
    ratingSubmitting: "Wird gesendet…",
    ratingThanks: "Danke für dein Feedback!",
    ratingFailed: "Konnte nicht gesendet werden: {msg}",

    vocalsNoAudio: "Kein Audio verfügbar – bitte Track erneut analysieren.",
    vocalsLoadingModel: "Lade Transkriptions-Modell (einmalig, danach gecacht)…",
    vocalsLoadingModelProgress: "Lade Transkriptions-Modell… {pct}%",
    vocalsPreparingAudio: "Bereite Audio auf (16kHz Mono)…",
    vocalsTranscribing: "Transkribiere Vocals (kann bei längeren Tracks etwas dauern)…",
    vocalsNoUsableTranscript: "Keine verwertbare Transkription erhalten (evtl. sehr leiser/instrumentaler Track).",
    vocalsFailed: "Transkription fehlgeschlagen: {msg}",
    vocalsFailedNetwork: "Transkription fehlgeschlagen – das KI-Modell (ca. 140 MB) konnte nicht geladen werden. Meist liegt's an der Internetverbindung (z. B. Wechsel zwischen WLAN und Mobilfunk mittendrin). Verbindung prüfen und über „Erneut transkribieren“ nochmal versuchen.",
    vocalsFailedMemory: "Transkription fehlgeschlagen – vermutlich reicht der Arbeitsspeicher gerade nicht (v. a. auf dem Handy bei vielen offenen Tabs/Apps). Andere Tabs schließen und über „Erneut transkribieren“ nochmal versuchen.",
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
    albumTrackDetailBtn: "Details & Verbessern",
    albumTrackCollapseBtn: "Einklappen",
    albumTrackNoAudio: "Audiodatei nach Neuladen der Seite nicht mehr verfügbar – zum Bearbeiten (Abspielen, EQ, Download) Album bitte erneut hochladen. Frequenzchart, Tipps und Fazit bleiben trotzdem sichtbar.",

    checkoutProcessing: "Zahlung wird verarbeitet…",
    checkoutStillProcessing: "Zahlung wird noch verarbeitet ({err}) – gleich nochmal auf 'Vollanalyse ansehen' klicken.",
    checkoutPleaseWait: "bitte kurz warten",

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
    passwordShowLabel: "Show password",
    passwordHideLabel: "Hide password",
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
    lyricsPlaceholder: "Enter lyrics for a precise Vocals-Check comparison.",
    genreLabel: "Genre",
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
    genreDeutschrap: "German rap",
    genreTrap: "Trap",
    genreDrill: "Drill",
    genreRnb: "R&B",
    genreHouse: "House",
    genrePhonk: "Phonk",
    genreCountry: "Country",
    analyzeBtn: "Start analysis",
    albumHeading: "Album check",
    albumHint: "Check multiple tracks at once (quick check: sound quality, loudness, frequency balance). Part of the Pro plan – each track counts as one check from your monthly quota.",
    albumFilesLabel: "Select tracks",
    albumAnalyzeBtn: "Analyze album",
    heroEyebrow: "Your result",
    shareBtn: "Share result",
    shareText: "My track scored {stars}/5 stars on Overhertz – “{title}” ({score}/100). Check your track for free too:",
    shareCopied: "Link copied!",
    shareCardCta: "Free short check at overhertz.app",
    unlockTitle: "Want to know exactly what's wrong – and how to fix it?",
    unlockDesc: "Detailed frequency curve, all improvement tips, and where best to submit your track.",
    unlockBtn: "View full analysis",
    unlockNote: "5 credits for €7 or Pro plan from €9.50/month",
    premiumHeading: "The in-depth analysis",
    exportPdfBtn: "Export as PDF",
    zoneFacts: "The facts — objectively measured",
    freqBlockHeading: "Frequency balance",
    freqBlockHint: "Share of energy per frequency band. Green = within reference range, yellow/red = noticeably above or below.",
    refCompareLabel: "Compare with a reference track (optional)",
    refCompareHint: "Upload a hit from your genre, for example – stays in your browser, never gets uploaded anywhere.",
    refCompareOwn: "Your track",
    refCompareRef: "Reference track",
    refCompareMore: "Biggest difference: {band} is {diff} percentage points stronger in your track than in the reference track.",
    refCompareLess: "Biggest difference: {band} is {diff} percentage points weaker in your track than in the reference track.",
    refCompareEqual: "Your frequency balance is very similar to the reference track's.",
    refCompareNoOwnTrack: "Analyze your own track first, then compare.",
    refCompareError: "Couldn't read the reference track – try a different format.",
    formatCheckHeading: "Format check",
    formatCheckHint: "Technical requirements and title metadata, as checked by distributors – independent of the sound.",
    formatTitleEmoji: "Title contains emojis – not allowed by most distributors.",
    formatTitleAllCaps: "Title is written entirely in capital letters – many distributors normalize or reject this.",
    formatTitleFeat: "\"feat.\" isn't in the usual format – common practice is \"Song Title (feat. Name)\".",
    formatTitleChars: "Title contains special characters that cause problems with some distributors: {chars}",
    formatTitleOk: "Title format looks clean.",
    formatDurationTooShort: "Track is only {s}s long – under 30 seconds doesn't count as a stream on Spotify.",
    formatDurationOk: "Length ({time}) is fine for submission.",
    formatSampleRateLow: "Sample rate ({hz} Hz) is below the distributor standard of 44.1 kHz.",
    formatSampleRateOk: "Sample rate ({hz} Hz) meets the standard.",
    formatBitDepthLow: "Bit depth ({bits}-bit) is below the distributor standard of 16-bit.",
    formatBitDepthOk: "Bit depth ({bits}-bit) meets the standard.",
    formatLossyUpload: "Uploaded as compressed {ext} format – fine for checking here, but actual distributor submission usually needs an uncompressed WAV file.",
    eqHeading: "EQ editor",
    eqIntro: "Adjust your track's frequencies right here and hear the result instantly. Runs entirely in your browser, your audio file never leaves your device.",
    eqSpectrumHint: "Waveform of your track – the gold marker shows the playback position, and the gold curve above it shows your current EQ setting, reacting instantly as you move the sliders below.",
    eqLockedHint: "Fixing things (EQ, de-esser, loudness matching, trimming silence, fade-out) is part of the Pro plan. You can see the full analysis with Credits too – editing directly here needs Pro.",
    eqUpgradeBtn: "Upgrade to Pro",
    eqDeesserToggle: "Reduce sibilance (de-esser)",
    eqDeesserAutoBtn: "Apply our recommendation",
    eqDeesserAutoApplied: "Recommended de-esser setting applied for this track.",
    eqDeesserAutoNotNeeded: "No noticeable sibilance detected – de-esser isn't needed for this track.",
    eqDeesserStrength: "Strength",
    eqDeesserHint: "Reduces sharp sibilance (typ. 5–8 kHz) only when it actually spikes – unlike the sliders above, which flatly lower a whole range. \"Apply our recommendation\" sets the strength automatically based on your track, you can still fine-tune it yourself afterwards.",
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
    rewriteHint: "Runs automatically: an assessment, title ideas, and a refined lyric version from the AI – style, language, and meaning are preserved.",
    rewriteBtn: "Show AI assessment",
    rewriteRegenerateBtn: "Regenerate",
    rewriteReconstructionHeading: "Estimated lyrics",
    rewriteReconstructionHint: "No lyrics entered – the AI reconstructed this text from the automatic vocals transcript. An estimate, not a fact.",
    rewriteClassificationHeading: "Assessment",
    rewriteTitleIdeasHeading: "Title ideas",
    rewriteOutputHeading: "Improved lyrics",
    rewritePronunciationHeading: "Pronunciation assessment",
    vocalsHeading: "Vocals check",
    vocalsIntro: "Automatically transcribes the sung vocals via AI directly in your browser (audio never leaves your device) and compares them with your lyrics (or, if none were entered, with an AI estimate of the text) – useful for spotting pronunciation/text artifacts from AI vocals (e.g. Suno, Udio). Automatic speech recognition on singing is itself error-prone (autotune, background beat, slang) – read it as a hint, not a hard fact. Downloads an AI model (~140 MB) once – on mobile this can cost data/battery.",
    vocalsCancelBtn: "Cancel",
    vocalsCancelled: "Cancelled – no more data/battery used.",
    vocalsRetryBtn: "Transcribe again",
    vocalsEstimatedNote: "No lyrics entered – comparison runs against an AI estimate of the text, not real lyrics.",
    vocalsResultHeading: "Lyrics comparison",
    vocalsTranscriptHeading: "Raw transcript",
    vocalsTranscriptHint: "(automatic, AI-generated)",
    submitHeading: "Where to submit?",
    disclaimer: "This analysis is based on automatic signal processing (frequency spectrum, loudness, dynamics) plus a simple text analysis of your lyrics. It doesn't replace a professional mastering ear or A&R judgment, but gives you a quick first assessment.",
    footerImpressum: "Legal notice",
    footerDatenschutz: "Privacy policy",
    footerAgb: "Terms",
    footerWiderruf: "Right of withdrawal",
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
    tipMonoCancelProblem: "Phase cancellation detected (correlation {corr}).",
    tipMonoCancelDetail: "Phone speakers and many TikTok/Reels players play audio in mono – parts of your track (in the worst case the hook) can partially or fully cancel out.",
    tipMonoCancelFix: "Reduce stereo widening/panning on the affected elements and check in mono.",
    tipMonoWeakProblem: "Limited mono compatibility (correlation {corr}).",
    tipMonoWeakDetail: "Not a hard error, but on mono-playing devices (phone speakers, many TikTok/Reels players) the track can end up sounding noticeably thinner.",
    tipMonoWeakFix: "Mix key elements (especially the hook) a bit more centered/less wide.",
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
    tipNoLyricsInstrumentalNote: "No lyrics – for this genre, a purely instrumental track is normal, so hook & song title aren't factored into the score.",
    tipHookWeakProblem: "No clearly repeated hook line is recognizable in the lyrics.",
    tipHookWeakDetail: "Usually boosts memorability – but for deliberately storytelling-driven lyrics (spoken word, narrative verses without a chorus), not having a hook is stylistically normal, not a flaw.",
    tipHookWeakFix: "If that's what you want: repeat one line (ideally containing the song title) 2–3 times to create a clear hook.",
    tipTitleMissingProblem: "The song title doesn't appear in the lyrics at all.",
    tipTitleMissingDetail: "Listeners remember much more easily when the title is actually sung.",
    tipTitleMissingFix: "Actually sing/mention the song title in the lyrics.",
    tipTitleRepeatProblem: "The song title appears in the lyrics, but only {count}x so far.",
    tipTitleRepeatDetail: "From {count}x repetition onward (e.g. throughout the chorus), the title counts as properly recognizable.",
    tipTitleRepeatFix: "Sing/mention the title more often, ideally in the most frequently repeated line (the hook).",
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
    submitBeatportName: "Beatport",
    submitBeatportReason: "The go-to platform for {genre} – labels and DJs specifically buy and discover electronic tracks there.",
    submitAudiomackName: "Audiomack",
    submitAudiomackReason: "Very common in the {genre} scene for uploads, mixtapes, and direct fan feedback, independent of the score.",
    submitIdagioName: "IDAGIO",
    submitIdagioReason: "A streaming platform built specifically for {genre} – listeners actively search for classical music there instead of it getting lost in a pop catalog.",
    submitBandcampName: "Bandcamp",
    submitBandcampReason: "A strong, spending-willing fan community especially in {genre} – well suited for selling music directly and building a fanbase, independent of the score.",
    submitDistroKidName: "DistroKid",
    submitDistroKidReason: "Not curator feedback, but distribution itself: gets your track onto Spotify, Apple Music & co. regardless of the score – for a yearly fee, but predictable and fast.",

    meterTechnik: "Sound quality / cleanliness",
    meterLautheit: "Loudness / star potential",
    meterFrequenz: "Frequency balance",
    meterHook: "Hook",
    meterTitel: "Song title recognizable",
    meterDynamik: "Dynamic range ({db} dB)",
    meterMonoCompat: "Mono compatibility (correlation {corr})",
    meterLyricsMissing: "Lyrics missing",
    meterInstrumentalGenre: "Instrumental (typical for genre)",
    meterTitleMissing: "Song title missing",
    badgeSound: "Sound",
    badgeStarPotential: "Star potential",
    badgeHook: "Hook",
    teaserProblem: "Biggest problem",
    teaserStrength: "Strength",

    genreCompareTitle: "Compared to {n} checked {genre} tracks",
    genreCompareLoudness: "Loudness",
    genreCompareDynamics: "Dynamic range",
    genreCompareBandLow: "bottom quartile",
    genreCompareBandMid: "mid-range",
    genreCompareBandHigh: "top quartile",

    detectedGenreAuto: "Auto-detected: {genre}{bpm} (estimate based on tempo, tone, and bass ratio – adjustable in the form above).",
    detectedGenreBpmOnly: "Tempo measured: ~{bpm} BPM. Genre couldn't be determined automatically with confidence – select manually in the form above for more accurate reference values.",

    rewriteNotConfigured: "This feature isn't set up yet (backend missing).",
    rewriteLoading: "AI is creating an assessment, title ideas, and a refined lyric version…",
    rewriteWaitingForTranscript: "Still in progress: no lyrics entered – waiting for the automatic vocals transcription. Once that's done, an assessment, title ideas, and a reconstructed lyric will appear here automatically.",
    rewriteNoTranscriptAvailable: "The automatic transcription didn't produce usable text – without lyrics or a transcript, the AI assessment can't run here. Add lyrics or retry the vocals check below.",
    rewriteNoClassification: "No assessment received.",
    rewriteError: "Error: {msg}",
    unknownError: "Unknown error.",
    kiRequestUnknownError: "Unknown error during the AI request.",

    unlockNeedLogin: "Please log in or register first to unlock the full analysis.",
    unlockNoCredits: "No credits left – choose a plan to unlock the full analysis.",

    statusLoadingAudio: "Loading audio…",
    fileTooLarge: "File is too large ({size} MB) – 100 MB maximum.",
    statusDecoding: "Decoding audio…",
    statusAnalyzing: "Analyzing frequencies, loudness & genre…",
    statusAnalyzeFailed: "Analysis failed: {msg}",

    accountMenuLabel: "Account",
    accountLoginRegisterBtn: "Log in / Sign up",
    accountLogoutBtn: "Log out",
    accountManageSubscriptionBtn: "Manage/cancel subscription",
    manageSubscriptionFailed: "Couldn't open.",
    accountDeleteBtn: "Delete account",
    accountDeleteConfirm: "Permanently delete your account and all associated data? An active subscription will be cancelled automatically.",
    accountDeleteSuccess: "Account deleted.",
    accountDeleteFailed: "Couldn't delete account.",
    verifyEmailBanner: "Please confirm your email address (link was sent to you).",
    verifyEmailResendBtn: "Resend",
    verifyEmailResendSending: "Sending…",
    verifyEmailResendSuccess: "New confirmation email sent.",
    verifyEmailResendFailed: "Couldn't send it. Please try again later.",
    verifyEmailLinkSuccess: "Email address confirmed!",
    verifyEmailLinkFailed: "Confirmation link is invalid or expired.",
    historyToggleBtn: "My checks",
    historyHeading: "My checks",
    historyHint: "Your past deep analyses – results only (tips, summary, assessment), not the audio files themselves.",
    historyBackBtn: "← Back to list",
    historyLoading: "Loading…",
    historyLoadFailed: "Couldn't load.",
    historyEmpty: "No deep analyses saved yet.",
    historyUntitled: "Untitled",
    historyTrendTitle: "Your score trend ({delta})",
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
    eqScorePreviewCalculating: "Calculating your score after this edit …",
    eqScorePreviewWaitingForStop: "Score preview follows once playback is paused (keeps playing smoothly in the meantime).",
    eqScorePreviewResult: "After your edit: {before} → {after}/100 ({delta})",
    eqScorePreviewNoChange: "±0",
    eqScorePreviewFailed: "Couldn't calculate the preview.",
    eqPreviewPlaying: "Preview playing (looping) – move the sliders for a live comparison.",
    eqPreviewFailed: "Preview failed: {msg}",
    eqRendering: "Rendering edited version…",
    eqDownloadStarted: "Download started.",
    eqRenderFailed: "Rendering failed: {msg}",
    eqEditorProOnlyMsg: "Fixing things (EQ editor, de-esser) is part of the Pro plan.",
    ratingModalHeading: "How happy are you with the result?",
    ratingModalHint: "Your feedback helps us improve Overhertz.",
    ratingCommentPlaceholder: "Optional: what could we do better? (not required)",
    ratingSkipBtn: "Later",
    ratingSubmitBtn: "Submit",
    ratingSubmitting: "Sending…",
    ratingThanks: "Thanks for your feedback!",
    ratingFailed: "Couldn't send: {msg}",

    vocalsNoAudio: "No audio available – please analyze the track again.",
    vocalsLoadingModel: "Loading transcription model (one-time, then cached)…",
    vocalsLoadingModelProgress: "Loading transcription model… {pct}%",
    vocalsPreparingAudio: "Preparing audio (16kHz mono)…",
    vocalsTranscribing: "Transcribing vocals (can take a while for longer tracks)…",
    vocalsNoUsableTranscript: "No usable transcription received (maybe a very quiet/instrumental track).",
    vocalsFailed: "Transcription failed: {msg}",
    vocalsFailedNetwork: "Transcription failed – the AI model (~140 MB) couldn't be loaded. Usually a connection issue (e.g. switching between Wi-Fi and mobile data mid-download). Check your connection and try again via \"Retranscribe\".",
    vocalsFailedMemory: "Transcription failed – you're probably out of memory right now (especially on mobile with many tabs/apps open). Close other tabs and try again via \"Retranscribe\".",
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
    albumTrackDetailBtn: "Details & improve",
    albumTrackCollapseBtn: "Collapse",
    albumTrackNoAudio: "Audio file is no longer available after reloading the page – to edit (play, EQ, download) please re-upload the album. Frequency chart, tips and summary stay visible either way.",

    checkoutProcessing: "Processing payment…",
    checkoutStillProcessing: "Payment is still processing ({err}) – try clicking 'View full analysis' again in a moment.",
    checkoutPleaseWait: "please wait a moment",

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
  // Generischer Mechanismus fuer uebersetzte Attribute (z.B. aria-label) - "attr:key" (mehrere
  // durch Komma getrennt), im Gegensatz zu data-i18n/data-i18n-placeholder braucht es hier keinen
  // festen Attributnamen wie text/placeholder.
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr")
      .split(",")
      .forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
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

// grade.color ist ein CSS-var()-String fuers Live-DOM (style.color = "var(--status-good)") - fuer
// das Canvas-Share-Bild (siehe buildShareCardBlob) braucht es echte Hex-Werte, deshalb die gleiche
// Zuordnung hier nochmal als Klartext-Map.
const STATUS_COLOR_HEX = {
  "var(--status-good)": "#4cc38a",
  "var(--status-warning)": "#dc9a3f",
  "var(--status-critical)": "#d64545",
};

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
  deutschrap: "genreDeutschrap",
  trap: "genreTrap",
  drill: "genreDrill",
  rnb: "genreRnb",
  house: "genreHouse",
  phonk: "genrePhonk",
  country: "genreCountry",
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
    // Subbass/Bass-Obergrenze angehoben, Presence/Brillanz-Untergrenze gesenkt: moderne
    // 808-lastige Trap-/Hip-Hop-Produktion konzentriert einen deutlich groesseren Anteil der
    // rohen Spektralenergie im Bassbereich als die alte Referenz erwartete - das hat systematisch
    // zu starke Bass-Cut- und Hoehen-Boost-Vorschlaege ausgeloest (Nutzer-Feedback anhand vieler
    // echter Trap-Checks). Da alle 7 Baender sich immer auf 100% aufsummieren, driften die
    // uebrigen Baender-Prozentwerte automatisch mit, wenn der Bassanteil realistischer
    // kalibriert ist - Presence/Brillanz brauchten trotzdem eine eigene Anpassung nach unten.
    refs: [[5, 20], [16, 32], [9, 16], [18, 28], [9, 16], [4, 10], [2, 8]],
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

// Feinere Genre-Auswahl (fuer Nutzer praeziser, fuer SEO-Tracking als eigene Kategorie zaehlbar),
// die aber noch keine eigenen recherchierten Zielwerte hat - nutzt stattdessen die Referenzwerte
// des musikalisch naechstliegenden Hauptgenres. Kein separater Eintrag in GENRE_PROFILES noetig,
// bis dafuer mal eigene Werte recherchiert werden.
const GENRE_SLUG_TO_PROFILE = {
  deutschrap: "hiphop",
  trap: "hiphop",
  drill: "hiphop",
  rnb: "pop",
  house: "edm",
  phonk: "edm",
  country: "acoustic",
};

function genreProfile(genreKey) {
  const profileKey = GENRE_SLUG_TO_PROFILE[genreKey] || genreKey;
  const base = GENRE_PROFILES[profileKey] || GENRE_PROFILES[""];
  // rawKey haelt die tatsaechlich gewaehlte (evtl. feinere) Genre-Angabe fest, z.B. "house" auch
  // wenn intern das breitere "edm"-Profil fuer die Zielwerte genutzt wird - manche Eigenschaften
  // (z.B. "hier ist instrumental normal") haengen am spezifischen Subgenre, nicht am Elternprofil.
  return Object.assign({}, base, { rawKey: genreKey || base.key });
}

// Genres, bei denen ein rein instrumentaler Track die Norm ist (kein Songtext ist hier kein
// Mangel) - Hook-/Songtitel-Erkennbarkeit sollen dafuer nicht wie ein Fehler behandelt werden.
// Bewusst die feineren Subgenre-Slugs (nicht das Elternprofil) - "edm" pauschal wuerde z.B. auch
// vokallastige Festival-EDM mit einschliessen, wo fehlender Text durchaus ein echtes Manko waere.
const TYPICALLY_INSTRUMENTAL_GENRES = ["techno", "klassik", "house", "phonk"];

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

// K-Gewichtung (Kernstueck der LUFS-Messung nach ITU-R BS.1770): ein Hochregler um ~1.5kHz plus
// ein Hochpass, die grob nachbilden, wie das menschliche Gehoer/Ohr Lautheit wahrnimmt. Ohne das
// las eine helle, moderne Abmischung (viel Energie in Hi-Hats/Praesenz/Luft) systematisch LEISER
// als sie tatsaechlich ist - genau die Tracks, die eigentlich am haeufigsten hochgeladen werden,
// wurden faelschlich als "zu leise" markiert. RBJ-Cookbook-Biquads, Parameter an den BS.1770-
// Referenzfilter angelehnt (keine bit-exakte Nachbildung, aber behebt den Haupt-Bias).
function biquadCoeffsHighShelf(sampleRate, freq, gainDb, q) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  const twoSqrtAalpha = 2 * Math.sqrt(A) * alpha;
  return {
    b0: A * (A + 1 + (A - 1) * cosw0 + twoSqrtAalpha),
    b1: -2 * A * (A - 1 + (A + 1) * cosw0),
    b2: A * (A + 1 + (A - 1) * cosw0 - twoSqrtAalpha),
    a0: A + 1 - (A - 1) * cosw0 + twoSqrtAalpha,
    a1: 2 * (A - 1 - (A + 1) * cosw0),
    a2: A + 1 - (A - 1) * cosw0 - twoSqrtAalpha,
  };
}

function biquadCoeffsHighPass(sampleRate, freq, q) {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  return {
    b0: (1 + cosw0) / 2,
    b1: -(1 + cosw0),
    b2: (1 + cosw0) / 2,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

function applyBiquad(samples, { b0, b1, b2, a0, a1, a2 }) {
  const out = new Float32Array(samples.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function applyKWeighting(mono, sampleRate) {
  const shelved = applyBiquad(mono, biquadCoeffsHighShelf(sampleRate, 1500, 4, Math.SQRT1_2));
  return applyBiquad(shelved, biquadCoeffsHighPass(sampleRate, 80, Math.SQRT1_2));
}

// Ungegatete Ganzsong-RMS zieht den Durchschnitt bei jedem Track mit Intro/Outro/Pausen
// systematisch nach unten (fast jeder Song hat davon etwas) - das fuehrte dazu, dass praktisch
// jeder Track als "zu leise" markiert wurde, unabhaengig vom tatsaechlichen Master. Eine grobe
// Annaeherung an gegatete Lautheit (aehnlich dem Prinzip hinter LUFS-Messung, inkl. K-Gewichtung)
// behebt den systematischen Bias: nur Passagen mit tatsaechlichem Signal zaehlen.
function computeGatedLoudnessDb(rawMono, sampleRate) {
  const mono = applyKWeighting(rawMono, sampleRate);
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

// Phasenkorrelation zwischen L/R: +1 = voll in Phase (perfekt mono-kompatibel), 0 = unkorreliert
// (nennenswerter Pegelverlust beim Mono-Summieren moeglich), -1 = gegenphasig (loescht sich beim
// Mono-Summieren teilweise/ganz aus). Genau das passiert auf Handylautsprechern/in vielen
// TikTok-Playern, die tatsaechlich mono wiedergeben - dort kann eine zu breit gezogene Hook
// dadurch schlicht verschwinden. Muss VOR dem Runterrechnen auf Mono berechnet werden, deshalb
// separat uebergeben statt aus dem bereits gemischten Signal.
function computePhaseCorrelation(buffer) {
  if (buffer.numberOfChannels < 2) return 1;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const length = left.length;
  const stride = Math.max(1, Math.floor(length / 200000));
  let sumLR = 0;
  let sumLL = 0;
  let sumRR = 0;
  for (let i = 0; i < length; i += stride) {
    const l = left[i];
    const r = right[i];
    sumLR += l * r;
    sumLL += l * l;
    sumRR += r * r;
  }
  const denom = Math.sqrt(sumLL * sumRR);
  if (denom < 1e-9) return 1;
  return Math.max(-1, Math.min(1, sumLR / denom));
}

// Naeherung an True Peak (ITU-R BS.1770): Sample-Peak (einfach das lauteste Sample) uebersieht
// Ueberschreitungen, die erst zwischen zwei Samples bei der D/A-Wandlung entstehen (Inter-Sample-
// Peaks) - kommt bei stark limitierten/lauten Masters vor. 4x-Oversampling per linearer
// Interpolation findet die meisten davon; kein vollwertiger bandbegrenzter Oversampler wie in
// professionellen Metering-Tools, aber reicht, um sie von echten Vollausschlaegen zu unterscheiden.
function computeTruePeakDb(mono) {
  const OVERSAMPLE = 4;
  const length = mono.length;
  let truePeak = 0;
  for (let i = 0; i < length - 1; i++) {
    const a = mono[i];
    const b = mono[i + 1];
    const absA = Math.abs(a);
    if (absA > truePeak) truePeak = absA;
    for (let k = 1; k < OVERSAMPLE; k++) {
      const absInterp = Math.abs(a + ((b - a) * k) / OVERSAMPLE);
      if (absInterp > truePeak) truePeak = absInterp;
    }
  }
  if (length > 0) {
    const last = Math.abs(mono[length - 1]);
    if (last > truePeak) truePeak = last;
  }
  return 20 * Math.log10(truePeak || 1e-9);
}

function analyzeAudioBuffer(buffer) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const phaseCorrelation = computePhaseCorrelation(buffer);

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
  const truePeakDb = computeTruePeakDb(mono);

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
    sampleRate,
    peak,
    rms,
    clippingRatio,
    loudnessDb,
    crestFactorDb,
    truePeakDb,
    phaseCorrelation,
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
  // Wie oft der Titel tatsaechlich im Song vorkommt, nicht nur ob - Wiedererkennbarkeit haengt
  // an der Wiederholung, nicht nur an einer einzigen Erwaehnung irgendwo im Text.
  const titleOccurrences = titleInLyrics ? normLyrics.split(normTitle).length - 1 : 0;

  return {
    hasLyrics: true,
    hasTitle,
    hookLine,
    hookRepeatCount,
    titleInLyrics,
    titleOccurrences,
  };
}

/* ---------- Scoring ---------- */

// Genre-abhaengiger Idealwert statt einem starren 12.5 dB fuer alle: Hip-Hop/EDM-Masters liegen
// genretypisch im niedrigeren Crest-Factor-Bereich, ohne dass das technisch schlechter waere -
// ein fixer Wert wuerde das systematisch abstrafen. Von scoreTechnik und scoreDynamikumfang
// gemeinsam genutzt, damit beide vom selben genre-typischen Zielwert ausgehen.
function idealCrestForProfile(profile) {
  const fp = profile && profile.fingerprint;
  return fp ? (fp.crestRange[0] + fp.crestRange[1]) / 2 : 12.5;
}

function scoreTechnik(a, profile) {
  // Bewertung um einen Idealpunkt statt einem "Idealfenster" - ein flacher Bereich, in dem
  // jeder Wert 100% gibt, wirkt schnell unglaubwuerdig grob (fast jeder saubere Track landet
  // sonst exakt bei 100%). So gibt's fast nie eine glatte Bestnote, sondern einen nuancierten Wert.
  const clipPenalty = Math.min(60, a.clippingRatio * 2800);

  const idealCrest = idealCrestForProfile(profile);
  const crestDeviation = Math.abs(a.crestFactorDb - idealCrest);
  const crestPenalty = crestDeviation * crestDeviation * 0.22;

  return Math.max(0, Math.min(100, 100 - clipPenalty - crestPenalty));
}

// Eigene, staerker ausschlagende Kennzahl fuer den Dynamikumfang (nicht nur ein unsichtbarer
// Bestandteil des Technik-Scores) - genau dafuer gedacht, ueberkomprimierte/plattgedrueckte
// KI-Master klar erkennbar zu machen, statt im kombinierten Technik-Wert unterzugehen.
function scoreDynamikumfang(a, profile) {
  const idealCrest = idealCrestForProfile(profile);
  const deviation = Math.abs(a.crestFactorDb - idealCrest);
  return Math.max(0, Math.min(100, 100 - deviation * deviation * 0.6));
}

// Phasenkorrelation (-1..+1) auf einen 0-100-Score gemappt: +1 (voll in Phase) -> 100,
// 0 (unkorreliert) -> 50, -1 (gegenphasig) -> 0. Bewusst eine einfache lineare Zuordnung statt
// einer kurvigen Gewichtung - es gibt noch keine kalibrierten Referenzwerte aus echten Tracks
// fuer diese neue Kennzahl.
function scoreMonoCompat(correlation) {
  if (correlation == null) return null;
  return Math.round(Math.max(0, Math.min(100, ((correlation + 1) / 2) * 100)));
}

function scoreLautheit(a, loudnessTarget) {
  const diff = Math.abs(a.loudnessDb - loudnessTarget);
  let score = 100 - diff * 6;
  return Math.max(0, Math.min(100, score));
}

function scoreFrequenz(a, refs) {
  // Bandpercents aus 7 Baendern summieren sich immer auf 100% - liegt ein Band unter seinem
  // Referenzbereich, MUESSEN andere Baender rechnerisch darueber liegen. Eine unbegrenzt lineare
  // Strafe pro Band (frueher: +1.8 je Prozentpunkt Abweichung, ohne Deckel) hat sich dadurch bei
  // fast jedem echten Track ueber alle 7 Baender aufsummiert und den Score auf 0 gedrueckt - auch
  // bei Tracks, die nur in 2-3 Baendern spuerbar abweichen. Jetzt pro Band gedeckelt (sanft
  // abflachend statt hart abgeschnitten), damit ein einzelnes stark abweichendes Band nicht den
  // gesamten Score allein ruiniert.
  let penalty = 0;
  refs.forEach(([lo, hi], i) => {
    const val = a.bandPercents[i];
    const mid = (lo + hi) / 2;
    const halfWidth = (hi - lo) / 2 || 1;
    const dist = Math.abs(val - mid);
    if (dist <= halfWidth) {
      penalty += (dist / halfWidth) * 3;
    } else {
      const over = dist - halfWidth;
      penalty += 3 + 11 * (1 - Math.exp(-over / (halfWidth * 2)));
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

const TITLE_OCCURRENCES_FOR_FULL_SCORE = 6;

function scoreTitel(lyrics) {
  if (!lyrics.hasLyrics || !lyrics.hasTitle) return null;
  if (!lyrics.titleInLyrics) return 15;
  return Math.round(Math.min(100, (lyrics.titleOccurrences / TITLE_OCCURRENCES_FOR_FULL_SCORE) * 100));
}

// Buendelt alle Einzel-Scores + Gesamtscore an einer Stelle, damit die Erstanalyse
// (renderAnalysis) und die EQ-Live-Vorschau (updateEqPreview) exakt dieselbe Gewichtung nutzen -
// zwei getrennte Kopien derselben Formel waeren eine Quelle fuer leise auseinanderlaufende Werte.
function computeAllScores(audioMetrics, lyrics, profile) {
  const scores = {
    technik: scoreTechnik(audioMetrics, profile),
    lautheit: scoreLautheit(audioMetrics, profile.loudnessTarget),
    frequenz: scoreFrequenz(audioMetrics, profile.refs),
    hook: scoreHook(lyrics),
    titel: scoreTitel(lyrics),
    monoCompat: scoreMonoCompat(audioMetrics.phaseCorrelation),
    dynamikumfang: scoreDynamikumfang(audioMetrics, profile),
  };

  const weighted = [
    { score: scores.technik, weight: 18 },
    { score: scores.lautheit, weight: 12 },
    { score: scores.frequenz, weight: 20 },
    { score: scores.hook, weight: 25 },
    { score: scores.titel, weight: 25 },
  ].filter((x) => x.score !== null);

  const totalWeight = weighted.reduce((a, x) => a + x.weight, 0);
  const overallScore = Math.round(weighted.reduce((a, x) => a + x.score * x.weight, 0) / totalWeight);

  return { scores, overallScore };
}

// Rendert die 7 Fakten-Meter - gemeinsam genutzt von der Erstanalyse und der EQ-Live-Vorschau,
// damit beide exakt dasselbe Markup/dieselbe Beschriftungslogik erzeugen.
function renderMetersInto(metersEl, scores, audioMetrics, lyrics, profile) {
  const isInstrumentalGenre = TYPICALLY_INSTRUMENTAL_GENRES.includes(profile.rawKey);
  const lyricsMissingLabel = isInstrumentalGenre && !lyrics.hasLyrics ? t("meterInstrumentalGenre") : t("meterLyricsMissing");

  metersEl.innerHTML = "";
  renderMeter(metersEl, { name: t("meterTechnik"), score: scores.technik });
  renderMeter(metersEl, { name: t("meterLautheit"), score: scores.lautheit });
  renderMeter(metersEl, { name: t("meterFrequenz"), score: scores.frequenz });
  renderMeter(metersEl, {
    name: t("meterHook"),
    score: scores.hook,
    statusText: scores.hook === null ? lyricsMissingLabel : "",
  });
  renderMeter(metersEl, {
    name: t("meterTitel"),
    score: scores.titel,
    statusText: scores.titel === null ? (lyrics.hasLyrics ? t("meterTitleMissing") : lyricsMissingLabel) : "",
  });
  renderMeter(metersEl, {
    name: t("meterDynamik", { db: audioMetrics.crestFactorDb.toFixed(1) }),
    score: scores.dynamikumfang,
  });
  renderMeter(metersEl, {
    name: t("meterMonoCompat", { corr: audioMetrics.phaseCorrelation.toFixed(2) }),
    score: scores.monoCompat,
  });
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

  if (a.phaseCorrelation != null && a.phaseCorrelation < 0) {
    const problem = t("tipMonoCancelProblem", { corr: a.phaseCorrelation.toFixed(2) });
    const detail = t("tipMonoCancelDetail");
    const fix = t("tipMonoCancelFix");
    tips.push({ level: "critical", problem, fix, text: tipText(problem, detail, fix) });
  } else if (a.phaseCorrelation != null && a.phaseCorrelation < 0.3) {
    const problem = t("tipMonoWeakProblem", { corr: a.phaseCorrelation.toFixed(2) });
    const detail = t("tipMonoWeakDetail");
    const fix = t("tipMonoWeakFix");
    tips.push({ level: "warning", problem, fix, text: tipText(problem, detail, fix) });
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
    if (TYPICALLY_INSTRUMENTAL_GENRES.includes(profile.rawKey)) {
      const problem = t("tipNoLyricsInstrumentalNote");
      tips.push({ level: "good", problem, fix: "", text: tipText(problem, null, "") });
    } else {
      const problem = t("tipNoLyricsProblem");
      const fix = t("tipNoLyricsFix");
      tips.push({ level: "warning", problem, fix, text: tipText(problem, null, fix) });
    }
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
        const problem = t("tipTitleRepeatProblem", { count: lyrics.titleOccurrences });
        const detail = t("tipTitleRepeatDetail", { count: TITLE_OCCURRENCES_FOR_FULL_SCORE });
        const fix = t("tipTitleRepeatFix");
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
  // Reines "keine Vollausschlaege"-Kriterium (clippingRatio < 0.0005) trifft auf fast jeden
  // Track zu, der nicht absichtlich hart geclippt ist - das Abzeichen erschien dadurch quasi
  // immer, egal wie der Track eigentlich klingt. scores.technik ist bereits genre-abhaengig
  // (Idealpunkt statt Fenster, siehe scoreTechnik) und fasst Clipping + Crest-Faktor sauber
  // zusammen, dadurch wird "Kristallklar" wieder ein echtes, selten erreichtes Abzeichen.
  if (audioMetrics.clippingRatio < 0.0005 && scores.technik >= 90) list.push({ emoji: "🧼", label: t("achClean") });
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
  const colors = ["#cda86b", "#f0d19c", "#8a6a35", "#f3efe6"];
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

// Zusaetzliche, genre-typische Anlaufstellen - nur dort ergaenzt, wo es eine wirklich passende,
// bekannte Plattform gibt, statt fuer jedes Genre etwas Beliebiges zu erfinden.
const GENRE_SUBMISSION_EXTRAS = {
  edm: { nameKey: "submitBeatportName", reasonKey: "submitBeatportReason" },
  hiphop: { nameKey: "submitAudiomackName", reasonKey: "submitAudiomackReason" },
  klassik: { nameKey: "submitIdagioName", reasonKey: "submitIdagioReason" },
  rock: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
  metal: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
  acoustic: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
  jazz: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
  reggae: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
  latin: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
  volksmusik: { nameKey: "submitBandcampName", reasonKey: "submitBandcampReason" },
};

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

  const genreExtra = GENRE_SUBMISSION_EXTRAS[genreKey];
  if (genreExtra) {
    items.push({ name: t(genreExtra.nameKey), reason: t(genreExtra.reasonKey, { genre }) });
  }

  // Vertrieb ist kategorisch etwas anderes als Kuratoren-Einreichung: bringt den Track unabhaengig
  // vom Score auf die Streaming-Plattformen, statt um redaktionelle Aufmerksamkeit zu werben.
  // Deshalb eigener Eintrag am Ende, nicht score-abhaengig gefiltert wie die anderen.
  items.push({ name: t("submitDistroKidName"), reason: t("submitDistroKidReason") });

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
    <div class="meter-track">
      <div class="meter-fill" style="width:0%;background:${status.color}"></div>
      <div class="meter-handle" style="left:0%;background:${status.color}"></div>
    </div>
  `;
  container.appendChild(el);
  const fill = el.querySelector(".meter-fill");
  const handle = el.querySelector(".meter-handle");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      fill.style.width = score + "%";
      handle.style.left = score + "%";
    })
  );
}

let freqChartUid = 0;

// Ob ein Frequenzband im, knapp neben oder deutlich ausserhalb seines Referenzbereichs liegt -
// dieselbe +-3-Prozentpunkte-Toleranz wie bei suggestedEqGainDb, damit Kurvenfarbe und
// EQ-Vorschlag immer dieselbe Grenze meinen statt zwei leicht widerspruechlichen Massstaeben.
function statusForBandValue(val, lo, hi) {
  if (val >= lo && val <= hi) return "good";
  if (val < lo - 3 || val > hi + 3) return "critical";
  return "warning";
}

function statusColorVar(key) {
  return key === "good" ? "var(--status-good)" : key === "critical" ? "var(--status-critical)" : "var(--status-warning)";
}

// Sanfte Verlaufskurve statt einzelner Balken: derselbe Glaettungs-Trick wie bei
// drawEqCurveOverlay im EQ-Editor (Quadratic-Curve durch die Mittelpunkte benachbarter Punkte) -
// sorgt fuer denselben visuellen Wiedererkennungswert zwischen Kurzcheck-Chart und EQ-Editor.
// Farbe pro Punkt/Segment zeigt an, ob dieses Band im Referenzbereich liegt (grafisch sofort
// erkennbar statt nur ueber eine grau hinterlegte Zielzone wie zuvor).
function renderFreqChart(container, bandPercents, refs) {
  container.innerHTML = "";
  const uid = freqChartUid++;
  const maxVal = Math.max(...bandPercents, ...refs.map((r) => r[1])) * 1.15;
  const W = 700;
  const H = 190;
  const padTop = 14;
  const padBottom = 40;
  const padLeft = 30;
  const padRight = 10;
  const plotW = W - padLeft - padRight;
  const baseY = padTop + H;

  const xFor = (i) => padLeft + (i / (FREQ_BANDS.length - 1)) * plotW;
  const yFor = (val) => padTop + H * (1 - Math.min(1, val / maxVal));

  const points = FREQ_BANDS.map((band, i) => {
    const val = bandPercents[i];
    const [lo, hi] = refs[i];
    return { x: xFor(i), y: yFor(val), val, lo, hi, status: statusForBandValue(val, lo, hi), band };
  });

  const linePath = points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    const midX = (prev.x + p.x) / 2;
    const midY = (prev.y + p.y) / 2;
    return `${d} Q${prev.x},${prev.y} ${midX},${midY}`;
  }, "");
  const lastPoint = points[points.length - 1];
  const fullLinePath = `${linePath} L${lastPoint.x},${lastPoint.y}`;
  const areaPath = `${fullLinePath} L${lastPoint.x},${baseY} L${points[0].x},${baseY} Z`;

  const gradStops = points
    .map((p) => `<stop offset="${((p.x / W) * 100).toFixed(1)}%" stop-color="${statusColorVar(p.status)}"/>`)
    .join("");

  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const y = padTop + H * (1 - f);
    return `<line x1="${padLeft}" y1="${y}" x2="${W - padRight}" y2="${y}" class="freq-gridline"/>
      <text x="${padLeft - 6}" y="${y}" class="freq-y-label" text-anchor="end" dominant-baseline="middle">${(maxVal * f).toFixed(0)}</text>`;
  });

  const dots = points
    .map(
      (p) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${statusColorVar(p.status)}" stroke="var(--bg-plane)" stroke-width="2">
        <title>${t("freqBarTitle", { name: bandLabel(p.band), val: p.val.toFixed(1), lo: p.lo, hi: p.hi })}</title>
      </circle>
      <text x="${p.x}" y="${p.y - 12}" class="freq-point-value" text-anchor="middle" fill="${statusColorVar(p.status)}">${p.val.toFixed(1)}%</text>`
    )
    .join("");

  const xLabels = points
    .map(
      (p) =>
        `<text x="${p.x}" y="${baseY + 18}" class="freq-x-label" text-anchor="middle">${bandLabel(p.band)}</text>
         <text x="${p.x}" y="${baseY + 32}" class="freq-x-sublabel" text-anchor="middle">${p.band.range[0]}-${p.band.range[1]}Hz</text>`
    )
    .join("");

  container.innerHTML = `
    <svg class="freq-svg" viewBox="0 0 ${W} ${padTop + H + padBottom}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="freq-grad-${uid}" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">${gradStops}</linearGradient>
        <linearGradient id="freq-grad-area-${uid}" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">${gradStops}</linearGradient>
      </defs>
      ${gridTicks.join("")}
      <path d="${areaPath}" fill="url(#freq-grad-area-${uid})" opacity="0.28" stroke="none"/>
      <path d="${fullLinePath}" fill="none" stroke="url(#freq-grad-${uid})" stroke-width="3" stroke-linecap="round"/>
      ${dots}
      ${xLabels}
    </svg>
  `;
}

// Referenz-Track-Vergleich: eigene, bewusst simple Mini-Chart getrennt von renderFreqChart (statt
// dessen Signatur/Logik zu erweitern) - geringeres Risiko fuer Regressionen am gut getesteten
// Hauptchart, zeigt beide Kurven (eigener Track vs. Referenz) uebereinander auf gleicher Skala.
function buildFreqLinePath(percents, xFor, yFor) {
  const pts = percents.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const midX = (prev.x + p.x) / 2;
    const midY = (prev.y + p.y) / 2;
    return `${acc} Q${prev.x},${prev.y} ${midX},${midY}`;
  }, "");
  const last = pts[pts.length - 1];
  return `${d} L${last.x},${last.y}`;
}

function biggestBandDiff(ownPercents, refPercents) {
  let maxDiff = 0;
  let maxIdx = 0;
  ownPercents.forEach((v, i) => {
    const diff = v - refPercents[i];
    if (Math.abs(diff) > Math.abs(maxDiff)) {
      maxDiff = diff;
      maxIdx = i;
    }
  });
  return { band: FREQ_BANDS[maxIdx], diff: maxDiff };
}

function renderRefCompareChart(container, ownPercents, refPercents) {
  const W = 700;
  const H = 140;
  const padTop = 14;
  const padBottom = 26;
  const padLeft = 34;
  const padRight = 30;
  const plotW = W - padLeft - padRight;
  const maxVal = Math.max(...ownPercents, ...refPercents) * 1.15 || 1;

  const xFor = (i) => padLeft + (i / (FREQ_BANDS.length - 1)) * plotW;
  const yFor = (val) => padTop + H * (1 - Math.min(1, val / maxVal));

  const ownPath = buildFreqLinePath(ownPercents, xFor, yFor);
  const refPath = buildFreqLinePath(refPercents, xFor, yFor);

  const xLabels = FREQ_BANDS.map(
    (band, i) => `<text x="${xFor(i)}" y="${padTop + H + 18}" class="freq-x-label" text-anchor="middle">${bandLabel(band)}</text>`
  ).join("");

  const { band: diffBand, diff } = biggestBandDiff(ownPercents, refPercents);
  const diffKey = diff > 0 ? "refCompareMore" : diff < 0 ? "refCompareLess" : "refCompareEqual";
  const summaryText = t(diffKey, { band: bandLabel(diffBand), diff: Math.abs(diff).toFixed(1) });

  container.innerHTML = `
    <svg class="ref-compare-svg" viewBox="0 0 ${W} ${padTop + H + padBottom}" preserveAspectRatio="none">
      <path d="${refPath}" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="6,5"/>
      <path d="${ownPath}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round"/>
      ${xLabels}
    </svg>
    <div class="ref-compare-legend">
      <span class="ref-legend-item"><span class="ref-legend-dot ref-legend-own"></span>${escapeHtml(t("refCompareOwn"))}</span>
      <span class="ref-legend-item"><span class="ref-legend-dot ref-legend-ref"></span>${escapeHtml(t("refCompareRef"))}</span>
    </div>
    <p class="ref-compare-summary">${escapeHtml(summaryText)}</p>
  `;
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
let lastFazitText = "";
let currentCheckId = null;

function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Wortweiser Zeilenumbruch (kein Bibliotheks-Overhead fuer diesen einen Anwendungsfall im
// Share-Bild) - ctx.font muss vor dem Aufruf bereits gesetzt sein, da die Breitenmessung darauf
// basiert.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Wie wrapLines, zeichnet aber direkt zentriert um y herum - gibt die Zeilenzahl zurueck, damit
// nachfolgende Elemente (Trennlinie, Fusszeile) sich an der tatsaechlichen Hoehe ausrichten koennen.
function wrapCenteredText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = wrapLines(ctx, text, maxWidth);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  return lines.length;
}

// Baut ein quadratisches Ergebnis-Bild (Sterne, Score, Urteil, Songtitel) zum Mitschicken beim
// Teilen. Bewusst mit Canvas selbst gezeichnet statt eines DOM-Screenshots der echten Seite (z.B.
// per html2canvas) - so sieht das Bild immer so aus, wie es aussehen SOLL, unabhaengig vom
// Scroll-/Layout-Zustand der Seite im Moment des Klicks, und ohne fremde Bibliothek nachzuladen.
async function buildShareCardBlob(info) {
  try {
    await document.fonts.ready;
  } catch {
    /* Font-Ladefehler ignorieren - Canvas faellt dann auf eine System-Schrift zurueck */
  }

  // Hochformat statt quadratisch - Ampel-Urteil + "groesstes Problem" (der eigentliche
  // Kurzcheck-Kern, siehe Produktbeschreibung) brauchen mehr vertikalen Platz als nur Score+Sterne.
  const width = 1080;
  const height = 1320;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#07080c");
  bgGrad.addColorStop(1, "#0b0e14");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height * 0.4, 40, width / 2, height * 0.4, height * 0.55);
  glow.addColorStop(0, "rgba(205, 168, 107, 0.16)");
  glow.addColorStop(1, "rgba(205, 168, 107, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.textBaseline = "alphabetic";

  // Logo + Wortmarke als zentrierte Gruppe
  let logoImg = null;
  try {
    logoImg = await loadImageAsync("logo.svg");
  } catch {
    /* Logo ist ein Bonus, kein Blocker fuers restliche Bild */
  }
  const wordmark = "OVERHERTZ";
  ctx.font = "700 40px Manrope, sans-serif";
  const wordmarkWidth = ctx.measureText(wordmark).width;
  const logoSize = 64;
  const logoGap = 18;
  const lockupWidth = (logoImg ? logoSize + logoGap : 0) + wordmarkWidth;
  const lockupStartX = width / 2 - lockupWidth / 2;
  const lockupY = 120;
  if (logoImg) ctx.drawImage(logoImg, lockupStartX, lockupY - logoSize / 2 - 8, logoSize, logoSize);
  ctx.fillStyle = "#cda86b";
  ctx.textAlign = "left";
  ctx.fillText(wordmark, lockupStartX + (logoImg ? logoSize + logoGap : 0), lockupY + 12);

  // Sterne
  ctx.textAlign = "center";
  const stars = Math.max(0, Math.min(5, info.stars || 0));
  ctx.font = "64px Manrope, sans-serif";
  const starGap = 58;
  const starsStartX = width / 2 - (starGap * 4) / 2;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < stars ? "#f0d19c" : "rgba(245, 240, 230, 0.18)";
    ctx.fillText("★", starsStartX + i * starGap, 290);
  }

  // Ampel-Punkt + Urteil, als Gruppe zentriert - der farbige Punkt macht das "Ampel"-Prinzip
  // (rot/gelb/gruen) auf den ersten Blick klar, nicht nur ueber die Textfarbe.
  const verdictColor = info.colorHex || "#f5f0e6";
  const verdictY = 400;
  ctx.font = "600 46px Fraunces, serif";
  const verdictText = info.title || "";
  const verdictWidth = ctx.measureText(verdictText).width;
  const dotRadius = 15;
  const dotGap = 22;
  const verdictGroupWidth = dotRadius * 2 + dotGap + verdictWidth;
  const verdictGroupStartX = width / 2 - verdictGroupWidth / 2;
  ctx.fillStyle = verdictColor;
  ctx.beginPath();
  ctx.arc(verdictGroupStartX + dotRadius, verdictY - 16, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillText(verdictText, verdictGroupStartX + dotRadius * 2 + dotGap, verdictY);
  ctx.textAlign = "center";

  // Score gross, "/100" kleiner direkt daneben
  const scoreText = String(info.score != null ? info.score : "–");
  ctx.font = "700 190px Fraunces, serif";
  const scoreWidth = ctx.measureText(scoreText).width;
  ctx.font = "600 56px Fraunces, serif";
  const suffixWidth = ctx.measureText("/100").width;
  const totalScoreWidth = scoreWidth + 14 + suffixWidth;
  const scoreBaseline = 660;
  ctx.textAlign = "left";
  ctx.font = "700 190px Fraunces, serif";
  ctx.fillStyle = verdictColor;
  ctx.fillText(scoreText, width / 2 - totalScoreWidth / 2, scoreBaseline);
  ctx.font = "600 56px Fraunces, serif";
  ctx.fillStyle = "rgba(245, 240, 230, 0.7)";
  ctx.fillText("/100", width / 2 - totalScoreWidth / 2 + scoreWidth + 14, scoreBaseline);
  ctx.textAlign = "center";

  // Songtitel
  if (info.songTitle) {
    ctx.font = "500 38px Manrope, sans-serif";
    ctx.fillStyle = "rgba(183, 178, 166, 0.9)";
    wrapCenteredText(ctx, `„${info.songTitle}“`, width / 2, 760, width - 200, 46);
  }

  // Groesstes Problem (bzw. groesste Staerke) - der eigentliche Inhalt des kostenlosen
  // Kurzchecks, nicht nur die Randdaten Score/Sterne.
  let afterProblemY = 830;
  if (info.problemText) {
    ctx.font = "700 28px Manrope, sans-serif";
    ctx.fillStyle = "#cda86b";
    const labelY = 860;
    ctx.fillText((info.problemLabel || "").toUpperCase(), width / 2, labelY);

    ctx.font = "500 36px Manrope, sans-serif";
    ctx.fillStyle = "#f5f0e6";
    const problemLineHeight = 46;
    const problemStartY = labelY + 65;
    const lines = wrapLines(ctx, info.problemText, width - 240);
    lines.forEach((l, i) => ctx.fillText(l, width / 2, problemStartY + i * problemLineHeight));
    afterProblemY = problemStartY + (lines.length - 1) * problemLineHeight + 70;
  }

  // Fusszeile mit Trennlinie
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 90, afterProblemY);
  ctx.lineTo(width / 2 + 90, afterProblemY);
  ctx.stroke();

  ctx.font = "600 32px Manrope, sans-serif";
  ctx.fillStyle = "#cda86b";
  ctx.fillText(t("shareCardCta"), width / 2, afterProblemY + 55);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

const shareResultBtn = document.getElementById("share-result-btn");
if (shareResultBtn) {
  shareResultBtn.addEventListener("click", async () => {
    if (!lastShareInfo) return;
    const shareText = t("shareText", { stars: lastShareInfo.stars, title: lastShareInfo.title, score: lastShareInfo.score });
    const shareUrl = window.location.origin + window.location.pathname;
    const combined = `${shareText} ${shareUrl}`;
    const labelSpan = shareResultBtn.querySelector("span");
    const originalLabel = labelSpan ? labelSpan.textContent : "";
    let imageBlob = null;
    try {
      imageBlob = await buildShareCardBlob(lastShareInfo);
    } catch {
      // Bild ist ein Bonus obendrauf, kein Blocker fuers Teilen selbst - ohne Bild faellt's auf
      // reinen Text+Link zurueck.
    }
    try {
      if (navigator.share) {
        const file = imageBlob ? new File([imageBlob], "overhertz-ergebnis.png", { type: "image/png" }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ text: combined, files: [file] });
        } else {
          // Text und url als GETRENNTE Felder uebergeben lief bei manchen Share-Zielen (u.a. WhatsApp
          // auf Android) als zwei separate Nachrichten auf statt als eine - je ein Linkvorschau-Kaertchen
          // und ein zusaetzlicher reiner Textschnipsel. Alles in ein einziges "text"-Feld gepackt, ohne
          // separates "url", damit der Share-Dialog nur EIN Element weitergibt.
          await navigator.share({ text: combined });
        }
        return;
      }
      await navigator.clipboard.writeText(combined);
      if (imageBlob) downloadBlob(imageBlob, "overhertz-ergebnis.png");
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

// PDF-Export der Tiefenanalyse: bewusst ueber den Browser-eigenen Druckdialog statt einer
// PDF-Library (keine zusaetzliche CDN-Last/Page-Speed-Kosten) - @media print in style.css
// blendet alles bis auf #premium-results aus. Hier wird nur der druckfreundliche Kopfbereich
// (Branding, Songtitel, Urteil, Datum) aus lastShareInfo befuellt, bevor window.print() greift.
const exportPdfBtn = document.getElementById("export-pdf-btn");
if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", () => {
    const header = document.getElementById("pdf-print-header");
    if (header && lastShareInfo) {
      const dateStr = new Date().toLocaleDateString();
      header.innerHTML = `
        <div class="pdf-header-brand">Overhertz</div>
        <h1 class="pdf-header-title">${escapeHtml(lastShareInfo.songTitle || t("historyUntitled"))}</h1>
        <div class="pdf-header-meta">
          <span class="pdf-header-dot" style="background:${lastShareInfo.colorHex || "#cda86b"}"></span>
          <span>${escapeHtml(lastShareInfo.title)} — ${lastShareInfo.score}/100</span>
          <span class="pdf-header-date">${escapeHtml(dateStr)}</span>
        </div>
      `;
    }
    window.print();
  });
}

// Referenz-Track-Vergleich: laeuft komplett ueber dieselbe analyzeAudioBuffer()-Pipeline wie der
// Haupt-Upload, rein client-seitig - die Referenzdatei verlaesst den Browser nie, es gibt keinen
// Server-Roundtrip dafuer.
const refFileInput = document.getElementById("ref-file-input");
if (refFileInput) {
  refFileInput.addEventListener("change", async () => {
    const file = refFileInput.files[0];
    if (!file) return;
    const statusEl = document.getElementById("ref-compare-status");
    const resultEl = document.getElementById("ref-compare-result");
    resultEl.hidden = true;

    if (file.size > MAX_UPLOAD_BYTES) {
      statusEl.textContent = t("fileTooLarge", { size: Math.round(file.size / 1024 / 1024) });
      return;
    }
    if (!currentAnalysisSnapshot || !currentAnalysisSnapshot.audioMetrics) {
      statusEl.textContent = t("refCompareNoOwnTrack");
      return;
    }

    statusEl.textContent = t("statusDecoding");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      statusEl.textContent = t("statusAnalyzing");
      await new Promise((r) => setTimeout(r, 10));
      const refMetrics = analyzeAudioBuffer(audioBuffer);
      renderRefCompareChart(resultEl, currentAnalysisSnapshot.audioMetrics.bandPercents, refMetrics.bandPercents);
      resultEl.hidden = false;
      statusEl.textContent = "";
    } catch {
      statusEl.textContent = t("refCompareError");
    }
  });
}

// Der Worker streamt die Anthropic-Antwort als Klartext im
// ###EINORDNUNG###/###TITEL###/###TEXT###-Format (siehe songtext-worker.js), statt auf die
// komplette Antwort zu warten - fuehlt sich dadurch spuerbar schneller an. parseKiStream() wird
// bei jedem neu angekommenen Chunk erneut ueber den bisher gesammelten Text aufgerufen.
function parseKiStream(raw) {
  const MARK_REKONSTRUKTION = "###REKONSTRUKTION###";
  const MARK_EINORDNUNG = "###EINORDNUNG###";
  const MARK_TITEL = "###TITEL###";
  const MARK_TEXT = "###TEXT###";
  const MARK_AUSSPRACHE = "###AUSSPRACHE###";

  const rekonstruktionStart = raw.indexOf(MARK_REKONSTRUKTION);
  const einordnungStart = raw.indexOf(MARK_EINORDNUNG);
  const titelStart = raw.indexOf(MARK_TITEL);
  const textStart = raw.indexOf(MARK_TEXT);
  const ausspracheStart = raw.indexOf(MARK_AUSSPRACHE);

  let reconstruction = "";
  if (rekonstruktionStart !== -1) {
    const end = einordnungStart !== -1 ? einordnungStart : raw.length;
    reconstruction = raw.slice(rekonstruktionStart + MARK_REKONSTRUKTION.length, end).trim();
  }

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

  let improved = "";
  if (textStart !== -1) {
    const end = ausspracheStart !== -1 ? ausspracheStart : raw.length;
    improved = raw.slice(textStart + MARK_TEXT.length, end).trim();
  }

  const pronunciation = ausspracheStart !== -1 ? raw.slice(ausspracheStart + MARK_AUSSPRACHE.length).trim() : "";

  return { reconstruction, classification, titleIdeas, improved, pronunciation };
}

async function streamKiEinschaetzung(title, lyrics, metrics, genre, transcript, onUpdate) {
  const res = await fetch(SONGTEXT_WORKER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, lyrics, metrics, genre: genre ? genreLabel(genre) : "", transcript: transcript || "" }),
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

// Meldet anonyme Rohmesswerte fuer die Genre-Statistik-Seiten - bewusst OHNE Auth-Header (kein
// Nutzerbezug), best effort (kein await im Aufrufer noetig, Fehler werden verschluckt), blockiert
// die eigentliche Analyse nie. Keine Audiodatei/Songtitel/Nutzerdaten, nur Zahlen + Genre-Slug.
function reportAnonymousMetrics(genreSlug, audioMetrics, fileInfo, metadataViolationCount, titleOccurrences) {
  if (!genreSlug) return;
  const payload = {
    genreSlug,
    metrics: {
      bandPercents: audioMetrics.bandPercents,
      loudnessDb: audioMetrics.loudnessDb,
      truePeakDb: audioMetrics.truePeakDb,
      crestFactorDb: audioMetrics.crestFactorDb,
      phaseCorrelation: audioMetrics.phaseCorrelation,
      introSilenceMs: audioMetrics.introSilenceMs,
      outroEndsAbruptly: audioMetrics.outroEndsAbruptly,
      duration: audioMetrics.duration,
      sampleRate: audioMetrics.sampleRate,
      bitDepth: fileInfo && Number.isInteger(fileInfo.bitDepth) ? fileInfo.bitDepth : null,
      metadataViolationCount: metadataViolationCount || 0,
      titleOccurrences: titleOccurrences || 0,
    },
  };
  fetch(WORKER_BASE + "track-metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
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
    const isSubscribed = currentUser.plan === "pro" || currentUser.plan === "pro_annual";
    accountBar.innerHTML = `
      <div class="account-actions">
        <button type="button" id="history-toggle-btn" class="account-btn">${t("historyToggleBtn")}</button>
        ${isSubscribed ? `<button type="button" id="manage-subscription-btn" class="account-btn">${t("accountManageSubscriptionBtn")}</button>` : ""}
        <button type="button" id="logout-btn" class="account-btn">${t("accountLogoutBtn")}</button>
      </div>
      <div class="account-meta">
        <span class="account-info"><strong>${currentUser.email}</strong> · ${planLabel} · ${quotaText}</span>
        <button type="button" id="delete-account-btn" class="link-btn">${t("accountDeleteBtn")}</button>
      </div>
    `;
    document.getElementById("logout-btn").addEventListener("click", handleLogout);
    document.getElementById("delete-account-btn").addEventListener("click", handleDeleteAccount);
    document.getElementById("history-toggle-btn").addEventListener("click", toggleHistoryCard);
    const manageBtn = document.getElementById("manage-subscription-btn");
    if (manageBtn) manageBtn.addEventListener("click", handleManageSubscription);
  } else {
    accountBar.innerHTML = `<button type="button" id="account-toggle" class="account-btn">${t("accountLoginRegisterBtn")}</button>`;
    document.getElementById("account-toggle").addEventListener("click", () => toggleAuthCard());
  }
  renderVerifyEmailBanner();
}

// Rein informativ (blockiert nichts, siehe /auth/resend-verification) - macht nur sichtbar, dass
// die E-Mail noch nicht bestaetigt ist, mit direktem Weg zum erneuten Verschicken.
function renderVerifyEmailBanner() {
  const banner = document.getElementById("verify-email-banner");
  if (!banner) return;
  banner.hidden = !currentUser || currentUser.emailVerified !== false;
  if (banner.hidden) return;
  const resendBtn = document.getElementById("verify-email-resend-btn");
  if (!resendBtn) return;
  resendBtn.textContent = t("verifyEmailResendBtn");
  resendBtn.onclick = async () => {
    resendBtn.disabled = true;
    resendBtn.textContent = t("verifyEmailResendSending");
    const { ok, data } = await apiFetch("auth/resend-verification", { method: "POST" });
    resendBtn.disabled = false;
    resendBtn.textContent = ok ? t("verifyEmailResendSuccess") : data.error || t("verifyEmailResendFailed");
    if (ok) setTimeout(() => (resendBtn.textContent = t("verifyEmailResendBtn")), 4000);
  };
}

function toggleAuthCard(forceOpen) {
  if (!authCard) return;
  authCard.hidden = forceOpen === true ? false : !authCard.hidden;
  if (!authCard.hidden) authCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Login/Registrieren-Button bzw. Konto-Infos stecken hinter einem Zahnrad-Symbol statt direkt im
// Header zu stehen - raeumt die Seite fuer neue Besucher auf (nur noch DE/EN direkt sichtbar).
const accountMenuToggle = document.getElementById("account-menu-toggle");
const accountMenuPanel = document.getElementById("account-menu-panel");
if (accountMenuToggle && accountMenuPanel) {
  function closeAccountMenu() {
    accountMenuPanel.hidden = true;
    accountMenuToggle.setAttribute("aria-expanded", "false");
  }
  accountMenuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = accountMenuPanel.hidden;
    accountMenuPanel.hidden = !willOpen;
    accountMenuToggle.setAttribute("aria-expanded", String(willOpen));
  });
  // Jeder Klick auf eine Aktion im Menue (Login, Logout, Meine Checks, ...) schliesst das Menue
  // gleich mit - die eigentlichen Handler dafuer werden dynamisch in renderAccountBar() gesetzt.
  accountMenuPanel.addEventListener("click", closeAccountMenu);
  document.addEventListener("click", (e) => {
    if (!accountMenuPanel.hidden && !accountMenuPanel.contains(e.target) && e.target !== accountMenuToggle) {
      closeAccountMenu();
    }
  });
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

async function handleManageSubscription() {
  const { ok, data } = await apiFetch("create-portal-session", { method: "POST" });
  if (ok && data.url) {
    window.location.href = data.url;
  } else {
    if (pricingStatus) pricingStatus.textContent = data.error || t("manageSubscriptionFailed");
  }
}

async function handleDeleteAccount() {
  if (!window.confirm(t("accountDeleteConfirm"))) return;
  const { ok, data } = await apiFetch("auth/delete-account", { method: "POST" });
  if (ok) {
    setToken("");
    currentUser = null;
    renderAccountBar();
    window.alert(t("accountDeleteSuccess"));
  } else {
    window.alert(data.error || t("accountDeleteFailed"));
  }
}

/* ---------- Verlauf ("Meine Checks") - gespeicherte Analyseergebnisse, keine Audiodateien ---------- */

const historyCard = document.getElementById("history-card");
const historyStatus = document.getElementById("history-status");
const historyList = document.getElementById("history-list");
const historyDetail = document.getElementById("history-detail");
const historyBackBtn = document.getElementById("history-back-btn");

function toggleHistoryCard() {
  if (!historyCard) return;
  const willOpen = historyCard.hidden;
  historyCard.hidden = !willOpen;
  if (willOpen) {
    historyDetail.hidden = true;
    historyList.hidden = false;
    loadHistoryList();
    historyCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Zeigt den Score-Verlauf ueber die letzten Checks als kleine Kurve - motiviert durch sichtbaren
// Fortschritt, nutzt aber nur Daten, die /my-checks eh schon liefert (kein neuer Endpunkt noetig).
// Erst ab 2 Checks mit Score sinnvoll, sonst gibt's schlicht keinen Verlauf zu zeigen.
function renderHistoryTrend(container, checks) {
  const points = checks
    .filter((c) => typeof c.overallScore === "number")
    .slice()
    .reverse(); // /my-checks liefert neueste zuerst, der Verlauf soll chronologisch (alt -> neu) laufen
  if (points.length < 2) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  const W = 600;
  const H = 80;
  const padTop = 16;
  const padBottom = 16;
  const padX = 14;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;

  const xFor = (i) => padX + (i / (points.length - 1)) * plotW;
  const yFor = (score) => padTop + plotH * (1 - Math.min(100, Math.max(0, score)) / 100);

  const pts = points.map((c, i) => ({
    x: xFor(i),
    y: yFor(c.overallScore),
    score: c.overallScore,
    date: new Date(c.createdAt).toLocaleDateString(),
    color: statusForScore(c.overallScore).color,
  }));

  const linePath = pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const midX = (prev.x + p.x) / 2;
    const midY = (prev.y + p.y) / 2;
    return `${d} Q${prev.x},${prev.y} ${midX},${midY}`;
  }, "");
  const lastPt = pts[pts.length - 1];
  const fullLinePath = `${linePath} L${lastPt.x},${lastPt.y}`;

  const dots = pts
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${p.color}" stroke="var(--bg-plane)" stroke-width="1.5"><title>${escapeHtml(
          p.date
        )}: ${p.score}/100</title></circle>`
    )
    .join("");

  const first = pts[0];
  const last = pts[pts.length - 1];
  const delta = last.score - first.score;
  const deltaText = delta === 0 ? "±0" : delta > 0 ? `+${delta}` : `${delta}`;

  container.innerHTML = `
    <p class="history-trend-title">${escapeHtml(t("historyTrendTitle", { delta: deltaText }))}</p>
    <svg class="history-trend-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <path d="${fullLinePath}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round"/>
      ${dots}
      <text x="${first.x}" y="${H - 2}" class="history-trend-label" text-anchor="start">${first.score}</text>
      <text x="${last.x}" y="${H - 2}" class="history-trend-label" text-anchor="end">${last.score}</text>
    </svg>
  `;
  container.hidden = false;
}

async function loadHistoryList() {
  historyStatus.textContent = t("historyLoading");
  historyList.innerHTML = "";
  const historyTrend = document.getElementById("history-trend");
  if (historyTrend) historyTrend.hidden = true;
  const { ok, data } = await apiFetch("my-checks", { method: "GET" });
  if (!ok) {
    historyStatus.textContent = data.error || t("historyLoadFailed");
    return;
  }
  if (!data.checks || data.checks.length === 0) {
    historyStatus.textContent = t("historyEmpty");
    return;
  }
  historyStatus.textContent = "";
  if (historyTrend) renderHistoryTrend(historyTrend, data.checks);
  for (const check of data.checks) {
    const li = document.createElement("li");
    li.className = "history-item";
    const date = new Date(check.createdAt).toLocaleDateString();
    const scoreText = typeof check.overallScore === "number" ? `${check.overallScore}/100` : "";
    const genreText = check.genre ? genreLabel(check.genre) : "";
    const metaParts = [date, genreText, scoreText].filter(Boolean).join(" · ");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-item-btn";
    btn.innerHTML = `<span class="history-item-title">${escapeHtml(check.title || t("historyUntitled"))}</span><span class="history-item-meta">${escapeHtml(metaParts)}</span>`;
    btn.addEventListener("click", () => showHistoryDetail(check.id));
    li.appendChild(btn);
    historyList.appendChild(li);
  }
}

async function showHistoryDetail(checkId) {
  historyList.hidden = true;
  historyDetail.hidden = false;
  historyStatus.textContent = t("historyLoading");
  const { ok, data } = await apiFetch("check-detail?id=" + encodeURIComponent(checkId), { method: "GET" });
  if (!ok) {
    historyStatus.textContent = data.error || t("historyLoadFailed");
    return;
  }
  historyStatus.textContent = "";

  document.getElementById("history-detail-title").textContent = data.title || t("historyUntitled");
  const date = new Date(data.createdAt).toLocaleDateString();
  const scoreText = typeof data.overallScore === "number" ? `${data.overallScore}/100` : "";
  const genreText = data.genre ? genreLabel(data.genre) : "";
  document.getElementById("history-detail-meta").textContent = [date, genreText, scoreText].filter(Boolean).join(" · ");

  const classificationBlock = document.getElementById("history-detail-classification-block");
  classificationBlock.hidden = !data.classification;
  document.getElementById("history-detail-classification").textContent = data.classification || "";

  const titleIdeasBlock = document.getElementById("history-detail-titleideas-block");
  const titleIdeasEl = document.getElementById("history-detail-titleideas");
  titleIdeasEl.innerHTML = "";
  if (data.titleIdeas && data.titleIdeas.length > 0) {
    titleIdeasBlock.hidden = false;
    for (const idea of data.titleIdeas) {
      const li = document.createElement("li");
      li.textContent = idea;
      titleIdeasEl.appendChild(li);
    }
  } else {
    titleIdeasBlock.hidden = true;
  }

  const tipsBlock = document.getElementById("history-detail-tips-block");
  const tipsEl = document.getElementById("history-detail-tips");
  tipsEl.innerHTML = "";
  if (data.tips && data.tips.length > 0) {
    tipsBlock.hidden = false;
    for (const tip of data.tips) {
      const li = document.createElement("li");
      li.className = "tip-item";
      li.textContent = tip;
      tipsEl.appendChild(li);
    }
  } else {
    tipsBlock.hidden = true;
  }

  const fazitBlock = document.getElementById("history-detail-fazit-block");
  fazitBlock.hidden = !data.fazit;
  document.getElementById("history-detail-fazit").textContent = data.fazit || "";

  const lyricsBlock = document.getElementById("history-detail-lyrics-block");
  lyricsBlock.hidden = !data.improvedLyrics;
  document.getElementById("history-detail-lyrics").textContent = data.improvedLyrics || "";
}

if (historyBackBtn) {
  historyBackBtn.addEventListener("click", () => {
    historyDetail.hidden = true;
    historyList.hidden = false;
  });
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

document.querySelectorAll(".password-toggle").forEach((btn) => {
  const input = document.getElementById(btn.dataset.target);
  if (!input) return;
  btn.setAttribute("aria-label", t("passwordShowLabel"));
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.classList.toggle("is-visible", show);
    btn.setAttribute("aria-label", show ? t("passwordHideLabel") : t("passwordShowLabel"));
  });
});

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

// Verifizierungs-Link (?verify=<token>) direkt beim Laden erkennen und bestaetigen - blockiert
// nichts (siehe renderVerifyEmailBanner), zeigt nur eine Rueckmeldung, ob's geklappt hat. Faengt
// sowohl den Fall "auf diesem Geraet noch eingeloggt" (Banner verschwindet nach refreshAccount)
// als auch "auf einem anderen Geraet/Browser geoeffnet" ab (Status liegt server-seitig am Konto).
const verifyTokenFromUrl = new URLSearchParams(window.location.search).get("verify");
if (verifyTokenFromUrl) {
  (async () => {
    const { ok, data } = await apiFetch("auth/verify-email", { method: "POST", body: JSON.stringify({ token: verifyTokenFromUrl }) });
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("verify");
    window.history.replaceState({}, "", cleanUrl);
    await refreshAccount();
    toggleAuthCard(true);
    showAuthForm(loginForm);
    authStatus.textContent = ok ? t("verifyEmailLinkSuccess") : data.error || t("verifyEmailLinkFailed");
  })();
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
const rewriteBlock = document.getElementById("rewrite-block");
const rewriteBtn = document.getElementById("rewrite-btn");
const rewriteStatus = document.getElementById("rewrite-status");
const rewriteResult = document.getElementById("rewrite-result");
const rewriteOutput = document.getElementById("rewrite-output");
const rewriteClassification = document.getElementById("rewrite-classification");
const rewriteTitleIdeas = document.getElementById("rewrite-title-ideas");
const vocalsBlockEl = document.getElementById("vocals-block");
const vocalsCheckBtn = document.getElementById("vocals-check-btn");
const vocalsCancelBtn = document.getElementById("vocals-cancel-btn");
const vocalsStatus = document.getElementById("vocals-status");
const vocalsResult = document.getElementById("vocals-result");
const vocalsEstimatedNote = document.getElementById("vocals-estimated-note");
let lastVocalsTranscript = "";

let genreManuallySet = false;
const trackGenreSelect = document.getElementById("track-genre");
trackGenreSelect.addEventListener("change", () => {
  genreManuallySet = true;
  if (currentAnalysisSnapshot) {
    const unlockedNow = !premiumResultsEl.hidden;
    renderAnalysis(Object.assign({}, currentAnalysisSnapshot, { genre: trackGenreSelect.value }), { unlockedPremium: unlockedNow });
  }
});

// Perzentil-Einordnung (unteres Viertel / mittlerer Bereich / oberes Viertel) im Vergleich zu
// anderen bereits geprueften Tracks desselben Genres - dieselben genre_stats-Daten wie die
// oeffentlichen /check/:slug-Seiten, hier direkt im Ergebnis statt auf einer separaten Seite.
// Bewusst neutral formuliert (kein "gut"/"schlecht") - lauter oder dynamischer ist nicht per se
// besser, nur anders als der Durchschnitt.
function genreCompareBand(value, stat) {
  if (value == null || !stat || stat.median == null) return null;
  if (stat.p25 != null && value < stat.p25) return "low";
  if (stat.p75 != null && value > stat.p75) return "high";
  return "mid";
}

async function updateGenreCompare(genre, audioMetrics) {
  const container = document.getElementById("genre-compare");
  if (!container) return;
  if (!genre) {
    container.hidden = true;
    return;
  }
  const { ok, data } = await apiFetch("genre-stats?slug=" + encodeURIComponent(genre), { method: "GET" });
  if (!ok || !data.stats) {
    container.hidden = true;
    return;
  }
  const rows = [
    { label: t("genreCompareLoudness"), band: genreCompareBand(audioMetrics.loudnessDb, data.stats.loudnessDb) },
    { label: t("genreCompareDynamics"), band: genreCompareBand(audioMetrics.crestFactorDb, data.stats.crestFactorDb) },
  ].filter((r) => r.band);
  if (!rows.length) {
    container.hidden = true;
    return;
  }
  const bandLabel = { low: t("genreCompareBandLow"), mid: t("genreCompareBandMid"), high: t("genreCompareBandHigh") };
  container.innerHTML = `
    <p class="genre-compare-title">${escapeHtml(t("genreCompareTitle", { n: data.trackCount, genre: genreLabel(genre) }))}</p>
    <div class="genre-compare-rows">
      ${rows
        .map(
          (r) => `
        <div class="genre-compare-row">
          <span class="genre-compare-metric">${escapeHtml(r.label)}</span>
          <span class="genre-compare-band">${escapeHtml(bandLabel[r.band])}</span>
        </div>`
        )
        .join("")}
    </div>
  `;
  container.hidden = false;
}

function renderAnalysis({ title, lyricsRaw, audioMetrics, genre, fileInfo }, { unlockedPremium }) {
  const lyrics = analyzeLyrics(lyricsRaw, title);
  const profile = genreProfile(genre);

  // monoCompat/dynamikumfang fliessen bewusst NICHT in den Gesamtscore/die Kurzcheck-Badges ein -
  // neue, noch unkalibrierte Kennzahlen, die als zusaetzliche Fakten in der Tiefenanalyse stehen,
  // nicht die bereits eingespielte Gesamtgewichtung verschieben sollen.
  const { scores, overallScore } = computeAllScores(audioMetrics, lyrics, profile);

  const soundScore = combineScores([scores.technik, scores.frequenz]);
  const starPotentialScore = scores.lautheit;
  const hookScore = combineScores([scores.hook, scores.titel]);

  const grade = gradeForScore(overallScore);
  document.getElementById("star-rating").innerHTML = starRatingHtml(grade.stars);
  const heroTitleEl = document.getElementById("hero-title");
  heroTitleEl.textContent = grade.title;
  heroTitleEl.style.color = grade.color;
  document.getElementById("hero-desc").textContent = grade.desc;
  lastShareInfo = { stars: grade.stars, title: grade.title, score: overallScore, songTitle: title, colorHex: STATUS_COLOR_HEX[grade.color] || "#f5f0e6" };
  const shareBtnEl = document.getElementById("share-result-btn");
  if (shareBtnEl) shareBtnEl.hidden = false;

  if (grade.celebrate) {
    fireConfetti(document.getElementById("confetti-layer"));
  }

  const isInstrumentalGenre = TYPICALLY_INSTRUMENTAL_GENRES.includes(profile.rawKey);
  const lyricsMissingLabel = isInstrumentalGenre && !lyrics.hasLyrics ? t("meterInstrumentalGenre") : t("meterLyricsMissing");

  renderBadges(document.getElementById("badges"), [
    { label: t("badgeSound"), score: soundScore },
    { label: t("badgeStarPotential"), score: starPotentialScore },
    { label: t("badgeHook"), score: hookScore, mutedNote: lyricsMissingLabel },
  ]);

  const achievements = buildAchievements(audioMetrics, scores, profile.loudnessTarget);
  renderAchievements(document.getElementById("achievements"), achievements);

  // Falls gerade ein Album-Track-Detail offen ist (EQ-Editor dorthin verschoben): erst zurueck
  // an seinen Stammplatz, bevor er hier fuer die Einzelanalyse neu befuellt wird.
  collapseOpenAlbumTrack();
  initEqEditor(audioMetrics, profile);

  const tips = buildTips(audioMetrics, lyrics, scores, profile);
  const topTip = pickTopTip(tips);
  const teaserLabel = topTip.level === "good" ? t("teaserStrength") : t("teaserProblem");
  document.getElementById("teaser-tip").innerHTML = `<span class="mark">✦ ${teaserLabel}</span> ${topTip.problem}`;
  lastShareInfo.problemLabel = teaserLabel;
  lastShareInfo.problemText = topTip.problem;
  updateGenreCompare(genre, audioMetrics).catch(() => {});

  lastAnalysis = {
    overallScore,
    soundScore,
    starPotentialScore,
    hookScore,
    topIssues: tips.filter((tip) => tip.level !== "good").map((tip) => tip.text),
  };

  currentAnalysisSnapshot = { title, lyricsRaw, audioMetrics, genre, fileInfo };

  // Alter Referenz-Vergleich bezieht sich auf den vorigen Track - bei neuer Analyse zuruecksetzen,
  // sonst zeigt die Kurve einen Vergleich gegen einen Track, der nicht mehr der aktuelle ist.
  const refCompareResultEl = document.getElementById("ref-compare-result");
  const refCompareStatusEl = document.getElementById("ref-compare-status");
  const refFileInputEl = document.getElementById("ref-file-input");
  if (refCompareResultEl) refCompareResultEl.hidden = true;
  if (refCompareStatusEl) refCompareStatusEl.textContent = "";
  if (refFileInputEl) refFileInputEl.value = "";

  premiumResultsEl.hidden = !unlockedPremium;

  renderMetersInto(document.getElementById("meters"), scores, audioMetrics, lyrics, profile);

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

  const formatCheckListEl = document.getElementById("format-check-list");
  if (formatCheckListEl) {
    const formatCheckItems = buildFormatCheck({ title, audioMetrics, fileInfo: fileInfo || { ext: "", isLossless: false, bitDepth: null } });
    renderTips(formatCheckListEl, formatCheckItems);
  }

  const fazit = buildFazit(overallScore, tips);
  renderFazit(document.getElementById("fazit-block"), fazit);
  lastFazitText = [fazit.intro, ...fazit.steps.map((s) => "- " + s), fazit.closing].join("\n");

  // Rewrite-/Vocals-Block werden nicht mehr am eingegebenen Songtext gehangen - beide starten
  // nach Freischaltung automatisch (siehe startAutoPremiumFlow), auch ohne Songtext (dann per
  // Vocals-Transkript als Basis). Reset hier nur den Anzeigezustand, nicht die Sichtbarkeit -
  // die steuert startAutoPremiumFlow bzw. bleibt hidden bis zur Freischaltung.
  document.getElementById("rewrite-status").textContent = "";
  document.getElementById("rewrite-result").hidden = true;
  rewriteBtn.hidden = true;

  const vocalsBlockEl = document.getElementById("vocals-block");
  if (vocalsBlockEl) {
    vocalsBlockEl.hidden = true;
    document.getElementById("vocals-status").textContent = "";
    document.getElementById("vocals-result").hidden = true;
    if (vocalsCheckBtn) vocalsCheckBtn.hidden = true;
    if (vocalsCancelBtn) vocalsCancelBtn.hidden = true;
  }

  const submissions = buildSubmissions(overallScore, genre);
  renderSubmissions(document.getElementById("submit-list"), document.getElementById("submit-hint"), submissions);

  freeResultsEl.hidden = false;
}

const rewriteReconstructionBlock = document.getElementById("rewrite-reconstruction-block");
const rewriteReconstruction = document.getElementById("rewrite-reconstruction");
const rewritePronunciationBlock = document.getElementById("rewrite-pronunciation-block");
const rewritePronunciation = document.getElementById("rewrite-pronunciation");

let lastKiResult = null;

// Laeuft automatisch nach der Freischaltung (startAutoPremiumFlow), rewriteBtn selbst dient nur
// noch als manueller "Neu generieren"-Retrigger. Ohne eigenen Songtext wird transcript als Basis
// verwendet - die KI rekonstruiert dann zuerst den wahrscheinlichen Text (###REKONSTRUKTION###),
// bevor sie einordnet/ueberarbeitet.
async function runKiEinschaetzung() {
  if (!SONGTEXT_WORKER_URL) {
    rewriteStatus.textContent = t("rewriteNotConfigured");
    return null;
  }
  const title = document.getElementById("track-title").value;
  const lyricsRaw = document.getElementById("track-lyrics").value;
  const hasLyrics = lyricsRaw.trim().length >= 10;
  const transcript = !hasLyrics ? lastVocalsTranscript || "" : "";
  if (!hasLyrics && transcript.trim().length < 10) {
    return null;
  }

  rewriteBtn.disabled = true;
  rewriteStatus.textContent = t("rewriteLoading");
  rewriteResult.hidden = false;
  rewriteReconstructionBlock.hidden = true;
  rewriteReconstruction.textContent = "";
  rewriteClassification.textContent = "";
  rewriteTitleIdeas.innerHTML = "";
  rewriteOutput.textContent = "";
  rewritePronunciationBlock.hidden = true;
  rewritePronunciation.textContent = "";

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
      transcript,
      (partial) => {
        if (partial.reconstruction) {
          rewriteReconstructionBlock.hidden = false;
          rewriteReconstruction.textContent = partial.reconstruction;
        }
        if (partial.classification) rewriteClassification.textContent = partial.classification;
        if (partial.titleIdeas.length > 0) renderTitleIdeas(partial.titleIdeas);
        if (partial.improved) rewriteOutput.textContent = partial.improved;
        if (partial.pronunciation) {
          rewritePronunciationBlock.hidden = false;
          rewritePronunciation.textContent = partial.pronunciation;
        }
      }
    );
    if (!result.classification) rewriteClassification.textContent = t("rewriteNoClassification");
    rewriteStatus.textContent = "";
    lastKiResult = result;
    return result;
  } catch (err) {
    rewriteResult.hidden = true;
    rewriteStatus.textContent = t("rewriteError", { msg: err && err.message ? err.message : t("unknownError") });
    return null;
  } finally {
    rewriteBtn.disabled = false;
    rewriteBtn.hidden = false;
  }
}

rewriteBtn.addEventListener("click", async () => {
  const kiResult = await runKiEinschaetzung();
  await saveCheckResult(kiResult);
});

// Startet nach der Freischaltung automatisch Transkription + KI-Einschaetzung, ohne dass der
// Nutzer extra klicken/warten muss. Mit Songtext laufen beide parallel (KI braucht das Transkript
// nicht). Ohne Songtext wartet die KI-Einschaetzung auf das Transkript und nutzt es als Basis;
// der Vocals-Vergleich zeigt dann die KI-Rekonstruktion statt eines echten Songtexts als Referenz.
async function startAutoPremiumFlow(checkId) {
  currentCheckId = checkId;
  lastKiResult = null;
  lastVocalsTranscript = "";

  const lyricsRaw = document.getElementById("track-lyrics").value;
  const hasLyrics = lyricsRaw.trim().length >= 10;

  let vocalsPromise = null;
  if (lastAudioBuffer && vocalsBlockEl) {
    vocalsBlockEl.hidden = false;
    vocalsPromise = runVocalsCheck();
  }

  if (hasLyrics) {
    rewriteBlock.hidden = false;
    const [kiResult, transcribedText] = await Promise.all([runKiEinschaetzung(), vocalsPromise || Promise.resolve(null)]);
    if (transcribedText) {
      showVocalsComparison(lyricsRaw, transcribedText, { estimated: false });
    }
    await saveCheckResult(kiResult);
  } else {
    // Kein Songtext eingegeben - die KI-Einschaetzung braucht erst das Vocals-Transkript als
    // Basis. Bisher blieb der ganze Block bis dahin unsichtbar, ohne jeden Hinweis, dass da noch
    // etwas kommt. Jetzt sofort sichtbar mit "wird noch bearbeitet"-Hinweis, wird dann durch
    // runKiEinschaetzung() bzw. die Fehlermeldung unten ueberschrieben. Ausnahme: bei genretypisch
    // instrumentalen Tracks (Techno/Klassik) ist "kein Transkript" der Normalfall, nicht wert,
    // extra angekuendigt/als Fehler gemeldet zu werden - Block bleibt einfach verborgen, ausser es
    // findet sich doch ein Transkript (z.B. Vocal-Sample/Hook in einem Techno-Track).
    const genre = currentAnalysisSnapshot ? currentAnalysisSnapshot.genre : "";
    const isInstrumentalGenre = TYPICALLY_INSTRUMENTAL_GENRES.includes(genre);
    if (vocalsPromise && !isInstrumentalGenre) {
      rewriteBlock.hidden = false;
      rewriteResult.hidden = true;
      rewriteStatus.textContent = t("rewriteWaitingForTranscript");
    }
    const transcribedText = vocalsPromise ? await vocalsPromise : null;
    let kiResult = null;
    if (transcribedText) {
      rewriteBlock.hidden = false;
      kiResult = await runKiEinschaetzung();
      if (kiResult && kiResult.reconstruction) {
        showVocalsComparison(kiResult.reconstruction, transcribedText, { estimated: true });
      }
    } else if (vocalsPromise && !isInstrumentalGenre) {
      rewriteStatus.textContent = t("rewriteNoTranscriptAvailable");
    }
    await saveCheckResult(kiResult);
  }
}

async function saveCheckResult(kiResult) {
  if (!currentCheckId || !currentAnalysisSnapshot) return;
  const title = document.getElementById("track-title").value;
  await apiFetch("save-check-result", {
    method: "POST",
    body: JSON.stringify({
      checkId: currentCheckId,
      title,
      genre: currentAnalysisSnapshot.genre || "",
      overallScore: lastAnalysis ? lastAnalysis.overallScore : null,
      classification: kiResult ? kiResult.classification : "",
      titleIdeas: kiResult ? kiResult.titleIdeas : [],
      improvedLyrics: kiResult ? kiResult.improved : "",
      tips: lastAnalysis ? lastAnalysis.topIssues : [],
      fazit: lastFazitText,
    }),
  });
}

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
    startAutoPremiumFlow(data.checkId);
  } else {
    openPricing(t("unlockNoCredits"));
  }
});

/* ---------- Formatcheck: Distributor-Anforderungen + Titel-Metadaten -----------------------
   Rein technische/textuelle Pruefungen, unabhaengig vom eigentlichen Klang - die haeufigsten
   Ablehnungsgruende bei Distributoren haben oft nichts mit der Musik selbst zu tun. */

const LOSSLESS_EXTENSIONS = ["wav", "flac", "aiff", "aif"];

// Bittiefe steckt nur bei unkomprimierten WAV-Dateien im fmt-Chunk - bei MP3/AAC/etc. gibt es
// keine "Bittiefe" im selben Sinn (nur eine Bitrate), deshalb hier bewusst kein Rateversuch.
function parseWavBitDepth(arrayBuffer) {
  try {
    const view = new DataView(arrayBuffer);
    if (view.byteLength < 12 || view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57415645) {
      return null;
    }
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
      const chunkId = view.getUint32(offset, false);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 0x666d7420 && offset + 8 + 16 <= view.byteLength) {
        return view.getUint16(offset + 8 + 14, true);
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
    return null;
  } catch {
    return null;
  }
}

function buildFileInfo(file, arrayBuffer) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const isLossless = LOSSLESS_EXTENSIONS.includes(ext);
  const bitDepth = ext === "wav" ? parseWavBitDepth(arrayBuffer) : null;
  return { ext, isLossless, bitDepth };
}

// Erkennt die haeufigsten formalen Ablehnungsgruende bei Distributoren, die nichts mit dem Klang
// zu tun haben (ALL CAPS, Emojis, kaputte "feat."-Schreibweise, verbotene Sonderzeichen) sowie
// harte technische Anforderungen (Mindestlaenge fuer Spotify-Streams, Samplerate, Bittiefe bei
// WAV). Regeln unterscheiden sich leicht je Distributor - hier bewusst als "gaengige Praxis"
// formuliert, nicht als universelles Hardfact.
function buildFormatCheck({ title, audioMetrics, fileInfo }) {
  const items = [];
  const titleTrimmed = (title || "").trim();

  if (titleTrimmed) {
    const hasEmoji = /\p{Extended_Pictographic}/u.test(titleTrimmed);
    const isAllCaps = titleTrimmed.length >= 4 && titleTrimmed === titleTrimmed.toUpperCase() && titleTrimmed !== titleTrimmed.toLowerCase();
    const hasFeatMention = /\b(ft\.?|feat\.?|featuring)\b/i.test(titleTrimmed);
    const hasCanonicalFeat = /\(feat\. [^)]+\)/i.test(titleTrimmed);
    const badFeat = hasFeatMention && !hasCanonicalFeat;
    const forbiddenChars = titleTrimmed.match(/[<>|\\^~*$%#{}[\]]/g);

    if (hasEmoji) {
      items.push({ level: "warning", category: "metadata", text: t("formatTitleEmoji") });
    }
    if (isAllCaps) {
      items.push({ level: "warning", category: "metadata", text: t("formatTitleAllCaps") });
    }
    if (badFeat) {
      items.push({ level: "warning", category: "metadata", text: t("formatTitleFeat") });
    }
    if (forbiddenChars && forbiddenChars.length > 0) {
      items.push({ level: "warning", category: "metadata", text: t("formatTitleChars", { chars: [...new Set(forbiddenChars)].join(" ") }) });
    }
    if (!hasEmoji && !isAllCaps && !badFeat && !forbiddenChars) {
      items.push({ level: "good", category: "metadata", text: t("formatTitleOk") });
    }
  }

  if (audioMetrics.duration < 30) {
    items.push({ level: "critical", category: "distributor", text: t("formatDurationTooShort", { s: audioMetrics.duration.toFixed(1) }) });
  } else {
    items.push({ level: "good", category: "distributor", text: t("formatDurationOk", { time: formatEqTime(audioMetrics.duration) }) });
  }

  if (audioMetrics.sampleRate < 44100) {
    items.push({ level: "warning", category: "distributor", text: t("formatSampleRateLow", { hz: audioMetrics.sampleRate }) });
  } else {
    items.push({ level: "good", category: "distributor", text: t("formatSampleRateOk", { hz: audioMetrics.sampleRate }) });
  }

  if (fileInfo.ext === "wav") {
    if (fileInfo.bitDepth) {
      if (fileInfo.bitDepth < 16) {
        items.push({ level: "warning", category: "distributor", text: t("formatBitDepthLow", { bits: fileInfo.bitDepth }) });
      } else {
        items.push({ level: "good", category: "distributor", text: t("formatBitDepthOk", { bits: fileInfo.bitDepth }) });
      }
    }
  } else {
    items.push({ level: "warning", category: "distributor", text: t("formatLossyUpload", { ext: fileInfo.ext.toUpperCase() }) });
  }

  return items;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("audio-file");
  const file = fileInput.files[0];
  if (!file) return;

  if (file.size > MAX_UPLOAD_BYTES) {
    statusLine.textContent = t("fileTooLarge", { size: Math.round(file.size / 1024 / 1024) });
    return;
  }

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
    const fileInfo = buildFileInfo(file, arrayBuffer);

    statusLine.textContent = t("statusAnalyzing");
    await new Promise((r) => setTimeout(r, 10));
    const audioMetrics = analyzeAudioBuffer(audioBuffer);

    const genre = genreManuallySet ? genreSelectEl.value : audioMetrics.estimatedGenre || "";
    genreSelectEl.value = genre;

    if (genre) {
      const lyricsForMetrics = analyzeLyrics(lyricsRaw, title);
      const formatCheckForMetrics = buildFormatCheck({ title, audioMetrics, fileInfo });
      const violationCount = formatCheckForMetrics.filter((item) => item.category === "metadata" && item.level !== "good").length;
      reportAnonymousMetrics(genre, audioMetrics, fileInfo, violationCount, lyricsForMetrics.titleOccurrences || 0);
    }

    renderAnalysis({ title, lyricsRaw, audioMetrics, genre, fileInfo }, { unlockedPremium: false });
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
let vocalsActiveReject = null;

function getVocalsWorker() {
  if (!vocalsWorker) {
    vocalsWorker = new Worker("vocals-worker.js", { type: "module" });
  }
  return vocalsWorker;
}

// Bricht eine laufende Transkription wirklich ab (Worker terminieren), nicht nur die
// Status-Anzeige ausblenden - sonst laeuft der ~140MB-Download/die Berechnung im Hintergrund
// weiter, obwohl der Nutzer auf "Abbrechen" (z.B. wegen Datenvolumen auf dem Handy) geklickt hat.
function cancelTranscription() {
  if (vocalsWorker) {
    vocalsWorker.terminate();
    vocalsWorker = null;
  }
  if (vocalsActiveReject) {
    const reject = vocalsActiveReject;
    vocalsActiveReject = null;
    reject(new Error("cancelled"));
  }
}

// Transkribiert in einem eigenen Thread (vocals-worker.js) statt im UI-Thread - das Laden und
// Ausfuehren des Whisper-Modells wuerde sonst die ganze Seite blockieren/haengen lassen, bis es
// fertig ist (spuerbar vor allem auf dem Handy).
function transcribeInWorker(audioData, language, onProgress, onTranscribing) {
  return new Promise((resolve, reject) => {
    const worker = getVocalsWorker();
    vocalsActiveReject = reject;
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      vocalsActiveReject = null;
    };
    const handleMessage = (event) => {
      const msg = event.data || {};
      if (msg.type === "progress") {
        onProgress(msg.progress);
      } else if (msg.type === "transcribing") {
        if (onTranscribing) onTranscribing();
      } else if (msg.type === "result") {
        cleanup();
        resolve(msg.text);
      } else if (msg.type === "error") {
        cleanup();
        // Nicht weiterverwenden: der Browser cacht einen fehlgeschlagenen Modell-Import fest an
        // diese Worker-Instanz, ein erneuter Versuch im selben Worker wuerde nie neu laden,
        // egal was im Worker selbst schon zurueckgesetzt wird.
        worker.terminate();
        if (vocalsWorker === worker) vocalsWorker = null;
        reject(new Error(msg.message));
      }
    };
    const handleError = (err) => {
      cleanup();
      // Der Worker-Thread selbst ist abgestuerzt (z.B. Out-of-Memory auf dem Handy) - nicht
      // weiterverwenden, sonst laufen alle folgenden Versuche gegen eine tote Instanz.
      worker.terminate();
      if (vocalsWorker === worker) vocalsWorker = null;
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

function showVocalsComparison(referenceText, transcribedText, { estimated }) {
  const { summary, highlightedHtml } = renderVocalsComparison(referenceText, transcribedText);
  document.getElementById("vocals-summary").textContent = summary;
  document.getElementById("vocals-lyrics-highlighted").innerHTML = highlightedHtml;
  document.getElementById("vocals-transcript").textContent = transcribedText;
  if (vocalsEstimatedNote) vocalsEstimatedNote.hidden = !estimated;
  vocalsResult.hidden = false;
}

let vocalsCancelRequested = false;

// Die rohe err.message (z.B. "Failed to fetch", ein WASM-Speicherfehler o.ae.) ist fuer
// Nicht-Techniker kaum verstaendlich und bietet keinen naechsten Schritt. Haeufige, aus der
// Praxis bekannte Fehlerarten (Modell-Download ueber CDN scheitert am Netzwerk, oder Handy hat
// gerade zu wenig Arbeitsspeicher fuer das ~140MB-Modell) werden stattdessen in eine
// verstaendliche, handlungsleitende Meldung uebersetzt - alles andere zeigt weiterhin die
// technische Meldung, damit bei einem echten Bug trotzdem nachvollziehbar bleibt, was passiert ist.
function vocalsFailedMessage(err) {
  const msg = (err && err.message) || "";
  const lower = msg.toLowerCase();
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("load failed") || lower.includes("failed to load") || lower.includes("err_")) {
    return t("vocalsFailedNetwork");
  }
  if (lower.includes("memory") || lower.includes("alloc") || lower.includes("out of")) {
    return t("vocalsFailedMemory");
  }
  return t("vocalsFailed", { msg: msg || t("unknownError") });
}

// Startet automatisch nach der Freischaltung (kein Klick noetig) - vocalsCheckBtn dient danach
// nur noch als manueller "Erneut transkribieren"-Retrigger, vocalsCancelBtn bricht waehrend des
// (automatischen) Ladens ab, z.B. wenn das ~140MB-Modell auf dem Handy zu viel Datenvolumen kostet.
async function runVocalsCheck() {
  if (!lastAudioBuffer) {
    vocalsStatus.textContent = t("vocalsNoAudio");
    return null;
  }

  vocalsCancelRequested = false;
  vocalsCheckBtn.hidden = true;
  vocalsCheckBtn.disabled = true;
  vocalsCancelBtn.hidden = false;
  vocalsResult.hidden = true;
  vocalsStatus.textContent = t("vocalsLoadingModel");

  try {
    vocalsStatus.textContent = t("vocalsPreparingAudio");
    const audioData = await resampleTo16kMono(lastAudioBuffer);
    if (vocalsCancelRequested) return null;

    const transcribedRaw = await transcribeInWorker(
      audioData,
      "german",
      (progress) => {
        if (!vocalsCancelRequested) vocalsStatus.textContent = t("vocalsLoadingModelProgress", { pct: Math.round(progress) });
      },
      () => {
        if (!vocalsCancelRequested) vocalsStatus.textContent = t("vocalsTranscribing");
      }
    );
    if (vocalsCancelRequested) return null;
    const transcribedText = (transcribedRaw || "").trim();
    lastVocalsTranscript = transcribedText;

    if (!transcribedText) {
      vocalsStatus.textContent = t("vocalsNoUsableTranscript");
      return null;
    }
    vocalsStatus.textContent = "";
    return transcribedText;
  } catch (err) {
    if (!vocalsCancelRequested) {
      vocalsStatus.textContent = vocalsFailedMessage(err);
    }
    return null;
  } finally {
    vocalsCheckBtn.disabled = false;
    vocalsCheckBtn.hidden = false;
    vocalsCancelBtn.hidden = true;
  }
}

vocalsCheckBtn.addEventListener("click", async () => {
  const lyricsRaw = document.getElementById("track-lyrics").value;
  const hasLyrics = lyricsRaw.trim().length >= 10;
  const transcribedText = await runVocalsCheck();
  if (!transcribedText) return;
  if (hasLyrics) {
    showVocalsComparison(lyricsRaw, transcribedText, { estimated: false });
  } else {
    // Ohne Songtext braucht der Vergleich eine KI-Rekonstruktion als Referenz - die gibt es beim
    // manuellen Retry evtl. noch nicht (falls die Erst-Transkription fehlschlug, lief die
    // KI-Einschaetzung nie), deshalb hier mit dem frischen Transkript neu anstossen.
    rewriteBlock.hidden = false;
    const kiResult = await runKiEinschaetzung();
    if (kiResult && kiResult.reconstruction) {
      showVocalsComparison(kiResult.reconstruction, transcribedText, { estimated: true });
    }
  }
  await saveCheckResult(lastKiResult);
});

vocalsCancelBtn.addEventListener("click", () => {
  vocalsCancelRequested = true;
  cancelTranscription();
  vocalsStatus.textContent = t("vocalsCancelled");
  vocalsCancelBtn.hidden = true;
  vocalsCheckBtn.hidden = false;
  vocalsCheckBtn.disabled = false;
});

/* ---------- EQ-Editor: Frequenzen direkt im Browser anpassen (kein Mastering) ----------
   Peaking-Filter (BiquadFilterNode) pro Frequenzband, live vorhoerbar und als WAV exportierbar.
   Alles client-seitig ueber Web Audio, kein Upload noetig - passt zur bestehenden
   "Audio verlaesst nie dein Geraet"-Architektur. */

function suggestedEqGainDb(val, lo, hi) {
  if (val < lo - 3) return +(10 * Math.log10(Math.max(lo, 0.5) / Math.max(val, 0.1))).toFixed(1);
  if (val > hi + 3) return -(10 * Math.log10(Math.max(val, 0.1) / Math.max(hi, 0.5))).toFixed(1);
  return 0;
}

// Schaetzt, ob/wie stark ein De-Esser sinnvoll waere: Praesenz- (4-6 kHz) und Brillanz-Band
// (6-16 kHz) - dort sitzen Zischlaute - gegen die genre-spezifische Referenz gegengecheckt. Nur
// echtes Ueberschiessen (nicht jeder Track) fuehrt zu "empfohlen", damit der Button einen echten
// Unterschied macht statt pauschal immer an/gleich stark zu sein.
function suggestedDeEsserAmount(metrics, profile) {
  const presence = metrics.bandPercents[5];
  const brilliance = metrics.bandPercents[6];
  const [, presenceHi] = profile.refs[5];
  const [, brillianceHi] = profile.refs[6];
  const overshoot = Math.max(0, presence - presenceHi) + Math.max(0, brilliance - brillianceHi) * 0.6;
  const needed = overshoot > 1;
  const amount = Math.max(0.2, Math.min(1, 0.25 + overshoot * 0.12));
  return { needed, amount: Math.round(amount * 20) / 20 };
}

// Pausiert die seitenweite Hintergrund-Wellenanimation (initBgWaves, weiter unten) waehrend der
// EQ-Vorschau spielt - zwei parallele requestAnimationFrame-Canvas-Loops (Hintergrund + EQ-
// Wellenform) gleichzeitig auf dem Hauptthread sind auf schwaecheren Geraeten/Handys ein
// wahrscheinlicher Grund fuer hoerbares Ruckeln genau dann, wenn es am meisten stoert: beim
// Zuhoeren. Die dekorative Wellenanimation kann fuer die paar Sekunden pausieren, ohne dass es auffaellt.
let bgWavesPaused = false;

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

// Zeitleiste (Scrubben) + statisches Wellenform-Band (Look wie in klassischen DAWs/
// Audio-Editoren: dichte gespiegelte Balken ueber den ganzen Track, Abspielposition als
// Linie+Punkt darueber - statt eines live mitlaufenden Spektrogramms wie zuvor)
let eqBandCanvasCtx = null;
let eqBandCanvasWidth = 0;
let eqBandCanvasHeight = 0;
let eqWaveformPeaks = null;
let eqPlaybackRafId = null;
let eqPlaybackStartCtxTime = 0;
let eqPlaybackDuration = 0;
let eqSeeking = false;
let eqPendingSeekOffset = 0;
let eqLastDrawnPositionRatio = 0;
const EQ_WAVEFORM_BUCKETS = 360;
const EQ_BAND_BG = "#07080c";
const EQ_CURVE_MIN_HZ = 20;
const EQ_CURVE_MAX_HZ = 16000;

// Redraw-Trigger, die selbst nichts ueber die Abspielposition wissen (z.B. ein EQ-Regler wird
// bewegt, waehrend gerade pausiert ist) - nutzen die zuletzt gezeichnete Position weiter, statt
// den Playhead ungewollt auf 0 zurueckzusetzen.
function redrawEqWaveformNow() {
  drawEqWaveform(eqLastDrawnPositionRatio);
}

// Duenne Kurve ueber der Wellenform, die die aktuellen EQ-Regler als Frequenzgang zeigt (wie bei
// einem klassischen Parametrik-EQ) - reagiert sofort auf jede Reglerbewegung, unabhaengig von der
// Wiedergabe. Beantwortet den Wunsch "nach Anpassung der Frequenz auch optisch anpassen", ohne
// die gerade erst umgesetzte ruhige Wellenform-Optik wieder durch ein live mitlaufendes
// Spektrogramm zu ersetzen.
function drawEqCurveOverlay(ctx, w, h) {
  const mid = h / 2;
  const maxDeflect = h * 0.36;
  const hzToX = (hz) => {
    const t = (Math.log(hz) - Math.log(EQ_CURVE_MIN_HZ)) / (Math.log(EQ_CURVE_MAX_HZ) - Math.log(EQ_CURVE_MIN_HZ));
    return Math.min(w, Math.max(0, t * w));
  };
  const gainToY = (gain) => mid - (Math.max(-12, Math.min(12, gain)) / 12) * maxDeflect;

  // Dezente 0dB-Referenzlinie, damit erkennbar bleibt, wovon die Kurve abweicht.
  ctx.save();
  ctx.strokeStyle = "rgba(238, 238, 236, 0.18)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(w, mid);
  ctx.stroke();
  ctx.setLineDash([]);

  const points = [{ x: 0, y: gainToY(eqGains[0] || 0) }];
  FREQ_BANDS.forEach((band, i) => points.push({ x: hzToX(bandCenterHz(band)), y: gainToY(eqGains[i] || 0) }));
  points.push({ x: w, y: gainToY(eqGains[FREQ_BANDS.length - 1] || 0) });

  ctx.strokeStyle = "#f0d19c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  ctx.fillStyle = "#f0d19c";
  for (let i = 1; i < points.length - 1; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function ensureEqAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  // "interactive" (Standard) haelt den Audiopuffer bewusst winzig fuer minimale Latenz bei
  // Instrumenten/Live-Eingabe - das laesst den Audio-Thread aber sehr oft (alle paar ms)
  // aufwachen, was auf schwaecheren Geraeten mit dem Hauptthread um CPU-Zeit konkurriert und
  // sich als Ruckeln zeigt. Hier spielen wir nur eine feste Datei ab, keine Latenz-kritische
  // Interaktion - "playback" nutzt groessere Puffer (weniger, dafuer seltenere Wakeups).
  if (!eqAudioCtx) eqAudioCtx = new Ctx({ latencyHint: "playback" });
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

// Rendert den aktuellen EQ-Editor-Stand (Baender, Lautheits-Trim, De-Esser, Intro-Trim, Fade-out)
// offline zu einem fertigen Buffer - identisch zu dem, was beim Download tatsaechlich rauskommt.
// Gemeinsam genutzt vom Download-Button UND von der Live-Vorschau (updateEqPreview), damit die
// angezeigte Vorschau nie von der heruntergeladenen Datei abweichen kann.
async function renderEditedBufferOffline() {
  const helperCtx = ensureEqAudioCtx();
  const sourceBuffer = getEqSourceBuffer(helperCtx);
  const offlineCtx = new OfflineAudioContext(sourceBuffer.numberOfChannels, sourceBuffer.length, sourceBuffer.sampleRate);
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
  return offlineCtx.startRendering();
}

// ---------- Live-Vorschau der Fakten-Box nach EQ-Bearbeitung ----------
// Nach jeder Aenderung im EQ-Editor (Regler, "Vorschlag uebernehmen", Lautheits-Trim, De-Esser,
// Intro-Trim, Fade-out) wird der bearbeitete Track kurz danach neu gerendert und neu analysiert -
// dieselbe Analyse-Pipeline wie beim Erst-Upload, keine separate/vereinfachte Schaetzung. Damit
// sieht der Kunde direkt (mit kurzer Verzoegerung statt "sofort bei jedem Pixel", das waere ohne
// echten Neu-Render/Neu-Analyse-Durchlauf nicht moeglich), wo sein Track nach der Bearbeitung
// tatsaechlich steht - Verbesserung UND Verschlechterung, keine Schoenrechnerei.
let eqPreviewToken = 0;
let eqPreviewShowingEdited = false;
let eqPreviewPendingWhilePlaying = false;

function eqHasEdits() {
  return (
    eqGains.some((g) => g !== 0) || eqGainDb !== 0 || eqDeEsserEnabled || eqTrimIntroEnabled || eqFadeOutEnabled
  );
}

function setEqPreviewStatus(text) {
  const el = document.getElementById("eq-preview-status");
  if (el) el.textContent = text;
}

async function updateEqPreview() {
  const previewEl = document.getElementById("eq-preview");
  if (!currentAnalysisSnapshot || !eqLastProfile) {
    if (previewEl) previewEl.hidden = true;
    return;
  }

  // Die Neuberechnung (Offline-Render + volle Analyse) blockiert den Hauptthread kurz spuerbar
  // (in Tests bis zu ~600ms an einem Stueck) - waehrend gerade Musik laeuft, faellt genau das als
  // hoerbares/sichtbares Ruckeln auf. Deshalb hier warten, bis die Wiedergabe steht, und danach
  // automatisch nachholen (siehe stopEqPreview).
  if (eqPlaying && eqHasEdits()) {
    eqPreviewPendingWhilePlaying = true;
    if (previewEl) previewEl.hidden = false;
    setEqPreviewStatus(t("eqScorePreviewWaitingForStop"));
    return;
  }

  if (!eqHasEdits()) {
    // Zurueck zum unbearbeiteten Original - keine Bearbeitung (mehr) aktiv.
    if (eqPreviewShowingEdited) {
      const { audioMetrics, lyricsRaw, title } = currentAnalysisSnapshot;
      const lyrics = analyzeLyrics(lyricsRaw, title);
      const { scores } = computeAllScores(audioMetrics, lyrics, eqLastProfile);
      renderMetersInto(document.getElementById("meters"), scores, audioMetrics, lyrics, eqLastProfile);
      renderFreqChart(document.getElementById("freq-chart"), audioMetrics.bandPercents, eqLastProfile.refs);
      eqPreviewShowingEdited = false;
    }
    if (previewEl) previewEl.hidden = true;
    return;
  }

  const token = ++eqPreviewToken;
  if (previewEl) {
    previewEl.hidden = false;
    previewEl.classList.add("is-calculating");
  }
  setEqPreviewStatus(t("eqScorePreviewCalculating"));

  try {
    const rendered = await renderEditedBufferOffline();
    if (token !== eqPreviewToken) return; // inzwischen ist eine neuere Anfrage unterwegs
    const editedMetrics = analyzeAudioBuffer(rendered);
    const { audioMetrics: originalMetrics, lyricsRaw, title } = currentAnalysisSnapshot;
    const lyrics = analyzeLyrics(lyricsRaw, title);
    const { overallScore: originalOverall } = computeAllScores(originalMetrics, lyrics, eqLastProfile);
    const { scores: editedScores, overallScore: editedOverall } = computeAllScores(editedMetrics, lyrics, eqLastProfile);

    renderMetersInto(document.getElementById("meters"), editedScores, editedMetrics, lyrics, eqLastProfile);
    renderFreqChart(document.getElementById("freq-chart"), editedMetrics.bandPercents, eqLastProfile.refs);
    eqPreviewShowingEdited = true;

    const delta = editedOverall - originalOverall;
    const deltaText = delta === 0 ? t("eqScorePreviewNoChange") : delta > 0 ? `+${delta}` : `${delta}`;
    setEqPreviewStatus(t("eqScorePreviewResult", { before: originalOverall, after: editedOverall, delta: deltaText }));
  } catch (err) {
    if (token !== eqPreviewToken) return;
    setEqPreviewStatus(t("eqScorePreviewFailed"));
  } finally {
    if (previewEl) previewEl.classList.remove("is-calculating");
  }
}

function updateDeEsserAmount(nodes, amount) {
  if (!nodes) return;
  rampAudioParam(nodes.notch.gain, -12 * amount, eqAudioCtx);
  rampAudioParam(nodes.sidechainGain.gain, amount, eqAudioCtx);
}

function formatEqTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Richtet den Canvas fuer das Frequenzband ein (Groesse an tatsaechliche Darstellung inkl.
// devicePixelRatio anpassen) - erst aufgerufen, wenn der Container sicher sichtbar ist, weil
// der Container davor noch hidden sein kann (getBoundingClientRect waere dann 0).
function setupEqBandCanvas() {
  const canvas = document.getElementById("eq-band-canvas");
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  eqBandCanvasCtx = canvas.getContext("2d");
  eqBandCanvasWidth = width;
  eqBandCanvasHeight = height;
  return eqBandCanvasCtx;
}

// Downgesampelte Min/Max-Peaks fuer die statische Wellenform-Anzeige - einmal pro Track
// berechnet (nicht pro Frame), damit das Zeichnen selbst beim Scrubben/Abspielen billig bleibt.
function computeEqWaveformPeaks(buffer) {
  const length = buffer.length;
  const channelCount = buffer.numberOfChannels;
  const channelData = [];
  for (let ch = 0; ch < channelCount; ch++) channelData.push(buffer.getChannelData(ch));

  const bucketCount = EQ_WAVEFORM_BUCKETS;
  const samplesPerBucket = Math.max(1, Math.floor(length / bucketCount));
  const stride = Math.max(1, Math.floor(samplesPerBucket / 400));
  const peaks = new Array(bucketCount);

  for (let i = 0; i < bucketCount; i++) {
    const start = i * samplesPerBucket;
    const end = i === bucketCount - 1 ? length : start + samplesPerBucket;
    let min = 0;
    let max = 0;
    for (let j = start; j < end; j += stride) {
      for (let ch = 0; ch < channelCount; ch++) {
        const v = channelData[ch][j];
        if (v > max) max = v;
        if (v < min) min = v;
      }
    }
    peaks[i] = [min, max];
  }
  return peaks;
}

// Statische, gespiegelte Wellenform-Optik (wie in klassischen Audio-Editoren) statt eines live
// mitlaufenden Spektrogramms - Abspielposition als heller Balken-Fortschritt plus Linie/Punkt
// obendrauf. positionRatio: 0-1 fuer die aktuelle Abspiel-/Scrub-Position, null = keine Anzeige.
function drawEqWaveform(positionRatio) {
  const ctx = eqBandCanvasCtx;
  if (!ctx) return;
  if (positionRatio != null) eqLastDrawnPositionRatio = positionRatio;
  const w = eqBandCanvasWidth;
  const h = eqBandCanvasHeight;
  ctx.fillStyle = EQ_BAND_BG;
  ctx.fillRect(0, 0, w, h);

  if (!eqWaveformPeaks) return;
  const mid = h / 2;
  const barCount = eqWaveformPeaks.length;
  const barGap = Math.max(0.5, w / barCount / 6);
  const barWidth = Math.max(1, w / barCount - barGap);
  const playedIndex = positionRatio == null ? -1 : Math.floor(positionRatio * barCount);

  for (let i = 0; i < barCount; i++) {
    const [min, max] = eqWaveformPeaks[i];
    const x = (i / barCount) * w;
    const topH = Math.max(1.5, max * mid * 0.92);
    const botH = Math.max(1.5, Math.abs(min) * mid * 0.92);
    ctx.fillStyle = positionRatio != null && i <= playedIndex ? "#f0d19c" : "rgba(238, 238, 236, 0.55)";
    ctx.fillRect(x, mid - topH, barWidth, topH + botH);
  }

  drawEqCurveOverlay(ctx, w, h);

  if (positionRatio != null) {
    const px = Math.min(w - 1, Math.max(0, positionRatio * w));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px - 1, 0, 2, h);
    ctx.beginPath();
    ctx.arc(px, h - Math.max(5, h * 0.08), Math.max(3, h * 0.045), 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateEqSeekBounds(duration) {
  const seekBar = document.getElementById("eq-seek");
  if (seekBar) seekBar.max = duration.toFixed(2);
  const totalEl = document.getElementById("eq-time-total");
  if (totalEl) totalEl.textContent = formatEqTime(duration);
}

function updateEqSeekDisplay(position) {
  const seekBar = document.getElementById("eq-seek");
  if (seekBar && !eqSeeking) seekBar.value = position.toFixed(2);
  const currentEl = document.getElementById("eq-time-current");
  if (currentEl) currentEl.textContent = formatEqTime(position);
}

// Aktuelle Abspielposition (in Sekunden innerhalb des Buffers) - genutzt sowohl vom RAF-Takt als
// auch, um beim Aendern eines EQ-Reglers waehrend der Wiedergabe an derselben Stelle
// weiterzuspielen statt (wie frueher) immer wieder von vorne zu starten.
function getEqElapsedPosition() {
  if (!eqPlaying || !eqAudioCtx || eqPlaybackDuration <= 0) return 0;
  let elapsed = eqAudioCtx.currentTime - eqPlaybackStartCtxTime;
  if (eqSourceNode && eqSourceNode.loop) {
    elapsed = elapsed % eqPlaybackDuration;
  } else {
    elapsed = Math.min(elapsed, eqPlaybackDuration);
  }
  return elapsed;
}

function tickEqPlayback() {
  if (!eqPlaying) {
    eqPlaybackRafId = null;
    return;
  }
  const elapsed = getEqElapsedPosition();
  updateEqSeekDisplay(elapsed);
  if (eqPlaybackDuration > 0) drawEqWaveform(elapsed / eqPlaybackDuration);
  eqPlaybackRafId = requestAnimationFrame(tickEqPlayback);
}

function stopEqPreview() {
  if (eqPlaybackRafId) {
    cancelAnimationFrame(eqPlaybackRafId);
    eqPlaybackRafId = null;
  }
  if (eqSourceNode) {
    const source = eqSourceNode;
    const gainNode = eqGainNode;
    const ctx = eqAudioCtx;
    source.onended = null;
    // Sofortiges stop()+disconnect() bricht das Signal exakt an der Stelle hart ab, an der
    // gerade abgespielt wird - hoerbar als Knacken, z.B. jedes Mal wenn waehrend der Wiedergabe
    // Trim/Fade-out/De-Esser umgeschaltet oder die Suchleiste losgelassen wird (beides baut die
    // Kette per startEqPreview() neu auf, was hier zuerst die alte stoppt). Kurzer Fade-out statt
    // hartem Cut vermeidet den Klick; disconnect() erst nach dem Fade, sonst waere der Fade selbst
    // durchs sofortige Trennen vom Graph unhoerbar.
    if (ctx && gainNode) {
      const fadeSeconds = 0.015;
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);
      try {
        source.stop(now + fadeSeconds);
      } catch {
        /* schon gestoppt */
      }
      setTimeout(() => {
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch {
          /* schon getrennt */
        }
      }, Math.ceil(fadeSeconds * 1000) + 20);
    } else {
      try {
        source.stop();
      } catch {
        /* schon gestoppt */
      }
      source.disconnect();
    }
    eqSourceNode = null;
  }
  eqFilters = [];
  eqDeEsserNodes = null;
  eqGainNode = null;
  eqPlaying = false;
  eqSeeking = false;
  bgWavesPaused = false;
  if (eqPreviewPendingWhilePlaying) {
    eqPreviewPendingWhilePlaying = false;
    updateEqPreview();
  }
  const btn = document.getElementById("eq-play-btn");
  if (btn) btn.textContent = t("eqPlayBtn");
  drawEqWaveform(0);
}

// offsetSeconds: Startposition innerhalb des Buffers - ermoeglicht sowohl das Scrubben in der
// Zeitleiste als auch das nahtlose Weiterspielen an derselben Stelle, wenn waehrend der
// Wiedergabe ein EQ-Regler geaendert wird (frueher sprang das immer auf 0 zurueck).
function startEqPreview(offsetSeconds = 0) {
  if (!lastAudioBuffer) return;
  stopEqPreview();
  bgWavesPaused = true;
  const ctx = ensureEqAudioCtx();
  const sourceBuffer = getEqSourceBuffer(ctx);
  const duration = sourceBuffer.duration;
  const startOffset = Math.max(0, Math.min(offsetSeconds, Math.max(0, duration - 0.05)));
  setupEqBandCanvas();
  drawEqWaveform(duration > 0 ? startOffset / duration : 0);
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
    scheduleFadeOut(gainNode, ctx.currentTime, duration - startOffset, Math.min(2.5, duration / 3));
  }

  source.onended = () => {
    // Nur bei natuerlichem Ende (nicht geloopt) reagieren - stop() im obigen stopEqPreview()
    // setzt onended vorher auf null, laeuft also nie hier rein.
    if (eqSourceNode === source) {
      stopEqPreview();
    }
  };

  source.start(0, startOffset);
  eqSourceNode = source;
  eqFilters = filters;
  eqPlaying = true;
  eqPlaybackStartCtxTime = ctx.currentTime - startOffset;
  eqPlaybackDuration = duration;
  updateEqSeekBounds(duration);
  const btn = document.getElementById("eq-play-btn");
  if (btn) btn.textContent = t("eqPlayBtnStop");
  eqPlaybackRafId = requestAnimationFrame(tickEqPlayback);
}

// Direktes ".value ="-Setzen auf einem AudioParam waehrend der Wiedergabe erzeugt an genau der
// Stelle im Signal einen Sprung - hoerbar als Knacken/Knistern, vor allem wenn beim Ziehen eines
// Reglers viele "input"-Events kurz hintereinander feuern. setTargetAtTime rampt stattdessen
// weich zum Zielwert (paar Millisekunden Zeitkonstante), bleibt dabei aber "live" genug, um sich
// beim Ziehen des Reglers noch unmittelbar anzufuehlen.
function rampAudioParam(param, target, ctx) {
  if (ctx) {
    param.setTargetAtTime(target, ctx.currentTime, 0.012);
  } else {
    param.value = target;
  }
}

function updateEqFilterGains() {
  eqFilters.forEach((f, i) => {
    rampAudioParam(f.gain, eqGains[i] || 0, eqAudioCtx);
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
    if (eqGains[i] !== 0) wrap.classList.add("is-adjusted");
    wrap.innerHTML = `
      <span class="eq-value" id="eq-value-${i}">${eqGains[i].toFixed(1)} dB</span>
      <div class="eq-slider-track-wrap">
        <span class="eq-slider-zero-tick" aria-hidden="true"></span>
        <input type="range" id="eq-band-${i}" min="-12" max="12" step="0.5" value="${eqGains[i]}" />
      </div>
      <label for="eq-band-${i}">${bandLabel(band)}</label>
    `;
    container.appendChild(wrap);
    const input = wrap.querySelector("input");
    input.addEventListener("input", () => {
      eqGains[i] = Number(input.value);
      document.getElementById(`eq-value-${i}`).textContent = `${eqGains[i].toFixed(1)} dB`;
      wrap.classList.toggle("is-adjusted", eqGains[i] !== 0);
      if (eqPlaying) updateEqFilterGains();
      redrawEqWaveformNow();
      // Waehrend des Ziehens (input-Event, mehrfach pro Sekunde) bewusst KEINE Score-Neuberechnung -
      // das waere eine teure Offline-Neuanalyse pro Frame. Stattdessen erst beim Loslassen (change,
      // siehe unten).
    });
    input.addEventListener("change", () => updateEqPreview());
  });
}

function initEqEditor(audioMetrics, profile) {
  eqLastMetrics = audioMetrics;
  eqLastProfile = profile;
  eqWaveformPeaks = lastAudioBuffer ? computeEqWaveformPeaks(lastAudioBuffer) : null;
  eqGains = FREQ_BANDS.map(() => 0);
  eqDeEsserEnabled = false;
  eqDeEsserAmount = 0.5;
  eqGainDb = 0;
  eqTrimIntroEnabled = false;
  eqFadeOutEnabled = false;
  eqPendingSeekOffset = 0;
  stopEqPreview();
  eqPreviewToken++;
  eqPreviewShowingEdited = false;
  const previewEl = document.getElementById("eq-preview");
  if (previewEl) previewEl.hidden = true;
  renderEqSliders();
  if (lastAudioBuffer) updateEqSeekBounds(lastAudioBuffer.duration);
  updateEqSeekDisplay(0);
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

  // Erst im naechsten Frame zeichnen - der Container kann in diesem Moment noch hidden sein
  // (z.B. beim Album-Akkordeon, wo "hidden" erst nach diesem Aufruf entfernt wird), davor
  // liefert getBoundingClientRect() nur Nullen.
  if (isPro && eqWaveformPeaks) {
    requestAnimationFrame(() => {
      setupEqBandCanvas();
      drawEqWaveform(0);
    });
  }
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
const eqDeEsserAutoBtn = document.getElementById("eq-deesser-auto-btn");

if (eqDeEsserAutoBtn) {
  eqDeEsserAutoBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    const { needed, amount } = suggestedDeEsserAmount(eqLastMetrics, eqLastProfile);
    eqDeEsserEnabled = needed;
    eqDeEsserAmount = amount;
    if (eqDeEsserEnabledEl) eqDeEsserEnabledEl.checked = needed;
    if (eqDeEsserStrengthWrap) eqDeEsserStrengthWrap.hidden = !needed;
    const pct = Math.round(amount * 100);
    if (eqDeEsserStrengthEl) eqDeEsserStrengthEl.value = pct;
    if (eqDeEsserStrengthValueEl) eqDeEsserStrengthValueEl.textContent = `${pct}%`;
    if (eqPlaying) startEqPreview(getEqElapsedPosition());
    if (eqStatus) eqStatus.textContent = needed ? t("eqDeesserAutoApplied") : t("eqDeesserAutoNotNeeded");
    updateEqPreview();
  });
}

if (eqDeEsserEnabledEl) {
  eqDeEsserEnabledEl.addEventListener("change", () => {
    eqDeEsserEnabled = eqDeEsserEnabledEl.checked;
    if (eqDeEsserStrengthWrap) eqDeEsserStrengthWrap.hidden = !eqDeEsserEnabled;
    if (eqPlaying) startEqPreview(getEqElapsedPosition()); // Graph neu aufbauen (De-Esser rein/raus), an gleicher Stelle weiterspielen
    updateEqPreview();
  });
}

if (eqDeEsserStrengthEl) {
  eqDeEsserStrengthEl.addEventListener("input", () => {
    eqDeEsserAmount = Number(eqDeEsserStrengthEl.value) / 100;
    if (eqDeEsserStrengthValueEl) eqDeEsserStrengthValueEl.textContent = `${eqDeEsserStrengthEl.value}%`;
    if (eqPlaying && eqDeEsserNodes) updateDeEsserAmount(eqDeEsserNodes, eqDeEsserAmount);
    // Waehrend des Ziehens bewusst keine Score-Neuberechnung - erst beim Loslassen (change).
  });
  eqDeEsserStrengthEl.addEventListener("change", () => updateEqPreview());
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
    if (eqPlaying && eqGainNode) rampAudioParam(eqGainNode.gain, Math.pow(10, eqGainDb / 20), eqAudioCtx);
    // Waehrend des Ziehens bewusst keine Score-Neuberechnung - erst beim Loslassen (change).
  });
  eqGainEl.addEventListener("change", () => updateEqPreview());
}

if (eqGainMatchBtn) {
  eqGainMatchBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    const suggested = Math.max(-12, Math.min(12, eqLastProfile.loudnessTarget - eqLastMetrics.loudnessDb));
    eqGainDb = Math.round(suggested * 2) / 2;
    if (eqGainEl) eqGainEl.value = eqGainDb;
    if (eqGainValueEl) eqGainValueEl.textContent = `${eqGainDb.toFixed(1)} dB`;
    if (eqPlaying && eqGainNode) rampAudioParam(eqGainNode.gain, Math.pow(10, eqGainDb / 20), eqAudioCtx);
    if (eqStatus) eqStatus.textContent = t("eqGainMatched");
    updateEqPreview();
  });
}

if (eqTrimIntroEl) {
  eqTrimIntroEl.addEventListener("change", () => {
    eqTrimIntroEnabled = eqTrimIntroEl.checked;
    if (eqPlaying) startEqPreview(getEqElapsedPosition());
    updateEqPreview();
  });
}

if (eqFadeOutEl) {
  eqFadeOutEl.addEventListener("change", () => {
    eqFadeOutEnabled = eqFadeOutEl.checked;
    if (eqPlaying) startEqPreview(getEqElapsedPosition());
    updateEqPreview();
  });
}

if (eqSuggestBtn) {
  eqSuggestBtn.addEventListener("click", () => {
    if (!eqLastMetrics || !eqLastProfile) return;
    // Bei mehreren gleichzeitig "zu niedrigen" Nachbarbaendern (z.B. bassbetonte Trap-Tracks mit
    // wenig Mitten) summieren sich die ueberlappenden Q=1-Peaking-Filter in der Kette - ein
    // Klemmwert wie beim manuellen Regler (+-12dB pro Band) waere hier schon bei 2-3 gleichzeitig
    // korrigierten Nachbarbaendern hoerbar unnatuerlich. +-6dB pro Band entspricht eher dem, was
    // in echter korrektiver Mischung in einem automatischen Vorschlag vertretbar ist.
    eqGains = FREQ_BANDS.map((band, i) => {
      const [lo, hi] = eqLastProfile.refs[i];
      const suggested = suggestedEqGainDb(eqLastMetrics.bandPercents[i], lo, hi);
      return Math.max(-6, Math.min(6, suggested));
    });
    renderEqSliders();
    if (eqPlaying) updateEqFilterGains();
    redrawEqWaveformNow();
    if (eqStatus) eqStatus.textContent = t("eqSuggestionApplied");
    // Direkt starten statt ueber das Drag-Debounce - ein Klick ist ein einzelnes, diskretes Ereignis,
    // die Berechnung soll sofort im Hintergrund losgehen (siehe updateEqPreview fuer das
    // Zurueckstellen waehrend aktiver Wiedergabe).
    updateEqPreview();
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
    if (eqPlaying) startEqPreview(getEqElapsedPosition());
    else redrawEqWaveformNow();
    if (eqStatus) eqStatus.textContent = t("eqResetDone");
    updateEqPreview();
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
        // Position merken, damit ein erneuter Play-Klick an derselben Stelle weitermacht statt
        // wieder von vorn zu beginnen.
        eqPendingSeekOffset = getEqElapsedPosition();
        stopEqPreview();
        if (eqStatus) eqStatus.textContent = "";
      } else {
        startEqPreview(eqPendingSeekOffset);
        if (eqStatus) eqStatus.textContent = t("eqPreviewPlaying");
      }
    } catch (err) {
      if (eqStatus) eqStatus.textContent = t("eqPreviewFailed", { msg: err && err.message ? err.message : t("unknownError") });
    }
  });
}

// Zeitleiste: Ziehen springt sofort an die neue Stelle (waehrend Wiedergabe: Graph mit neuem
// Offset neu starten; im Stand: Position merken fuer den naechsten Play-Klick) - so kann man
// gezielt eine Stelle im Track wiederholt anhoeren, ohne jedes Mal von vorn zu starten.
const eqSeekBar = document.getElementById("eq-seek");
if (eqSeekBar) {
  eqSeekBar.addEventListener("pointerdown", () => {
    eqSeeking = true;
  });
  eqSeekBar.addEventListener("input", () => {
    const value = parseFloat(eqSeekBar.value) || 0;
    const currentEl = document.getElementById("eq-time-current");
    if (currentEl) currentEl.textContent = formatEqTime(value);
    // Playhead auf der Wellenform live mitziehen, auch wenn gerade nicht abgespielt wird -
    // eqPlaybackDuration ist nur waehrend/nach der ersten Wiedergabe gesetzt, das Maximum der
    // Zeitleiste (aus dem Track selbst) gilt aber immer.
    const max = parseFloat(eqSeekBar.max) || 0;
    if (max > 0) drawEqWaveform(value / max);
  });
  eqSeekBar.addEventListener("change", () => {
    const offset = parseFloat(eqSeekBar.value) || 0;
    eqSeeking = false;
    if (eqPlaying) {
      startEqPreview(offset);
      if (eqStatus) eqStatus.textContent = t("eqPreviewPlaying");
    } else {
      eqPendingSeekOffset = offset;
      updateEqSeekDisplay(offset);
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
      const rendered = await renderEditedBufferOffline();
      const metaTitleEl = document.getElementById("eq-meta-title");
      const metaArtistEl = document.getElementById("eq-meta-artist");
      const tagTitle = metaTitleEl ? metaTitleEl.value.trim() : "";
      const tagArtist = metaArtistEl ? metaArtistEl.value.trim() : "";
      const blob = audioBufferToWavBlob(rendered, { title: tagTitle, artist: tagArtist });
      const baseName = sanitizeFilename(tagTitle) || "overhertz-eq-bearbeitet";
      downloadBlob(blob, `${baseName}.wav`);
      if (eqStatus) eqStatus.textContent = t("eqDownloadStarted");
      showRatingModal();
    } catch (err) {
      if (eqStatus) eqStatus.textContent = t("eqRenderFailed", { msg: err && err.message ? err.message : t("unknownError") });
    } finally {
      eqDownloadBtn.disabled = false;
    }
  });
}

/* ---------- Bewertungs-Pop-up nach dem Download der bearbeiteten Version ---------- */

const ratingModalOverlay = document.getElementById("rating-modal-overlay");
const ratingStarsEl = document.getElementById("rating-stars");
const ratingCommentEl = document.getElementById("rating-comment");
const ratingSubmitBtn = document.getElementById("rating-submit-btn");
const ratingSkipBtn = document.getElementById("rating-skip-btn");
const ratingStatusEl = document.getElementById("rating-status");
let ratingSelectedStars = 0;

function showRatingModal() {
  if (!ratingModalOverlay) return;
  ratingSelectedStars = 0;
  if (ratingCommentEl) ratingCommentEl.value = "";
  if (ratingStatusEl) ratingStatusEl.textContent = "";
  if (ratingSubmitBtn) ratingSubmitBtn.disabled = true;
  renderRatingStars();
  ratingModalOverlay.hidden = false;
}

function hideRatingModal() {
  if (ratingModalOverlay) ratingModalOverlay.hidden = true;
}

function renderRatingStars() {
  if (!ratingStarsEl) return;
  ratingStarsEl.querySelectorAll(".rating-star").forEach((btn) => {
    const value = Number(btn.dataset.value);
    btn.classList.toggle("is-filled", value <= ratingSelectedStars);
    btn.setAttribute("aria-pressed", value <= ratingSelectedStars ? "true" : "false");
  });
}

if (ratingStarsEl) {
  ratingStarsEl.querySelectorAll(".rating-star").forEach((btn) => {
    btn.addEventListener("click", () => {
      ratingSelectedStars = Number(btn.dataset.value);
      renderRatingStars();
      if (ratingSubmitBtn) ratingSubmitBtn.disabled = false;
    });
  });
}

if (ratingSkipBtn) {
  ratingSkipBtn.addEventListener("click", hideRatingModal);
}

if (ratingSubmitBtn) {
  ratingSubmitBtn.addEventListener("click", async () => {
    if (ratingSelectedStars < 1) return;
    ratingSubmitBtn.disabled = true;
    if (ratingStatusEl) ratingStatusEl.textContent = t("ratingSubmitting");
    const { ok, data } = await apiFetch("rate-download", {
      method: "POST",
      body: JSON.stringify({ stars: ratingSelectedStars, comment: ratingCommentEl ? ratingCommentEl.value : "" }),
    });
    if (ok) {
      if (ratingStatusEl) ratingStatusEl.textContent = t("ratingThanks");
      setTimeout(hideRatingModal, 1200);
    } else {
      if (ratingStatusEl) ratingStatusEl.textContent = t("ratingFailed", { msg: data.error || t("unknownError") });
      ratingSubmitBtn.disabled = false;
    }
  });
}

/* ---------- Album-Check (Pro-Feature: mehrere Tracks am Stück pruefen) ---------- */

// Dateinamen kommen 1:1 vom Nutzer (Upload) und landen unten per innerHTML in der Seite - ohne
// Escaping koennte ein praeparierter Dateiname (z.B. "<img src=x onerror=...>.mp3") als HTML
// ausgefuehrt werden statt als Text angezeigt zu werden.
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const albumBtn = document.getElementById("album-analyze-btn");
const albumFilesInput = document.getElementById("album-files");
const albumStatus = document.getElementById("album-status");
const albumResults = document.getElementById("album-results");

// Album-Ergebnisse ueberleben sonst keinen Reload/Redirect (z.B. Stripe-Checkout fuer den
// Pro-Kauf zwischendurch) - waren bisher reiner DOM-Stand ohne jede Persistenz, ein Sprung weg
// von der Seite hat alles geloescht, obwohl dafuer schon Checks/Credits verbraucht wurden.
const ALBUM_RESULTS_KEY = "overhertz_album_results";
// Strukturierte Daten separat von der reinen Anzeige (innerHTML) gesichert, damit "Details &
// Verbessern" nach einem Reload weiterhin Frequenzchart/Tipps/Fazit zeigen kann - nur die
// File-Objekte selbst ueberleben keinen Reload (wie beim Einzeltrack-EQ-Editor nach Checkout-
// Redirect auch schon: Anzeige bleibt, live abspielen/bearbeiten braucht die Originaldatei erneut).
const ALBUM_TRACKS_DATA_KEY = "overhertz_album_tracks_data";

let albumTracksData = [];
let albumOpenIndex = -1;
const albumEqEditorEl = document.getElementById("eq-editor");
const albumEqEditorHomeParent = albumEqEditorEl ? albumEqEditorEl.parentNode : null;
const albumEqEditorHomeNext = albumEqEditorEl ? albumEqEditorEl.nextSibling : null;

function saveAlbumResultsSnapshot() {
  try {
    sessionStorage.setItem(ALBUM_RESULTS_KEY, albumResults.innerHTML);
  } catch {
    /* sessionStorage evtl. nicht verfuegbar (privater Modus) - dann bleibt es halt unpersistiert */
  }
}

function restoreAlbumResultsSnapshot() {
  try {
    const saved = sessionStorage.getItem(ALBUM_RESULTS_KEY);
    if (saved) albumResults.innerHTML = saved;
  } catch {
    /* ignorieren */
  }
}

function saveAlbumTracksDataSnapshot() {
  try {
    const serializable = albumTracksData.map((d) =>
      d ? { fileName: d.fileName, audioMetrics: d.audioMetrics, tips: d.tips, fazit: d.fazit } : null
    );
    sessionStorage.setItem(ALBUM_TRACKS_DATA_KEY, JSON.stringify(serializable));
  } catch {
    /* ignorieren */
  }
}

function restoreAlbumTracksDataSnapshot() {
  try {
    const saved = sessionStorage.getItem(ALBUM_TRACKS_DATA_KEY);
    if (saved) {
      albumTracksData = JSON.parse(saved).map((d) => (d ? Object.assign({ file: null }, d) : null));
    }
  } catch {
    /* ignorieren */
  }
}

restoreAlbumResultsSnapshot();
restoreAlbumTracksDataSnapshot();

// Akkordeon: pro Track ein "Details & Verbessern"-Button, der Frequenzchart/Tipps/Fazit wie
// bei der Einzelanalyse aufklappt und den (einzigen) EQ-Editor dorthin verschiebt - kein
// zusaetzlicher Credit-Verbrauch, ist ja schon bezahlt. Immer nur ein Track offen, sonst wird
// die Seite bei vielen Tracks ewig lang zum Scrollen.
function collapseOpenAlbumTrack() {
  if (albumOpenIndex === -1) return;
  stopEqPreview();
  const prevBtn = albumResults.querySelector(`.album-track-toggle[data-index="${albumOpenIndex}"]`);
  const prevDetail = document.getElementById(`album-track-detail-${albumOpenIndex}`);
  if (prevBtn) {
    prevBtn.textContent = t("albumTrackDetailBtn");
    prevBtn.classList.remove("is-open");
  }
  if (prevDetail) prevDetail.hidden = true;
  if (albumEqEditorEl && albumEqEditorHomeParent) {
    albumEqEditorHomeParent.insertBefore(albumEqEditorEl, albumEqEditorHomeNext);
  }
  albumOpenIndex = -1;
}

async function expandAlbumTrack(index) {
  const data = albumTracksData[index];
  const detail = document.getElementById(`album-track-detail-${index}`);
  const btn = albumResults.querySelector(`.album-track-toggle[data-index="${index}"]`);
  if (!data || !detail || !btn) return;

  const profile = genreProfile("");
  renderFreqChart(document.getElementById(`album-freq-chart-${index}`), data.audioMetrics.bandPercents, profile.refs);
  renderTips(document.getElementById(`album-tips-list-${index}`), data.tips);
  renderFazit(document.getElementById(`album-fazit-${index}`), data.fazit);

  const noAudioNote = detail.querySelector(".album-track-detail-note");

  if (data.file && albumEqEditorEl) {
    try {
      const arrayBuffer = await data.file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      ctx.close();
      lastAudioBuffer = audioBuffer;
      const eqSlot = document.getElementById(`album-eq-slot-${index}`);
      if (eqSlot) eqSlot.appendChild(albumEqEditorEl);
      initEqEditor(data.audioMetrics, profile);
      const metaTitleEl = document.getElementById("eq-meta-title");
      if (metaTitleEl) metaTitleEl.value = data.fileName.replace(/\.[^/.]+$/, "");
      if (noAudioNote) noAudioNote.hidden = true;
    } catch {
      lastAudioBuffer = null;
      if (noAudioNote) noAudioNote.hidden = false;
    }
  } else {
    lastAudioBuffer = null;
    if (noAudioNote) noAudioNote.hidden = false;
  }

  detail.hidden = false;
  btn.textContent = t("albumTrackCollapseBtn");
  btn.classList.add("is-open");
  albumOpenIndex = index;
}

function toggleAlbumTrackDetail(index) {
  const wasOpen = albumOpenIndex === index;
  collapseOpenAlbumTrack();
  if (!wasOpen) expandAlbumTrack(index);
}

if (albumResults) {
  albumResults.addEventListener("click", (e) => {
    const btn = e.target.closest(".album-track-toggle");
    if (!btn) return;
    toggleAlbumTrackDetail(Number(btn.dataset.index));
  });
}

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
    collapseOpenAlbumTrack();
    albumResults.innerHTML = "";
    albumTracksData = [];
    try {
      sessionStorage.removeItem(ALBUM_RESULTS_KEY);
      sessionStorage.removeItem(ALBUM_TRACKS_DATA_KEY);
    } catch {
      /* ignorieren */
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const profile = genreProfile("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      albumStatus.textContent = t("albumChecking", { i: i + 1, total: files.length, name: file.name });

      if (file.size > MAX_UPLOAD_BYTES) {
        albumTracksData[i] = null;
        const card = document.createElement("div");
        card.className = "album-track";
        card.innerHTML = `
          <div class="album-track-head"><span class="album-track-name">${escapeHtml(file.name)}</span></div>
          <p class="album-track-tip">${t("fileTooLarge", { size: Math.round(file.size / 1024 / 1024) })}</p>
        `;
        albumResults.appendChild(card);
        saveAlbumResultsSnapshot();
        saveAlbumTracksDataSnapshot();
        continue;
      }

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
        const fazit = buildFazit(overallScore, tips);

        albumTracksData[i] = { file, fileName: file.name, audioMetrics, tips, fazit };

        card.innerHTML = `
          <div class="album-track-head">
            <span class="album-track-name">${escapeHtml(file.name)}</span>
            <span class="album-track-score" style="color:${grade.color}">${overallScore}/100 · ${grade.title}</span>
          </div>
          <p class="album-track-tip">${topTip.text}</p>
          <button type="button" class="account-btn album-track-toggle" data-index="${i}">${t("albumTrackDetailBtn")}</button>
          <div class="album-track-detail" id="album-track-detail-${i}" hidden>
            <div class="freq-block">
              <h4>${t("freqBlockHeading")}</h4>
              <div class="freq-chart" id="album-freq-chart-${i}"></div>
            </div>
            <div class="tips-block">
              <h4>${t("tipsHeading")}</h4>
              <ul class="tips" id="album-tips-list-${i}"></ul>
            </div>
            <div class="fazit-wrap">
              <h4>${t("fazitHeading")}</h4>
              <div id="album-fazit-${i}"></div>
            </div>
            <p class="album-track-detail-note" hidden>${t("albumTrackNoAudio")}</p>
            <div class="album-eq-slot" id="album-eq-slot-${i}"></div>
          </div>
        `;
      } catch (err) {
        albumTracksData[i] = null;
        card.innerHTML = `
          <div class="album-track-head"><span class="album-track-name">${escapeHtml(file.name)}</span></div>
          <p class="album-track-tip">${t("albumTrackError", { msg: err && err.message ? err.message : t("albumAnalysisFailed") })}</p>
        `;
      }
      saveAlbumResultsSnapshot();
      saveAlbumTracksDataSnapshot();
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
    { amp: 30, freq: 0.0016, speed: 0.35, phase: 0, yRatio: 0.14, color: "255,255,255", widthPx: 1.6, alpha: 0.4 },
    { amp: 18, freq: 0.0024, speed: 0.5, phase: 2.1, yRatio: 0.24, color: "255,255,255", widthPx: 1.4, alpha: 0.3 },
    { amp: 38, freq: 0.0011, speed: -0.28, phase: 4.2, yRatio: 0.42, color: "255,255,255", widthPx: 1.3, alpha: 0.22 },
    { amp: 16, freq: 0.0028, speed: 0.6, phase: 1.3, yRatio: 0.66, color: "255,255,255", widthPx: 1.2, alpha: 0.18 },
    { amp: 24, freq: 0.0018, speed: -0.4, phase: 5.5, yRatio: 0.86, color: "255,255,255", widthPx: 1.2, alpha: 0.15 },
    { amp: 20, freq: 0.0021, speed: 0.45, phase: 3.3, yRatio: 1.05, color: "255,255,255", widthPx: 1.1, alpha: 0.12 },
  ];

  let t = 0;
  let skipFrame = false;

  // Rein dekorative Animation lief bisher jeden Frame (60fps) durchgehend auf dem Hauptthread -
  // zusammen mit dem ebenfalls RAF-getriebenen EQ-Wellenform-Redraw waehrend der Vorschau (siehe
  // bgWavesPaused) auf schwaecheren Geraeten ein wahrscheinlicher Ruckel-Grund. Jeden zweiten
  // Frame zeichnen (~30fps) faellt bei dieser Art sanfter Wellenbewegung nicht auf, halbiert aber
  // die Hauptthread-Last dauerhaft, nicht nur waehrend der EQ-Vorschau.
  function draw() {
    if (bgWavesPaused) {
      if (!reduceMotion) requestAnimationFrame(draw);
      return;
    }
    skipFrame = !skipFrame;
    if (skipFrame) {
      if (!reduceMotion) requestAnimationFrame(draw);
      return;
    }
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
    t += 0.032;
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

  // Formularfelder aus dem Snapshot wiederherstellen - nach dem Redirect von Stripe ist die Seite
  // frisch geladen, die Eingaben stehen nur noch im Snapshot, nicht mehr im DOM. Noetig, damit die
  // automatische KI-Einschaetzung unten (liest Titel/Songtext live aus dem Formular) den echten
  // Songtext sieht statt leerer Felder.
  document.getElementById("track-title").value = snapshot.title || "";
  document.getElementById("track-lyrics").value = snapshot.lyricsRaw || "";
  if (snapshot.genre) document.getElementById("track-genre").value = snapshot.genre;

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
    startAutoPremiumFlow(lastData ? lastData.checkId : null);
  } else {
    statusLine.textContent = t("checkoutStillProcessing", {
      err: lastData && lastData.error ? lastData.error : t("checkoutPleaseWait"),
    });
  }
})();

/* ---------- PWA: "Zum Startbildschirm hinzufuegen" ----------
   Registriert den Service Worker (noetig, damit Chrome/Android den Install-Hinweis anbietet -
   iOS braucht das nicht, dort geht's nur manuell ueber Teilen -> Zum Home-Bildschirm). Rein
   additiv: schlaegt der Browser das nicht vor oder scheitert die Registrierung, bleibt die Seite
   unveraendert normal nutzbar. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

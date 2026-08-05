// Laeuft in einem eigenen Web-Worker-Thread, damit das Laden/Ausfuehren des Whisper-Modells
// (via transformers.js) nicht den UI-Thread blockiert - sonst haengt die ganze Seite waehrend
// der Transkription (spuerbar vor allem auf dem Handy).

let transcriberPromise = null;

async function getTranscriber(onProgress) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/+esm");
      return pipeline("automatic-speech-recognition", "Xenova/whisper-base", {
        progress_callback: onProgress,
      });
    })();
    // Schlaegt das Laden fehl (z.B. Abbruch durch Speicherdruck auf dem Handy), Cache wieder
    // leeren - sonst bekommt jeder weitere Versuch fuer den Rest der Session sofort denselben
    // alten Fehler zurueck, statt das Modell neu zu laden.
    transcriberPromise.catch(() => {
      transcriberPromise = null;
    });
  }
  return transcriberPromise;
}

self.onmessage = async (event) => {
  const { audioData, language } = event.data || {};
  try {
    const transcriber = await getTranscriber((info) => {
      if (info && info.status === "progress" && typeof info.progress === "number") {
        self.postMessage({ type: "progress", progress: info.progress });
      }
    });

    self.postMessage({ type: "transcribing" });
    const result = await transcriber(audioData, {
      language,
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    self.postMessage({ type: "result", text: (result && result.text) || "" });
  } catch (err) {
    self.postMessage({ type: "error", message: err && err.message ? err.message : String(err) });
  }
};

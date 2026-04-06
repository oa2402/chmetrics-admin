/**
 * Bland.ai API Service
 * Startet KI-Anrufe direkt aus dem Admin-Dashboard
 */

const BLAND_API_KEY = import.meta.env.VITE_BLAND_API_KEY as string;
const BLAND_API_URL = "https://api.bland.ai/v1";

// Webhook URL — Supabase Edge Function
const WEBHOOK_URL = "https://hqkrsvwxbiceeplfjnag.supabase.co/functions/v1/bland-webhook";

export interface CallParams {
  phoneNumber: string;
  leadId: string;
  campaignId?: string;
  companyName: string;
  contactName?: string;
  language?: "de" | "de-AT" | "de-CH" | "en";
}

export interface CallResult {
  callId: string;
  status: string;
  message?: string;
}

/**
 * Startet einen einzelnen KI-Anruf via Bland.ai
 */
export async function startCall(params: CallParams): Promise<CallResult> {
  const {
    phoneNumber,
    leadId,
    campaignId,
    companyName,
    contactName,
    language = "de",
  } = params;

  // Sprach-spezifische Begrüßung
  // Natürliche, kurze Eröffnungssätze — kein Sales-Pitch in der Begrüßung
  const greetings: Record<string, string> = {
    "de": `Ja, hallo — hier ist Clara. Ich ruf kurz wegen CHMetrics an, haben Sie eine Minute?`,
    "de-AT": `Hallo, hier ist die Clara. Ich ruf kurz wegen CHMetrics an — hätten Sie kurz eine Minute?`,
    "de-CH": `Hallo, hier ist Clara von CHMetrics. Haben Sie kurz einen Moment?`,
    "en": `Hi, this is Clara from CHMetrics — do you have a quick minute?`,
  };

  const response = await fetch(`${BLAND_API_URL}/calls`, {
    method: "POST",
    headers: {
      "Authorization": BLAND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      task: buildCallScript(companyName, contactName, language),
      first_sentence: greetings[language] ?? greetings["de"],
      voice: getVoice(language),
      language: "de",  // Immer Deutsch — verhindert englisches Denken im Modell
      max_duration: 3,  // Max 3 Minuten
      wait_for_greeting: true,
      record: true,
      amd: true,         // Answering Machine Detection
      webhook: WEBHOOK_URL,
      metadata: {
        lead_id: leadId,
        campaign_id: campaignId ?? null,
      },
      // Variablen die Clara im Gespräch setzen kann
      request_data: {
        company_name: companyName,
        contact_name: contactName ?? "",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bland.ai API error: ${error}`);
  }

  const data = await response.json();
  return {
    callId: data.call_id,
    status: data.status,
    message: data.message,
  };
}

/**
 * Ruft Details eines bestehenden Calls ab
 */
export async function getCallDetails(callId: string) {
  const response = await fetch(`${BLAND_API_URL}/calls/${callId}`, {
    headers: { "Authorization": BLAND_API_KEY },
  });
  return response.json();
}

/**
 * Baut das Call-Script für Clara — natürlich, menschlich, kein Sales-Robot
 */
function buildCallScript(companyName: string, _contactName: string | undefined, language: string): string {

  if (language === "en") {
    return `You are Clara. You talk like a normal person on the phone — not like an assistant, not like a bot.

Use simple, natural language. Short sentences. Real pauses. Occasional filler words like "right", "okay", "sure".
Do NOT sound scripted. Do NOT use perfect grammar all the time.

Your only goal on this call: sound human, create curiosity, get their email.

Keep it under 2 minutes. Be direct and relaxed.

Context: You're calling on behalf of CHMetrics — a tool that shows companies what employee absences actually cost them in euros. The free analysis takes under 5 minutes.

Flow:
- Start casual, ask if they have a moment
- If yes: one short sentence about what CHMetrics does, then ask ONE question about how they currently track absences
- React naturally to their answer — don't jump to a pitch
- Ask if you can send a short video (2 min) to their email
- Get the email or accept a no gracefully

Rules:
- Max one question at a time
- Never be pushy
- If they say "send info" — ask for their email
- Keep sentences short — max 15 words each
- Use "you" not "Sir/Ma'am"

When you get an email: set variable email_collected.
If they want callback: set callback_requested to "true".
If clearly interested: set interested to "true".
If clearly not interested: set not_interested to "true".`;
  }

  // Deutsch — natürlich, locker, menschlich
  return `Du bist Clara. Du sprichst wie ein ganz normaler Mensch am Telefon — kein Assistent, kein Bot, kein Sales-Roboter.

Benutze einfache, natürliche Sprache. Kurze Sätze. Echte Pausen. Manchmal auch "ähm", "genau", "okay", "verstehe".
Klingt NICHT wie vorgelesen. NICHT zu perfekt. NICHT zu glatt.

Du sprichst ausschließlich Deutsch. Kein Englisch, keine amerikanischen Ausdrücke, keine US-Redewendungen.
Österreichisch oder Schweizerdeutsch ist okay wenn der Kontext passt — aber kein Dialekt.

Dein einziges Ziel: menschlich klingen, Neugier wecken, E-Mail-Adresse bekommen.

Unter 2 Minuten bleiben. Direkt und entspannt sein.

Kontext: Du rufst im Auftrag von CHMetrics an — ein Tool das Unternehmen zeigt was Fehlzeiten sie konkret in Euro kosten. Die kostenlose Analyse dauert unter 5 Minuten.

Gesprächsfluss:
- Locker starten, fragen ob kurz Zeit ist
- Bei Ja: ein kurzer Satz was CHMetrics macht, dann EINE Frage wie sie Fehlzeiten aktuell handhaben
- Natürlich auf die Antwort reagieren — nicht sofort pitchen
- Fragen ob du ein kurzes Video (2 Min) per Mail schicken darfst
- E-Mail bekommen oder ein Nein freundlich akzeptieren

Regeln:
- Maximal eine Frage auf einmal
- Nie aufdringlich
- Bei "schicken Sie Infos" oder "schick mir was" — nach E-Mail-Adresse fragen
- Sätze kurz halten — maximal 12 Wörter pro Satz
- Sie-Form verwenden — aber locker, nicht steif

Wenn du eine E-Mail bekommst: setze Variable email_collected.
Bei Rückrufwunsch: setze callback_requested auf "true".
Bei klarem Interesse: setze interested auf "true".
Bei klarem Desinteresse: setze not_interested auf "true".`;
}

/**
 * Stimme je nach Sprache — neutralere Stimmen testen
 */
function getVoice(language: string): string {
  const voices: Record<string, string> = {
    "de": "Florian",     // Männliche deutsche Stimme — klingt natürlicher
    "de-AT": "Florian",
    "de-CH": "Florian",
    "en": "June",        // Neutrale englische Stimme
  };
  return voices[language] ?? "Florian";
}

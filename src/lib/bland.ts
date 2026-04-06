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
  const greetings: Record<string, string> = {
    "de": `Guten Tag, mein Name ist Clara, ich rufe im Auftrag von CHMetrics an. Wir helfen Unternehmen wie ${companyName}, die wahren Kosten von Fehlzeiten sichtbar zu machen. Haben Sie kurz zwei Minuten?`,
    "de-AT": `Grüß Gott, mein Name ist Clara, ich ruf im Auftrag von CHMetrics an. Wir helfen Unternehmen wie ${companyName} dabei, Krankenstände messbar zu machen. Hätten Sie kurz zwei Minuten?`,
    "de-CH": `Guten Tag, mein Name ist Clara, ich rufe im Auftrag von CHMetrics an. Wir unterstützen Unternehmen wie ${companyName} dabei, Absenzen messbar zu reduzieren. Haben Sie kurz einen Moment?`,
    "en": `Good day, my name is Clara, calling on behalf of CHMetrics. We help companies like ${companyName} measure and reduce the real cost of employee absenteeism. Do you have two minutes?`,
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
      language: language.startsWith("de") ? "de" : "en",
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
 * Baut das Call-Script für Clara
 */
function buildCallScript(companyName: string, contactName: string | undefined, language: string): string {
  const name = contactName ? `, ${contactName.split(" ")[0]}` : "";

  if (language === "en") {
    return `You are Clara, a professional AI assistant for CHMetrics, a BGM software platform for SMEs in the DACH region.

Your goal: Create interest and get the contact's email address. Do NOT try to sell on this call.

Script:
1. Greet and ask permission (already done in first_sentence)
2. If they agree: Mention the gap — "Companies your size lose significant money to absenteeism — often without knowing exactly where."
3. Ask ONE question: "How are you currently tracking your absence trends?"
4. Listen carefully and respond naturally based on their answer.
5. Briefly mention CHMetrics: "CHMetrics shows you in under 5 minutes how your absence rate compares to your industry and what it costs in euros — the basic analysis is free."
6. Ask for email: "I'd love to send you a short 2-minute presentation. Which email should I send it to?"
7. If email given: confirm and say goodbye warmly.
8. If no interest: accept gracefully and say goodbye.

Rules:
- Always speak in formal "Sie" form
- Maximum 3 minutes total
- Ask maximum one question at a time
- Never be pushy
- If they say "send info": always ask for their email address

When you collect an email, set the variable email_collected to that email address.
If they want a callback, set callback_requested to "true" and ask for preferred time.
If they are clearly interested, set interested to "true".
If they are clearly not interested, set not_interested to "true".`;
  }

  return `Du bist Clara, eine professionelle KI-Assistentin für CHMetrics, eine BGM-Software-Plattform für KMU im DACH-Raum.

Dein Ziel: Interesse wecken und die E-Mail-Adresse des Kontakts erhalten. Versuche NICHT, beim Anruf zu verkaufen.

Gesprächsleitfaden:
1. Begrüßung und Erlaubnis einholen (bereits in first_sentence erledigt)
2. Bei Zusage: Gap aufzeigen — "Unternehmen Ihrer Größe verlieren im Schnitt erhebliche Summen durch Fehlzeiten — oft ohne genau zu wissen, wo."
3. EINE Frage stellen: "Wie gehen Sie aktuell vor, wenn Sie verstehen wollen, warum Mitarbeitende häufig fehlen?"
4. Aufmerksam zuhören und natürlich auf die Antwort eingehen.
5. CHMetrics kurz erwähnen: "CHMetrics zeigt Ihnen in unter 5 Minuten, wie Ihr Krankenstand im Branchenvergleich steht und was Fehlzeiten Sie konkret in Euro kosten — der Einstieg ist kostenlos."
6. Nach E-Mail fragen: "Ich würde Ihnen gerne eine kurze 2-Minuten-Präsentation schicken. An welche Adresse darf ich die senden?"
7. Bei E-Mail: bestätigen und herzlich verabschieden.
8. Bei Desinteresse: höflich akzeptieren und verabschieden.

Regeln:
- Immer in der Sie-Form sprechen
- Maximal 3 Minuten gesamt
- Maximal eine Frage auf einmal stellen
- Nie aufdringlich sein
- Bei "schicken Sie Infos": immer nach E-Mail-Adresse fragen

Wenn du eine E-Mail-Adresse sammelst, setze die Variable email_collected auf diese Adresse.
Wenn ein Rückruf gewünscht wird, setze callback_requested auf "true" und frage nach dem gewünschten Zeitpunkt.
Wenn die Person klar interessiert ist, setze interested auf "true".
Wenn die Person klar kein Interesse hat, setze not_interested auf "true".`;
}

/**
 * Stimme je nach Sprache
 */
function getVoice(language: string): string {
  const voices: Record<string, string> = {
    "de": "Maya",        // Deutsche professionelle Stimme
    "de-AT": "Maya",
    "de-CH": "Maya",
    "en": "Alicia",      // Englische professionelle Stimme
  };
  return voices[language] ?? "Maya";
}

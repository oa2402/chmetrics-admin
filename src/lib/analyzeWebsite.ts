import { supabase } from './supabase'

const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2'

export interface WebsiteAnalysis {
  company_name: string
  industry: string
  employee_count: number
  city: string
  country: string
  contacts: { name: string; email: string; role: string }[]
  bgm_signals: string[]
  bgm_score: number
  analysis_summary: string
}

export interface LeadData {
  company_name: string
  website_url: string
  industry: string
  employee_count: number
  contact_name: string | null
  contact_email: string | null
  contact_role: string | null
  bgm_score: number
  source: string
  notes: string
}

const ANALYSIS_PROMPT = `Analyze this company website and extract information for BGM (Betriebliches Gesundheitsmanagement = occupational health management) sales purposes.

Return ONLY valid JSON with these fields:
- company_name: The official company name
- industry: One of: Produktion, Logistik, Handel, Dienstleistung, IT, Gesundheit, Bildung, Sonstiges
- employee_count: Estimated number of employees as a number
- city: Main city of operations
- country: Country (DE, AT, or CH)
- contacts: Array of {name, email, role} for HR/management contacts visible on website
- bgm_signals: Array of strings mentioning health, wellbeing, stress, work-life balance, employee benefits, sick leave, workplace safety, mental health, corporate health
- bgm_score: Number 0-100 rating their apparent BGM awareness based on website signals
- analysis_summary: Brief German summary of the company and BGM potential

Return ONLY the JSON, no other text.`

const EMAIL_PROMPT = `Generate a personalized cold email in German for B2B sales.

Company: {company_name}
Industry: {industry}
Employees: {employee_count}
BGM Signals found: {bgm_signals}
BGM Score: {bgm_score}/100

Email tone: Professional, peer-level, empathetic — never salesy. Use "Du" form.
Reference specific signals found on their website.
Max 150 words.
Include a clear CTA for a 15-minute call.

Return ONLY the email text in German, no subject line.`

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-website', {
      body: { url }
    })

    if (error) {
      throw new Error(`Edge Function error: ${error.message}`)
    }

    if (!data?.html) {
      throw new Error('No HTML returned from Edge Function')
    }

    // Extract text content from HTML
    const text = data.html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length > 100) {
      return text.slice(0, 10000)
    }

    throw new Error('Website content too short')
  } catch (error) {
    console.error('Edge Function fetch failed:', error)
    throw new Error('Website konnte nicht geladen werden. Bitte URL prüfen.')
  }
}

async function analyzeWithClaude(content: string, prompt: string): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error('VITE_MINIMAX_API_KEY not configured')
  }

  const response = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`
    },
    body: JSON.stringify({
      model: 'abab6.5s-chat',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nWebsite content:\n${content.slice(0, 8000)}`
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('MiniMax API Error:', response.status, errorText)
    throw new Error(`MiniMax API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('MiniMax Response:', JSON.stringify(data, null, 2))

  // MiniMax returns choices array
  if (data.choices && data.choices[0]) {
    const choice = data.choices[0]
    return choice.message?.content || choice.text || JSON.stringify(choice)
  }
  // Fallback: try to extract from base_resp
  if (data.base_resp) {
    throw new Error(`MiniMax error: ${data.base_resp.status_msg} (code: ${data.base_resp.status_code})`)
  }
  throw new Error('Unexpected MiniMax response format')
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const content = await fetchWebsiteContent(url)
  const result = await analyzeWithClaude(content, ANALYSIS_PROMPT)

  // Parse JSON from response
  const jsonMatch = result.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Konnte Website-Daten nicht analysieren')
  }

  return JSON.parse(jsonMatch[0]) as WebsiteAnalysis
}

export async function generateColdEmail(leadData: {
  company_name: string
  industry: string
  employee_count: number
  bgm_signals: string[]
  bgm_score: number
}): Promise<{ subject: string; body: string }> {
  const prompt = EMAIL_PROMPT
    .replace('{company_name}', leadData.company_name)
    .replace('{industry}', leadData.industry)
    .replace('{employee_count}', String(leadData.employee_count))
    .replace('{bgm_signals}', leadData.bgm_signals.join(', ') || 'keine spezifischen Signale')
    .replace('{bgm_score}', String(leadData.bgm_score))

  const emailBody = await analyzeWithClaude('', prompt)

  const subject = `BGM-Analyse für ${leadData.company_name} — kostenloses Angebot`

  return {
    subject,
    body: emailBody.trim()
  }
}

export async function saveLeadToSupabase(
  analysis: WebsiteAnalysis,
  websiteUrl: string,
  emailContent: { subject: string; body: string },
  contact: { name: string; email: string; role: string } | null
): Promise<string> {
  // Create lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      company_name: analysis.company_name,
      website_url: websiteUrl,
      industry: analysis.industry,
      employee_count: analysis.employee_count,
      contact_name: contact?.name || analysis.contacts[0]?.name || null,
      contact_email: contact?.email || analysis.contacts[0]?.email || null,
      contact_role: contact?.role || analysis.contacts[0]?.role || null,
      bgm_score: analysis.bgm_score,
      status: 'new',
      source: 'website_analysis',
      notes: analysis.analysis_summary
    })
    .select('id')
    .single()

  if (leadError) throw leadError

  // Save website analysis
  await supabase.from('website_analyses').insert({
    lead_id: lead.id,
    url: websiteUrl,
    industry_detected: analysis.industry,
    employee_estimate: String(analysis.employee_count),
    bgm_signals: analysis.bgm_signals,
    raw_analysis: analysis.analysis_summary
  })

  // Save generated email as activity
  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    activity_type: 'email_generated',
    subject: emailContent.subject,
    content: emailContent.body
  })

  return lead.id
}

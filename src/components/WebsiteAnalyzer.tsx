import { useState } from 'react'
import { Globe, Loader2, X, Check, AlertCircle, Mail, Building, Users, MapPin, Sparkles } from 'lucide-react'
import { analyzeWebsite, generateColdEmail, saveLeadToSupabase } from '@/lib/analyzeWebsite'
import type { WebsiteAnalysis } from '@/lib/analyzeWebsite'
import { cn } from '@/lib/utils'

interface WebsiteAnalyzerProps {
  isOpen: boolean
  onClose: () => void
  onLeadSaved: () => void
}

type Step = 'idle' | 'fetching' | 'analyzing' | 'email' | 'done' | 'error'

const steps = {
  fetching: 'Website wird geladen...',
  analyzing: 'Inhalte werden analysiert...',
  email: 'E-Mail wird generiert...',
}

export function WebsiteAnalyzer({ isOpen, onClose, onLeadSaved }: WebsiteAnalyzerProps) {
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [emailContent, setEmailContent] = useState<{ subject: string; body: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleAnalyze = async () => {
    if (!url.trim()) return

    setError(null)
    setStep('fetching')
    setProgress(20)

    try {
      // Step 1: Fetch and analyze website
      setStep('analyzing')
      setProgress(50)

      const result = await analyzeWebsite(url)
      setAnalysis(result)
      setProgress(70)

      // Step 2: Generate email
      setStep('email')
      const email = await generateColdEmail({
        company_name: result.company_name,
        industry: result.industry,
        employee_count: result.employee_count,
        bgm_signals: result.bgm_signals,
        bgm_score: result.bgm_score
      })
      setEmailContent(email)
      setProgress(100)
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Analyse fehlgeschlagen')
      setStep('error')
    }
  }

  const handleSaveLead = async () => {
    if (!analysis || !emailContent) return

    setSaving(true)
    try {
      await saveLeadToSupabase(analysis, url, emailContent, analysis.contacts[0] || null)
      onLeadSaved()
      handleReset()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setUrl('')
    setStep('idle')
    setProgress(0)
    setAnalysis(null)
    setEmailContent(null)
    setError(null)
  }

  if (!isOpen) return null

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0D9488]/10 rounded-lg">
              <Globe className="h-5 w-5 text-[#0D9488]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Website analysieren</h2>
              <p className="text-sm text-gray-500">Automatische Lead-Generierung</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* URL Input */}
          {step === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL eingeben
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.beispiel.de"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!url.trim()}
                className="w-full py-3 bg-[#0D9488] text-white font-medium rounded-lg hover:bg-[#0F766E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Analysieren starten
              </button>
            </div>
          )}

          {/* Loading State */}
          {(step === 'fetching' || step === 'analyzing' || step === 'email') && (
            <div className="space-y-6 py-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[#0D9488] animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-center text-gray-900 font-medium">
                  {steps[step as keyof typeof steps]}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#0D9488] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {step === 'done' && analysis && emailContent && (
            <div className="space-y-6">
              {/* Company Info Card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold text-gray-900">{analysis.company_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {analysis.city}, {analysis.country}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    ~{analysis.employee_count} MA
                  </div>
                  <div className="px-2 py-1 bg-gray-200 rounded text-xs font-medium w-fit">
                    {analysis.industry}
                  </div>
                </div>
              </div>

              {/* BGM Score */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">BGM Score</span>
                  <span className={cn('px-3 py-1 rounded-full font-bold text-lg', getScoreColor(analysis.bgm_score))}>
                    {analysis.bgm_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={cn('h-full rounded-full', analysis.bgm_score >= 70 ? 'bg-green-500' : analysis.bgm_score >= 40 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${analysis.bgm_score}%` }}
                  ></div>
                </div>
              </div>

              {/* BGM Signals */}
              {analysis.bgm_signals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Erkannte BGM-Signale</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.bgm_signals.map((signal, i) => (
                      <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Email */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">Generierte E-Mail</span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Betreff:</p>
                  <p className="text-gray-900 mb-4">{emailContent.subject}</p>
                  <p className="text-sm font-medium text-gray-500 mb-2">Inhalt:</p>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {emailContent.body}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-center text-gray-900 font-medium">{error}</p>
              <button
                onClick={handleReset}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'done' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Neue Analyse
            </button>
            <button
              onClick={handleSaveLead}
              disabled={saving}
              className="px-6 py-2 bg-[#0D9488] text-white font-medium rounded-lg hover:bg-[#0F766E] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Lead speichern
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

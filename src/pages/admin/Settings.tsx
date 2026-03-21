import { useState } from 'react'
import { Key, Bell, Mail, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label: string
  description: string
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors',
          enabled ? 'bg-[#0D9488]' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

export function Settings() {
  const [automationEnabled, setAutomationEnabled] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [autoPosting, setAutoPosting] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* API Keys */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#0D9488]/10 rounded-lg">
            <Key className="h-5 w-5 text-[#0D9488]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
            <p className="text-sm text-gray-500">Externe Services für Automation</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resend API Key</label>
            <input
              type="password"
              placeholder="re_xxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn API Token</label>
            <input
              type="password"
              placeholder="AQXXXXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canva API Key</label>
            <input
              type="password"
              placeholder="CPXXXXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Automations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#1E3A5F]/10 rounded-lg">
            <Bell className="h-5 w-5 text-[#1E3A5F]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Automatisierung</h2>
            <p className="text-sm text-gray-500">Tägliche Abläufe und Trigger</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <Toggle
            enabled={automationEnabled}
            onChange={setAutomationEnabled}
            label="Automation aktiviert"
            description="Tägliche Reports und Lead-Scoring aktiv"
          />
          <Toggle
            enabled={emailNotifications}
            onChange={setEmailNotifications}
            label="E-Mail Benachrichtigungen"
            description="Benachrichtigung bei neuen Leads und Antworten"
          />
          <Toggle
            enabled={autoPosting}
            onChange={setAutoPosting}
            label="Auto-Posting LinkedIn"
            description="Automatische Veröffentlichung geplanter Posts"
          />
        </div>
      </div>

      {/* Email Template Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">E-Mail Vorlage</h2>
            <p className="text-sm text-gray-500">Lead-Ansprache Vorlage</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Betreff</p>
            <p className="text-sm font-medium text-gray-900">Betriebliches Gesundheitsmanagement – Potenzialanalyse für {`{{company_name}}`}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Inhalt</p>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Sehr geehrte{`{{contact_name}}`},</p>
              <p>ich habe Ihre Website analysiert und festgestellt, dass {`{{company_name}}`} im Bereich Mitarbeitergesundheit noch Potenzial hat.</p>
              <p>Mit CHMetrics können Sie die Gesundheit Ihrer Mitarbeitenden messen, Benchmarks vergleichen und den ROI nachweisen.</p>
              <p>Würden Sie sich 15 Minuten Zeit nehmen für ein kurzes Gespräch?</p>
            </div>
          </div>
        </div>

        <button className="mt-4 text-sm text-[#0D9488] hover:underline">
          Vorlage bearbeiten →
        </button>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            Gespeichert
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-[#0D9488] text-white font-medium rounded-lg hover:bg-[#0F766E] transition-colors"
        >
          Einstellungen speichern
        </button>
      </div>
    </div>
  )
}

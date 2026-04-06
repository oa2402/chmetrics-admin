import { useEffect, useState } from 'react'
import { Phone, PhoneCall, PhoneMissed, ThumbsUp, ThumbsDown, Clock, Euro } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CallLog {
  id: string
  lead_id: string | null
  campaign_id: string | null
  bland_call_id: string | null
  called_at: string
  duration_sec: number
  outcome: string
  language_used: string
  email_collected: string | null
  callback_time: string | null
  transcript: string | null
  notes: string | null
  cost_eur: number
  leads?: { company_name: string; contact_name: string | null }
  sales_campaigns?: { name: string }
}

const outcomeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_reached:    { label: 'Nicht erreicht', color: 'bg-gray-100 text-gray-600',    icon: PhoneMissed },
  reached:        { label: 'Erreicht',        color: 'bg-blue-100 text-blue-700',    icon: PhoneCall },
  interested:     { label: 'Interessiert',    color: 'bg-green-100 text-green-700',  icon: ThumbsUp },
  not_interested: { label: 'Kein Interesse',  color: 'bg-red-100 text-red-600',      icon: ThumbsDown },
  callback:       { label: 'Rückruf',         color: 'bg-yellow-100 text-yellow-700',icon: Clock },
  voicemail:      { label: 'Mailbox',         color: 'bg-purple-100 text-purple-600',icon: Phone },
  wrong_number:   { label: 'Falsche Nr.',     color: 'bg-orange-100 text-orange-600',icon: PhoneMissed },
}

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

export function Calls() {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CallLog | null>(null)
  const [filter, setFilter] = useState<string>('all')

  // KPI summary
  const [stats, setStats] = useState({
    total: 0, reached: 0, interested: 0, totalCost: 0, avgDuration: 0,
  })

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    const { data } = await supabase
      .from('sales_calls')
      .select('*, leads(company_name, contact_name), sales_campaigns(name)')
      .order('called_at', { ascending: false })
      .limit(200)

    if (data) {
      setCalls(data)
      const total = data.length
      const reached = data.filter(c => c.outcome !== 'not_reached' && c.outcome !== 'voicemail').length
      const interested = data.filter(c => c.outcome === 'interested').length
      const totalCost = data.reduce((sum, c) => sum + (c.cost_eur || 0), 0)
      const avgDuration = total > 0 ? Math.round(data.reduce((sum, c) => sum + c.duration_sec, 0) / total) : 0
      setStats({ total, reached, interested, totalCost, avgDuration })
    }
    setLoading(false)
  }

  const filteredCalls = filter === 'all' ? calls : calls.filter(c => c.outcome === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Call-Log</h1>
        <p className="text-sm text-gray-500 mt-1">Alle Anrufe des KI-Assistenten Clara</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Calls gesamt', value: stats.total, icon: Phone, color: 'text-blue-600 bg-blue-50' },
          { label: 'Erreicht', value: stats.reached, icon: PhoneCall, color: 'text-teal-600 bg-teal-50' },
          { label: 'Interessiert', value: stats.interested, icon: ThumbsUp, color: 'text-green-600 bg-green-50' },
          { label: 'Ø Dauer', value: formatDuration(stats.avgDuration), icon: Clock, color: 'text-purple-600 bg-purple-50' },
          { label: 'Kosten', value: `${stats.totalCost.toFixed(2)}€`, icon: Euro, color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex p-2 rounded-lg ${color} mb-2`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Pickup Rate */}
      {stats.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pickup Rate</span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round((stats.reached / stats.total) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-full bg-[#0D9488] rounded-full"
              style={{ width: `${Math.round((stats.reached / stats.total) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Ziel: 25%</span>
            <span>{stats.reached} von {stats.total} Calls</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'interested', 'reached', 'callback', 'not_reached', 'not_interested'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#0D9488] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Alle' : outcomeConfig[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Call List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488]" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredCalls.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Phone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p>Noch keine Anrufe vorhanden.</p>
              <p className="text-sm mt-1">Anrufe werden automatisch von Bland.ai hier eingetragen.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Firma</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Datum</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ergebnis</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Dauer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kosten</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCalls.map(call => {
                  const cfg = outcomeConfig[call.outcome] ?? outcomeConfig.not_reached
                  const Icon = cfg.icon
                  return (
                    <tr
                      key={call.id}
                      onClick={() => setSelected(call)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">
                          {call.leads?.company_name ?? '—'}
                        </p>
                        {call.leads?.contact_name && (
                          <p className="text-xs text-gray-400">{call.leads.contact_name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(call.called_at).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDuration(call.duration_sec)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {call.email_collected
                          ? <span className="text-green-600 font-medium">{call.email_collected}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {call.cost_eur > 0 ? `${call.cost_eur.toFixed(3)}€` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Detail Sidebar */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selected.leads?.company_name ?? 'Call Detail'}
              </h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="text-gray-500 text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Ergebnis', value: outcomeConfig[selected.outcome]?.label },
                  { label: 'Dauer', value: formatDuration(selected.duration_sec) },
                  { label: 'Sprache', value: selected.language_used },
                  { label: 'Kosten', value: `${selected.cost_eur.toFixed(3)}€` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">{label}</p>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {selected.email_collected && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 uppercase font-medium">E-Mail erhalten</p>
                  <p className="font-medium text-green-800">{selected.email_collected}</p>
                </div>
              )}

              {selected.callback_time && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-600 uppercase font-medium">Rückruf gewünscht</p>
                  <p className="font-medium text-yellow-800">
                    {new Date(selected.callback_time).toLocaleString('de-DE')}
                  </p>
                </div>
              )}

              {selected.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-1">Notizen</p>
                  <p className="text-sm text-gray-700">{selected.notes}</p>
                </div>
              )}

              {selected.transcript && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-2">Transkript</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {selected.transcript}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

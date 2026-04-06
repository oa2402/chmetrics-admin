import { useEffect, useState } from 'react'
import { Plus, Play, Pause, Euro, Phone, Users, TrendingUp, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  description: string | null
  budget_eur: number
  spent_eur: number
  target_segment: string
  target_country: string
  status: string
  start_date: string | null
  end_date: string | null
  calls_per_day: number
  created_at: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
}

const statusLabels: Record<string, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
}

export function Kampagnen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    budget_eur: '',
    target_segment: '200-500',
    target_country: 'DE',
    calls_per_day: '30',
    start_date: '',
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('sales_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCampaigns(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('sales_campaigns').insert({
      name: form.name,
      description: form.description || null,
      budget_eur: parseFloat(form.budget_eur) || 0,
      target_segment: form.target_segment,
      target_country: form.target_country,
      calls_per_day: parseInt(form.calls_per_day) || 30,
      start_date: form.start_date || null,
      status: 'active',
    })
    await fetchCampaigns()
    setShowForm(false)
    setForm({ name: '', description: '', budget_eur: '', target_segment: '200-500', target_country: 'DE', calls_per_day: '30', start_date: '' })
    setSaving(false)
  }

  const toggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    await supabase.from('sales_campaigns').update({ status: newStatus }).eq('id', campaign.id)
    fetchCampaigns()
  }

  const budgetPercent = (c: Campaign) =>
    c.budget_eur > 0 ? Math.min(100, Math.round((c.spent_eur / c.budget_eur) * 100)) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampagnen</h1>
          <p className="text-sm text-gray-500 mt-1">Budget-Tracking und Outbound-Kampagnen verwalten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neue Kampagne
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488]" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Noch keine Kampagnen. Erstelle deine erste Kampagne.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                      {statusLabels[c.status]}
                    </span>
                  </div>
                  {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Ziel: {c.target_segment} MA</span>
                    <span>Land: {c.target_country}</span>
                    <span>{c.calls_per_day} Calls/Tag</span>
                    {c.start_date && <span>Start: {new Date(c.start_date).toLocaleDateString('de-DE')}</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(c)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={c.status === 'active' ? 'Pausieren' : 'Aktivieren'}
                >
                  {c.status === 'active'
                    ? <Pause className="h-5 w-5 text-yellow-500" />
                    : <Play className="h-5 w-5 text-green-500" />}
                </button>
              </div>

              {/* Budget Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Budget verbraucht</span>
                  <span className="font-medium text-gray-900">
                    {c.spent_eur.toFixed(2)}€ / {c.budget_eur.toFixed(2)}€
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${budgetPercent(c) > 80 ? 'bg-red-500' : budgetPercent(c) > 60 ? 'bg-yellow-500' : 'bg-[#0D9488]'}`}
                    style={{ width: `${budgetPercent(c)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{budgetPercent(c)}% verbraucht</p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Calls/Tag geplant</p>
                  <p className="font-bold text-gray-900">{c.calls_per_day}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Euro className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Cost/Lead (Ziel)</p>
                  <p className="font-bold text-gray-900">≤15€</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Segment</p>
                  <p className="font-bold text-gray-900">{c.target_segment} MA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Neue Kampagne Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Neue Kampagne</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. DACH Phase 1 — 200-500 MA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
                  <input
                    type="number"
                    required
                    value={form.budget_eur}
                    onChange={e => setForm(f => ({ ...f, budget_eur: e.target.value }))}
                    placeholder="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calls/Tag</label>
                  <input
                    type="number"
                    value={form.calls_per_day}
                    onChange={e => setForm(f => ({ ...f, calls_per_day: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ziel-Segment</label>
                  <select
                    value={form.target_segment}
                    onChange={e => setForm(f => ({ ...f, target_segment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="200-500">200–500 MA</option>
                    <option value="50-200">50–200 MA</option>
                    <option value="alle">Alle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                  <select
                    value={form.target_country}
                    onChange={e => setForm(f => ({ ...f, target_country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="DE">Deutschland</option>
                    <option value="AT">Österreich</option>
                    <option value="CH">Schweiz</option>
                    <option value="alle">Alle</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Wird erstellt...' : 'Kampagne erstellen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

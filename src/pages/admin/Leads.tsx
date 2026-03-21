import { useEffect, useState } from 'react'
import { Search, Plus, Globe, Mail, Phone, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Lead {
  id: string
  company_name: string
  website_url: string | null
  industry: string | null
  employee_count: number | null
  contact_name: string | null
  contact_email: string | null
  contact_role: string | null
  bgm_score: number
  status: string
  source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface LeadActivity {
  id: string
  activity_type: string
  subject: string | null
  content: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  converted: 'bg-teal-100 text-teal-700',
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setLeads(data)
    setLoading(false)
  }

  const fetchActivities = async (leadId: string) => {
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) setActivities(data)
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.industry?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead)
    await fetchActivities(lead.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lead Management</h2>
          <p className="text-sm text-gray-500 mt-1">{leads.length} Leads insgesamt</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors">
          <Plus className="h-4 w-4" />
          Neuer Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Suche nach Firma, E-Mail oder Branche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
        >
          <option value="all">Alle Status</option>
          <option value="new">Neu</option>
          <option value="contacted">Kontaktiert</option>
          <option value="replied">Antwort erhalten</option>
          <option value="converted">Konvertiert</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branche</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectLead(lead)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.company_name}</div>
                      <div className="text-sm text-gray-500">{lead.contact_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lead.industry || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.employee_count || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0D9488] rounded-full"
                            style={{ width: `${lead.bgm_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{lead.bgm_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium capitalize', statusColors[lead.status] || statusColors.new)}>
                        {lead.status === 'new' ? 'Neu' : lead.status === 'contacted' ? 'Kontaktiert' : lead.status === 'replied' ? 'Antwort' : lead.status === 'converted' ? 'Konvertiert' : lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Keine Leads gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Sidebar */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedLead(null)}></div>
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedLead.company_name}</h3>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 uppercase">Kontakt</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedLead.contact_email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedLead.contact_role || '-'}</span>
                  </div>
                  {selectedLead.website_url && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a href={selectedLead.website_url} target="_blank" rel="noopener noreferrer" className="text-[#0D9488] hover:underline">
                        {selectedLead.website_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Branche</p>
                  <p className="font-medium text-gray-900">{selectedLead.industry || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Mitarbeiter</p>
                  <p className="font-medium text-gray-900">{selectedLead.employee_count || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">BGM Score</p>
                  <p className="font-medium text-gray-900">{selectedLead.bgm_score}/100</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[selectedLead.status])}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-2">Notizen</p>
                  <p className="text-sm text-gray-700">{selectedLead.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors">
                  Website analysieren
                </button>
                <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  E-Mail senden
                </button>
              </div>

              {/* Activities */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 uppercase">Letzte Aktivitäten</h4>
                {activities.length > 0 ? (
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[#0D9488] capitalize">{activity.activity_type}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        {activity.subject && <p className="text-sm font-medium text-gray-900">{activity.subject}</p>}
                        {activity.content && <p className="text-sm text-gray-600 mt-1">{activity.content}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Keine Aktivitäten</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

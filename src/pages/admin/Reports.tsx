import { useEffect, useState } from 'react'
import { Calendar, TrendingUp, Users, Mail, MessageSquare, Euro } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DailyReport {
  id: string
  report_date: string
  new_leads: number
  emails_sent: number
  emails_opened: number
  replies_received: number
  mrr_current: number
  linkedin_posts_today: number
  summary: string | null
  created_at: string
}

export function Reports() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    const { data } = await supabase
      .from('daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(30)

    if (data) setReports(data)
    setLoading(false)
  }

  const totals = reports.reduce(
    (acc, r) => ({
      leads: acc.leads + r.new_leads,
      emails: acc.emails + r.emails_sent,
      opened: acc.opened + r.emails_opened,
      replies: acc.replies + r.replies_received,
      posts: acc.posts + r.linkedin_posts_today,
    }),
    { leads: 0, emails: 0, opened: 0, replies: 0, posts: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Daily Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Letzte 30 Tage</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Leads</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.leads}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium">E-Mails</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.emails}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Öffnungen</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.opened}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium">Antworten</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.replies}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-[#0D9488] mb-2">
            <Euro className="h-4 w-4" />
            <span className="text-xs font-medium">Posts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.posts}</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mx-auto"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0D9488]/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-[#0D9488]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(report.report_date).toLocaleDateString('de-DE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {report.summary && (
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">{report.summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500">Leads</p>
                      <p className="font-semibold text-gray-900">{report.new_leads}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">E-Mails</p>
                      <p className="font-semibold text-gray-900">{report.emails_sent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Öffnungen</p>
                      <p className="font-semibold text-gray-900">{report.emails_opened}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Antworten</p>
                      <p className="font-semibold text-gray-900">{report.replies_received}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">MRR</p>
                      <p className="font-semibold text-gray-900">{report.mrr_current}€</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Keine Reports verfügbar
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

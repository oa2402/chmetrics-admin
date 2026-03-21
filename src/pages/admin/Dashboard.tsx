import { useEffect, useState } from 'react'
import { Users, Mail, MessageSquare, Euro, TrendingUp, Plus, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface DailyReport {
  report_date: string
  new_leads: number
  emails_sent: number
  emails_opened: number
  replies_received: number
  mrr_current: number
  linkedin_posts_today: number
}

interface StatCard {
  label: string
  value: string | number
  change?: string
  icon: React.ElementType
  color: string
}

export function Dashboard() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(7)

      if (data) {
        setReports(data.reverse())
      }
      setLoading(false)
    }
    fetchReports()
  }, [])

  const todayReport = reports[reports.length - 1] || {
    new_leads: 0,
    emails_sent: 0,
    replies_received: 0,
    mrr_current: 0,
    linkedin_posts_today: 0,
  }

  const statCards: StatCard[] = [
    { label: 'Neue Leads', value: todayReport.new_leads, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'E-Mails gesendet', value: todayReport.emails_sent, icon: Mail, color: 'text-purple-600 bg-purple-50' },
    { label: 'Antworten', value: todayReport.replies_received, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
    { label: 'MRR', value: `${todayReport.mrr_current}€`, icon: Euro, color: 'text-[#0D9488] bg-teal-50' },
  ]

  const chartData = reports.map((r) => ({
    date: new Date(r.report_date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit' }),
    leads: r.new_leads,
    emails: r.emails_sent,
    replies: r.replies_received,
  }))

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte 7 Tage</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488]"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} dot={false} name="Leads" />
              <Line type="monotone" dataKey="emails" stroke="#8B5CF6" strokeWidth={2} dot={false} name="E-Mails" />
              <Line type="monotone" dataKey="replies" stroke="#10B981" strokeWidth={2} dot={false} name="Antworten" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Keine Daten verfügbar
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/leads"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#0D9488] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0D9488] rounded-lg group-hover:bg-[#0F766E] transition-colors">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Neuen Lead analysieren</h3>
              <p className="text-sm text-gray-500">Website scannen und BGM-Signale identifizieren</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/posts"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#0D9488] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1E3A5F] rounded-lg group-hover:bg-[#2D4A6F] transition-colors">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Post erstellen</h3>
              <p className="text-sm text-gray-500">LinkedIn Content aus Wissensdatenbank generieren</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

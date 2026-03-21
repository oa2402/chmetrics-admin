import { useEffect, useState } from 'react'
import { Plus, Image, Calendar, Check, Clock, MessageSquare, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface LinkedInPost {
  id: string
  content: string | null
  image_url: string | null
  category: string | null
  status: string
  scheduled_for: string | null
  posted_at: string | null
  likes: number
  comments: number
  created_at: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: 'Entwurf', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'Geplant', icon: Calendar, color: 'bg-blue-100 text-blue-700' },
  posted: { label: 'Gepostet', icon: Check, color: 'bg-green-100 text-green-700' },
}

const categoryLabels: Record<string, string> = {
  bgm_stat: 'BGM Statistik',
  sales_insight: 'Sales Insight',
  feature: 'Feature/Tipp',
  leadership: 'Leadership',
}

export function Posts() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showPreview, setShowPreview] = useState<LinkedInPost | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('linkedin_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setPosts(data)
    setLoading(false)
  }

  const filteredPosts = posts.filter((post) => statusFilter === 'all' || post.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">LinkedIn Posts</h2>
          <p className="text-sm text-gray-500 mt-1">{posts.length} Posts insgesamt</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors">
          <Plus className="h-4 w-4" />
          Neuen Post generieren
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {['all', 'draft', 'scheduled', 'posted'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              statusFilter === status
                ? 'bg-[#0D9488] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {status === 'all' ? 'Alle' : statusConfig[status].label}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9488] mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const StatusIcon = statusConfig[post.status].icon
            return (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#0D9488] transition-colors cursor-pointer" onClick={() => setShowPreview(post)}>
                {/* Image Placeholder */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-10 w-10 text-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', statusConfig[post.status].color)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[post.status].label}
                    </span>
                    {post.category && (
                      <span className="text-xs text-gray-500">{categoryLabels[post.category] || post.category}</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                    {post.content || 'Kein Inhalt...'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {post.status === 'posted' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comments}
                        </span>
                      </>
                    )}
                    {post.scheduled_for && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.scheduled_for).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredPosts.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500">
              Keine Posts gefunden
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(null)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Image */}
            <div className="h-64 bg-gray-100 flex items-center justify-center">
              {showPreview.image_url ? (
                <img src={showPreview.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Image className="h-12 w-12 text-gray-300" />
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[showPreview.status].color)}>
                  {statusConfig[showPreview.status].label}
                </span>
                {showPreview.category && (
                  <span className="text-xs text-gray-500">{categoryLabels[showPreview.category]}</span>
                )}
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">{showPreview.content}</p>

              {/* Stats */}
              {showPreview.status === 'posted' && (
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {showPreview.likes} Likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {showPreview.comments} Kommentare
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPreview(null)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Schließen
                </button>
                <button className="flex-1 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors">
                  {showPreview.status === 'draft' ? 'Bearbeiten' : showPreview.status === 'scheduled' ? 'Jetzt posten' : 'Duplizieren'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

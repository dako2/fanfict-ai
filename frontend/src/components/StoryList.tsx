import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share, Bookmark, User, Clock } from 'lucide-react'

interface Story {
  id: string
  title: string
  description: string
  genre: string
  created_at: string
  root_node_id: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function StoryList() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories`)
      if (!response.ok) {
        throw new Error('Failed to fetch stories')
      }
      const data = await response.json()
      setStories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
          <p className="text-gray-600 mb-6">Oops! Something went wrong</p>
          <button 
            onClick={fetchStories}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      {/* Stories Feed Header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Stories
        </h1>
        <Link 
          to="/stories/create"
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
        >
          Create
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No stories yet</h3>
            <p className="text-gray-600 mb-8">Be the first to share your creative story!</p>
            <Link 
              to="/stories/create"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all inline-block"
            >
              Create Your Story
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Original Author</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(story.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {story.genre}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bookmark className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Story Content */}
              <div className="px-4 pb-3">
                <Link to={`/stories/${story.id}`} className="block">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                    {story.title}
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {story.description}
                  </p>
                </Link>
              </div>

              {/* Story Image Placeholder */}
              <div className="mx-4 mb-3">
                <Link to={`/stories/${story.id}`}>
                  <div className="aspect-video bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 rounded-2xl flex items-center justify-center hover:shadow-md transition-all cursor-pointer">
                    <div className="text-center">
                      <Heart className="h-12 w-12 text-purple-300 mx-auto mb-2" />
                      <p className="text-purple-600 font-medium text-sm">Tap to read story</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Interaction Bar */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-full transition-colors">
                      <Heart className="h-6 w-6 text-gray-700 hover:text-red-500 transition-colors" />
                    </button>
                    <button className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-full transition-colors">
                      <MessageCircle className="h-6 w-6 text-gray-700 hover:text-blue-500 transition-colors" />
                    </button>
                    <button className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-full transition-colors">
                      <Share className="h-6 w-6 text-gray-700 hover:text-green-500 transition-colors" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <Link 
                    to={`/stories/${story.id}`}
                    className="text-purple-600 font-medium text-sm hover:text-purple-700 transition-colors"
                  >
                    Read full story
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

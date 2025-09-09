import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

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
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    fetchStories()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (stories.length === 0) return
      
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => Math.min(stories.length - 1, prev + 1))
          break
        case 'Enter':
          event.preventDefault()
          if (stories[selectedIndex]) {
            window.location.href = `/stories/${stories[selectedIndex].id}`
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stories, selectedIndex])

  useEffect(() => {
    const selectedElement = document.getElementById(`story-${selectedIndex}`)
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedIndex])

  const fetchStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories`)
      if (!response.ok) {
        throw new Error('Failed to fetch stories')
      }
      const data = await response.json()
      setStories(data)
      
      const initialVotes: Record<string, number> = {}
      data.forEach((story: Story) => {
        initialVotes[story.id] = Math.floor(Math.random() * 100) + 1
      })
      setVotes(initialVotes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = (storyId: string, direction: 'up' | 'down') => {
    setVotes(prev => ({
      ...prev,
      [storyId]: prev[storyId] + (direction === 'up' ? 1 : -1)
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-white rounded-lg p-8 shadow border border-gray-200 max-w-md mx-auto">
          <p className="text-gray-600 mb-6">Oops! Something went wrong</p>
          <button 
            onClick={fetchStories}
            className="bg-orange-500 text-white px-6 py-2 rounded-md font-medium hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {stories.length === 0 ? (
        <div className="text-center py-24">
          <div className="bg-white rounded-2xl p-16 shadow-lg border border-gray-100 max-w-md mx-auto">
            <h3 className="text-2xl font-light text-gray-900 mb-4">No stories yet</h3>
            <p className="text-gray-600 mb-8 font-light">Be the first to share your creative story</p>
            <Link 
              to="/stories/create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Create Story</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <div 
              key={story.id} 
              id={`story-${index}`}
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                selectedIndex === index 
                  ? 'ring-2 ring-gray-900 shadow-xl -translate-y-1' 
                  : ''
              }`}
            >
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-6xl font-light text-gray-400">📖</div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {story.genre}
                  </span>
                  <span className="text-sm text-gray-500 font-light">
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                </div>

                <Link to={`/stories/${story.id}`} className="block mb-3">
                  <h2 className="text-xl font-light text-gray-900 hover:text-gray-600 transition-colors leading-tight">
                    {story.title}
                  </h2>
                </Link>

                <p className="text-gray-600 mb-4 leading-relaxed font-light line-clamp-3">
                  {story.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleVote(story.id, 'up')}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ♡
                    </button>
                    <span className="text-sm text-gray-500 font-light">
                      {votes[story.id] || 0}
                    </span>
                  </div>
                  
                  <Link 
                    to={`/stories/${story.id}`}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Read →
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

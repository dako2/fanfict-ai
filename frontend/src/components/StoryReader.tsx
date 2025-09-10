import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Story {
  id: string
  title: string
  description: string
  genre: string
  created_at: string
  root_node_id: string
}

interface StoryNode {
  id: string
  story_id: string
  content: string
  parent_id: string | null
  children_ids: string[]
  is_ai_generated: boolean
  created_at: string
  author: string
  likes: number
  dislikes: number
}

interface Comment {
  id: string
  node_id: string
  content: string
  author: string
  created_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function StoryReader() {
  const { t } = useTranslation()
  const { storyId, nodeId } = useParams()
  const navigate = useNavigate()
  
  const [story, setStory] = useState<Story | null>(null)
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null)
  const [children, setChildren] = useState<StoryNode[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showComments] = useState(true)
  const [showTwistForm, setShowTwistForm] = useState(false)
  const [showContinueForm, setShowContinueForm] = useState(false)
  const [votes, setVotes] = useState({ likes: 0, dislikes: 0 })
  
  const [newComment, setNewComment] = useState('')
  const [newTwist, setNewTwist] = useState({ content: '', twist_description: '', author: 'Anonymous' })
  const [newContinuation, setNewContinuation] = useState({ content: '', author: 'Anonymous' })
  const userId = 'user123' // In a real app, this would come from authentication

  useEffect(() => {
    if (storyId) {
      fetchStoryData()
    }
  }, [storyId, nodeId])

  const fetchStoryData = async () => {
    try {
      setLoading(true)
      
      const storyResponse = await fetch(`${API_BASE_URL}/api/stories/${storyId}`)
      if (!storyResponse.ok) throw new Error('Failed to fetch story')
      const storyData = await storyResponse.json()
      setStory(storyData)
      
      const targetNodeId = nodeId || storyData.root_node_id
      
      const nodeResponse = await fetch(`${API_BASE_URL}/api/stories/${storyId}/nodes/${targetNodeId}`)
      if (!nodeResponse.ok) throw new Error('Failed to fetch story node')
      const nodeData = await nodeResponse.json()
      setCurrentNode(nodeData)
      setVotes({ 
        likes: nodeData.likes || Math.floor(Math.random() * 50) + 10, 
        dislikes: nodeData.dislikes || Math.floor(Math.random() * 10) + 1 
      })
      
      const childrenResponse = await fetch(`${API_BASE_URL}/api/stories/${storyId}/nodes/${targetNodeId}/children`)
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json()
        setChildren(childrenData)
      }
      
      const commentsResponse = await fetch(`${API_BASE_URL}/api/nodes/${targetNodeId}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!currentNode) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/nodes/${currentNode.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType, user_id: userId })
      })
      
      if (response.ok) {
        setVotes(prev => ({
          ...prev,
          [voteType === 'like' ? 'likes' : 'dislikes']: prev[voteType === 'like' ? 'likes' : 'dislikes'] + 1
        }))
        fetchStoryData()
      }
    } catch (err) {
      console.error('Failed to vote:', err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentNode || !newComment.trim()) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/nodes/${currentNode.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, author: 'Anonymous' })
      })
      
      if (response.ok) {
        setNewComment('')
        fetchStoryData() // Refresh to show new comment
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleCreateTwist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentNode || !newTwist.content.trim()) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/nodes/${currentNode.id}/ai-twist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTwist)
      })
      
      if (response.ok) {
        const newNode = await response.json()
        setNewTwist({ content: '', twist_description: '', author: 'Anonymous' })
        setShowTwistForm(false)
        navigate(`/stories/${storyId}/nodes/${newNode.id}`)
      }
    } catch (err) {
      console.error('Failed to create twist:', err)
    }
  }

  const handleContinueStory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentNode || !newContinuation.content.trim()) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/nodes/${currentNode.id}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newContinuation.content, 
          parent_id: currentNode.id,
          is_ai_generated: false 
        })
      })
      
      if (response.ok) {
        const newNode = await response.json()
        setNewContinuation({ content: '', author: 'Anonymous' })
        setShowContinueForm(false)
        navigate(`/stories/${storyId}/nodes/${newNode.id}`)
      }
    } catch (err) {
      console.error('Failed to continue story:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('storyReader.loading')}</span>
      </div>
    )
  }

  if (error || !story || !currentNode) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{t('storyReader.error')}: {error || 'Story not found'}</p>
        <button 
          onClick={() => navigate('/stories')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('storyReader.backToStories')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <button
          onClick={() => navigate('/stories')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('storyReader.backToStories')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Story Content - Left Side (Mobile: Full Width, Desktop: 2/3 Width) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {story.genre}
                  </span>
                  <span className="text-sm text-gray-500 font-light">
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                  {currentNode.is_ai_generated && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      AI Generated
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleVote('like')}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg"
                  >
                    ♡
                  </button>
                  <span className="text-sm text-gray-500 font-light">
                    {votes.likes - votes.dislikes}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-light text-gray-900 mb-4">{story.title}</h1>
              <p className="text-gray-600 font-light mb-8 text-lg">{story.description}</p>
              
              <div className="prose max-w-none mb-8">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-light text-lg">
                  {currentNode.content}
                </div>
              </div>
            </div>
          </div>

          {children.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-light text-gray-900 mb-6">{t('storyReader.continueReading')}</h3>
              <div className="grid gap-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => navigate(`/stories/${storyId}/nodes/${child.id}`)}
                    className="w-full text-left p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">{child.author}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400 hover:text-red-500 transition-colors">♡</span>
                        <span className="text-sm text-gray-500 font-light">{child.likes} {t('storyReader.likes')}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 font-light leading-relaxed">{child.content.substring(0, 150)}...</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowContinueForm(!showContinueForm)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>{t('storyReader.continueReading')}</span>
              </button>
              
              <button
                onClick={() => setShowTwistForm(!showTwistForm)}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>{t('storyReader.plotTwist')}</span>
              </button>
            </div>
          </div>

          {showContinueForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-light text-gray-900 mb-6">{t('storyReader.continueReading')}</h3>
              <form onSubmit={handleContinueStory}>
                <textarea
                  value={newContinuation.content}
                  onChange={(e) => setNewContinuation({ ...newContinuation, content: e.target.value })}
                  placeholder={t('storyReader.plotTwistPlaceholder')}
                  rows={8}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-6 resize-none font-light"
                  required
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowContinueForm(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
                  >
                    {t('createStory.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
                  >
                    {t('createStory.publish')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showTwistForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-light text-gray-900 mb-6">{t('storyReader.plotTwist')}</h3>
              <form onSubmit={handleCreateTwist}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('storyReader.plotTwist')}
                  </label>
                  <input
                    type="text"
                    value={newTwist.twist_description}
                    onChange={(e) => setNewTwist({ ...newTwist, twist_description: e.target.value })}
                    placeholder={t('storyReader.plotTwistPlaceholder')}
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-light"
                    required
                  />
                </div>
                <textarea
                  value={newTwist.content}
                  onChange={(e) => setNewTwist({ ...newTwist, content: e.target.value })}
                  placeholder={t('storyReader.plotTwistPlaceholder')}
                  rows={8}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-6 resize-none font-light"
                  required
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowTwistForm(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
                  >
                    {t('createStory.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all font-medium"
                  >
                    {t('storyReader.submitTwist')} ✨
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Comments - Right Side (Mobile: Full Width Below, Desktop: 1/3 Width) */}
        <div className="lg:col-span-1">
          {showComments && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:sticky lg:top-8">
              <h3 className="text-xl font-light text-gray-900 mb-6">{t('storyReader.comments')} ({comments.length})</h3>
              
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('storyReader.addComment')}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-3 resize-none font-light text-sm"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
                  >
                    {t('storyReader.postComment')}
                  </button>
                </div>
              </form>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-100 pl-4">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1 font-light">
                      <span className="font-medium">{comment.author}</span>
                      <span>•</span>
                      <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 font-light leading-relaxed text-sm">{comment.content}</p>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl font-light text-gray-300 mb-3">💬</div>
                    <p className="text-gray-500 font-light text-sm">{t('storyReader.noComments')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

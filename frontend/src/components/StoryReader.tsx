import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Plus, Zap, GitBranch, User, Clock, Share, Bookmark } from 'lucide-react'

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
  const { storyId, nodeId } = useParams()
  const navigate = useNavigate()
  
  const [story, setStory] = useState<Story | null>(null)
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null)
  const [children, setChildren] = useState<StoryNode[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showComments, setShowComments] = useState(false)
  const [showTwistForm, setShowTwistForm] = useState(false)
  const [showContinueForm, setShowContinueForm] = useState(false)
  
  const [newComment, setNewComment] = useState('')
  const [newTwist, setNewTwist] = useState({ content: '', twist_description: '', author: 'Anonymous' })
  const [newContinuation, setNewContinuation] = useState({ content: '', author: 'Anonymous' })
  
  const [userVote, setUserVote] = useState<string | null>(null)
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
        setUserVote(voteType)
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
      </div>
    )
  }

  if (error || !story || !currentNode) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error || 'Story not found'}</p>
        <button 
          onClick={() => navigate('/stories')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Stories
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <button
          onClick={() => navigate('/stories')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bookmark className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Story Post */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{currentNode.author}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{new Date(story.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {story.genre}
                </span>
                {currentNode.is_ai_generated && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium">
                      AI ✨
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Story Title */}
        <div className="px-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{story.title}</h1>
          <p className="text-gray-600 text-sm mb-3">{story.description}</p>
        </div>

        {/* Story Content */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-6">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">
              {currentNode.content}
            </p>
          </div>
        </div>

        {/* Interaction Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleVote('like')}
                className={`flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-full transition-colors ${
                  userVote === 'like' ? 'text-red-500' : 'text-gray-700'
                }`}
              >
                <Heart className={`h-6 w-6 ${userVote === 'like' ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-full transition-colors text-gray-700"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <button className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-full transition-colors text-gray-700">
                <Share className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="text-sm">
            <p className="font-semibold text-gray-900 mb-1">
              {currentNode.likes} {currentNode.likes === 1 ? 'like' : 'likes'}
            </p>
            {comments.length > 0 && (
              <button 
                onClick={() => setShowComments(!showComments)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                View all {comments.length} comments
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Options */}
      {children.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <GitBranch className="h-5 w-5 mr-2 text-purple-600" />
            What happens next?
          </h3>
          <div className="space-y-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => navigate(`/stories/${storyId}/nodes/${child.id}`)}
                className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:shadow-md transition-all border border-purple-100 hover:border-purple-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{child.author}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {child.likes}
                    </span>
                  </div>
                </div>
                <p className="text-gray-900 line-clamp-2 text-sm leading-relaxed">{child.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowContinueForm(!showContinueForm)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:shadow-lg transition-all font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Continue</span>
          </button>
          
          <button
            onClick={() => setShowTwistForm(!showTwistForm)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg transition-all font-medium"
          >
            <Zap className="h-4 w-4" />
            <span>Plot Twist</span>
          </button>
        </div>
      </div>

      {/* Continue Story Form */}
      {showContinueForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-500" />
            Continue the Story
          </h3>
          <form onSubmit={handleContinueStory}>
            <textarea
              value={newContinuation.content}
              onChange={(e) => setNewContinuation({ ...newContinuation, content: e.target.value })}
              placeholder="Write the next part of the story..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 resize-none"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowContinueForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all font-medium"
              >
                Publish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plot Twist Form */}
      {showTwistForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-purple-500" />
            Add Plot Twist
          </h3>
          <form onSubmit={handleCreateTwist}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twist Idea
              </label>
              <input
                type="text"
                value={newTwist.twist_description}
                onChange={(e) => setNewTwist({ ...newTwist, twist_description: e.target.value })}
                placeholder="What's your plot twist idea?"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <textarea
              value={newTwist.content}
              onChange={(e) => setNewTwist({ ...newTwist, content: e.target.value })}
              placeholder="Write your plot twist content..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4 resize-none"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowTwistForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all font-medium"
              >
                Create with AI ✨
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
            Comments
          </h3>
          
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 resize-none text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all font-medium text-sm"
                >
                  Post
                </button>
              </div>
            </div>
          </form>
          
          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

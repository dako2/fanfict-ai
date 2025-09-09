import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Plus, Zap, GitBranch } from 'lucide-react'

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/stories')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Stories</span>
        </button>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{story.title}</h1>
          <p className="text-gray-600 mb-4">{story.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="capitalize">{story.genre}</span>
            <span>•</span>
            <span>Created {new Date(story.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Current Node */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">By {currentNode.author}</span>
            {currentNode.is_ai_generated && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">AI Generated</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('like')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md ${
                userVote === 'like' ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{currentNode.likes}</span>
            </button>
            
            <button
              onClick={() => handleVote('dislike')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md ${
                userVote === 'dislike' ? 'bg-red-100 text-red-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{currentNode.dislikes}</span>
            </button>
          </div>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{currentNode.content}</p>
        </div>
      </div>

      {/* Navigation Options */}
      {children.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <GitBranch className="h-5 w-5 mr-2" />
            What happens next?
          </h3>
          <div className="space-y-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => navigate(`/stories/${storyId}/nodes/${child.id}`)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">By {child.author}</span>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {child.likes}
                    </span>
                    <span className="flex items-center">
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      {child.dislikes}
                    </span>
                  </div>
                </div>
                <p className="text-gray-900 line-clamp-2">{child.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowContinueForm(!showContinueForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Continue Story</span>
          </button>
          
          <button
            onClick={() => setShowTwistForm(!showTwistForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Zap className="h-4 w-4" />
            <span>Add Plot Twist</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comments ({comments.length})</span>
          </button>
        </div>
      </div>

      {/* Continue Story Form */}
      {showContinueForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue the Story</h3>
          <form onSubmit={handleContinueStory}>
            <textarea
              value={newContinuation.content}
              onChange={(e) => setNewContinuation({ ...newContinuation, content: e.target.value })}
              placeholder="Write the next part of the story..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowContinueForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Continuation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plot Twist Form */}
      {showTwistForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Plot Twist</h3>
          <form onSubmit={handleCreateTwist}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twist Description
              </label>
              <input
                type="text"
                value={newTwist.twist_description}
                onChange={(e) => setNewTwist({ ...newTwist, twist_description: e.target.value })}
                placeholder="Briefly describe your plot twist idea..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <textarea
              value={newTwist.content}
              onChange={(e) => setNewTwist({ ...newTwist, content: e.target.value })}
              placeholder="Write your plot twist content..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowTwistForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create AI Twist
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
          
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this scene..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Comment
            </button>
          </form>
          
          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{comment.author}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

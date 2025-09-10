import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSwipeable } from 'react-swipeable'
import { useAuth } from '../contexts/AuthContext'
import StoryTreeVisualization from './StoryTreeVisualization'

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
  parent_ids: string[]
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
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showComments] = useState(true)
  const [votes, setVotes] = useState({ likes: 0, dislikes: 0 })
  const [allStories, setAllStories] = useState<Story[]>([])
  const [swapping, setSwapping] = useState(false)
  
  const [newComment, setNewComment] = useState('')
  const [cachedNodes, setCachedNodes] = useState<Map<string, StoryNode>>(new Map())
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false)
  const [showStoryMap, setShowStoryMap] = useState(false)
  const { user } = useAuth()
  const userId = user?.id || 'anonymous'

  useEffect(() => {
    if (storyId && !isKeyboardNavigation) {
      fetchStoryData()
    }
  }, [storyId, nodeId, isKeyboardNavigation])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handleSwapStory()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleContinueStory()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
        body: JSON.stringify({ content: newComment, author: user?.username || 'Anonymous' })
      })
      
      if (response.ok) {
        setNewComment('')
        fetchStoryData() // Refresh to show new comment
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const fetchAllStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories`)
      if (response.ok) {
        const stories = await response.json()
        setAllStories(stories.filter((s: Story) => s.id !== storyId))
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err)
    }
  }

  const handleSwapStory = async () => {
    if (allStories.length === 0) {
      await fetchAllStories()
    }
    
    if (allStories.length > 0) {
      setSwapping(true)
      const randomStory = allStories[Math.floor(Math.random() * allStories.length)]
      navigate(`/stories/${randomStory.id}`)
    }
  }


  const handleContinueStory = async () => {
    if (!currentNode) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/nodes/${currentNode.id}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: "The story continues with an unexpected turn...",
          is_ai_generated: true
        })
      })
      
      if (response.ok) {
        const newNode = await response.json()
        navigate(`/stories/${storyId}/nodes/${newNode.id}`)
      }
    } catch (err) {
      console.error('Failed to continue story:', err)
    }
  }

  const updateNodeCache = useCallback((nodes: StoryNode[]) => {
    const nodeMap = new Map<string, StoryNode>()
    nodes.forEach(node => {
      nodeMap.set(node.id, node)
    })
    setCachedNodes(nodeMap)
  }, [])

  const handleKeyboardNodeSelect = useCallback((nodeId: string) => {
    const cachedNode = cachedNodes.get(nodeId)
    if (cachedNode) {
      setIsKeyboardNavigation(true)
      setCurrentNode(cachedNode)
      setVotes({
        likes: cachedNode.likes || Math.floor(Math.random() * 50) + 10,
        dislikes: cachedNode.dislikes || Math.floor(Math.random() * 10) + 1
      })
      
      fetchCommentsForNode(nodeId)
      
      window.history.replaceState(null, '', `/stories/${storyId}/nodes/${nodeId}`)
      setIsKeyboardNavigation(false)
    }
  }, [cachedNodes, storyId])

  const fetchCommentsForNode = async (nodeId: string) => {
    try {
      const commentsResponse = await fetch(`${API_BASE_URL}/api/nodes/${nodeId}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    }
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleContinueStory(),
    onSwipedRight: () => handleSwapStory(),
    onSwipedUp: () => {
      const currentIdx = cachedNodes.size > 0 ? 
        Array.from(cachedNodes.keys()).indexOf(currentNode?.id || '') : -1
      if (currentIdx > 0) {
        const prevNodeId = Array.from(cachedNodes.keys())[currentIdx - 1]
        handleKeyboardNodeSelect(prevNodeId)
      }
    },
    onSwipedDown: () => {
      const currentIdx = cachedNodes.size > 0 ? 
        Array.from(cachedNodes.keys()).indexOf(currentNode?.id || '') : -1
      const nodeIds = Array.from(cachedNodes.keys())
      if (currentIdx >= 0 && currentIdx < nodeIds.length - 1) {
        const nextNodeId = nodeIds[currentIdx + 1]
        handleKeyboardNodeSelect(nextNodeId)
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  })

  if (loading) {
    return (
      <div className="flex items-center h-64 px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('storyReader.loading')}</span>
      </div>
    )
  }

  if (error || !story || !currentNode) {
    return (
      <div className="py-12">
        <p className="text-red-600 mb-4 text-left">{t('storyReader.error')}: {error || 'Story not found'}</p>
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
    <div {...swipeHandlers} className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/stories')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('storyReader.backToStories')}</span>
        </button>
        
        <button
          onClick={() => setShowStoryMap(!showStoryMap)}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <span className="text-sm">🗺️</span>
          <span className="text-sm">{showStoryMap ? t('storyReader.hideMap') : t('storyReader.showMap')}</span>
        </button>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showStoryMap ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {/* Story Tree Visualization - Left Sidebar (Conditional) */}
        {showStoryMap && (
          <div className="lg:col-span-1 order-2 lg:order-1">
            <StoryTreeVisualization
              storyId={storyId!}
              currentNodeId={currentNode.id}
              onNodeSelect={(nodeId) => navigate(`/stories/${storyId}/nodes/${nodeId}`)}
              onKeyboardNodeSelect={handleKeyboardNodeSelect}
              onNodesLoaded={updateNodeCache}
              className="lg:sticky lg:top-8"
            />
          </div>
        )}

        {/* Story Content - Center (Mobile: Full Width, Desktop: Responsive Width) */}
        <div className={`space-y-8 order-1 ${showStoryMap ? 'lg:col-span-2 lg:order-2' : 'lg:col-span-2 lg:order-1'}`}>
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

              <h1 className="text-3xl font-light text-gray-900 mb-4 text-left">{story.title}</h1>
              <p className="text-gray-600 font-light mb-8 text-lg text-left">{story.description}</p>
              
              <div className="prose max-w-none mb-6">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-light text-lg text-left">
                  {currentNode.content}
                </div>
              </div>

              {/* Inline Story Navigation Buttons */}
              <div className="flex justify-center space-x-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSwapStory}
                  disabled={swapping}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium disabled:opacity-50"
                >
                  <span className="text-sm">👈</span>
                  <span>{t('storyReader.swapStory')}</span>
                </button>
                
                <button
                  onClick={handleContinueStory}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <span className="text-sm">👉</span>
                  <span>{t('storyReader.continueStory')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments - Right Side (Mobile: Full Width Below, Desktop: 1/4 Width) */}
        <div className="lg:col-span-1 order-3">
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
                  <div className="py-8">
                    <div className="text-4xl font-light text-gray-300 mb-3">💬</div>
                    <p className="text-gray-500 font-light text-sm text-left">{t('storyReader.noComments')}</p>
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

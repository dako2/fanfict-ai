import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, MessageCircle, BookOpen, Edit3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface UserProfile {
  id: string
  username: string
  email: string
  bio: string
  profile_picture?: string
  created_at: string
  stories_count: number
  comments_count: number
}

interface UserStory {
  id: string
  title: string
  description: string
  genre: string
  created_at: string
  likes: number
  nodes_count: number
}

interface UserComment {
  id: string
  content: string
  created_at: string
  story_title: string
  story_id: string
  node_id: string
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000'

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [userComments, setUserComments] = useState<UserComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'stories' | 'comments'>('stories')

  const isOwnProfile = currentUser?.id === userId

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchUserStories()
      fetchUserComments()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`)
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      } else {
        setError(t('profile.userNotFound'))
      }
    } catch (err) {
      setError(t('profile.loadError'))
    }
  }

  const fetchUserStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/stories`)
      if (response.ok) {
        const stories = await response.json()
        setUserStories(stories)
      }
    } catch (err) {
      console.error('Failed to fetch user stories:', err)
    }
  }

  const fetchUserComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/comments`)
      if (response.ok) {
        const comments = await response.json()
        setUserComments(comments)
      }
    } catch (err) {
      console.error('Failed to fetch user comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">{t('profile.notFound')}</h2>
          <p className="text-gray-600 mb-6">{error || t('profile.userNotFound')}</p>
          <button
            onClick={() => navigate('/stories')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('nav.stories')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('common.back')}
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600">
                    {getInitials(profile.username)}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-light text-gray-900">{profile.username}</h1>
                {isOwnProfile && (
                  <button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit3 className="h-4 w-4 mr-2" />
                    {t('profile.editProfile')}
                  </button>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-600 mb-4 leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('profile.joinedOn')} {formatDate(profile.created_at)}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-light text-gray-900">{profile.stories_count}</div>
                  <div className="text-sm text-gray-500">{t('profile.stories')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-gray-900">{profile.comments_count}</div>
                  <div className="text-sm text-gray-500">{t('profile.comments')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('stories')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'stories'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-2" />
                {t('profile.stories')} ({userStories.length})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-5 w-5 inline mr-2" />
                {t('profile.comments')} ({userComments.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'stories' && (
              <div className="space-y-4">
                {userStories.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isOwnProfile ? t('profile.noStoriesOwn') : t('profile.noStories')}
                    </p>
                  </div>
                ) : (
                  userStories.map((story) => (
                    <div
                      key={story.id}
                      onClick={() => navigate(`/stories/${story.id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{story.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{story.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">{story.genre}</span>
                            <span>{formatDate(story.created_at)}</span>
                            <span>❤️ {story.likes}</span>
                            <span>{story.nodes_count} {t('profile.nodes')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {userComments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isOwnProfile ? t('profile.noCommentsOwn') : t('profile.noComments')}
                    </p>
                  </div>
                ) : (
                  userComments.map((comment) => (
                    <div
                      key={comment.id}
                      onClick={() => navigate(`/stories/${comment.story_id}/nodes/${comment.node_id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">{t('profile.commentOn')} </span>
                        <span className="font-medium text-gray-900">{comment.story_title}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      <div className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

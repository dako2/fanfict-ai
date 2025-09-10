import './i18n'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { StoryList } from './components/StoryList'
import { StoryReader } from './components/StoryReader'
import { CreateStory } from './components/CreateStory'
import { About } from './components/About'
import { Navigation } from './components/Navigation'
import UserProfile from './components/UserProfile'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/stories" replace />} />
              <Route path="/stories" element={<StoryList />} />
              <Route path="/stories/create" element={<CreateStory />} />
              <Route path="/stories/:storyId" element={<StoryReader />} />
              <Route path="/stories/:storyId/nodes/:nodeId" element={<StoryReader />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

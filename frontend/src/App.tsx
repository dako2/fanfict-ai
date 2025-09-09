import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { StoryList } from './components/StoryList'
import { StoryReader } from './components/StoryReader'
import { CreateStory } from './components/CreateStory'
import { Navigation } from './components/Navigation'
import './App.css'

function App() {
  return (
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
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

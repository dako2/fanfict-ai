import { Link } from 'react-router-dom'
import { Plus, Home } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/stories" className="text-2xl font-light text-gray-900">
            FanFiction
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link 
              to="/stories" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Stories</span>
            </Link>
            
            <Link 
              to="/stories/create" 
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">Create</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

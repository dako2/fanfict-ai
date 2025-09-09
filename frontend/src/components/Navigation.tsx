import { Link } from 'react-router-dom'
import { BookOpen, Plus, Home, Search, Heart, User } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/stories" className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <BookOpen className="h-7 w-7 text-purple-600" />
            <span>FanFiction</span>
          </Link>
          
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-64">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search stories..." 
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/stories" 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Home className="h-6 w-6 text-gray-700" />
            </Link>
            
            <Link 
              to="/stories/create" 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-700" />
            </Link>
            
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="h-6 w-6 text-gray-700" />
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

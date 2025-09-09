import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Home } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/stories" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <BookOpen className="h-6 w-6" />
            <span>FanFiction AI</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/stories" 
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <Home className="h-4 w-4" />
              <span>Stories</span>
            </Link>
            
            <Link 
              to="/stories/create" 
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Story</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

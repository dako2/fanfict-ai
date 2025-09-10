import { Link } from 'react-router-dom'
import { Plus, Home, Globe, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Navigation() {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/stories" className="text-2xl font-light text-gray-900">
            {t('nav.title')}
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link 
              to="/stories" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">{t('nav.stories')}</span>
            </Link>
            
            <Link 
              to="/about" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Info className="h-5 w-5" />
              <span className="font-medium">{t('nav.about')}</span>
            </Link>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Globe className="h-5 w-5" />
              <span className="font-medium">{i18n.language === 'en' ? '中文' : 'EN'}</span>
            </button>
            
            <Link 
              to="/stories/create" 
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">{t('nav.create')}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

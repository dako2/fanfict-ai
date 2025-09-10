import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function About() {
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link
          to="/stories"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('about.backToStories')}</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2 text-left">{t('about.title')}</h1>
          <p className="text-gray-600 font-light mb-8 text-left">{t('about.subtitle')}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4 text-left">{t('about.rulesTitle')}</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 text-left">
                    {t('about.rule1Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed text-left">
                    {t('about.rule1Description')}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 text-left">
                    {t('about.rule2Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed text-left">
                    {t('about.rule2Description')}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 text-left">
                    {t('about.rule3Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed text-left">
                    {t('about.rule3Description')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">{t('about.howToUseTitle')}</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.step1Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    {t('about.step1Description')}
                  </p>
                </div>

                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.step2Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    {t('about.step2Description')}
                  </p>
                </div>

                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.step3Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    {t('about.step3Description')}
                  </p>
                </div>

                <div className="border-l-4 border-gray-200 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.step4Title')}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    {t('about.step4Description')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">{t('about.featuresTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.feature1Title')}
                  </h3>
                  <p className="text-gray-600 font-light">
                    {t('about.feature1Description')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.feature2Title')}
                  </h3>
                  <p className="text-gray-600 font-light">
                    {t('about.feature2Description')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.feature3Title')}
                  </h3>
                  <p className="text-gray-600 font-light">
                    {t('about.feature3Description')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('about.feature4Title')}
                  </h3>
                  <p className="text-gray-600 font-light">
                    {t('about.feature4Description')}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-light text-gray-900 mb-4">{t('about.communityTitle')}</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                {t('about.communityDescription')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/stories/create"
                  className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
                >
                  {t('about.startWriting')}
                </Link>
                <Link
                  to="/stories"
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('about.exploreStories')}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

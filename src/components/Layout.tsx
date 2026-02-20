import { Link, Outlet, useLocation } from 'react-router-dom';
import { Plane, Settings, Gauge, Sun, Moon, Map } from 'lucide-react';
import cessnaBanner from '../resources/cessna_wallpaper.jpg';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import BuildVersion from './BuildVersion';

export default function Layout() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col bg-aviation-gray dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <header className="bg-aviation-blue text-white shadow-md relative overflow-hidden border-b border-white/10">
                {/* Banner Image Overlay */}
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 bg-blue-900">
                    <img src={cessnaBanner} alt="Cessna Banner" className="w-full h-full object-cover object-center grayscale-[0.3] dark:grayscale" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-48 md:h-56 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                            <Plane className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md flex items-baseline gap-3">
                                <span>{t('appTitle')}</span>
                                <BuildVersion className="hidden sm:block mt-1" />
                            </h1>
                            <p className="text-xs text-blue-100 font-medium tracking-wide">{t('appSubtitle')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Desktop Nav */}
                        <nav className="hidden md:flex gap-2">
                            <Link to="/calculator" className={`px-4 py-2 rounded-md text-sm font-semibold backdrop-blur-md border border-white/30 flex items-center gap-2 transition-all ${location.pathname === '/calculator' ? 'bg-white text-aviation-blue shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                <Gauge className="h-4 w-4" /> {t('nav.wb')}
                            </Link>
                            <Link to="/navigation" className={`px-4 py-2 rounded-md text-sm font-semibold backdrop-blur-md border border-white/30 flex items-center gap-2 transition-all ${location.pathname === '/navigation' ? 'bg-white text-aviation-blue shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                <Map className="h-4 w-4" /> {t('nav.navPlanner')}
                            </Link>
                            <Link to="/config" className={`px-4 py-2 rounded-md text-sm font-semibold backdrop-blur-md border border-white/30 flex items-center gap-2 transition-all ${location.pathname === '/config' ? 'bg-white text-aviation-blue shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                <Settings className="h-4 w-4" /> {t('nav.config')}
                            </Link>
                        </nav>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 transition-all group active:scale-95"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? (
                                <Moon className="h-5 w-5 text-white group-hover:rotate-12 transition-transform" />
                            ) : (
                                <Sun className="h-5 w-5 text-yellow-300 group-hover:rotate-90 transition-transform" />
                            )}
                        </button>

                        {/* Language Switcher */}
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full text-gray-900 dark:text-gray-100">
                <Outlet />
            </main>

            {/* Mobile Nav (Bottom Bar) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around pb-safe z-[100] transition-colors">
                <Link to="/calculator" className={`flex-1 flex flex-col items-center justify-center py-3 ${location.pathname === '/calculator' ? 'text-aviation-blue dark:text-blue-400 font-bold' : 'text-gray-500'}`}>
                    <Gauge className="h-5 w-5" />
                    <span className="text-[10px] mt-1 uppercase font-bold tracking-tighter text-gray-400">{t('nav.wb')}</span>
                </Link>
                <Link to="/navigation" className={`flex-1 flex flex-col items-center justify-center py-3 ${location.pathname === '/navigation' ? 'text-aviation-blue dark:text-blue-400 font-bold' : 'text-gray-500'}`}>
                    <Map className="h-5 w-5" />
                    <span className="text-[10px] mt-1 uppercase font-bold tracking-tighter text-gray-400">{t('nav.navPlanner')}</span>
                </Link>
                <Link to="/config" className={`flex-1 flex flex-col items-center justify-center py-3 ${location.pathname === '/config' ? 'text-aviation-blue dark:text-blue-400 font-bold' : 'text-gray-500'}`}>
                    <Settings className="h-5 w-5" />
                    <span className="text-[10px] mt-1 uppercase font-bold tracking-tighter text-gray-400">{t('nav.config')}</span>
                </Link>
            </nav>
        </div>
    );
}

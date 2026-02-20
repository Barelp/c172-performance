import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import WBCalculator from './components/WBCalculator';
import Config from './pages/Config';
import NavigationPlanner from './pages/NavigationPlanner';
import { ThemeContext } from './context/ThemeContext';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/calculator" replace />} />
            <Route path="calculator" element={<WBCalculator />} />
            <Route path="navigation" element={<NavigationPlanner />} />
            <Route path="config" element={<Config />} />
            <Route path="checklist" element={<div className="p-4 bg-white dark:bg-gray-800 rounded shadow transition-colors">Checklist Logic Here</div>} />
            <Route path="*" element={<Navigate to="/calculator" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Analytics />
    </ThemeContext.Provider>
  );
}

export default App;

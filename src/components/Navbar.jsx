import { Link, NavLink } from 'react-router-dom';
import { useLang } from '../i18n';
import LanguageSelector from './LanguageSelector';
import { useEffect, useState } from 'react';

// Theme toggle logic: persist theme in localStorage and set data-theme attribute
function useThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('isl_ui_theme');
      if (stored) return stored;
    } catch {}
    // default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('isl_ui_theme', theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  return { theme, toggle };
}


export default function Navbar() {
  const { t } = useLang();
  const { theme, toggle } = useThemeToggle();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="SignBridge home">
          <span className="brand-mark" aria-hidden="true">🤟</span>
          <span>SignBridge <small>{t('brand_sub')}</small></span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>{t('nav_home')}</NavLink>
          <NavLink to="/sign-to-text">{t('nav_s2t')}</NavLink>
          <NavLink to="/text-to-sign">{t('nav_t2s')}</NavLink>
          <NavLink to="/about">{t('nav_about')}</NavLink>
        </nav>
        <LanguageSelector />
        {/* Theme toggle button */}
        <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

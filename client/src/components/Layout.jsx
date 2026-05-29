import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

const roleIcons = { elder: '👴', caretaker: '🧑‍⚕️', doctor: '👨‍⚕️', admin: '⚙️', family: '👨‍👩‍👧' };

export default function Layout({
  children,
  title,
  sidebarItems = [],
  activeSection,
  onSectionChange,
  sidebarExtra,
  subtitle,
}) {
  const { t, toggleLang, lang } = useI18n();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const hasSidebar = sidebarItems.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      {hasSidebar && (
        <>
          {mobileOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          )}
          <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-brand">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                EC
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">{t('appName')}</p>
                <p className="text-emerald-300/70 text-xs">{roleIcons[user?.role]} {user && t(user.role)}</p>
              </div>
            </div>

            <nav className="sidebar-nav">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSectionChange(item.id); setMobileOpen(false); }}
                  className={`sidebar-link ${activeSection === item.id ? 'sidebar-link-active' : ''}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {sidebarExtra && (
              <div className="sidebar-extra">{sidebarExtra}</div>
            )}

            <div className="sidebar-footer">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-emerald-300/60 text-xs truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={toggleLang} className="sidebar-footer-btn flex-1">
                  {lang === 'en' ? '🇮🇳 TA' : '🇬🇧 EN'}
                </button>
                <button onClick={logout} className="sidebar-footer-btn flex-1 text-red-300 hover:text-red-200">
                  {t('logout')}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="topbar">
          <div className="flex items-center gap-3">
            {hasSidebar && (
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(true)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-800">{title || t('appName')}</h1>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>

          {!hasSidebar && user && (
            <div className="flex items-center gap-2">
              <button onClick={toggleLang} className="px-3 py-1.5 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">
                {lang === 'en' ? '🇮🇳 TA' : '🇬🇧 EN'}
              </button>
              <button onClick={logout} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                {t('logout')}
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

import { Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">English Learning Platform</span>
          <span className="text-sm text-slate-500">App shell</span>
        </div>
      </header>
      <div className="flex">
        <aside className="hidden w-64 border-r bg-white p-4 text-sm text-slate-500 lg:block">
          Sidebar placeholder
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

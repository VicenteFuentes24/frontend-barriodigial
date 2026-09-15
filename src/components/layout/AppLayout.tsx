import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="app-main">
        <Header onOpenMenu={() => setIsSidebarOpen(true)} />
        <main className="content-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Desktop/tablet sidebar */}
      <Sidebar />
      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </main>
      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}

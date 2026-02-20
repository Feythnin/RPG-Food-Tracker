import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⚔️' },
  { to: '/food', label: 'Food Log', icon: '🍖' },
  { to: '/water', label: 'Water', icon: '💧' },
  { to: '/shop', label: 'Shop', icon: '🏪' },
  { to: '/inventory', label: 'Inventory', icon: '🎒' },
  { to: '/nutrition', label: 'Nutrition', icon: '📊' },
  { to: '/dungeon', label: 'Dungeon', icon: '🏰' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-bg-secondary border-r border-accent-gold/20 p-4">
      <h1 className="text-accent-gold font-bold text-xl mb-6 text-center">Quest Fuel</h1>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-bg-hover text-accent-gold'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

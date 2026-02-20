import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '⚔️' },
  { to: '/food', label: 'Food', icon: '🍖' },
  { to: '/water', label: 'Water', icon: '💧' },
  { to: '/shop', label: 'Shop', icon: '🏪' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-accent-gold/20 flex justify-around py-2 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs px-2 py-1 ${
              isActive ? 'text-accent-gold' : 'text-text-muted'
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

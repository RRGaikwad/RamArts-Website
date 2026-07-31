import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLogout } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/updates', label: 'Updates' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout.mutateAsync();
    toast.info('Signed out');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-paper-sunken lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-paper-raised lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="font-display text-lg font-bold">
              Ram<span className="text-brand">Arts</span>
            </p>
            <p className="text-caption text-ink-muted">Admin</p>
          </div>
          <button type="button" className="btn-ghost text-sm lg:mt-6 lg:px-0" onClick={handleLogout}>
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-6" aria-label="Admin">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-muted text-brand' : 'text-ink-muted hover:bg-paper-sunken hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a href="/" className="mt-auto whitespace-nowrap rounded-sm px-3 py-2 text-sm text-ink-muted hover:text-ink lg:mt-8">
            ← View site
          </a>
        </nav>
      </aside>
      <main className="p-5 sm:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}

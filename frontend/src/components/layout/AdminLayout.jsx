import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, LogOut, ChevronLeft } from 'lucide-react';
import { useLogout } from '../../hooks/useAuth';
import '../../styles/pages/Admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__sidebar-header">
          <button className="admin__back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
            <span>Back to Store</span>
          </button>
        </div>

        <nav className="admin__nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin__nav-link ${isActive ? 'admin__nav-link--active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin__nav-link ${isActive ? 'admin__nav-link--active' : ''}`}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) => `admin__nav-link ${isActive ? 'admin__nav-link--active' : ''}`}
          >
            <Package size={18} />
            <span>Products</span>
          </NavLink>
        </nav>

        <div className="admin__sidebar-footer">
          <button className="admin__nav-link" onClick={() => logoutMutation.mutate()}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin__content">
        <Outlet />
      </main>
    </div>
  );
}

import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, User, Menu, X, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useLogout } from '../../hooks/useAuth';

export default function Header() {
  const { isAuthenticated, user } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const logoutMutation = useLogout();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner container">
        {/* Logo */}
        <Link to="/" className="header__logo">
          <Package className="header__logo-icon" size={24} />
          <span className="header__logo-text">ShopVault</span>
        </Link>

        {/* Nav Links — Desktop */}
        <nav className="header__nav">
          <Link
            to="/products"
            className={`header__link ${isActive('/products') ? 'header__link--active' : ''}`}
          >
            Products
          </Link>
          {isAuthenticated && (
            <Link
              to="/cart"
              className={`header__link ${isActive('/cart') ? 'header__link--active' : ''}`}
            >
              Cart
            </Link>
          )}
        </nav>

        {/* Actions — Desktop */}
        <div className="header__actions">
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="header__cart-btn" aria-label="Shopping cart">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="header__cart-badge">{itemCount > 99 ? '99+' : itemCount}</span>
                )}
              </Link>

              <div className="header__user-menu">
                <button className="header__user-btn">
                  <User size={18} />
                  <span className="header__user-name">{user?.name?.split(' ')[0]}</span>
                </button>
                <div className="header__dropdown">
                  <button
                    className="header__dropdown-item header__dropdown-item--danger"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="header__auth-links">
              <Link to="/login" className="header__link header__link--auth">
                Sign In
              </Link>
              <Link to="/register" className="header__cta-btn">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="header__menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`header__mobile-menu ${menuOpen ? 'header__mobile-menu--open' : ''}`}>
        <nav className="header__mobile-nav">
          <Link to="/products" className="header__mobile-link">
            Products
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="header__mobile-link">
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
              <button
                className="header__mobile-link header__mobile-link--danger"
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header__mobile-link">
                Sign In
              </Link>
              <Link to="/register" className="header__mobile-link header__mobile-link--accent">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

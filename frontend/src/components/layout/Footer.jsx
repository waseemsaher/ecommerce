import './Footer.css';
import { Package, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <Package size={20} />
            <span>ShopVault</span>
          </Link>
          <p className="footer__tagline">
            Premium e-commerce experience built with modern technology.
          </p>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <h4 className="footer__col-title">Shop</h4>
            <Link to="/products" className="footer__link">All Products</Link>
            <Link to="/cart" className="footer__link">Shopping Cart</Link>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Account</h4>
            <Link to="/login" className="footer__link">Sign In</Link>
            <Link to="/register" className="footer__link">Register</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {new Date().getFullYear()} ShopVault. Made with{' '}
            <Heart size={14} className="footer__heart" /> and great code.
          </p>
        </div>
      </div>
    </footer>
  );
}

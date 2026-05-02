import '../styles/pages/NotFound.css';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page Not Found');
  return (
    <div className="not-found page-enter glow-bg">
      <div className="not-found__inner">
        <span className="not-found__code">404</span>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found__actions">
          <Link to="/">
            <Button icon={Home} size="lg">Go Home</Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary" icon={ArrowLeft} size="lg">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

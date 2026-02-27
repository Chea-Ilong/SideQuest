import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔭</div>
        <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="text-slate-500">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

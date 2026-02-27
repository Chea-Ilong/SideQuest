import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="relative">
          <div className="text-8xl">🔭</div>
          <div className="absolute -top-2 -right-2 text-4xl animate-bounce">✨</div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">404</h1>
          <p className="text-xl font-semibold text-slate-700">Page not found</p>
          <p className="text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <Link to="/">
          <Button variant="gradient" size="lg">
            ← Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

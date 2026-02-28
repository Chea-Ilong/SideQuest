import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';

export function NotFound() {
  return (
    <div className="min-h-[80vh] pixel-grid-bg flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="font-[Press_Start_2P,monospace] text-6xl text-[#ff2244]" style={{ textShadow: '4px 4px 0 #000000' }}>
          404
        </div>
        <div className="space-y-2">
          <p className="font-[Press_Start_2P,monospace] text-sm text-[#f0f0f0]" style={{ textShadow: '2px 2px 0 #000000' }}>
            PAGE NOT FOUND
          </p>
          <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/">
          <Button variant="gradient" size="lg">
            ◀ Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header.js';
import { Landing } from './pages/Landing.js';
import { ScanSetup } from './pages/ScanSetup.js';
import { ScanProgress } from './pages/ScanProgress.js';
import { ScanResults } from './pages/ScanResults.js';
import { ScanHistory } from './pages/ScanHistory.js';
import { NotFound } from './pages/NotFound.js';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/scans" element={<ScanHistory />} />
            <Route path="/scan/new" element={<ScanSetup />} />
            <Route path="/scan/:id/progress" element={<ScanProgress />} />
            <Route path="/scan/:id/results" element={<ScanResults />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

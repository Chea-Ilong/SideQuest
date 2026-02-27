import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireShareToken } from '../middleware/shareToken.js';
import { createScan, getScan, getScanStatus, deleteScan } from '../controllers/scanController.js';
import { addSource } from '../controllers/sourceController.js';
import { triggerAnalysis } from '../controllers/analysisController.js';

const router = Router();

// Create scan (no auth required)
router.post('/', createScan);

// All routes below require share_token
router.get('/:id', requireShareToken, getScan);
router.delete('/:id', requireShareToken, deleteScan);
router.get('/:id/status', requireShareToken, getScanStatus);
router.post('/:id/run', requireShareToken, triggerAnalysis);

// Add sources (github/manual via JSON, resume via multipart)
router.post(
  '/:id/sources',
  requireShareToken,
  upload.single('resume'),
  addSource
);

export default router;

import { Router } from 'express';
import { requireShareToken } from '../middleware/shareToken.js';
import {
  getSkillsView,
  getEvidenceView,
  getSkillEvidenceView,
  getMapView,
  getClustersView,
  getGapsView,
  getTimelineView,
  getRoadmapView,
  overrideNormalization,
} from '../controllers/viewController.js';
import { getTargetRoles } from '../services/gapService.js';

const router = Router();

// Public: target roles reference data
router.get('/target-roles', async (_req, res, next) => {
  try {
    const roles = await getTargetRoles();
    res.json({ data: roles });
  } catch (err) {
    next(err);
  }
});

// Protected: per-scan views
router.get('/:id/views/skills', requireShareToken, getSkillsView);
router.get('/:id/views/evidence', requireShareToken, getEvidenceView);
router.get('/:id/views/evidence/:escoUri(*)', requireShareToken, getSkillEvidenceView);
router.get('/:id/views/map', requireShareToken, getMapView);
router.get('/:id/views/clusters', requireShareToken, getClustersView);
router.get('/:id/views/gaps', requireShareToken, getGapsView);
router.get('/:id/views/timeline', requireShareToken, getTimelineView);
router.get('/:id/views/roadmap', requireShareToken, getRoadmapView);

// Normalization override
router.put('/:id/skills/:mentionId/normalize', requireShareToken, overrideNormalization);

export default router;

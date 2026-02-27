import { Router } from 'express';
import scanRoutes from './scanRoutes.js';
import viewRoutes from './viewRoutes.js';

const router = Router();

router.use('/scans', scanRoutes);
router.use('/scans', viewRoutes);

export default router;

import { Router } from 'express';
import { getTrialEligibility } from '../controllers/trial.controller.js';

const router = Router();

// GET /api/trials/eligibility?email=...
router.get('/trials/eligibility', getTrialEligibility);

export default router;

import { Router } from 'express';
import {
  getPlansHandler,
  createIntentHandler,
} from '../controllers/subscription.controller.js';

const router = Router();

router.get('/subscriptions/plans', getPlansHandler);
router.post('/subscriptions/intent', createIntentHandler);

export default router;

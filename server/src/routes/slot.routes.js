import { Router } from 'express';
import { getSlots } from '../controllers/slot.controller.js';

const router = Router();

// GET /api/slots
router.get('/slots', getSlots);

export default router;

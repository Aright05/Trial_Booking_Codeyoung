import { Router } from 'express';
import healthRoutes from './health.routes.js';
import mentorRoutes from './mentor.routes.js';
import slotRoutes from './slot.routes.js';
import bookingRoutes from './booking.routes.js';
import adminRoutes from './admin.routes.js';
import trialRoutes from './trial.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = Router();

// Mount all API routes
router.use('/', healthRoutes);
router.use('/', mentorRoutes);
router.use('/', slotRoutes);
router.use('/', bookingRoutes);
router.use('/', adminRoutes);
router.use('/', trialRoutes);
router.use('/', subscriptionRoutes);

export default router;



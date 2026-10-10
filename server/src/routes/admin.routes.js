import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  getStatsHandler,
  getBookingsHandler,
  getMentorsHandler,
  cancelBookingHandler,
  retryNotificationHandler,
} from '../controllers/admin.controller.js';

const router = Router();

// Protect all admin routes with authentication middleware
router.use('/admin', adminAuth);

router.get('/admin/stats', getStatsHandler);
router.get('/admin/bookings', getBookingsHandler);
router.get('/admin/mentors', getMentorsHandler);
router.post('/admin/bookings/:id/cancel', cancelBookingHandler);
router.patch('/admin/bookings/:id/cancel', cancelBookingHandler);
router.post('/admin/bookings/:id/retry-notification', retryNotificationHandler);

export default router;

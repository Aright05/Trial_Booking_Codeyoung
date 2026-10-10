import { Router } from 'express';
import { postBooking, getBooking } from '../controllers/booking.controller.js';

const router = Router();

// POST /api/bookings
router.post('/bookings', postBooking);

// GET /api/bookings/:id
router.get('/bookings/:id', getBooking);

export default router;

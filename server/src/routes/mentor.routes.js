import { Router } from 'express';
import { getActiveMentors } from '../controllers/mentor.controller.js';
import { getMySchedule } from '../controllers/mentorSchedule.controller.js';
import { authenticateMentor } from '../middleware/mentorAuth.js';

const router = Router();

// GET /api/mentors (List active mentors)
router.get('/mentors', getActiveMentors);

// GET /api/mentor/me/schedule (Mentor's private assigned schedule)
router.get('/mentor/me/schedule', authenticateMentor, getMySchedule);

export default router;


import {
  getSubscriptionPlans,
  createSubscriptionIntent,
} from '../services/subscription.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/subscriptions/plans
 */
export const getPlansHandler = async (req, res, next) => {
  try {
    const plans = getSubscriptionPlans();
    return successResponse(res, plans, 'Subscription plans fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subscriptions/intent
 */
export const createIntentHandler = async (req, res, next) => {
  try {
    const { parentName, parentEmail, planId, phone, notes } = req.body;
    const subscription = await createSubscriptionIntent({
      parentName,
      parentEmail,
      planId,
      phone,
      notes,
    });
    return successResponse(res, subscription, 'Subscription intent created successfully (demo mode)', 201);
  } catch (error) {
    next(error);
  }
};

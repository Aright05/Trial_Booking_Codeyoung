import { checkFreeTrialEligibility } from '../services/trial.service.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Handle GET /api/trials/eligibility?email=...
 */
export const getTrialEligibility = async (req, res, next) => {
  try {
    const { email } = req.query;
    const result = await checkFreeTrialEligibility(email);

    return successResponse(
      res,
      result,
      result.eligible
        ? 'Email is eligible for 1 free trial class.'
        : 'A free trial has already been claimed for this email account.'
    );
  } catch (error) {
    next(error);
  }
};

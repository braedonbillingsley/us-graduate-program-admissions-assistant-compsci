import express from 'express';
import { validateProfile, validateMongoId } from '../middleware/validation.js';
import { 
    submitProfile, 
    getProfileMatches, 
    getProfileById,
    updateProfile 
} from '../controllers/profileController.js';

const router = express.Router();

// Profile routes
router.post('/profiles', validateProfile, submitProfile);
router.get('/profiles/:id', validateMongoId(), getProfileById);
router.put('/profiles/:id', validateMongoId(), validateProfile, updateProfile);
router.get('/profiles/:id/matches', validateMongoId(), getProfileMatches);

export default router;
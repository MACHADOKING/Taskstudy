import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
	getNotificationSettings,
	updateNotificationSettings,
	getProfile,
	connectGoogleAccount,
	updateProfilePhoto,
} from '../controllers/accountController';

const router = Router();

router.use(authMiddleware);

router.get('/notification-settings', getNotificationSettings);
router.put('/notification-settings', updateNotificationSettings);
router.get('/profile', getProfile);
router.post('/connect-google', connectGoogleAccount);
router.put('/profile-photo', updateProfilePhoto);

export default router;

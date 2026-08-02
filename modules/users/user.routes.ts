import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth.middleware';
import { UserController } from './user.controller';

const router = Router();
const controller = new UserController();

/* ── Authenticated user profile routes ─────────────────────── */
router.get('/profile/me',                        requireAuth,  controller.getMyProfile);
router.post('/profile/addresses',                requireAuth,  controller.saveAddress);
router.delete('/profile/addresses/:addressId',   requireAuth,  controller.deleteAddress);
router.patch('/profile/addresses/:addressId/default', requireAuth, controller.setDefaultAddress);

/* ── Admin-only user management routes ─────────────────────── */
router.post('/',        requireAdmin, controller.createUser);
router.get('/',         requireAdmin, controller.getUsers);
router.get('/:id',      requireAdmin, controller.getUserById);
router.put('/:id',      requireAdmin, controller.updateUser);
router.patch('/:id/block', requireAdmin, controller.blockUser);
router.delete('/:id',   requireAdmin, controller.deleteUser);

export default router;

import { Router } from 'express';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { UserController } from './user.controller';

const router = Router();
const controller = new UserController();

router.post(
  '/',
  requireAdmin,
  controller.createUser
);

router.get(
  '/',
  requireAdmin,
  controller.getUsers
);

router.get(
  '/:id',
  requireAdmin,
  controller.getUserById
);

router.put(
  '/:id',
  requireAdmin,
  controller.updateUser
);

router.patch(
  '/:id/block',
  requireAdmin,
  controller.blockUser
);

router.delete(
  '/:id',
  requireAdmin,
  controller.deleteUser
);

export default router;

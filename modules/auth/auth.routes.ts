import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const controller =
  new AuthController();

router.post(
  '/send-otp',
  controller.sendOtp
);

router.post(
  '/verify-otp',
  controller.verifyOtp
);

router.post(
  '/logout',
  controller.logout
);

export default router;

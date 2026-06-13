import { Router } from 'express';
import contactController from './contact.controller';

const router = Router();

router.post('/send', contactController.send.bind(contactController));

export default router;

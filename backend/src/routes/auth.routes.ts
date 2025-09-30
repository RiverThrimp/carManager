import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const controller = new AuthController();
export const authRouter = Router();

authRouter.post('/login', (...args) => controller.login(...args));
authRouter.post('/refresh', (...args) => controller.refreshToken(...args));

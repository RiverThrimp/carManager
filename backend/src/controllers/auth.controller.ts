import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';

export class AuthController {
  private readonly users = new UserService();

  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const user = await this.users.validateCredentials(username, password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { sub: user.id, role: user.role };
    const secret = process.env.JWT_SECRET ?? 'change-me';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' });

    return res.json({ token, refreshToken });
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const secret = process.env.JWT_SECRET ?? 'change-me';
    try {
      const payload = jwt.verify(refreshToken, secret) as jwt.JwtPayload;
      const token = jwt.sign({ sub: payload.sub, role: payload.role }, secret, { expiresIn: '1h' });
      return res.json({ token });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token', error });
    }
  }
}

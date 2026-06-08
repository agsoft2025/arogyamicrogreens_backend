import {
  Request,
  Response,
} from 'express';
import { UserService, UserError } from './user.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

const userService = new UserService();

export class UserController {
  async createUser(
    req: Request,
    res: Response
  ) {
    const user =
      await userService.createUser(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        'User created successfully',
      data: user,
    });
  }

  async getUsers(
    req: AuthRequest,
    res: Response
  ) {
    const data =
      await userService.getUsers(
        req.query,
        req.userId
      );

    return res.json({
      success: true,
      message:
        'Users fetched successfully',
      data,
    });
  }

  async getUserById(
    req: Request,
    res: Response
  ) {
    const user =
      await userService.getUserById(
        String(req.params.id)
      );

    return res.json({
      success: true,
      message:
        'User fetched successfully',
      data: user,
    });
  }

  async updateUser(
    req: Request,
    res: Response
  ) {
    const user =
      await userService.updateUser(
        String(req.params.id),
        req.body
      );

    return res.json({
      success: true,
      message:
        'User updated successfully',
      data: user,
    });
  }

  async blockUser(
    req: Request,
    res: Response
  ) {
    const user =
      await userService.blockUser(
        String(req.params.id)
      );

    return res.json({
      success: true,
      message:
        'User blocked successfully',
      data: user,
    });
  }

  async deleteUser(
    req: Request,
    res: Response
  ) {
    const user =
      await userService.deleteUser(
        String(req.params.id)
      );

    return res.json({
      success: true,
      message:
        'User deleted successfully',
      data: user,
    });
  }
}

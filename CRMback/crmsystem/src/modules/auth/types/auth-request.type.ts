import type { Request } from 'express';
import type { PublicUser } from '../../users/users.service';

export type AuthRequest = Request & {
  user: PublicUser;
};

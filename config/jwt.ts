import jwt from 'jsonwebtoken';

export const generateAccessToken = (
  userId: string
): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    {
      expiresIn: '15m' as any,
    }
  );
};
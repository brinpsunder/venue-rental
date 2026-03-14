import jwt from 'jsonwebtoken';

interface VerifyTokenResult {
  valid: boolean;
  userId: number;
  email: string;
  role: string;
}

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

class VerifyToken {
  execute(token: string): VerifyTokenResult {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      return { valid: true, userId: decoded.userId, email: decoded.email, role: decoded.role };
    } catch {
      return { valid: false, userId: 0, email: '', role: '' };
    }
  }
}

export default VerifyToken;

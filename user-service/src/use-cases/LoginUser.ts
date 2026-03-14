import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PublicUser } from '../domain/entities/User';
import IUserRepository from '../domain/repositories/IUserRepository';

interface LoginUserInput {
  email: string;
  password: string;
}

interface LoginUserResult {
  token: string;
  user: PublicUser;
}

class LoginUser {
  constructor(private userRepository: IUserRepository) {}

  async execute({ email, password }: LoginUserInput): Promise<LoginUserResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    return { token, user: user.toPublic() };
  }
}

export default LoginUser;

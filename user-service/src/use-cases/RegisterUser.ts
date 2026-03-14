import bcrypt from 'bcrypt';
import User, { UserRole } from '../domain/entities/User';
import IUserRepository from '../domain/repositories/IUserRepository';

interface RegisterUserInput {
  email: string;
  password: string;
  role?: UserRole;
}

class RegisterUser {
  constructor(private userRepository: IUserRepository) {}

  async execute({ email, password, role }: RegisterUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error('User already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      id: null,
      email,
      passwordHash,
      role: role ?? 'RENTER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.userRepository.save(user);
  }
}

export default RegisterUser;

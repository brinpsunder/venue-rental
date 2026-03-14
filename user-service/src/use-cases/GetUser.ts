import { PublicUser } from '../domain/entities/User';
import IUserRepository from '../domain/repositories/IUserRepository';

class GetUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: number): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User not found');
    return user.toPublic();
  }
}

export default GetUser;

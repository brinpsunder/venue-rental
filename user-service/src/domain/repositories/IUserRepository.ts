import User from '../entities/User';

abstract class IUserRepository {
  abstract findById(id: number): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;
  abstract update(user: User): Promise<User>;
}

export default IUserRepository;

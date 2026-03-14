export type UserRole = 'OWNER' | 'RENTER';

export interface UserProps {
  id: number | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: number | null;
  email: string;
  role: string;
  createdAt: Date;
}

class User {
  id: number | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  constructor({ id, email, passwordHash, role, createdAt, updatedAt }: UserProps) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toPublic(): PublicUser {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}

export default User;

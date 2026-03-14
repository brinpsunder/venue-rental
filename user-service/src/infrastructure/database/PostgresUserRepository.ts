import IUserRepository from '../../domain/repositories/IUserRepository';
import User from '../../domain/entities/User';
import pool from './db';
import { QueryResult } from 'pg';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: 'OWNER' | 'RENTER';
  created_at: Date;
  updated_at: Date;
}

class PostgresUserRepository extends IUserRepository {
  async findById(id: number): Promise<User | null> {
    const result: QueryResult<UserRow> = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    return this._toEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result: QueryResult<UserRow> = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) return null;
    return this._toEntity(result.rows[0]);
  }

  async save(user: User): Promise<User> {
    const result: QueryResult<UserRow> = await pool.query(
      `INSERT INTO users (email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt]
    );
    return this._toEntity(result.rows[0]);
  }

  async update(user: User): Promise<User> {
    const result: QueryResult<UserRow> = await pool.query(
      `UPDATE users SET email = $1, password_hash = $2, role = $3, updated_at = $4
       WHERE id = $5 RETURNING *`,
      [user.email, user.passwordHash, user.role, new Date(), user.id]
    );
    return this._toEntity(result.rows[0]);
  }

  private _toEntity(row: UserRow): User {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

export default PostgresUserRepository;

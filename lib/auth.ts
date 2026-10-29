import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'tinaye-hub-super-secret-production-key-change-in-env';
export const COOKIE_NAME = process.env.COOKIE_NAME || 'tinaye_session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  activeChildId?: string;
  firstName?: string;
  lastName?: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function generateToken(payload: SessionPayload, expiresIn: jwt.SignOptions['expiresIn'] = '14d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function assertParent(session: SessionPayload | null): asserts session is SessionPayload {
  if (!session || (session.role !== Role.PARENT && session.role !== Role.ADMIN)) {
    throw new Error('UNAUTHORIZED_PARENT_ACCESS_REQUIRED');
  }
}

export function assertChildOrParent(session: SessionPayload | null): asserts session is SessionPayload {
  if (!session) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }
}

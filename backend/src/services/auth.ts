import { db } from '../db';
import { users } from '../db/schema/users';

export async function findUserByEmail(email: string) {
  return null;
}

export async function createUser(data: { name: string; email: string; password: string }) {
  return null;
}

export async function verifyPassword(inputPassword: string, hashedPassword: string) {
  return false;
}

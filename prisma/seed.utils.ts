import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

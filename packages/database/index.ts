import 'server-only';
import { PrismaClient } from './generated/client';

export const database = new PrismaClient();

export * from './generated/client';
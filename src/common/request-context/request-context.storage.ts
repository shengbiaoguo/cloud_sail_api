import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  ip?: string;
  userAgent?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

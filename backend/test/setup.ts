// Polyfill for crypto.randomUUID in Node.js < 19
import { webcrypto } from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

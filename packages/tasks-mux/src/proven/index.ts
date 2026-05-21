export {
  generateKeyPair,
  saveTrustedPublicKey,
  savePrivateKey,
  loadTrustedPublicKeys,
  loadPrivateKey,
  rotateKey,
} from "./keys.js";

export type {
  KeyPairMetadata,
  PublicKeyRecord,
  PrivateKeyRecord,
} from "./keys.js";

export { signAnswer, signAnswerWithKeyRecord } from "./sign.js";
export { verifyAnswer } from "./verify.js";

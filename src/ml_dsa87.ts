import {
  cryptoSignKeypair,
  cryptoSignSignature,
  cryptoSignVerify,
  CryptoPublicKeyBytes,
  CryptoSecretKeyBytes,
  CryptoBytes,
} from "@theqrl/mldsa87";

export const ml_dsa87 = {
  keygen(seed: Uint8Array) {
    const pk = new Uint8Array(CryptoPublicKeyBytes);
    const sk = new Uint8Array(CryptoSecretKeyBytes);
    cryptoSignKeypair(seed, pk, sk);
    return { publicKey: pk, secretKey: sk };
  },
  sign(secretKey: Uint8Array, message: Uint8Array, ctx: Uint8Array) {
    const sig = new Uint8Array(CryptoBytes);
    cryptoSignSignature(sig, message, secretKey, false, ctx);
    return sig;
  },
  verify(
    publicKey: Uint8Array,
    message: Uint8Array,
    signature: Uint8Array,
    ctx: Uint8Array,
  ) {
    return cryptoSignVerify(signature, message, publicKey, ctx);
  },
};

import { crypto as cr } from "@noble/hashes/crypto";
import { concatBytes } from "./utils";

const crypto: any = { web: cr };

function validateOpt(key: Uint8Array, iv: Uint8Array, mode: string) {
  if (!mode.startsWith("aes-")) {
    throw new Error(`AES submodule doesn't support mode ${mode}`);
  }
  if (iv.length !== 12) {
    throw new Error("AES: wrong IV length");
  }
  if (mode.startsWith("aes-256") && key.length !== 32) {
    throw new Error("AES: wrong key length");
  }
}

async function getBrowserKey(
  mode: string,
  key: Uint8Array,
  iv: Uint8Array,
): Promise<[CryptoKey, AesGcmParams]> {
  if (!crypto.web) {
    throw new Error("Browser crypto not available.");
  }
  let keyMode: string | undefined;
  if (["aes-256-gcm"].includes(mode)) {
    keyMode = "gcm";
  }
  if (!keyMode) {
    throw new Error("AES: unsupported mode");
  }
  const wKey = await crypto.web.subtle.importKey(
    "raw",
    key,
    { name: `AES-${keyMode.toUpperCase()}`, length: key.length * 8 },
    true,
    ["encrypt", "decrypt"],
  );
  // TODO(rgeraldes24): missing fields
  // node.js uses whole 128 bit as a counter, without nonce, instead of 64 bit
  // recommended by NIST SP800-38A
  return [wKey, { name: `aes-${keyMode}`, iv }];
}

export async function encrypt(
  msg: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  mode = "aes-256-gcm",
  pkcs7PaddingEnabled = true,
): Promise<Uint8Array> {
  validateOpt(key, iv, mode);
  if (crypto.web) {
    const [wKey, wOpt] = await getBrowserKey(mode, key, iv);
    const cipher = await crypto.web.subtle.encrypt(wOpt, wKey, msg);
    let res = new Uint8Array(cipher);
    return res;
  } else if (crypto.node) {
    const cipher = crypto.node.createCipheriv(mode, key, iv);
    cipher.setAutoPadding(pkcs7PaddingEnabled);
    return concatBytes(cipher.update(msg), cipher.final());
  } else {
    throw new Error("The environment doesn't have AES module");
  }
}

export async function decrypt(
  cypherText: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  mode = "aes-256-gcm",
  pkcs7PaddingEnabled = true,
): Promise<Uint8Array> {
  validateOpt(key, iv, mode);
  if (crypto.web) {
    const [wKey, wOpt] = await getBrowserKey(mode, key, iv);
    const msg = await crypto.web.subtle.decrypt(wOpt, wKey, cypherText);
    const msgBytes = new Uint8Array(msg);
    return msgBytes;
  } else if (crypto.node) {
    const decipher = crypto.node.createDecipheriv(mode, key, iv);
    decipher.setAutoPadding(pkcs7PaddingEnabled);
    return concatBytes(decipher.update(cypherText), decipher.final());
  } else {
    throw new Error("The environment doesn't have AES module");
  }
}

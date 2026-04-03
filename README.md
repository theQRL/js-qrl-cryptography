# @theqrl/qrl-cryptography

All pure-js cryptographic primitives normally used when
developing Javascript / TypeScript applications and tools for QRL.

The cryptographic primitives included are:

* [Hashes: keccak-256](#hasheskeccak-256)
* [KDFs: Argon2id](#kdfs-argon2id)
* [CSPRNG (Cryptographically strong pseudorandom number generator)](#csprng-cryptographically-strong-pseudorandom-number-generator)
* [AES Encryption](#aes-encryption)
* [ML-DSA-87](#ml-dsa-87)

## Usage

Use NPM / Yarn in node.js / browser:

```bash
# NPM
npm install @theqrl/qrl-cryptography

# Yarn
yarn add @theqrl/qrl-cryptography
```

See [browser usage](#browser-usage) for information on using the package with major Javascript bundlers. It is
tested with **Webpack, Rollup and Parcel**.

This package has no single entry-point, but submodule for each cryptographic
primitive. Read each primitive's section of this document to learn how to use
them.

The reason for this is that importing everything from a single file will lead to
huge bundles when using this package for the web. This could be avoided through
tree-shaking, but the possibility of it not working properly on one of
[the supported bundlers](#browser-usage) is too high.

```js
// Hashes
const { keccak256 } = require("@theqrl/qrl-cryptography/keccak");

// KDFs
const { argon2idSync } = require("@theqrl/qrl-cryptography/argon2id");

// Random
const { getRandomBytesSync } = require("@theqrl/qrl-cryptography/random");

// AES encryption
const { encrypt } = require("@theqrl/qrl-cryptography/aes");

// ML-DSA-87
const { ml_dsa87 } = require("@theqrl/qrl-cryptography/ml_dsa87");

// utilities
const { hexToBytes, toHex, utf8ToBytes } = require("@theqrl/qrl-cryptography/utils");
```

## Hashes: keccak-256
```typescript
function keccak256(msg: Uint8Array): Uint8Array;
```

Exposes following cryptographic hash functions:

- keccak-256 variant of SHA3 (also `keccak224`, `keccak384`,
and `keccak512`)

```js
const { keccak256, keccak224, keccak384, keccak512 } = require("@theqrl/qrl-cryptography/keccak");

keccak256(Uint8Array.from([1, 2, 3]))

// Can be used with strings
const { utf8ToBytes } = require("@theqrl/qrl-cryptography/utils");
keccak256(utf8ToBytes("abc"))

// If you need hex
const { bytesToHex as toHex } = require("@theqrl/qrl-cryptography/utils");
toHex(keccak256(utf8ToBytes("abc")))
```

## KDFs: Argon2id

```ts
function argon2id(password: Uint8Array, salt: Uint8Array, t: number, m: number, p: number, dkLen: number, onProgress?: (progress: number) => void): Promise<Uint8Array>;
function argon2idSync(password: Uint8Array, salt: Uint8Array, t: number, m: number, p: number, dkLen: number, onProgress?: (progress: number) => void): Uint8Array;
```

The `argon2id` submodule has two functions implementing the Argon2id key
derivation algorithm in synchronous and asynchronous ways. This algorithm is
very slow, and using the synchronous version in the browser is not recommended,
as it will block its main thread and hang your UI.

```js
const { argon2id } = require("@theqrl/qrl-cryptography/argon2id");
const { utf8ToBytes } = require("@theqrl/qrl-cryptography/utils");
console.log(await argon2id(utf8ToBytes("password"), utf8ToBytes("salt"), 8, 262144, 1, 32));
```

## CSPRNG (Cryptographically strong pseudorandom number generator)

```ts
function getRandomBytes(bytes: number): Promise<Uint8Array>;
function getRandomBytesSync(bytes: number): Uint8Array;
```

The `random` submodule has functions to generate cryptographically strong
pseudo-random data in synchronous and asynchronous ways.

Backed by [`crypto.getRandomValues`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) in browser and by [`crypto.randomBytes`](https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback) in node.js. If backends are somehow not available, the module would throw an error and won't work, as keeping them working would be insecure.

```js
const { getRandomBytesSync } = require("@theqrl/qrl-cryptography/random");
console.log(getRandomBytesSync(32));
```

## AES Encryption

```ts
function encrypt(msg: Uint8Array, key: Uint8Array, iv: Uint8Array, mode = "aes-256-gcm", pkcs7PaddingEnabled = true): Promise<Uint8Array>;
function decrypt(cypherText: Uint8Array, key: Uint8Array, iv: Uint8Array, mode = "aes-256-gcm", pkcs7PaddingEnabled = true): Promise<Uint8Array>;
```

The `aes` submodule contains encryption and decryption functions implementing
the [Advanced Encryption Standard](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
algorithm.

### Encrypting with passwords

AES is not supposed to be used directly with a password. Doing that will
compromise your users' security.

The `key` parameters in this submodule are meant to be strong cryptographic
keys. If you want to obtain such a key from a password, please use a
[key derivation function](https://en.wikipedia.org/wiki/Key_derivation_function)
like [argon2id](#kdfs-argon2id).

### Operation modes

This submodule works with different [block cipher modes of operation](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation). If you are using this module in a new
application, we recommend using the default.

While this module may work with any mode supported by OpenSSL, we only test it
with `aes-256-gcm`. If you use another module a warning will be printed in the
 console.

We only recommend using `aes-256-gcm` to decrypt already encrypted data.

### Padding plaintext messages

Some operation modes require the plaintext message to be a multiple of `16`. If
that isn't the case, your message has to be padded.

By default, this module automatically pads your messages according to [PKCS#7](https://tools.ietf.org/html/rfc2315).
Note that this padding scheme always adds at least 1 byte of padding. If you
are unsure what anything of this means, we **strongly** recommend you to use
the defaults.

If you need to encrypt without padding or want to use another padding scheme,
you can disable PKCS#7 padding by passing `false` as the last argument and
handling padding yourself. Note that if you do this and your operation mode
requires padding, `encrypt` will throw if your plaintext message isn't a
multiple of `16`.

This option is only present to enable the decryption of already encrypted data.
To encrypt new data, we recommend using the default.

### How to use the IV parameter

The `iv` parameter of the `encrypt` function must be unique, or the security
of the encryption algorithm can be compromised.

You can generate a new `iv` using the `random` module.

Note that to decrypt a value, you have to provide the same `iv` used to encrypt
it.

### How to handle errors with this module

Sensitive information can be leaked via error messages when using this module.
To avoid this, you should make sure that the errors you return don't
contain the exact reason for the error. Instead, errors must report general
encryption/decryption failures.

Note that implementing this can mean catching all errors that can be thrown
when calling on of this module's functions, and just throwing a new generic
exception.

### Example usage

```js
const { encrypt } = require("@theqrl/qrl-cryptography/aes");
const { hexToBytes, utf8ToBytes } = require("@theqrl/qrl-cryptography/utils");

console.log(
  encrypt(
    utf8ToBytes("message"),
    hexToBytes("2b7e151628aed2a6abf7158809cf4f3c"),
    hexToBytes("f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff")
  )
);
```

## ML-DSA-87

```ts
function keygen(seed: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array };
function sign(secretKey: Uint8Array, message: Uint8Array, ctx: Uint8Array): Uint8Array;
function verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array, ctx: Uint8Array): boolean;
```

The `ml_dsa87` submodule provides the ML-DSA-87 (FIPS 204) post-quantum digital signature scheme, powered by [`@theqrl/mldsa87`](https://www.npmjs.com/package/@theqrl/mldsa87).

```js
const { ml_dsa87 } = require("@theqrl/qrl-cryptography/ml_dsa87");
const { utf8ToBytes } = require("@theqrl/qrl-cryptography/utils");

// Generate a key pair
const { publicKey, secretKey } = ml_dsa87.keygen(seed);

// Sign a message
const ctx = utf8ToBytes("context");
const msg = utf8ToBytes("hello");
const signature = ml_dsa87.sign(secretKey, msg, ctx);

// Verify a signature
const isValid = ml_dsa87.verify(publicKey, msg, signature, ctx);
```

## Browser usage

### Rollup setup

Using this library with Rollup requires the following plugins:

* [`@rollup/plugin-commonjs`](https://www.npmjs.com/package/@rollup/plugin-commonjs)
* [`@rollup/plugin-node-resolve`](https://www.npmjs.com/package/@rollup/plugin-node-resolve)

These can be used by setting your `plugins` array like this:

```js
  plugins: [
    commonjs(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
  ]
```

## License

`qrl-cryptography` is released under The MIT License (MIT)

Copyright (c) 2021 Patricio Palladino, Paul Miller, ethereum-cryptography contributors
Copyright (c) 2024 The QRL Contributors

See [LICENSE](./LICENSE) file.
# Zippie Vault API

Zippie Vault API is the main application interface into [Zippie Vault](https://github.com/zippiehq/vault)

Zippie Vault API provides a simple interface for interacting with Zippie Vault derived cryptographic keys allowing cryptographic signing and encryption of arbitrary data.

Currently the only cryptographic algorithm implemented is Eliptic Curve secp256k1 suitable for Bitcoin and Ethereum Wallets.

## Key Paths
Key paths are to be given in the following format of maximum 16bit integer numbers
m/99999/99999/...

Each key is derived from the given path in a hierarchial manner where the parent path is used to generate all children keys
eg.
m/0/1/2/3; Key 2 is generated by Key 1, which is generated by Key 0
m/0/5; Key 5 is also generated by Key 0 

## Dependencies
 - Node.js
 - NPM

## Install from npm repository
```bash
npm install @zippie/vault-api
```

## Building
```bash
npm install
```

## Run Tests
Mocha unit tests need to be run through a web browser

```bash
npm run test
```
## Example
API Usage examples are available in [example.js](./src/example.js) and can be run with the following command:

```bash
npm run example
```

## API

### Imports
```javascript
import vault from 'vault-api';
import { keyInfo, sign, encrypt, decrypt } from './secp256k1.js'
import * as shajs from 'sha.js';
```

### Init Vault
The init call is the entry point to the zippie vault, this call will check for an existing vault service worker and redirect the user to onboarding if required

```javascript
vault.init().then(
  result => {
    console.log("Init Result: " + result);
  },
  error => {
    console.log("Error: " + error);
  }
);
```

### Key Info
Get public key information for a particular vault path.
These will be particular to your dapp, and you can have as many as you like
eg. 'm/0', 'm/1', 'm/1/1' .etc
```javascript
keyInfo(vault, 'm/0')
  .then(result => {
    console.log("keyInfo: " + result.pubkey);
  }
);
```

### Sign
Cryptographically sign a piece of data.
The data needs to be summarised in a digest like sha256
```javascript
sign(vault, 'm/0', shajs('sha256').update("data to sign goes here").digest())
  .then(signedOutput => {
    console.log("sign: " + signedOutput.signature);
  }
);
```

### Encrypt
Encrypt a piece of data
The data needs to be encoded into a hex string before sending
```javascript
encrypt(vault, publicKey, Buffer.from("message to encrypt").toString('hex'))
  .then(encryptedMessage => {
    console.log("encrypt: " + encryptedMessage.ciphertext);
  }
);
```

### Decrypt
Reverse the encryption process to get back your message

```javascript
decrypt(vault, 'm/0', encryptedMessage)
  .then(message => {
    console.log("decrypt: " + Buffer.from(message, 'hex').toString());
  }
);
```

## License
[BSD-3-Clause](LICENSE)

const vault = require('./index.js')
const vaultSecp256k1 = require('./secp256k1.js')
const shajs = require('sha.js')

console.log('--- Zippie Vault Tests ---')

console.log('--- Test #1: Init ---')

var opts = {vaultURL: 'https://vault.dev.zippie.org'}

// Init Zippie vault
vault.init(opts).then(
  result => {
    console.log('Init Result: ' + result);

    console.log('--- Test #2: Sign ---')

    // Sign data with derived private key for path 'm/0'
     vaultSecp256k1
      .sign(vault, 'm/0', shajs('sha256').update('data to sign goes here').digest())
      .then(result => {
        console.log("sign: " + result.signature)
      });

    console.log('--- Test #3: KeyInfo ---')
    // Get derived public key for path 'm/0'

    vaultSecp256k1.keyInfo(vault, 'm/1').then(result => {
      console.log('keyInfo m/1: ' + result.pubkey);
    });

    vaultSecp256k1.keyInfo(vault, 'm/1/1').then(result => {
      console.log('keyInfo m/1/1: ' + result.pubkey);
    });

    vaultSecp256k1.keyInfo(vault, 'm/0').then(result => {
      console.log('keyInfo m/0: ' + result.pubkey);

      console.log('--- Test #4: Encrypt ---')
      // Encrypt a message
      // NB: Usually you would use someone elses public key
      vaultSecp256k1
        .encrypt(vault, result.pubkey, Buffer.from("message to encrypt").toString('hex'))
        .then(encResult => {
          console.log("encrypt: " + encResult.result.ciphertext);

          console.log('--- Test #5: Decrypt ---')
          // Decrypt a message
          vaultSecp256k1
            .decrypt(vault, 'm/0', encResult.result)
            .then(message => {
              console.log("decrypt: " + Buffer.from(message.result, 'hex').toString());
            });
        });
    });
  },
  error => {
    console.log("encountered error: " + error);
  }
);


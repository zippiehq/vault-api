import { div, h1, span, br } from 'callbag-html'
import * as vault from './index.js'
import { keyInfo, sign, encrypt, decrypt } from './secp256k1.js'
import * as shajs from 'sha.js'

function testLog(message)
{
  console.log(message)
  document.body.appendChild(
    div([span(message),
    br()
    ])
  )
}

testLog('--- Zippie Vault Tests ---')

testLog('--- Test #1: Init ---')

var opts = {vaultURL: 'https://localhost:8443'}

// Init Zippie vault
vault.init(opts).then(
  result => {
    testLog('Init Result: ');
    testLog(result)
    
    testLog('--- Test #2: Sign ---')

    // Sign data with derived private key for path 'm/0'
     sign(vault, 'm/0', shajs('sha256').update('data to sign goes here').digest())
      .then(result => {
        testLog("sign: " + result.signature)
      });

    testLog('--- Test #3: KeyInfo ---')
    // Get derived public key for path 'm/0'

    keyInfo(vault, 'm/1').then(result => {
      testLog('keyInfo m/1: ' + result.pubkey);
    });

    keyInfo(vault, 'm/1/1').then(result => {
      testLog('keyInfo m/1/1: ' + result.pubkey);
    });

    keyInfo(vault, 'm/0').then(result => {
      testLog('keyInfo m/0: ' + result.pubkey);

      testLog('--- Test #4: Encrypt ---')
      // Encrypt a message
      // NB: Usually you would use someone elses public key
      encrypt(vault, result.pubkey, Buffer.from("message to encrypt").toString('hex'))
        .then(encResult => {
          testLog("encrypt: " + encResult.result.ciphertext);

          testLog('--- Test #5: Decrypt ---')
          // Decrypt a message
          decrypt(vault, 'm/0', encResult.result)
            .then(message => {
              testLog("decrypt: " + Buffer.from(message.result, 'hex').toString());
            });
        });
    });
  },
  error => {
    testLog("encountered error: " + error);
  }
);


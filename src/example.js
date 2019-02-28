import { div, h1, span, br } from 'callbag-html'
import Vault from './index.js'
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

testLog('--- Zippie Vault-API Examples ---')
testLog('--- Example #1: Init ---')

// Init Zippie vault
const vault = new Vault({vault_uri: 'https://vault.dev.zippie.org'})
vault.setup()
  .then(_ => vault.signin())
  .then(result => {
    testLog(result)

    testLog('--- Example #2: Sign ---')

    // Sign data with derived private key for path 'm/0'
    vault.secp256k1.sign('m/0', shajs('sha256').update('data to sign goes here').digest())
      .then(result => {
        testLog("sign: " + result.signature)
      });

    testLog('--- Example #3: KeyInfo ---')
    // Get derived public key for path 'm/0'

    vault.secp256k1.keyInfo('m/1').then(result => {
      testLog('keyInfo m/1: ' + result.pubkey);
    });

    vault.secp256k1.keyInfo('m/1/1').then(result => {
      testLog('keyInfo m/1/1: ' + result.pubkey);
    });

    vault.secp256k1.keyInfo('m/0').then(result => {
      testLog('keyInfo m/0: ' + result.pubkey);

      testLog('--- Example #4: Encrypt ---')
      // Encrypt a message
      // NB: Usually you would use someone elses public key
      vault.secp256k1.encrypt(result.pubkey, Buffer.from("message to encrypt").toString('hex'))
        .then(encResult => {
          testLog("encrypt: " + encResult.ciphertext);

          testLog('--- Example #5: Decrypt ---')
          // Decrypt a message
          vault.secp256k1.decrypt('m/0', encResult)
            .then(message => {
              testLog("decrypt: " + Buffer.from(message, 'hex').toString());
            });
        });
    });
  })
  .catch(e => console.error(e))

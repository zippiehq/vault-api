import { div, h1, span, br } from 'callbag-html'
import * as vault from './index.js'
import { keyInfo, sign, encrypt, decrypt } from './secp256k1.js'
import * as shajs from 'sha.js'
import * as wallet from './wallet_api.js'

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

var opts = {vaultURL: 'https://vault.dev.zippie.org'}

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
          testLog("encrypt: " + encResult.ciphertext);

          testLog('--- Test #5: Decrypt ---')
          // Decrypt a message
          decrypt(vault, 'm/0', encResult)
            .then(message => {
              testLog("decrypt: " + Buffer.from(message, 'hex').toString());
            });
        });
    });

    testLog('--- Test #5: Enrollments ---')
    vault.enrollments().then( (result) => {
      testLog("enrollments: " + JSON.stringify(result))
    })
    
    testLog('--- Test #6 Wallet API ---')
    wallet.walletInit(vault, 'https://localhost:3000').then(() => {
      testLog('Wallet Init Return')

      testLog('Test Wallet Call')
      wallet.getPassportInfo(vault).then((result) => {
        testLog('Get Passport Info Return')
        testLog('passport info: ' +JSON.stringify(result))
        })

        wallet.getAddressForToken(vault, '0x374FaBa19192a123Fbb0c3990e3EeDcFeeaad42A').then((result) => {
          testLog('ZIPT address: ' + JSON.stringify(result))
      })

      wallet.getAddressForToken(vault, '0xd0A1E359811322d97991E03f863a0C30C2cF029C').then((result) => {
        testLog('WETH address ' + JSON.stringify(result))

        wallet.createBlankCheque(vault, result, 10, 'lets go')
      })
    })
  },
  error => {
    testLog("encountered error: " + error);
  }
);


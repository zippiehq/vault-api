import { div, h1, span, br } from 'callbag-html'
import Vault from './index.js'
import { keyInfo, sign, encrypt, decrypt } from './secp256k1.js'
import * as shajs from 'sha.js'
import * as wallet from './wallet_api.js'
import * as constants from './constants'

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

const WETH_ADDRESS = "0xd0A1E359811322d97991E03f863a0C30C2cF029C"
const ZIPT_ADDRESS = "0x374FaBa19192a123Fbb0c3990e3EeDcFeeaad42A"
const SNOUT_ADDRESS = "0x236425d1CD5dc250AdAdd1405871f1f285347F01"
const FANT_ADDRESS = "0x5A32259f5661207935d031C9d5a59571F70B9252"

testLog('--- Example #1: Init ---')

var opts = {vaultURL: constants.ZippieVaultURL}

// Init Zippie vault
let vault = new Vault(opts)
vault.setup()
.then(
  result => {
    testLog('Init Result: ');
    testLog(result)

    testLog('--- Example #2: Sign ---')

    // Sign data with derived private key for path 'm/0'
     sign(vault, 'm/0', shajs('sha256').update('data to sign goes here').digest())
      .then(result => {
        testLog("sign: " + result.signature)
      });

    testLog('--- Example #3: KeyInfo ---')
    // Get derived public key for path 'm/0'

    keyInfo(vault, 'm/1').then(result => {
      testLog('keyInfo m/1: ' + result.pubkey);
    });

    keyInfo(vault, 'm/1/1').then(result => {
      testLog('keyInfo m/1/1: ' + result.pubkey);
    });

    keyInfo(vault, 'm/0').then(result => {
      testLog('keyInfo m/0: ' + result.pubkey);

      testLog('--- Example #4: Encrypt ---')
      // Encrypt a message
      // NB: Usually you would use someone elses public key
      encrypt(vault, result.pubkey, Buffer.from("message to encrypt").toString('hex'))
        .then(encResult => {
          testLog("encrypt: " + encResult.ciphertext);

          testLog('--- Example #5: Decrypt ---')
          // Decrypt a message
          decrypt(vault, 'm/0', encResult)
            .then(message => {
              testLog("decrypt: " + Buffer.from(message, 'hex').toString());
            });
        });
    });

    testLog('--- Example #5: Enrollments ---')
    vault.enrollments().then( (result) => {
      testLog("enrollments: " + JSON.stringify(result))
    })

    testLog('--- Example #6 Wallet API ---')
    wallet.walletInit(vault, constants.ZippieWalletURL).then(() => {
      testLog('Wallet Init Return')

      testLog('Test Wallet Call')
      

      wallet.getPassportInfo(vault).then((result) => {
        testLog('Get Passport Info Return')
        testLog('passport info: ' +JSON.stringify(result))
        })

      wallet.getAccountForToken(vault, ZIPT_ADDRESS).then((result) => {
          testLog('ZIPT address: ' + JSON.stringify(result))

          wallet.getTokenBalance(vault, ZIPT_ADDRESS).then((result) => {
            testLog('MultisigInfo ' + JSON.stringify(result))


            wallet.getPaymentInfo(vault, 'd2916cdf34344b4198c374e4aaeed9797caaa18366112ffbf20dcd80edb46224,428ab13acbad47c8bd648d0f31ff90aa286fe6687fd5c604a4b699184cedfb3d').then((result) => {
              testLog('Blank Check ' + JSON.stringify(result))
      
              wallet.claimPayment(vault, result.blankCheckData).then((claim) => {
                testLog('Claim Check ' + JSON.stringify(claim))
              })
            })

            wallet.createPaymentLink(vault, ZIPT_ADDRESS, 100, 'test from api').then((hash) => {
              testLog('create payment link' + JSON.stringify(hash))
            })
          })
      })

      wallet.createAccountForToken(vault, FANT_ADDRESS).then((account) => {
        testLog('create Account ' + JSON.stringify(account))

        wallet.createPaymentLink(vault, FANT_ADDRESS, 100, 'test from api').then((hash) => {
          testLog('create payment link' + JSON.stringify(hash))
        })
      })
    })   
  },
  error => {
    testLog("encountered error: " + error);
  }
);


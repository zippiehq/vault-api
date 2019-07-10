/*
 * Copyright (c) 2018 Zippie Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import shajs from 'sha.js'
import * as appcache from './appcache'

/**  @module secp256k1 */

var __context

/**
 * Initialize Vault API secp256k1 functionality.
 *
 * This function is called in the Vault API setup function.
 *
 * @access private
 *
 * @param {Vault} vault Vault API instance
 */
export async function init (vault) {
  __context = vault

  vault.secp256k1 = {
    /**
     * @function keyInfo
     *
     * @desc Get derived public key and extended public key information
     *
     * @param {string} derive key derivation path,
     * see {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki|BIP32}
     *
     * @returns {Promise}
     *
     * @example
     * vault.secp256k1.keyInfo('m/0')
     *   .then(({ pubkey, pubex }) => {
     *     console.log("Public Key:", pubkey)
     *     console.log("Public Extended:", pubex)
     *   })
     */
    keyInfo (derive) {
      const cacheId = shajs('sha256').update('secp256k1.keyInfo-' + derive)
        .digest().toString('hex')

      return appcache.get(__context, cacheId, {
        secp256k1KeyInfo: { key: { derive }}
      })
    },

    /**
     * @function sign
     *
     * @desc Sign hash with derived private key
     *
     * @param {string} derive key derivation path,
     * see {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki|BIP32}
     * @param {string} hash 32-bit SHA256 hex encoded hash to sign
     *
     * @returns {Promise}
     *
     * @example
     * vault.secp256k1.sign('m/0', sha256('Some Message Here').toString('hex'))
     *   .then((signature) => {
     *     console.log("Signature:", signature)
     *   })
     */
    sign (derive, hash) {
      return __context.message({
        secp256k1Sign: { key: { derive }, hash }
      })
    },

    /**
     * @function encrypt
     *
     * @desc Encrypt plaintext data with ECIES against provided public key
     * {@link https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme}
     *
     * @param {string} pubkey Uncompressed secp256k1 public key encoded in hex
     * @param {string} plaintext Plain text message to encrypt
     *
     * @returns {Promise}
     *
     * @example
     * import crypto from 'crypto'
     * import secp256k1 from 'secp256k1'
     * 
     * const key = crypto.randomBytes(32)
     * const pubkey = secp256k1.publicKeyCreate(key, false).toString('hex')
     * 
     * vault.secp256k1.encrypt(pubkey, 'Some message here')
     *   .then((ecies) => {
     *     console.log("Encrypted Message:", ecies)
     *   })
     */
    encrypt (pubkey, plaintext) {
      return __context.message({
        secp256k1Encrypt: { pubkey, plaintext }
      })
    },

    /**
     * @function decrypt
     *
     * @desc Decrypt ECIES ciphertext object with derived private key
     * {@link https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme}
     *
     * @param {string} derive key derivation path,
     * see {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki|BIP32}
     * @param {Object} ciphertext encrypted message object
     *
     * @returns {Promise}
     *
     * {@link https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme}
     *
     * @example
     * import crypto from 'crypto'
     * import secp256k1 from 'secp256k1'
     * 
     * vault.secp256k1.decrypt('m/0', ecies)
     *   .then((plaintext) => {
     *     console.log("Decrypted Message:", plaintext)
     *   })
     */
    decrypt (derive, ciphertext) {
      return __context.message({
        secp256k1Decrypt: Object.assign({ key: { derive }}, ciphertext)
      })
    }
  }
}

/** 
 * Get the public key and extended public key for that particular purpose and derivation
 * 
 * @deprecated Since version 1.0.15
 * @ignore
 * 
 * @param {Vault} vault the Vault module
 * @param {string} derive the particular BIP32 derivation, see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * 
 * @return {Promise} where resolve gets the public key and public extended key in a dictionary
 * 
 * @example
 * import * as vaultSecp256k1 from '@zippie/vault-api/secp256k1'
 * 
 * vaultSecp256k1.keyInfo(vault, 'm/0')
 *   .then(keyInfo => console.info(keyInfo))
 */
export function keyInfo(vault, derive) {
  console.warn('VAULT-API: DEPRECATED: Accessing secp256k1 functions this way is deprecated, please update your apps to use vault#secp256k1 module.')
  const cacheId =
    shajs('sha256').update('secp256k1KeyInfo-' + derive).digest().toString('hex')
  return appcache.get(
    vault,
    cacheId,
    {'secp256k1KeyInfo' : { key: { derive: derive } }}
  )
}

/** 
 * Signs a particular hash with the private for that particular purpose and derivation
 * 
 * @deprecated Since version 1.0.15
 * @ignore
 * 
 * @param {Vault} vault the Vault module
 * @param {string} derive the particular BIP32 derivation, see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * @param {string} hash the hash (32-bytes) that should be signed
 * 
 * @return {Promise} a promise where the resolve returns a string with the particular signature
 *
 * @example
 * import * as vaultSecp256k1 from '@zippie/vault-api/secp256k1'
 * 
 * const hash = shajs('sha256').update('test message').digest().toString('hex')
 * vaultSecp256k1.sign(vault, 'm/0', hash)
 *   .then(signature => console.info(signature))
 *
 */
export function sign(vault, derive, hash) {
  console.warn('VAULT-API: DEPRECATED: Accessing secp256k1 functions this way is deprecated, please update your apps to use vault#secp256k1 module.')
  return vault.message({'secp256k1Sign' : { key: { derive: derive }, hash: hash }})
}

/** 
 * Ask vault to encrypt a message
 * 
 * @deprecated Since version 1.0.15
 * @ignore
 * 
 * @param {Vault} vault the Vault module
 * @param {pubkey} hex encoded public key
 * @param {plaintext} plain text data to encrypt
 * 
 * @return {Promise} that resolves with the response from the vault
 * 
 * @example
 * import * as vaultSecp256k1 from '@zippie/vault-api/secp256k1'
 * 
 * vaultSecp256k1.encrypt(vault, 'm/0', 'test message')
 *   .then(mesg => console.info(mesg))
 *
 */
export function encrypt(vault, pubkey, plaintext) {
  console.warn('VAULT-API: DEPRECATED: Accessing secp256k1 functions this way is deprecated, please update your apps to use vault#secp256k1 module.')
  return vault.message({
    secp256k1Encrypt: {
      pubkey: pubkey,
      plaintext: plaintext
    }
  })
}

/** 
 * Ask vault to decrypt a message
 *
 * @deprecated Since version 1.0.15
 * @ignore
 * 
 * @param {Vault} vault the Vault module
 * @param {derive} key index
 * @param {opts} output from secp256k1 encrypt call
 * 
 * @return {Promise} that resolves with the response from the vault
 * 
 * @example
 * import * as vaultSecp256k1 from '@zippie/vault-api/secp256k1'
 * 
 * vaultSecp256k1.decrypt(vault, 'm/0', data)
 *   .then(plaintext => console.info(plaintext))
 *
 */
export function decrypt(vault, derive, opts) {
  console.warn('VAULT-API: DEPRECATED: Accessing secp256k1 functions this way is deprecated, please update your apps to use vault#secp256k1 module.')
  return vault.message({
    secp256k1Decrypt: Object.assign({
      key: { derive: derive }
    }, opts)
  })
}
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

/** 
 * Get the public key and extended public key for that particular purpose and derivation
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
  return vault.message({'secp256k1Sign' : { key: { derive: derive }, hash: hash }})
}

/** 
 * Ask vault to encrypt a message
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
  return vault.message({
    secp256k1Encrypt: {
      pubkey: pubkey,
      plaintext: plaintext
    }
  })
}

/** 
 * Ask vault to encrypt a message
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
  return vault.message({
    secp256k1Decrypt: Object.assign({
      key: { derive: derive }
    }, opts)
  })
}
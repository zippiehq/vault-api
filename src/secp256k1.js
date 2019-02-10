/** 
 * Get the public key and extended public key for that particular purpose and derivation
 * @param {vault} vault the Vault module
 * @param {String} derive the particular BIP32 derivation, see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * @return {Promise} where resolve gets the public key and public extended key in a dictionary
*/
import shajs from 'sha.js'
import * as appcache from './appcache'

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
 * @param {vault} vault the Vault module
 * @param {String} derive the particular BIP32 derivation, see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * @param {String} hash the hash (32-bytes) that should be signed
 * @return {Promise} a promise where the resolve returns a string with the particular signature
*/
 
export function sign(vault, derive, hash) {
  return vault.message({'secp256k1Sign' : { key: { derive: derive }, hash: hash }})
}

/** 
 * Ask vault to encrypt a message
 * @param {vault} vault the Vault module
 * @param {pubkey} hex encoded public key
 * @param {plaintext} plain text data to encrypt
 * @return {Promise} that resolves with the response from the vault
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
 * @param {vault} vault the Vault module
 * @param {derive} key index
 * @param {opts} output from secp256k1 encrypt call
 * @return {Promise} that resolves with the response from the vault
 */
export function decrypt(vault, derive, opts) {
  return vault.message({
    secp256k1Decrypt: Object.assign({
      key: { derive: derive }
    }, opts)
  })
}

export default {keyInfo, sign, encrypt, decrypt}
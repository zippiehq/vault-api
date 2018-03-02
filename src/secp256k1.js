/** 
 * Get the public key and extended public key for that particular purpose and derivation
 * @param {vault} vault the Vault module
 * @param {String} derive the particular BIP32 derivation, see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * @return {Promise} where resolve gets the public key and public extended key in a dictionary
*/

exports.keyInfo = function(vault, derive) {     
  return new Promise(function(resolve, reject) {
    vault.message({'secp256k1KeyInfo' : { key: { derive: derive } }}).then(function(result) { 
      resolve(result.result)
    })
  })
}

/** 
 * Signs a particular hash with the private for that particular purpose and derivation
 * @param {vault} vault the Vault module
 * @param {String} derive the particular BIP32 derivation, see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * @param {String} hash the hash (32-bytes) that should be signed
 * @return {Promise} a promise where the resolve returns a string with the particular signature
*/
 
exports.sign = function(vault, derive, hash) {
  return new Promise(function(resolve, reject) { 
    vault.message({'secp256k1Sign' : { key: { derive: derive }, hash: hash }}).then(function(result) { 
      resolve(result.result)
    })
  })
}

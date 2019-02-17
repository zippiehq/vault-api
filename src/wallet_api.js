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
import * as constants from './constants'

/**
 * @module wallet
 * 
 * @desc
 * Zippie Wallet API
 * Allows interaction between dapps and the Zippie Wallet
 * 
 * @example
 * import * as wallet from '@zippie/vault-api/wallet_api'
 * 
 * wallet.walletInit(vault)
 *  .then(_ => {
 *    // USE WALLET FUNCTIONS HERE
 *  })
 * 
 */

var walletApiUrl = constants.ZippieWalletURL

/**
 * Runs a method on the Wallet API
 * @param {Object} vault  Initialised Zippie Vault
 * @param {String} call Method Name to call on remote API
 * @param {Object} args Arguments for method call
 * @returns {Promise}
 */
function messageWallet(vault, call, args)
{
    return vault.message({'IPCRouterRequest' : {target: walletApiUrl, payload: {call: call, args: args }}})
}

/**
 * Initialises the Wallet API Iframe
 * @param {Object} vault  Initialised Zippie Vault
 * @param {String} apiUrl Wallet API URL
 * @returns {Promise}
 */
export function walletInit(vault, apiUrl) {

    if(apiUrl !== undefined)
    {
        walletApiUrl = apiUrl
    }

    return messageWallet(vault, 'init')
}

/**
 * Gets the users multisig account for a token contract address
 * @param {Object} vault Initialised Zippie Vault
 * @param {String} tokenAddr Token Contract Address
 */
export function getAccountForToken(vault, tokenAddr) {
    return messageWallet(vault, 'getAccountForToken', tokenAddr)
}

/**
 * 
 * @param {Object} vault  Initialised Zippie Vault
 */
export function getPassportInfo(vault) {
    return messageWallet(vault, 'getPassportInfo')
}

/**
 * 
 * @param {Object} vault  Initialised Zippie Vault
 */
export function getPassportImage(vault) {
    return messageWallet(vault, 'getPassportImage')
}

/**
 * Create a Payment Link for a specified token
 * @param {Object} vault  Initialised Zippie Vault
 * @param {String} tokenAddress
 * @param {Number} amount 
 * @param {String} message 
 */
export function createPaymentLink(vault, tokenAddress, amount, message) {
  return messageWallet(vault, 'createPaymentLink', {tokenAddress, amount, message})
}

/**
 * Gets users balance of a specified token
 * @param {Object} vault  Initialised Zippie Vault
 * @param {String} tokenAddr Token Contract address
 */
export function getTokenBalance(vault, tokenAddr) {
    return messageWallet(vault, 'getTokenBalance', tokenAddr)
}

/**
 * Returns information about a Payment Link
 * @param {Object} vault  Initialised Zippie Vault
 * @param {String} hash Payment Link hash
 */
export function getPaymentInfo(vault, hash) {
    return messageWallet(vault, 'getPaymentInfo', hash)

}

/**
 * Claims a Payment Link into a wallet account
 * @param {Object} vault  Initialised Zippie Vault
 * @param {Object} paymentLink Payment Link Info
 */
export function claimPayment(vault, paymentInfo) {
    return messageWallet(vault, 'claimPayment', paymentInfo)
}

/**
 * Create a whitelisted multisig account for a particular Token
 * @param {Object} vault Initialised Zippie Vault
 * @param {String} tokenAddress Contract address for Token
 */
export function createAccountForToken(vault, tokenAddress) {
    return messageWallet(vault, 'createAccountForToken', tokenAddress)
}

export default { 
    walletInit, 
    getAccountForToken,
    createAccountForToken, 
    getPassportInfo, 
    getPassportImage, 
    createPaymentLink, 
    getTokenBalance, 
    claimPayment, 
    getPaymentInfo 
}
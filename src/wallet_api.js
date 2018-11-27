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

var walletApiUrl = 'https://my.zippie.org'

function messageWallet(vault, call, args)
{
    return vault.message({'IPCRouterRequest' : {target: walletApiUrl, payload: {call: call, args: args }}})
}

export function walletInit(vault, apiUrl) {

    if(apiUrl !== undefined)
    {
        walletApiUrl = apiUrl
    }

    return messageWallet(vault, 'init')
}

export function getAddressForToken(vault, tokenAddr)
{
    return messageWallet(vault, 'getAccountForToken', tokenAddr)
}

export function getPassportInfo(vault) {
    return messageWallet(vault, 'getPassportInfo')
}

export function getPassportImage(vault) {
    return messageWallet(vault, 'getPassportImage')
}

export function createBlankCheque(vault, tokenAccount, amount, message) {
  return messageWallet(vault, 'createBlankCheque', {tokenAccount, amount, message})
}

export default { walletInit, getAddressForToken, getPassportInfo, getPassportImage, createBlankCheque }
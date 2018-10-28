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

import { getCookie, setCookie } from 'tiny-cookie'

var vault = null

var vaultOpts = null
var vaultReady = null
var vaultNotReady = null

var _counter = 0
var receivers = {}

/**
 * Parse opts from URI fragment portion, this is so we can pass parameters
 * to vault and apps without HTTP server knowledge. The format is: #?q1=v1;q2=v2
 */
export function parseOpts(uri) {
  let parser = document.createElement('a')
  parser.href = uri

  let hash = parser.hash
  let paramstr = hash.split('?')[1] || ''
  hash = hash.split('?')[0]

  let params = {}

  let p = paramstr.split(';')
  if (p[0] !== '') {
    for (let i = 0; i < p.length; i++) {
      let parts = p[i].split('=')
      params[parts[0]] = parts[1]
    }
  }

  return params
}

/**
 * Internal function, invoked when a message is received from vault.
 */
function onIncomingMessage(event) {
  if (event.source !== vault) return;

  console.log('API: Received:', event.data)

  // Vault sent ready message, 
  if ('login' in event.data) {
    document.body.appendChild(createButton())

  } else if ('ready' in event.data) {
    message({ 'signin' : vaultOpts })
      .then(vaultReady, vaultNotReady)

  } else {
    if (event.data.callback && receivers[event.data.callback]) {
      let receiver = receivers[event.data.callback]
      delete receivers[event.data.callback]

      if ('error' in event.data) {
        if (event.data.error === 'launch' || event.data.error === 'signin') {
          return launch(event.data.launch)
        }

        return receiver[1](event.data)
      }

      return receiver[0](event.data)
    }
  }
}

/**
 * Internal function, invoked when vault asks us to redirect for signin/signup.
 */
function launch(vaultURI, returnURI) {
  var callback = window.location.href

  if(returnURI !== undefined) {
    callback = returnURI
  }

  console.log('API: redirecting to ' + vaultURI + '#?launch=' + callback)
  window.location = vaultURI + '#?launch=' + callback
}

/**
 * Send a message to Zippie Vault
 * @param {Object} message Dictionary with the message to
 * @return {Promise} that resolves with the response from the vault
 */
export function message(message) {
  return new Promise(function(resolve, reject) {
    let id = 'callback-' + _counter++

    receivers[id] = [resolve, reject]
    message.callback = id

    // XXX this should be to our known origin for when it claims it's ready
    vault.postMessage(message, '*')
  })
}

/** 
 * Init the Zippie Vault communication
 * @return {Promise} that resolves when the vault is ready for messaging
*/
export function init(opts) {
  opts = opts || {};

  // Variables for parameter processing
  let params = parseOpts(window.location)

  // Strip params from URI fragment part
  if (window.location.hash.indexOf('?') !== -1) {
    window.location.hash = window.location.hash.slice(0, window.location.hash.indexOf('?'))
  }

  if(isUserOnboarded() == false)
  {
    setCookie('autoSignInWith','zippieVault')
  }

  // DApp IPC Mode, running in an IFrame inside the vault
  // XXX: maybe we should validate that we are talking to the actual vault
  if('ipc-mode' in opts)
  {
    console.log('API: setting parent window as vault instance')

    vault = parent
    vaultOpts = opts

    return new Promise(
      function (resolve, reject) {
        vaultReady = resolve
        vaultNotReady = reject

        window.addEventListener('message', onIncomingMessage)

        return Promise.resolve()
      }
    )
  }

  // If no vault URI provided, auto-detect from domain check.
  if (!('vaultURL' in opts)) {
    opts.vaultURL = 'https://vault.zippie.org'

    if (window.location.href.indexOf('dev.zippie.org') !== -1) {
      opts.vaultURL = 'https://vault.dev.zippie.org'
    } else if (window.location.href.indexOf('testing.zippie.org') !== -1) {
      opts.vaultURL = 'https://vault.testing.zippie.org'
    }
  }

  if (params['zippie-vault'] !== undefined) {
    opts.vaultURL = params['zippie-vault']
  }

  // XXX: Implement per-dapp vault access token and cookie, then dapps can
  // cache in local storage their access token making this redirect only
  // required on first run.

  // If we have no vault "magic" cookie, we have to signin, so launch vault.
  if (params['vault-cookie'] === undefined) {
    return Promise.reject(launch(opts.vaultURL, opts.returnURI))
  }

  opts.vaultURL = opts.vaultURL + '#?magiccookie=' + params['vault-cookie']

  // Create invisible, nested vault iframe.
  return new Promise(
    function (resolve, reject) {
      vaultOpts = opts
      vaultReady = resolve
      vaultNotReady = reject

      window.addEventListener('message', onIncomingMessage)

      var iframe = document.createElement('iframe')
      iframe.style.display = 'none'

      iframe.sandbox += ' allow-storage-access-by-user-activation'
      iframe.sandbox += ' allow-same-origin'
      iframe.sandbox += ' allow-scripts'

      iframe.src = opts.vaultURL

      document.body.appendChild(iframe)
      vault = iframe.contentWindow

      console.log('API: Launched plainly, enclave built and waiting for ready signal.')
      return Promise.resolve()
    })
}

export function isUserOnboarded() {
  var isSetup = false

  // Check the set cookie for returning customers
  // TODO: integrate this with the vault better
  var signInWith = getCookie('autoSignInWith');

  if(signInWith == 'zippieVault')
  {
    isSetup = true
  }

  return isSetup
}

export function version() {
  return message({version: null})
}

export function config() {
  return message({config: null})
}

export function enrollments() {
  return message({enrollments: null})
}

export function isCardValid(cardInfo) {
  return message({'cardinfo': cardInfo})
    .then(r => {
      return Promise.resolve(r.result !== null)
    })
}

/**
 * Return vault internal card management dapp uri
 * @return {String} of constructed resource uri
 */
export function getCardEnrollUri(path) {
  path = path || ''
  let baseuri = 'https://vault.zippie.org/#/'
  if (window.location.href.indexOf('dev.zippie.org') !== -1) {
    baseuri = 'https://vault.dev.zippie.org/#/'
  } else if (window.location.href.indexOf('testing.zippie.org') !== -1) {
    baseuri = 'https://vault.testing.zippie.org/#/'
  } else if (vaultOpts.vaultURL) {
    baseuri = vaultOpts.vaultURL
  }

  // Strip out any unwanted  parameters
  baseuri = baseuri.split('#')[0]

  return baseuri + '#?card=' + path
}

/**
 * Return users preferred wallet uri for resource
 * @return {String} of constructed resource uri
 */
export function getWalletUri(path) {
  path = path || ''
  let baseuri = 'https://my.zippie.org/#/'
  if (window.location.href.indexOf('dev.zippie.org') !== -1) {
    baseuri = 'https://my.dev.zippie.org/#/'
  } else if (window.location.href.indexOf('testing.zippie.org') !== -1) {
    baseuri = 'https://my.testing.zippie.org/#/'
  }
  return baseuri + (path[0] === '/' ? path.slice(1) : path)
}

/**
 * Create a Zippie Signin button.
 * @return {Button} that when click signs the user in using Zippie
 */
export function createButton() {
  // XXX: Hand off button management to Dapp, so they can place it where they
  // please. Also need to manage state visible, not visible, etc. properly.
  var button = document.createElement('button')
  button.id = 'zippie-btn'
  button.style = 'margin: 0; padding: 0; border: none;'
  button.innerHTML = 'Zippie Signin'

  button.onclick = function () {
    console.log('API: Signing in with Zippie')

    message({'login': null})
    .then(
      result => {
        button.style.display = 'none'
      },
      error => {
      }
    )    
  }

  return button
}

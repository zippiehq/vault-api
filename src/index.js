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
var vault = null

var vaultOpts = null
var vaultReady = null
var vaultNotReady = null

var _counter = 0
var receivers = {}

/**
 * Internal function, invoked when a message is received from vault.
 */
function onIncomingMessage(event) {
  if (event.source !== vault) return;

  console.log('API: Received:', event.data)

  // Vault sent ready message, 
  if ('login' in event.data) {
    document.body.appendChild(exports.createButton())

  } else if ('ready' in event.data) {
    exports.message({ 'signin' : vaultOpts })
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
function launch(vaultURI) {
  console.log('redirecting to ' + vaultURI + '#?launch=' + window.location.href)
  window.location = vaultURI + '#?launch=' + window.location.href
}

/**
 * Send a message to Zippie Vault
 * @param {Object} message Dictionary with the message to
 * @return {Promise} that resolves with the response from the vault
 */
exports.message = function (message) {
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
exports.init = function (opts) {
  opts = opts || {};

  // Variables for parameter processing
  let hash = window.location.hash
  let params = {}

  // Process URI fragment part for vault params
  if (hash.indexOf('?') !== -1) {
    let p = hash.split('?')[1].split(';')

    for (var i = 0; i < p.length; i++) {
      var kv = p[i].split('=')
      params[kv[0]] = kv[1]
    }

    // Strip params from URI fragment part
    window.location.hash = hash.slice(0, hash.indexOf('?'))
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
    return Promise.resolve(launch(opts.vaultURL))
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

      console.log('Launched plainly, enclave built and waiting for ready signal.')
      return Promise.resolve()
    })
}

exports.enrollments = function () {
  return exports.message({enrollments: null})
}

exports.isCardValid = function (cardInfo) {
  return exports.message({'getCardInfo': cardInfo})
    .then(r => {
      return Promise.resolve(r.result !== null)
    })
}

/**
 * Return vault internal card management dapp uri
 * @return {String} of constructed resource uri
 */
exports.getCardEnrollUri = function (path) {
  path = path || ''
  let baseuri = 'https://vault.zippie.org/#/'
  if (window.location.href.indexOf('dev.zippie.org') !== -1) {
    baseuri = 'https://vault.dev.zippie.org/#/'
  } else if (window.location.href.indexOf('testing.zippie.org') !== -1) {
    baseuri = 'https://vault.testing.zippie.org/#/'
  } else if (vaultOpts.vaultURL) {
    baseuri = vaultOpts.vaultURL
  }
  return baseuri + '?card=' + path
}

/**
 * Return users preferred wallet uri for resource
 * @return {String} of constructed resource uri
 */
exports.getWalletUri = function (path) {
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
exports.createButton = function () {
  // XXX: Hand off button management to Dapp, so they can place it where they
  // please. Also need to manage state visible, not visible, etc. properly.
  var button = document.createElement('button')
  button.id = 'zippie-btn'
  button.style = 'position: absolute; right: 0; top: 0; border: 1px solid #000'
  button.innerHTML = 'Zippie Signin'

  button.onclick = function () {
    console.log('API: Signing in with Zippie')
    exports.message({'login': null})
      .then(
        result => {
          button.style.display = 'none'
        },
        error => {
        })
  }

  return button
}

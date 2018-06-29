var vault = null
var vaultOpts = null
var vaultReady = null
var vaultNotReady = null
var _counter = 0
var receivers = {}

function vaultHandleMessage(event) {
  if (event.source == vault) {
    if ('ready' in event.data) {
      exports.message({ 'init' : vaultOpts }).then((result) => {
        vaultReady(result)
      }, (reject) => {
        vaultNotReady(reject)
      })
      return;
    } else {
      if (event.data.callback && receivers[event.data.callback]) {
        let receiver = receivers[event.data.callback]
        delete receivers[event.data.callback]
        if ('error' in event.data) {
          receiver[1](event.data)
        } else {
          receiver[0](event.data)
        }
      }
    }
  }  
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

exports.launch = function(vaultURI) {
  let uri = window.location.href.split('?')[0]
  let hash = window.location.hash
  let params = {}

  // Process URI fragment part for vault params
  if (hash.indexOf('?') !== -1) {
    let p = hash.split('?')[1].split(';')

    for (var i = 0; i < p.length; i++) {
      var kv = p[i].split('=')
      p[kv[0]] = kv[1]
    }
  }

  // sort out deep linking
  console.log('redirecting to ' + vaultURI + '#launch=' + uri)
  window.location = vaultURI + '#launch=' + uri
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
      p[kv[0]] = kv[1]
    }
  }

  // Strip params from URI fragment part
  window.location.hash = hash.slice(0, hash.indexOf('?'))

  // Handle being loaded by vault inside iframe (legacy)
  if (params['iframe']) {
    opts.cookie = params['iframe']
    opts.iframe = true
  }

  // Handle being launched by vault
  if (params['zippie-vault']) {
    opts.vaultURL = params['zippie-vault']
  }

  // If no vault URI provided, auto-detect from domain check.
  if (!('vaultURL' in opts)) {
    opts.vaultURL = 'https://vault.zippie.org'

    if (window.location.indexOf('dev.zippie.org') !== -1) {
      opts.vaultURL = 'https://vault.dev.zippie.org'
    }
  }

  return new Promise(
    function (resolve, reject) {
      vaultOpts = opts
      vaultReady = resolve
      vaultNotReady = reject

      window.addEventListener('message', vaultHandleMessage)
      if (opts.iframe) {
        vault = window.parent

        console.log("Launched in an iframe, sending init message.")
        return message({ 'init' : opts })
      }
      else {
        var iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = opts.vaultURL
        document.body.appendChild(iframe)

        vault = iframe.contentWindow

        console.log('Launched plainly, enclave built and waiting for ready signal.')
        return Promise.resolve()
      }
    })
}

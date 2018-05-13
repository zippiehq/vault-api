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

/** 
 * Init the Zippie Vault communication
 * @return {Promise} that resolves when the vault is ready for messaging
*/

exports.launch = function(vaultURI) {
  // sort out deep linking
  uri = window.location.href.split('#')[0]
  console.log('launching ' + uri)
  if (window.location.hash.startsWith('#zippie-vault=')) {
    uri = window.location.href.split('#zippie-vault=')[0]
    console.log('split the uri')
  }
  console.log('redirecting to ' + vaultURI + '#iframe=' + uri)
  window.location = vaultURI + '#iframe=' + uri
}
 
exports.init = function (opts) {
    opts = opts || {};

    // Handle being loaded by vault inside an iframe.
    if (location.hash.startsWith('#iframe=')) {
      opts.cookie = location.hash.slice('#iframe='.length)
      opts.iframe = true
      location.hash = ''
    }
    if (location.hash.startsWith('#/iframe=')) {
      opts.cookie = location.hash.slice('#/iframe='.length)
      opts.iframe = true
      location.hash = ''
    }

    /* This handles being launched by vault. */
    if (location.hash.startsWith('#zippie-vault=')) {
      opts.vaultURL = location.hash.slice('#zippie-vault='.length)
      location.hash = ''
    }
    if (location.hash.startsWith('#/zippie-vault=')) {
      opts.vaultURL = location.hash.slice('#/zippie-vault='.length)
      location.hash = ''
    }

    return new Promise(
      function (resolve, reject) {
        vaultOpts = opts
        vaultReady = resolve
        vaultNotReady = reject

        window.addEventListener('message', vaultHandleMessage)
        if (opts.iframe) {
          console.log("Launched in an iframe, sending init message")
          vault = window.parent
          exports.message({ 'init' : vaultOpts }).then((result) => {
            vaultReady(result)
          }, (reject) => {
            vaultNotReady(reject)
          })
        }
        else {
          var iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          if ('vaultURL' in opts) {
            iframe.src = opts.vaultURL
          } else {
            iframe.src = 'https://vault.zippie.org/' // vault URL
          }
          document.body.appendChild(iframe)
          vault = iframe.contentWindow
        }
      })
}

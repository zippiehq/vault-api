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
        vaultReady(event.data)
      }, (reject) => {
        vaultNotReady(event.data)
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
 * Send a message to Zipper Vault
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
 * Init the Zipper Vault communication
 * @return {Promise} that resolves when the vault is ready for messaging
*/
 
exports.init = function (opts) {
    opts = opts || {};
    return new Promise(
      function (resolve, reject) {
        window.addEventListener('message', vaultHandleMessage)
        var iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = 'https://vault.zipperglobal.com/' // vault URL
        document.body.appendChild(iframe)
        vault = iframe.contentWindow
        vaultOpts = opts
        vaultReady = resolve
        vaultNotReady = reject
      })
}

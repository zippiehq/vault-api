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

/**
 * Vault API
 */
export default class Vault {
  /**
   * opts:
   *   vault_uri - Zippie vault location
   */
  constructor (opts) {
    opts = opts || {}

    // Parse params from URI fragment
    this.__params = this.__parse_opts(window.location)

    // Strip params from URI fragment
    if (window.location.hash.indexOf('?') !== -1) {
      window.location.hash = window.location.hash.slice(0, window.location.hash.indexOf('?'))
    }

    // Enclave DOM objects
    this.__iframe = null
    this.__vault = null

    // Message receiver dispatch variables
    this.__callback_counter = 0
    this.__receivers = {}

    // Construct iframe to load vault enclave
    var iframe = document.createElement('iframe')

    iframe.style.display = 'none'

    iframe.sandbox += ' allow-storage-access-by-user-activation'
    iframe.sandbox += ' allow-same-origin'
    iframe.sandbox += ' allow-scripts'

    // Setup vault URI default if none provided in constructor opts.
    if (!opts.vault_uri) {
      opts.vault_uri = 'https://vault.zippie.org'

      if (window.location.host.indexOf('dev.zippie.org') !== -1) {
        opts.vault_uri = 'https://vault.dev.zippie.org'
      } else
      if (window.location.host.indexOf('testing.zippie.org') !== -1) {
        opts.vault_uri = 'https://vault.testing.zippie.org'
      }
    }

    // If vault URI set in local storage, it overrides above default.
    if (window.localStorage.getItem('zippie-vault-url') !== null) {
      opts.vault_uri = window.localStorage.getItem('zippie-vault-url')
    }

    // 'zippie-vault' query parameter overrides and persists to local storage.
    if (this.__params['zippie-vault'] !== undefined) {
      opts.vault_uri = this.__params['zippie-vault']
      window.localStorage.setItem('zippie-vault-url', opts.vault_uri)
    }

    // Add vault enclave iframe to DOM
    this.__opts = opts

    document.body.appendChild(iframe)
    this.__iframe = iframe
    this.__vault = iframe.contentWindow
  }


  /**
   *   Initialize vault enclave by loading in vault source with magiccookie key
   * if we have one available. Resolves when enclave is ready for commands.
   */
  setup () {
    return new Promise(function (resolve, reject) {
      // Setup incoming message handler.
      window.addEventListener('message', this.__on_message.bind(this))

      if ('ipc-mode' in this.__opts) return resolve()

      this.__onSetupReady = resolve
      this.__onSetupError = reject

      let magiccookie = window.localStorage.getItem('zippie-vault-cookie')
      if (this.__params['vault-cookie'] !== undefined) {
        magiccookie = this.__params['vault-cookie']
        window.localStorage.setItem('zippie-vault-cookie', magiccookie)
      }

      if (magiccookie !== null) {
        this.__iframe.src = this.__opts.vault_uri + '#?magiccookie=' + magiccookie
      } else {
        this.__iframe.src = this.__opts.vault_uri
      } 

      console.info('VAULT-API: Loading vault from URI:', this.__iframe.src)
    }.bind(this))
  }


  /**
   *   When vault is setup correctly, this function initiates a signin process
   * should be called from an interactive user component, like a button to work
   * correctly with Safari browsers that have ITP 2.0
   */
  signin (noLogin) {
    let promise
    if (noLogin) {
      promise = new Promise(function (resolve, reject) { resolve() })
    } else {
      promise = this.message({login: null})
        .then(function (r) {
          console.info('VAULT-API: Vault reports ITP access granted.')

          if ('itp' in this.__params) {
            console.info('VAULT-API: ITP ITP ITP ITP')

            // XXX - https://bugs.webkit.org/show_bug.cgi?id=188783
            this.message({reboot: null})

            delete this.__params['itp']
            return Promise.reject()
          }

          return Promise.resolve()
        }.bind(this))
    }

    return promise
      .then(function (r) {
        if (this.isSignedIn === undefined) return Promise.reject('Not setup')

        let magiccookie = window.localStorage.getItem('zippie-vault-cookie')
        if (magiccookie === undefined) {
          console.warn('VAULT-API: No vault cookie provided, redirecting to vault.')
          window.location = this.__opts.vault_uri + '#?launch=' + window.location
          return
        }

        return this.message({signin: null})
      }.bind(this))
      .then(function (r) {
        if (r && 'error' in r && 'launch' in r) {
          window.location = r.launch + '#?launch=' + window.location
          return
        }
      })
      .catch(function (e) {
        if (e !== 'ITP_REQUEST_FAILURE') return Promise.reject()
        console.warn('VAULT-API: Vault reported ITP request failure, redirecting to vault for authorization.')
        window.location = this.__opts.vault_uri + '#?launch=' + window.location + ';itp'
      }.bind(this))
  }


  /**
   *   Send a request command to vault enclave. Returns a promise that resolves
   * or rejects depending on the result received back from the enclave.
   */
  message (req) {
    if (!this.__iframe) {
      return Promise.reject({ error: 'Vault not initialized.' })
    }

    return new Promise(function (resolve, reject) {
      let id = 'callback-' + this.__callback_counter++
      this.__receivers[id] = [resolve, reject]

      req.callback = id
      this.__vault.postMessage(req, '*')
    }.bind(this))
  }


  /**
   * Event handler for incoming messages from vault.
   */
  __on_message (event) {
      // Ignore messages not from vault
      if (event.source !== this.__vault) return

      // If there's a receiver setup for this message, handle it.
      if (event.data.callback && this.__receivers[event.data.callback]) {
        let receiver = this.__receivers[event.data.callback]
        delete this.__receivers[event.data.callback]

        // Call receiver promise reject
        if ('error' in event.data) return receiver[1](event.data.error)

        // Call receiver promise resolve
        return receiver[0](event.data.result)
      }

      if ('login' in event.data || 'ready' in event.data) {
        console.info('VAULT-API: processing vault login/ready message.')
        return this.message({version: null})
          .then(function (r) {
            this.version = r
            return this.message({config: null})
          }.bind(this))
          .then(function (r) {
            this.config = r
            return this.message({isSignedIn: null})
          }.bind(this))
          .then(function (r) {
            this.isSignedIn = r

            //   If we have a magiccookie from a previous session, then retrieve
            // it, and attempt an automatic signin, we can presume we've already
            // been granted cookie access from a previous session.
            let magiccookie = window.localStorage.getItem('zippie-vault-cookie')
            if ('ready' in event.data && magiccookie && !this.__params.itp) {
              return this.signin(true)
                .then(function () {
                  return this.message({isSignedIn: null})
                    .then(function (r) {
                      this.isSignedIn = r
                      return this.__onSetupReady()
                    }.bind(this))
                }.bind(this))
            }

            this.isSignedIn = false
            return this.__onSetupReady()
          }.bind(this))
      }

      console.warn('VAULT-API: unhandled vault message event:', event)
  }


  /**
   * Parse hash query parameters into an object.
   */
  __parse_opts (uri) {
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
}


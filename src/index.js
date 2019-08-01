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
import * as appcache from './appcache'
import * as ipc from './ipc/'
import * as secp256k1 from './secp256k1'
import * as runtime from './runtime'

/**
 * The DeviceInfo type contains unique information associated with this device.
 * Information like the devices unique ID is hashed with the application origin
 * to stop developers from being able to track devices across different domains
 * and applications.
 * 
 * @typedef {Object} Vault#DeviceInfo
 * 
 * @property {string} deviceId Unique device ID
 * 
 */
/**
 * @typedef {Object} Vault#SigninOpts
 * 
 * @property {string} [launch] URI to redirect to after the signin process is completed.
 * 
 */
/**
 * @typedef {Object} Vault#VaultOpts
 * 
 * @property {string} vault_uri Specify custom vault location
 * 
 */
/**
 * @typedef {Object} Vault#VersionInfo
 * 
 * @property {string} BUILD_VERSION Vault build version
 * @property {string} BUILD_TIMESTAMP Vault build timestamp
 */

/**
 * Class for initializing and integrating the Zippie Platform into an
 * application. This class should be instantiated and setup in the main
 * entry point of your code to properly handle signing a user in.
 * 
 * After calling [setup()]{@link Vault#setup}, you may query the instance
 * property [isSignedIn]{@link Vault#isSignedIn} to check to see if the user
 * was automatically signed in. If not, then the [signin()]{@link Vault#signin}
 * method must be called to trigger the signin process.
 * 
 * It is good practice to build a button linked to the
 * [signin()]{@link Vault#signin} process to work properly with browsers that
 * have ITP 2.0 (Internet Tracking Prevention) support, like Safari and
 * Firefox 65+
 * 
 * @class Vault
 * 
 * @param {Vault#VaultOpts} [opts] Vault API configuration.
 * 
 * @returns {Vault} New vault instance
 * 
 * @example
 * const vault = new Vault({vault_uri: 'https://vault.dev.zippie.org'})
 * vault.setup()
 *  .then(_ => vault.signin())
 *  .then(_ => {
 *    console.info('Vault initialized')
 *  })
 *  .catch(e => { console.error(e) })
 * 
 */
/**
 * Vault version information
 * @member {Vault#VersionInfo} Vault#version
 */
/**
 * Vault services configuration
 * @member {Object} Vault#config
 */
/**
 * Indicates whether the vault is initialized and the user is successfully
 * signed in with this application to their Zippie identity.
 * @member {boolean} Vault#isSignedIn
 */
export default class Vault {
  constructor (opts) {
    opts = opts || {}
    
    if (opts.klaatu) {
      this.__klaatu = true
    } else {
      this.__klaatu = false
    }
  
    if (!this.__klaatu) {
      // Parse params from URI fragment
      this.__params = this.__parse_opts(window.location)

      // Strip params from URI fragment
     if (window.location.hash.indexOf('?') !== -1) {
       window.location.hash = window.location.hash.slice(0, window.location.hash.indexOf('?'))
     }
    }

    // Enclave DOM objects
    this.__iframe = null
    this.__vault = null

    // Message receiver dispatch variables
    this.__callback_counter = 0
    this.__receivers = {}

    if (!this.__klaatu) {
      // Construct iframe to load vault enclave
      var iframe = document.createElement('iframe')

      iframe.style.display = 'none'

      iframe.sandbox += ' allow-storage-access-by-user-activation'
      iframe.sandbox += ' allow-same-origin'
      iframe.sandbox += ' allow-scripts'

      // Setup vault URI default if none provided in constructor opts.
      if (!opts.vault_uri) {
        opts.vault_uri = 'https://vault.zippie.org'

        if (window.location.host.split('.').indexOf('dev') !== -1) {
          opts.vault_uri = 'https://vault.dev.zippie.org'
        } else
          if (window.location.host.split('.').indexOf('testing') !== -1) {
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
      document.body.appendChild(iframe)
      this.__iframe = iframe
      this.__vault = iframe.contentWindow
    }

    this.__opts = opts
  }


  /**
   * Initialize the vault enclave by loading the vault into an iframe with
   * a magiccookie key (if available). Resolves when the vault is ready for
   * receiving messages.
   * 
   * This function may result in an automated signin, you can test for this
   * by reading the [isSignedIn]{@link Vault#isSignedIn} property.
   * 
   * @method Vault#setup
   */
  async setup () {
    // Don't allow setup to be called multiple times.
    if (this.__onSetupReady !== undefined) return Promise.resolve()

    await ipc.init(this)
    await secp256k1.init(this)
    await runtime.init(this)
    
    console.info('VAULT-API: Setting up Zippie Vault enclave.')
    return new Promise(function (resolve, reject) {
      let magiccookie
      
      if (this.__klaatu) {
        console.info('VAULT-API: Running in Klaatu') 
        // Setup async response handlers for when we hear "ready" from vault.
        this.__onSetupReady = resolve
        this.__onSetupError = reject

        // Setup incoming message handler.
        this.__on_message = this.__on_message.bind(this)
        this.__vault = window.parent

        window.addEventListener('message', this.__on_message)
        return resolve()
      }

      if (!this.__klaatu && 'ipc-mode' in this.__opts) {
        console.info('VAULT-API: Running in IPC mode.')

        // Setup async response handlers for when we hear "ready" from vault.
        this.__onSetupReady = resolve
        this.__onSetupError = reject

        // Setup incoming message handler.
        this.__on_message = this.__on_message.bind(this)
        this.__vault = window.parent

        window.addEventListener('message', this.__on_message)
        return resolve()
      }

      if (!this.__klaatu) {
        //   Get magic vault cookie by whatever means necessary, if provided via
        // query parameters, then save /new/ value to local storage.
        magiccookie = window.localStorage.getItem('zippie-vault-cookie')
        if (this.__params['vault-cookie'] !== undefined) {
          magiccookie = this.__params['vault-cookie']
          window.localStorage.setItem('zippie-vault-cookie', magiccookie)
        }

        if (magiccookie === '') magiccookie = null

        //   If no magic cookie was discovered redirect to vault in root mode,
        // to pick up a new magic cookie, or require user sign up.
        if (!this.__params['inhibit-signup'] && !magiccookie) {
          console.warn('VAULT-API: No vault cookie provided, redirecting to vault.')
          window.location = this.__opts.vault_uri +
            '#?launch=' + window.location + ';inhibit-signup'
          return reject()
        }
      }

      // Setup incoming message handler.
      this.__on_message = this.__on_message.bind(this)
      window.addEventListener('message', this.__on_message)

      //   We have a magic cookie, which means we should have an identity
      // initialize vault with our cookie.
      if (!this.__klaatu) {
        if (magiccookie !== null) {
          console.info('VAULT-API: Found magic cookie:', magiccookie)
          this.__iframe.src = this.__opts.vault_uri + '#?magiccookie=' + magiccookie
        }  else {
          this.__iframe.src = this.__opts.vault_uri
        }  
      }

      // Setup async response handlers for when we hear "ready" from vault.
      this.__onSetupReady = resolve
      this.__onSetupError = reject

      if (!this.__klaatu) {
        console.info('VAULT-API: Loading vault from URI:', this.__iframe.src)
      }
    }.bind(this))
  }


  /**
   * When vault is setup correctly, this function initiates a signin process,
   * which should be called from an interactive user component, like a button
   * to work correctly with browsers that have ITP 2.0 (Internet Tracking
   * Prevention) support, like Safari and Firefox 65+
   * 
   * @method Vault#signin
   * 
   * @param {Vault#SigninOpts} [opts] Options to pass to Vault during signin process.
   * @param {bool} [noLogin] (internal use only)
   */
  signin (opts, noLogin) {
    if (this.isSignedIn) return Promise.resolve()
    if (this.__klaatu) return Promise.resolve()

    this.__signin_opts = opts || {}
    console.info('VAULT-API: Attempting to signin.')

    //   If we've been launched with inhibit-signup specified, and vault reports
    // no identity (no magiccookie set). Initiate signup process.
    let magiccookie = window.localStorage.getItem('zippie-vault-cookie')
    if (this.__params['inhibit-signup'] && !magiccookie) {
      this.__signin_opts.launch = this.__signin_opts.launch || window.location.href
      let paramstr = ''
      Object.keys(this.__signin_opts).forEach(k => {
        paramstr += (paramstr.length === 0 ? '' : ';')
          + k + '=' + this.__signin_opts[k]
      })

      console.info('VAULT-API: Redirecting to:', this.__opts.vault_uri + '#?' + paramstr)
      window.location = this.__opts.vault_uri + '#?' + paramstr
      return Promise.reject()
    }

    return new Promise(function (resolve, reject) {
      if (noLogin) return resolve()

      //   Send 'login' message for ITP support.
      this.message({login: null})
        .then(function (r) {
          console.info('VAULT-API: Vault reports ITP access granted.')

          this.__onSetupReady = resolve
          this.__onSetupError = reject

          // XXX - https://bugs.webkit.org/show_bug.cgi?id=188783
          //   This should cause a "ready" message down the line, which is
          // picked up by the above promise resolve/reject, which in turn
          // triggers the continuation of the signin process.
          this.message({reboot: null})

          if ('itp' in this.__params) {
            console.info('VAULT-API: ITP ITP ITP ITP')
            delete this.__params['itp']
          }
        }.bind(this))
    }.bind(this))

    .then(function (r) {
      if (this.isSignedIn === undefined) return Promise.reject('Not setup')

      return this.message({signin: this.__signin_opts})
    }.bind(this))

    .then(function (r) {
      if (r && r.error && r.launch && !this.__signin_opts['inhibit-signup']) {
        this.__signin_opts.launch = this.__signin_opts.launch || window.location.href

        let paramstr = ''
        Object.keys(this.__signin_opts).forEach(k => {
          paramstr += (paramstr.length === 0 ? '' : ';')
            + k + '=' + this.__signin_opts[k]
        })

        window.location = r.launch + '#?' + paramstr
      }

      return appcache.init(this)
    }.bind(this))

    .catch(function (e) {
      if (e === 'ITP_REQUEST_FAILURE') {
        console.warn('VAULT-API: Vault reported ITP request failure, redirecting to vault for authorization.')
        window.location = this.__opts.vault_uri + '#?launch=' + window.location + ';itp'
        return
      }

      if (e.error === 'VAULT_NO_DATACOOKIE' || e.error === 'VAULT_DECRYPT_DATACOOKIE_ERROR') {
        console.warn('VAULT-API: Vault reported data cookie issue.')
        window.localStorage.removeItem('zippie-vault-cookie')
        window.location = this.__opts.vault_uri + '#?launch=' + window.location
        return
      }

      return Promise.reject(e)
    }.bind(this))
  }


  /**
   * Low-Level API which sends a raw request message to the vault enclave.
   * Returns a promise that resolves or rejects depending on the received
   * result.
   * 
   * @method Vault#message
   * 
   * @param {Vault#Message} request Message to send
   * 
   * @returns {Promise} response
   */
  message (req) {
    if (!this.__vault) {
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
   * Request this devices' identification information.
   * 
   * @method Vault#getDeviceInfo
   * 
   * @returns {Vault#DeviceInfo} Device information
   */
  getDeviceInfo () {
    return this.message({ getDeviceInfo: null })
  }

  /**
   * Request identity enrollments, this is a list of devices and recovery
   * methods.
   * 
   * @method Vault#enrollments
   * 
   * @private
   * 
   * @returns {Array.<Vault#Enrollment>} Users' enrollments
   */
  enrollments () {
    return this.message({ enrollments: null })
  }

  /**
   * Request user data
   * 
   * @method Vault#getUserData
   * 
   * @private
   * 
   * @param {string} id User data key to get value of
   * 
   * @returns {Any} Userdata
   */
  getUserData (id) {
    return this.message({ userdata: { get: { key: id } }})
  }

  /**
   * Assign user data.
   * 
   * @method Vault#setUserData
   * 
   * @private
   * 
   * @param {string} id User data key to overwrite value of
   * @param {Any} value New value
   */
  setUserData (id, value) {
    return this.message({ userdata: { set: { key: id, value: value }}})
  }


  /**
   * Event handler for incoming messages from vault.
   * 
   * @access private
   */
  __on_message (event) {
      // Ignore messages not from vault
      if (event.source !== this.__vault) return

      // Ignore IPC messages which are handled in ipc module.
      if ('call' in event.data) return

      console.info('VAULT-API: Received message:', event.data)

      // If there's a receiver setup for this message, handle it.
      if (event.data.callback && this.__receivers[event.data.callback]) { 
        console.info('VAULT-API: Invoking message callback.')
        let receiver = this.__receivers[event.data.callback]  
        delete this.__receivers[event.data.callback]

        // Call receiver promise reject
        if (event.data.error) return receiver[1](event.data.error)

        // Call receiver promise resolve
        return receiver[0](event.data.result)
      }

      if ('login' in event.data || 'ready' in event.data) {
        console.info('VAULT-API: processing vault login/ready message.')

        this.__get_vault_attr('version')() 
          .then(this.__get_vault_attr('config'))
          .then(this.__get_vault_attr('isSignedIn'))
          .then(async function () {
            //   If we have a magiccookie from a previous session, then retrieve
            // it, and attempt an automatic signin, we can presume we've already
            // been granted cookie access from a previous session.
            if (this.__klaatu) {
              return this.__onSetupReady()
            }
            let magiccookie = window.localStorage.getItem('zippie-vault-cookie')
            if ('ready' in event.data && magiccookie) {
              return this.signin(this.__signin_opts, true)
                .then(this.__get_vault_attr('version'))
                .then(this.__get_vault_attr('config'))
                .then(this.__get_vault_attr('isSignedIn'))
                .then(function () {
                  if (this.isSignedIn) return appcache.init(this)
                }.bind(this))
                .then(this.__onSetupReady)
                .catch(e => { console.error(e) })
            }

            if (this.isSignedIn) await appcache.init(this)

            return this.__onSetupReady()
          }.bind(this))

        return
      }

      console.warn('VAULT-API: unhandled vault message event:', event)
  }

  /**
   * Parse hash query parameters into an object.
   * 
   * @access private
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
        params[parts[0]] = decodeURIComponent(parts[1])
      }
    }

    return params
  }


  /**
   *   Send vault message to request a vault, and store value in corrosponding
   * instance attribute.
   * 
   * @access private
   */
  __get_vault_attr (attr) {
    return function () {
      let mesg = {}
      mesg[attr] = null
      return this.message(mesg).then(function (r) { this[attr] = r }.bind(this))
    }.bind(this)
  }
}

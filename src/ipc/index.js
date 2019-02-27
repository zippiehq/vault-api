/*
 * Copyright (c) 2019 Zippie Ltd.
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
 *
 */
import * as Client from './client'
import * as Service from './service'

/** @module ipc */

var __context

/**
 * Initialize Vault API remote IPC functionality.
 * 
 * This function is called in the Vault API setup function.
 * 
 * @access private
 *
 * @param {Vault} vault Vault API instance
 */
export async function init (vault) {
  __context = vault

  Client.init(vault)
  Service.init(vault)

  vault.ipc = {
    /**
     * @function createClient
     * 
     * @desc Create remote IPC service client
     * 
     * @param {string} uri Remote application service location
     * @param {string} tag Remote application service descriptor
     * 
     * @returns {IPCClient}
     * 
     * @example
     * vault.ipc.createClient('https://my.dev.zippie.org', 'wallet')
     *   .then(async wallet => {
     *     console.info('Read Accounts:', await wallet.getAccounts())
     *   })
     * 
     */
    createClient: Client.connect,

    /**
     * @function createService
     * 
     * @desc Create local IPC service
     * 
     * @param {string} tag Remote application service descriptor
     * 
     * @returns {IPCService}
     * 
     * @example
     * vault.ipc.createService('wallet')
     *   .then(ipc => {
     *     ipc.addReceiver(function sayHello (name) { return "Hello, " + name })
     *     ipc.ready()
     *   })
     */
    createService: Service.register,
  }

  window.addEventListener('message', Service.dispatch)
}

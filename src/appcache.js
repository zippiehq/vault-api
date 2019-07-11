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
 *
 */

const storeEngine = require('store/src/store-engine')
const storeLocalStorage = require('store/storages/localStorage')
const storeMemoryStorage = require('store/storages/memoryStorage')

export async function init (vault) {
  if (vault.__klaatu) {
    vault.appcachestore = storeEngine.createStore([storeMemoryStorage], [])
  } else {
    vault.appcachestore = storeEngine.createStore([storeLocalStorage], [])
  }

  console.info('VAULT-API: VaultAppCache checking device ID...')

  const deviceId = vault.appcachestore.get('zippie-device-id')
  const deviceInfo = await vault.getDeviceInfo()

  if (deviceInfo.deviceId !== deviceId) {
    console.info('VAULT-API: VaultAppCache device ID mismatch, clearing...')
    clear(vault)
    vault.appcachestore.set('zippie-device-id', deviceInfo.deviceId)
  }
  console.log('VAULT-API: Appcache initialized')
}

export function get (vault, key, req) {
  key = 'zippie-appcache-' + key

  let value = vault.appcachestore.get(key)
  if (value) {
    console.info('VAULT-API: VaultAppCache pulled value for message:', req)
    return Promise.resolve(value)
  }

  return vault.message(req)
    .then(r => {
      console.info('VAULT-API: VaultAppCache caching value for message:', req)
      vault.appcachestore.set(key, r)
      return r
    })
}

export function remove (vault, key) {
  vault.appcachestore.remove('zippie-appcache-' + key)
}

export function clear (vault) {
  var keys = []
  vault.appcachestore.each(function(val, key) {
    if (key.startsWith('zippie-appcache-')) {
      keys.push(key)
    }
  })
  
  for (let i = 0; i < keys.length; i++) {
    vault.appcachestore.remove(keys[i])
  }
}

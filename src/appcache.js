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
export async function init (vault) {
  if (vault.__klaatu) 
    return
    
  console.info('VAULT-API: VaultAppCache checking device ID...')
  

  const deviceId = localStorage.getItem('zippie-device-id')
  const deviceInfo = await vault.getDeviceInfo()

  if (deviceInfo.deviceId !== deviceId) {
    console.info('VAULT-API: VaultAppCache device ID mismatch, clearing...')
    clear(vault)
    localStorage.setItem('zippie-device-id', deviceInfo.deviceId)
  }
}

export function get (vault, key, req) {
  if (!vault.__klaatu)
  {
    key = 'zippie-appcache-' + key

    let value = localStorage.getItem(key)
    if (value) {
      console.info('VAULT-API: VaultAppCache pulled value for message:', req)
      return Promise.resolve(JSON.parse(value))
    }  
  }  

  return vault.message(req)
    .then(r => {
      if (!vault.__klaatu) {
        console.info('VAULT-API: VaultAppCache caching value for message:', req)
        localStorage.setItem(key, JSON.stringify(r))
      }
      return r
    })
}

export function remove (key) {
  if (vault.__klaatu) 
     return
     
  localStorage.removeItem('zippie-appcache-' + key)
}

export function clear (vault) {
  if (vault.__klaatu)
     return
     
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('zippie-appcache-')) {
      localStorage.removeItem(key)
    }
  }
}

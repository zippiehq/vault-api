
var vault = require('./index.js')
var vaultSecp256k1 = require('./secp256k1.js')

opts = {}

if (location.hash.startsWith('#zipper-vault=')) {
   opts = { 'vaultURL' : location.hash.slice('#zipper-vault='.length) }
}
vault.init(opts).then((result) => {
  console.log('got inited:')
  console.log(result)
  vaultSecp256k1.keyInfo(vault, 'm/0').then((result) => {
    console.log(result)
  })
}, (error) => {
  console.log('encountered error: ')
  if (error.error === 'launch') {
    vault.launch(error.launch)
  }
  console.log(error)
})

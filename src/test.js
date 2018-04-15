

var vault = require('./index.js')
var vaultSecp256k1 = require('./secp256k1.js')

opts = {}

if (location.hash.startsWith('#zippie-vault=')) {
   opts = { 'vaultURL' : location.hash.slice('#zippie-vault='.length) }
}
vault.init(opts).then((result) => {
  console.log('got inited:')
  console.log(result)
  vaultSecp256k1.keyInfo(vault, 'm/0').then((result) => {
    console.log(result)
    vaultSecp256k1.sign(vault, 'm/0', '0123456789012345678901234567890123456789012345678901234567890101').then((result) => {
      console.log(result)
    })
  })
}, (error) => {
  console.log('encountered error: ')
  if (error.error === 'launch') {
    vault.launch(error.launch)
  }
  console.log(error)
})

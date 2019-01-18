import * as vaultsecp256k1 from '../src/secp256k1.js'
import * as shajs from 'sha.js'

describe('Secp256k1', function() {

  describe('Key Info Fetch Tests', function() {
      ["m/0","m/1","m/1/1"].forEach(function(key) {
       it('keyinfo', function(done) {
        vaultsecp256k1.keyInfo(window.vault, key).then(keyInfo => {
          chai.expect(keyInfo).to.be.an('object')
          chai.expect(keyInfo).to.have.all.keys('pubex', 'pubkey')
          chai.expect(keyInfo.pubex).to.be.a('string')
          chai.expect(keyInfo.pubkey).to.be.a('string')
          done();
        })
      })
    })
  })

  describe('Sign Tests', function() {
    it('sign', function(done) {
      vaultsecp256k1.sign(window.vault, "m/0", shajs('sha256').update('data to sign goes here').digest())
        .then(output => {
          chai.expect(output).to.be.an('object')
          chai.expect(output).to.have.all.keys('signature', 'recovery', 'hash')
          chai.expect(output.signature).to.be.a('string')
          chai.expect(output.recovery).to.be.a('number')
          chai.expect(output.hash).to.be.an('Uint8Array')
          done()
        })
    })
  })

  describe('Encrypt / Decrypt Tests', function() {
    it('encrypt', function(done) {
      vaultsecp256k1.keyInfo(window.vault, "m/0").then((keyInfo) => {
        vaultsecp256k1.encrypt(window.vault, keyInfo.pubkey, Buffer.from("message to encrypt").toString('hex')).then(message => {
          chai.expect(message).to.be.an('object')
          chai.expect(message).to.have.all.keys('ciphertext', 'iv', 'mac', 'ephemPublicKey')
          chai.expect(message.ciphertext).to.be.a('string')
          chai.expect(message.mac).to.be.a('string')
          chai.expect(message.iv).to.be.a('string')
          chai.expect(message.ephemPublicKey).to.be.a('string')
          done()
        })
      })
    }).timeout(5000)

    it('decrypt', function(done) {
      vaultsecp256k1.keyInfo(window.vault, "m/0").then((keyInfo) => {
        vaultsecp256k1.encrypt(window.vault, keyInfo.pubkey, Buffer.from("message to encrypt").toString('hex')).then(message => {
          vaultsecp256k1.decrypt(window.vault, "m/0", message).then(decrypted => {
            chai.expect(decrypted).to.be.a('string')
            chai.expect(Buffer.from(decrypted, 'hex').toString()).to.eq("message to encrypt")
            done()
          })
        })
      })
    }).timeout(5000)

  })
})
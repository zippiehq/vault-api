import Vault from '../src/index.js'
import * as constants from '../src/constants.js'

describe('Vault-API', function () {
    it('setup', function (done) {
      window.vault.setup().then(() => {
        window.vault.signin().then(() => {
          done();
        })
      })
    })
 
    it('version', function(done) {
      window.vault.version().then((version) => {
       chai.expect(version).to.be.an('object')
       chai.expect(version).to.have.property('BUILD_VERSION').that.is.a('string')
       chai.expect(version).to.have.property('BUILD_TIMESTAMP').that.is.a('string')
       done();
     }) 
    })

    it('config', function(done) {
      window.vault.config().then((config) => {
        chai.expect(config).to.be.an('object')
        chai.expect(config).to.have.all.keys('apis', 'apps', 'uri')
        chai.expect(config.apis).to.have.all.keys('fms', 'permastore')
        chai.expect(config.apps).to.have.all.keys('root', 'user')
        done();
      })
    })

    it('enrollments', function(done) {
      window.vault.enrollments().then((enrollments) => {
        chai.expect(enrollments).to.be.an('array').that.is.not.empty
        done()
      })
    }).timeout(5000)
})

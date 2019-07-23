import Vault from '../src/index.js'
import * as constants from '../src/constants.js'

describe('Vault-API', function () {
    it('setup', function (done) {
      this.timeout(20000)
      window.vault.setup().then(() => {
        window.vault.signin().then(() => {
          done();
        })
      })
    })
 
    it('version', function(done) {
      chai.expect(window.vault.version).to.be.an('object')
      chai.expect(window.vault.version).to.have.property('BUILD_VERSION').that.is.a('string')
      chai.expect(window.vault.version).to.have.property('BUILD_TIMESTAMP').that.is.a('string')
      done();
    })

    it('config', function(done) {
      console.log(window.vault.config)
      chai.expect(window.vault.config).to.be.an('object')
      chai.expect(window.vault.config).to.have.all.keys(['apis', 'apps', 'uri'])
      chai.expect(window.vault.config.apis).to.be.an('object')
      
      chai.expect(window.vault.config.apis).to.have.all.keys(['fms', 'permastore', 'mailbox'])
      chai.expect(window.vault.config.apps).to.have.all.keys(['root', 'user'])
      done();
    })

    it('enrollments', function(done) {
      window.vault.enrollments().then((enrollments) => {
        chai.expect(enrollments).to.be.an('array').that.is.not.empty
        done()
      })
    }).timeout(5000)
})

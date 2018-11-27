import * as  vault from '../src/index.js'

describe('Vault-API', function () {
    it('init', function (done) {
      var opts = {vaultURL: 'https://vault.dev.zippie.org'}
      vault.init(opts).then(() => {
        done();
      })
    })
 
    it('version', function(done) {
     vault.version().then((version) => {
       chai.expect(version).to.be.an('object')
       chai.expect(version).to.have.property('BUILD_VERSION').that.is.a('string')
       chai.expect(version).to.have.property('BUILD_TIMESTAMP').that.is.a('string')
       done();
     }) 
    })

    it('config', function(done) {
      vault.config().then((config) => {
        chai.expect(config).to.be.an('object')
        chai.expect(config).to.have.all.keys('apis', 'apps', 'uri')
        chai.expect(config.apis).to.have.all.keys('fms', 'permastore')
        chai.expect(config.apps).to.have.all.keys('root', 'user')
        done();
      })
    })

    it('enrollments', function(done) {
      vault.enrollments().then((enrollments) => {
        chai.expect(enrollments).to.be.an('array').that.is.not.empty
        done()
      })
    }).timeout(5000)
})

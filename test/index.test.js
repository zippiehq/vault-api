import Vault from '../src/index.js'
import * as constants from '../src/constants.js'

describe('Vault-API', function () {
    console.log(window.vault.__klaatu)
    if (window.vault.__klaatu) {
      it('klaatu-first-setup', function (done) {
        this.timeout(20000)
        window.vault.setup().then(() => {
          console.log('did setup')
          window.vault.message({newidentity: null}).then(() => {
            window.vault.signin().then(() => {
              console.log('did signin')
              done();
            }).catch((err) => {
              console.log(err)
            })
           }).catch((err) => {
            console.log(err)
           })
         }) 
      })
     } else {
      it('vault-setup', function (done) {
        this.timeout(20000)
        window.vault.setup().then(() => {
          console.log('did setup')
          window.vault.signin().then(() => {
              console.log('did signin')
                done();
          }).catch((err) => {
            console.log(err)
            })
          }).catch((err) => {
            console.log(err)
          })
      })
     }
    
    it('version', function(done) {
      window.vault.__get_vault_attr('version')().then(async function () {
        chai.expect(window.vault.version).to.be.an('object')
        chai.expect(window.vault.version).to.have.property('BUILD_VERSION').that.is.a('string')
        chai.expect(window.vault.version).to.have.property('BUILD_TIMESTAMP').that.is.a('string')
        done();
      })
    })

    it('config', function(done) {
      window.vault.__get_vault_attr('config')().then(async function () {
        console.log(window.vault.config)
        chai.expect(window.vault.config).to.be.an('object')
       chai.expect(window.vault.config).to.have.all.keys(['apis', 'apps', 'uri'])
       chai.expect(window.vault.config.apis).to.be.an('object')
      
       chai.expect(window.vault.config.apis).to.have.all.keys(['fms', 'permastore', 'mailbox'])
       chai.expect(window.vault.config.apps).to.have.all.keys(['root', 'user'])
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

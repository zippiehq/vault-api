describe('IPC API', function() {
    if (window.vault.__klaatu) {

      let ipc = undefined
      describe('ipc basics', function() {
            it('connect', function(done) {
                vault.ipc.createClient('/permastore2/030b4bbc7a00d29051e5c51bd783730757dd62a1e0333e4fd6a2a400579acf7ae1', 'demo-service').then((service) => {
                   console.log('connected to service ' + service)
                   ipc = service
                   done()
                }).catch((error) => {
                  console.log('caught error creating IPC ' + error)
                  done(error)
                })
            }).timeout(20000)

            it('test throw', function(done) {
               ipc.throw().then(() => {
                  done('did not throw')
               }).catch((error) => {
                  done()
               })
            }).timeout(20000)
        })
    }
})
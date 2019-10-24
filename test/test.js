import './index.test.js'
import './secp256k1.test.js'
import './ipc.test.js'

mocha.checkLeaks();
mocha.run();

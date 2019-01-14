import './index.test.js'
import './secp256k1.test.js'
import './wallet_api.test.js'

mocha.checkLeaks();
mocha.run();

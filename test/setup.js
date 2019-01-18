import 'https://unpkg.com/chai@4.1.2/chai.js';
import Vault from '../src/index.js'
import * as constants from '../src/constants.js'

mocha.setup('bdd');

var opts = {vault_uri: constants.ZippieVaultURL}
window.vault = new Vault(opts)

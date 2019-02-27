import * as wallet from '../src/wallet_api'
import * as constants from '../src/constants.js'

const WETH_ADDRESS = "0xd0A1E359811322d97991E03f863a0C30C2cF029C"
const ZIPT_ADDRESS = "0x374FaBa19192a123Fbb0c3990e3EeDcFeeaad42A"
const SNOUT_ADDRESS = "0x236425d1CD5dc250AdAdd1405871f1f285347F01"
const FANT_ADDRESS = "0x5A32259f5661207935d031C9d5a59571F70B9252"

describe('Wallet API', function() {

    describe('Wallet Init', function() {
        it('initialise', function(done) {
            wallet.walletInit(window.vault, constants.ZippieWalletURL).then(() => {
                done();
            }).catch((error) => {
                done(error)
            })
        }).timeout(5000)
    })

    describe('Get Token Account', function() {
        [   
            ZIPT_ADDRESS,
            WETH_ADDRESS,          
        ].forEach(function(token_addr) {
            it('getAccountForToken', function(done) {
                wallet.getAccountForToken(window.vault, token_addr).then((address) => {
                    chai.expect(address).to.be.a('string')
                    done();
                }).catch((error) => {
                    done(error)
                })
            })
        })
    })

    describe('Get Token Balance', function() {
        [
            ZIPT_ADDRESS,
            WETH_ADDRESS
        ].forEach(function(token_addr) {
            it('getTokenBalance', function(done) {
                wallet.getTokenBalance(window.vault, token_addr).then((balance) => {
                    chai.expect(balance).to.be.a('string')
                    done()
                }).catch((error) => {
                    done(error)
                })
            })
        })
    })

    describe('Get Payment Info', function() {
        ["d2916cdf34344b4198c374e4aaeed9797caaa18366112ffbf20dcd80edb46224,428ab13acbad47c8bd648d0f31ff90aa286fe6687fd5c604a4b699184cedfb3d"
        ].forEach(function(hash) {
            it('getPaymentInfo', function(done) {
                wallet.getPaymentInfo(window.vault, hash).then((check_info) => {
                    console.info(check_info)

                    chai.expect(check_info.blankCheckData).to.be.an('object')
                    chai.expect(check_info.blankCheckData).to.have.all.keys('check', 'multisigAccount')
                    chai.expect(check_info.blankCheckData.check).to.have.all.keys('amount', 'message', "r1", "s1", "v1", 'verificationKey')
                    chai.expect(check_info.blankCheckData.multisigAccount).to.have.all.keys("accountAddress", "approveTx", "contractAddress", "m", "r0", "s0", "signerAddress", "tokenAddress", "v0")
                    done()
                }).catch((error) => {
                    done(error)
                })
            })
        })
    })

    describe('Create Token Account', function() {
        [FANT_ADDRESS, SNOUT_ADDRESS].forEach(function(token_contract) {
            it('createAccountForToken', function(done) {
                wallet.createAccountForToken(window.vault, token_contract).then((account) => {
                    console.info(account)
                    chai.expect(account).to.be.an('object')
                    chai.expect(account).to.include.keys('accountAddress', 'approveTx', 'contractAddress', 'dappUri', 'm','r0','s0','signerAddress', 'tokenAddress', 'v0')
                    done()
                }).catch((error) => {
                    done(error)
                })
            }).timeout(5000)
        })
    })

    describe('Create Payment Link', function() {
        [FANT_ADDRESS, SNOUT_ADDRESS].forEach(function(token_contract) {
            it('createPaymentLink', function(done) {
                wallet.createPaymentLink(window.vault, token_contract, 1, 'test message').then((link) => {
                    done()
                }).catch((error) => {
                    done(error)
                })
            })
        })
    })
})
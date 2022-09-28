const ethers = require('ethers');

// Obviously only use this for testing
const wallet = ethers.Wallet.createRandom()
console.log(JSON.stringify(wallet))
console.log(wallet._signingKey())
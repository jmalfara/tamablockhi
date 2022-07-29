const { privateKeyDev } = require('../../config')
const { network: networkConfig } = require('../config')
const { abi, networks } = require('../../build/contracts/Ligma.json')

const network = networks[networkConfig.chainId]
const ethers = require('ethers');

const providerRPC = {
  dev: networkConfig
};

const provider = new ethers.providers.StaticJsonRpcProvider(
  providerRPC.dev.rpc,
  {
    chainId: providerRPC.dev.chainId,
    name: providerRPC.dev.name,
  }
);

// 4. Create wallet
let wallet = new ethers.Wallet(privateKeyDev, provider);


// 3. Contract address variable
const contractAddress = network.address;

// 4. Create contract instance
const contract = new ethers.Contract(contractAddress, abi, wallet);

// 5. Create get function
const request = async () => {
  console.log(`Making a call to contract at address: ${contractAddress}`);
  const data = await contract.totalSupply();
  console.log(`Total Supply: ${data}`)
};

request();

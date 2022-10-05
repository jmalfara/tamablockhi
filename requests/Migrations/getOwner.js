const { network: networkConfig } = require('../config')
const { abi, networks } = require('../../build/contracts/Tamablockhi.json')

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

// 3. Contract address variable
const contractAddress = network.address;

// 4. Create contract instance
const migrations = new ethers.Contract(contractAddress, abi, provider);

// 5. Create get function
const get = async () => {
  console.log(`Making a call to contract at address: ${contractAddress}`);

  // 6. Call contract 
  const data = await migrations.owner();

  console.log(`The owner of this contract is: ${data}`);
};

// 7. Call get function
get();
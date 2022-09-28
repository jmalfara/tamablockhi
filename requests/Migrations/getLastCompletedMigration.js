const { network: networkConfig } = require('../config')
const { abi, networks } = require('../../build/contracts/Tamoblockhi.json')

const network = networks[networkConfig.chainId]
const ethers = require('ethers');

// 2. Define network configurations
const ethers = require('ethers');
const providerRPC = {
    dev: networkConfig,
  };
  // 3. Create ethers provider
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
  const data = await migrations.last_completed_migration();

  console.log(`The last completed migration is: ${data}`);
};

// 7. Call get function
get();
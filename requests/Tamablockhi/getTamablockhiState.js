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
const contract = new ethers.Contract(contractAddress, abi, provider);

// 5. Create get function
const request = async () => {
  const args = process.argv.slice(2);
  console.log(`Making a call to contract at address: ${contractAddress}`);
  const data = await contract.getTamablockhiState(args[0]);
  console.log(`${data}`);
};

request();

// balanceOf: [Function (anonymous)],
// balanceOfBatch: [Function (anonymous)],
// exists: [Function (anonymous)],
// isApprovedForAll: [Function (anonymous)],
// owner: [Function (anonymous)],
// renounceOwnership: [Function (anonymous)],
// safeBatchTransferFrom: [Function (anonymous)],
// safeTransferFrom: [Function (anonymous)],
// setApprovalForAll: [Function (anonymous)],
// supportsInterface: [Function (anonymous)],
// totalSupply: [Function (anonymous)],
// transferOwnership: [Function (anonymous)],
// uri: [Function (anonymous)],
// setURI: [Function (anonymous)],
// starvationBlockOf: [Function (anonymous)],
// dehydrationBlockOf: [Function (anonymous)],
// poopScheduledForBlocks: [Function (anonymous)],
// cropScheduledForBlock: [Function (anonymous)],
// hatch: [Function (anonymous)],
// feed: [Function (anonymous)],
// water: [Function (anonymous)],
// clean: [Function (anonymous)],
// pet: [Function (anonymous)],
// plantFood: [Function (anonymous)],
// harvestFood: [Function (anonymous)],
// mate: [Function (anonymous)],
// uAdjustedAmount: [Function (anonymous)]
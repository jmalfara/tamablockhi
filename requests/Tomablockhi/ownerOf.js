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

// 3. Contract address variable
const contractAddress = network.address;

// 4. Create contract instance
const contract = new ethers.Contract(contractAddress, abi, provider);

// 5. Create get function
const request = async () => {
  const args = process.argv.slice(2);
  console.log(`Making a call to contract at address: ${contractAddress}`);
  const data = await contract.ownerOf(parseInt(args[0]));
  console.log(`The name of this NFT is: ${data}`);
};

request();

// 'approve(address,uint256)': [Function (anonymous)],
// 'balanceOf(address)': [Function (anonymous)],
// 'getApproved(uint256)': [Function (anonymous)],
// 'isApprovedForAll(address,address)': [Function (anonymous)],
// 'name()': [Function (anonymous)],
// 'owner()': [Function (anonymous)],
// 'ownerOf(uint256)': [Function (anonymous)],
// 'renounceOwnership()': [Function (anonymous)],
// 'safeTransferFrom(address,address,uint256)': [Function (anonymous)],
// 'safeTransferFrom(address,address,uint256,bytes)': [Function (anonymous)],
// 'setApprovalForAll(address,bool)': [Function (anonymous)],
// 'supportsInterface(bytes4)': [Function (anonymous)],
// 'symbol()': [Function (anonymous)],
// 'tokenURI(uint256)': [Function (anonymous)],
// 'transferFrom(address,address,uint256)': [Function (anonymous)],
// 'transferOwnership(address)': [Function (anonymous)],
// 'safeMint(address)': [Function (anonymous)],
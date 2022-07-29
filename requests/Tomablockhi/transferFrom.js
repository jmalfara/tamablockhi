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
  const block = await provider.getBlockNumber().then((blockNumber) => {
    return provider.getBlock(blockNumber)
  });
  console.log("Previous Block " + block.number);

  const args = process.argv.slice(2);
  console.log(`Making a call to contract at address: ${contractAddress}`);

  const overrides = {
   gasLimit: 250000
  };

  try {
    const transaction = await contract.transferFrom(
      args[0],
      args[1],
      parseInt(args[2]),
      overrides
    );
    await transaction.wait()
    console.log("Transaction successful")
  } catch (e) {
    console.log(e)
  } finally {
    const newBlock = await provider.getBlockNumber().then((blockNumber) => {
      return provider.getBlock(blockNumber)
    });
    console.log("New Block " + newBlock.number);
  }

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
const { privateKeyDev } = require('./config');
const HDWalletProvider = require('@truffle/hdwallet-provider');

if (!privateKeyDev.trim()) {
   throw new Error(
      'Please enter a private key with funds, you can use the default one'
   );
}

const rpcDev = 'http://localhost:9933/'
const rpcMoonbaseAlpha = 'https://rpc.api.moonbase.moonbeam.network'
const rpcMoonbase = 'https://rpc.api.moonbase.moonbeam.network'

module.exports = {
   networks: {
      // Moonbeam Development Network
      dev: {
         rpc: rpcDev,
         provider: () => {
            return new HDWalletProvider(
               privateKeyDev,
               rpcDev
            );
         },
         network_id: 1281,
      },
      // Moonbase Alpha TestNet
      alpha: {
         rpc: rpcMoonbaseAlpha,
         provider: () => {
            return new HDWalletProvider(
               privateKeyDev,
               rpcMoonbaseAlpha
            );
         },
         network_id: 1287,
      },
      moonbase: {
         rpc: rpcMoonbase,
         provider: () => {
            return new HDWalletProvider(
               privateKeyDev,
               rpcMoonbase
            );
         },
         network_id: 1287,
      },
   },
   // Solidity 0.8.0 Compiler
   compilers: {
      solc: {
         version: '^0.8.0',
      },
   },
   // Moonbeam Truffle Plugin & Truffle Plugin for Verifying Smart Contracts
   plugins: ['moonbeam-truffle-plugin', 'truffle-plugin-verify'],
};

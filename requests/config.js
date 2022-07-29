const { networks } = require('../truffle-config');

module.exports = {
    network: {
        name: 'moonbeam',
        rpc: networks.dev.rpc,
        chainId: networks.dev.network_id
    },
}
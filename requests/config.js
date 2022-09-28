const { networks } = require('../truffle-config');

module.exports = {
    network: {
        name: 'moonbeam',
        rpc: networks.alpha.rpc,
        chainId: networks.alpha.network_id
    },
}
// Example test script - Uses Mocha and Ganache
const Contract = artifacts.require("Tamoblockhi");

const mine = (timestamp) => {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: Date.now(),
        params: [timestamp],
      }, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }

const mineMany = async (blocks, timestamp) => {
    for (i = 0; i < blocks; i++) {
        await mine(timestamp)
        await sleep(1)
    }
  }

const sleep = ms => new Promise(r => setTimeout(r, ms));


contract('Tamoblockhi', accounts => {
    let contract;
    beforeEach(async () => {
        // Deploy token contract
        contract = await Contract.new({ from: accounts[0] });
    });

    it("Inital egg balance for owner", async () => {
        const balance = await contract.balanceOf(
            accounts[0],
            4
        );

        assert.equal(
            balance,
            8888, 
            `Unexpected starting amount`
        );
    });

    it("Hatch egg balance for owner", async () => {
        await contract.hatch(
            accounts[0],
            []
        );

        const tamoBalance = await contract.balanceOf(
            accounts[0],
            11
        );

        assert.equal(
            tamoBalance,
            1, 
            `Unexpected tamo amount`
        );
    });

    it("Hatched Toma dies of starvation after blocks", async () => {
        const expectedTamoId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await mineMany(7000, 1000)
        
        try {
            await contract.feed(
                accounts[0],
                expectedTamoId,
                4
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "Tamo has died of starvation", "Expected Error")
        }
    });

    it("Hatched Toma dies of dehydration after blocks", async () => {
        const expectedTamoId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.feed(
            accounts[0],
            expectedTamoId,
            1
        );

        await mineMany(7000, 1000)
    
        try {
            await contract.feed(
                accounts[0],
                expectedTamoId,
                1
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "Tamo has died of thirst", "Expected Error")
        }
    });

    it("feed fails if over fed in a single transaction", async () => {
        const expectedTamoId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        try {
            await contract.feed(
                accounts[0],
                expectedTamoId,
                4
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "Toma is too full to eat that much food", "Expected Error")
        }
    });

    it("feed multiple in single transaction", async () => {
        const expectedTamoId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.feed(
            accounts[0],
            expectedTamoId,
            2
        );

        let block = await web3.eth.getBlock("latest")
        let newStarvationBlock = await contract.starvationBlock.call(expectedTamoId)
        
        assert.equal(
            (newStarvationBlock - block.number), 
            19184, 
            "New starvation block does not add up"
        )
    });

    it("feed requires burns food, delays starvation and increases tiredness", async () => {
        let { number: startingBlockNumber } = await web3.eth.getBlock("latest")
        console.log(startingBlockNumber)
        
        const expectedTamoId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        const starvationBlock = await contract.starvationBlockOf(expectedTamoId)
        assert.equal(
            starvationBlock,
            startingBlockNumber + 1 + 6395, 
            `Unexpected tamo amount`
        );

        const tirednessBlock = await contract.fullyRestedAfterBlockOf(expectedTamoId)
        assert.equal(
            tirednessBlock,
            startingBlockNumber + 1, 
            `Unexpected tamo amount`
        );
        
        // Mine more blocks to allow feeding
        await mineMany(6000, 10000)

        await contract.feed(
            accounts[0],
            expectedTamoId,
            1
        );

        const starvationBlock2 = await contract.starvationBlockOf(expectedTamoId)
        assert.equal(
            starvationBlock2,
            startingBlockNumber + 1 + 12790, 
            `Unexpected tamo amount`
        );

        const tirednessBlock2 = await contract.fullyRestedAfterBlockOf(expectedTamoId)
        assert.equal(
            tirednessBlock2,
            startingBlockNumber + 1 + 3000, 
            `Unexpected tamo amount`
        );
    });
});

/*
        let block = await web3.eth.getBlock("latest")
        console.log(block.number)

        let starvations = await contract.starvationBlock.call(expectedTamoId)
        console.log(starvations)
*/

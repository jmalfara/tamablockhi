// Example test script - Uses Mocha and Ganache
const Contract = artifacts.require("Tamablockhi");

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

const mineMany = async (blocks) => {
    for (i = 0; i < blocks; i++) {
        await mine(1000)
        await sleep(1)
        if (i % 1000 == 0) {
            console.log("Mining many blocks: " + i)
        }
    }
  }

const sleep = ms => new Promise(r => setTimeout(r, ms));

const debugLogState = async (contract, tamaId) => {
    let { number: blockNumber } = await web3.eth.getBlock("latest")
    console.log("Current Block: " + blockNumber)
    const state = await contract.getTamablockhiState(tamaId, false);
    console.log("Starves after: " + state.starvationBlock)
    console.log("Dehydrates after: " + state.dehydrationBlock)
    console.log("Infected after: " + (parseInt(state.poopQueue[0]) + 19185))
}

contract('Tamablockhi', accounts => {
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

        const tamaBalance = await contract.balanceOf(
            accounts[0],
            11
        );

        assert.equal(
            tamaBalance,
            1, 
            `Unexpected tama amount`
        );
    });

    it("Tamas are stored in the account list", async () => {
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.hatch(
            accounts[0],
            []
        );

        await contract.hatch(
            accounts[0],
            []
        );

        const tokens = await contract.getTamablockhiIds(accounts[0]);

        assert.equal(
            tokens[0].toNumber(),
            11, 
            `Unexpected tama`
        );

        assert.equal(
            tokens[1].toNumber(),
            12, 
            `Unexpected tama`
        );

        assert.equal(
            tokens[2].toNumber(),
            13, 
            `Unexpected tama`
        );
    });

    it("Hatched Tama dies of starvation after blocks", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );

        await mineMany(7000)

        await debugLogState(contract, expectedTamaId)

        try {
            await contract.feed(
                accounts[0],
                expectedTamaId,
                4
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "10", "Expected Error")
        }
    });

    it("Hatched Tama dies of starvation after blocks and is persisted", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );

        console.log("Mining 25589 blocks. This will take some time.")
        await mineMany(25589)

        await debugLogState(contract, expectedTamaId)

        try {
            await contract.feed(
                accounts[0],
                expectedTamaId,
                4
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "10", "Expected Error")
        }
    });

    it("Hatched Tama dies of dehydration after blocks", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.feed(
            accounts[0],
            expectedTamaId,
            1000
        );

        await mineMany(6394)

        await debugLogState(contract, expectedTamaId)

        try {
            await contract.feed(
                accounts[0],
                expectedTamaId,
                1
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "11", "Expected Error")
        }
    });

    it("Hatched Tama dies of dehydration after blocks and is persisted", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.feed(
            accounts[0],
            expectedTamaId,
            1000
        );

        console.log("Mining 25589 blocks. This will take some time.")
        await mineMany(25589)

        await debugLogState(contract, expectedTamaId)

        try {
            await contract.feed(
                accounts[0],
                expectedTamaId,
                1
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "11", "Expected Error")
        }
    });

    it("Hatched Tama dies of infection", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        // Day 1
        await contract.feed(
            accounts[0],
            expectedTamaId,
            1
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );
        await mineMany(6395)

        // Day 2
        await contract.feed(
            accounts[0],
            expectedTamaId,
            1
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );
        await mineMany(6395)

        // Day 3
        await contract.feed(
            accounts[0],
            expectedTamaId,
            1
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );
        await mineMany(6395)

        await contract.feed(
            accounts[0],
            expectedTamaId,
            1
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );
        await mineMany(6395)

        await debugLogState(contract, expectedTamaId)

        try {
            await contract.feed(
                accounts[0],
                expectedTamaId,
                1
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "12", "Expected Error")
        }
    });

    it("Hatched Tama has too poop after blocks", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        let block = await web3.eth.getBlock("latest")
        const state = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            parseInt(state.poopQueue[0]),
            6395 + block.number,
            "Poop schedule was not correct for initial hatch"
        );

        assert.equal(
            state.poopQueue.length,
            1,
            "Poop schedule was not correct for initial hatch"
        );
    });

    it("clean can not remove poop earlier than block", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        try {
            await contract.clean(
                accounts[0],
                expectedTamaId
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "5", "Expected Error")
        }
    });

    it("uAdjustedAmount returns correct amounts", async () => {
        assert.equal(
            await contract.uAdjustedAmount.call(
                10,
                0,
                10
            ),
            10,
            "Max amount no offset is not 0"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                10, // A
                0, // Current 
                9, // B
            ),
            9,
            "Max amount no offset is not 9"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                0, //A
                0,
                9,
            ),
            0,
            "Amount 0 is not 0"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                0, //A
                1200, // A offset
                9, // B
            ),
            0,
            "Attempt to add 0 to 9 with current 1200. Is not zero"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                234,
                1000,
                10
            ),
            0, // Amount + offset -
            "Amount 0 is not 0 with offsets"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                10,
                1,
                10
            ),
            9, 
            "Amount 10 current 1 and max 10 does not return 9"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                12,
                12,
                12
            ),
            0, 
            "Add 12, current 12 and max of 12. Does not equal 0"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                0,
                0,
                0
            ),
            0, 
            "Add 0, current 0 and max of 0. Does not equal 0"
        )

        assert.equal(
            await contract.uAdjustedAmount.call(
                1,
                0,
                0
            ),
            0, 
            "Add 1, current 0 and max of 0. Does not equal 0"
        )
    });

    it("feed is capped to max amount", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        await contract.feed(
            accounts[0],
            expectedTamaId,
            40000
        );

        let block = await web3.eth.getBlock("latest")

        const maxBlocksBeforeStarvation = 19185
        const state = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            state.starvationBlock,
            maxBlocksBeforeStarvation + block.number,
            "Starvation block was not capped to max"
        );
    });

    it("feed multiple in single transaction", async () => {
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        let block = await web3.eth.getBlock("latest")
        const state = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            (state.starvationBlock - block.number), 
            6395, 
            "Original starvation block isn't expected"
        )

        await contract.feed(
            accounts[0],
            expectedTamaId,
            2
        );

        let newBlock = await web3.eth.getBlock("latest")
        const newState = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            (newState.starvationBlock - newBlock.number), 
            19184, 
            "New starvation block does not add up"
        )
    });

    it("water requires burns water, delays dehydration", async () => {        
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        let { number: blockNumber } = await web3.eth.getBlock("latest")

        const state = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            state.dehydrationBlock,
            blockNumber + 6395, 
            `Unexpected dehydration block`
        );
        
        // Mine more blocks to allow watering
        await mineMany(6000)

        const waterAmount = 1;
        await contract.water(
            accounts[0],
            expectedTamaId,
            waterAmount
        );

        const newState = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            newState.dehydrationBlock,
            parseInt(state.dehydrationBlock) + (waterAmount * 6395), 
            `Unexpected tama amount`
        );
    });

    it("feeding queues up a poop for a future block", async () => {        
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        let { number: blockNumber } = await web3.eth.getBlock("latest")

        const feedAmount = 3;
        await contract.feed(
            accounts[0],
            expectedTamaId,
            feedAmount
        );

        const state = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            parseInt(state.poopQueue[0]), 
            6395 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            parseInt(state.poopQueue[1]), 
            6396 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            state.poopQueue.length, 
            2,
            `Unexpected size. Expected 2`
        );
    });

    it("clean will remove the first poop from the queue", async () => {        
        const expectedTamaId = 11
        await contract.hatch(
            accounts[0],
            []
        );

        let { number: blockNumber } = await web3.eth.getBlock("latest")

        await contract.feed(
            accounts[0],
            expectedTamaId,
            1
        );

        await contract.water(
            accounts[0],
            expectedTamaId,
            1
        );

        await contract.feed(
            accounts[0],
            expectedTamaId,
            1
        );

        const state = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            parseInt(state.poopQueue[0]), 
            6395 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            parseInt(state.poopQueue[1]),
            6396 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            parseInt(state.poopQueue[2]),
            6398 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            state.poopQueue.length,
            3,
            `Unexpected size. Expected 3`
        );

        await mineMany(6396)
        await contract.clean(
            accounts[0],
            expectedTamaId
        )

        const newState = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            parseInt(newState.poopQueue[0]), 
            6396 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            parseInt(newState.poopQueue[1]), 
            6398 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            newState.poopQueue.length,
            2,
            `Unexpected size. Expected 2`
        );

        await mineMany(2)
        await contract.clean(
            accounts[0],
            expectedTamaId
        )

        const secondState = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            parseInt(secondState.poopQueue[0]),
            6398 + blockNumber,
            `Unexpected poop block number`
        );

        assert.equal(
            secondState.poopQueue.length,
            1,
            `Unexpected size. Expected 1`
        );

        await mineMany(2)
        await contract.clean(
            accounts[0],
            expectedTamaId
        )

        const thirdState = await contract.getTamablockhiState(expectedTamaId, true)
        assert.equal(
            thirdState.poopQueue.length,
            0,
            `Unexpected size. Expected 0`
        );

        const balance = await contract.balanceOf(
            accounts[0],
            1
        );
        assert.equal(
            balance,
            3,
            `Balance of poop should be 3`
        );
    });

    it("mate will create and egg and remove resources", async () => {        
        const expectedTamaIdOne = 11
        await contract.hatch(
            accounts[0],
            []
        );

        const expectedTamaIdTwo = 12
        await contract.hatch(
            accounts[0],
            []
        );

        const balanceFood = await contract.balanceOf(
            accounts[0],
            0
        );
        assert.equal(
            balanceFood.toNumber(), 
            50000, //Seeded in owner amounts
            `balanceFood is wrong`
        );

        const balanceWater = await contract.balanceOf(
            accounts[0],
            2
        );
        assert.equal(
            balanceWater.toNumber(), 
            50000, //Seeded in owner amounts
            `balanceWater is wrong`
        );

        const balanceEggs = await contract.balanceOf(
            accounts[0],
            4
        );
        assert.equal(
            balanceEggs.toNumber(), 
            8886, //Seeded in owner amounts
            `balanceEggs is wrong`
        );

        await contract.mate(
            accounts[0],
            expectedTamaIdOne,
            expectedTamaIdTwo,
        );

        const newBalanceEggs = await contract.balanceOf(
            accounts[0],
            4
        );
        assert.equal(
            newBalanceEggs.toNumber(), 
            8887, //Seeded in owner amounts
            `new balanceEggs is wrong`
        );

        const newBalanceFood = await contract.balanceOf(
            accounts[0],
            0
        );
        assert.equal(
            newBalanceFood.toNumber(), 
            49990, //Seeded in owner amounts
            `new balanceFood is wrong`
        );

        const newBalanceWater = await contract.balanceOf(
            accounts[0],
            2
        );
        assert.equal(
            newBalanceWater.toNumber(), 
            49990, //Seeded in owner amounts
            `new balanceWater is wrong`
        );
    });

    it("mate requires the address owner", async () => {        
        const expectedTamaIdOne = 11
        const expectedTamaIdTwo = 12

        try {
            await contract.mate(
                accounts[1],
                expectedTamaIdOne,
                expectedTamaIdTwo,
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "8", "Expected Error")
        }
    });

    it("mate fails if tamas are the same", async () => {        
        const expectedTamaIdOne = 11
        await contract.hatch(
            accounts[0],
            []
        );

        try {
            await contract.mate(
                accounts[0],
                expectedTamaIdOne,
                expectedTamaIdOne,
            );
            assert(false, "This should not run. Expected error")
        } catch(e) {
            assert.equal(e.data.reason, "6", "Expected Error")
        }
    });
});



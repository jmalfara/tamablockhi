// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract Tamoblockhi is ERC1155, Ownable, ERC1155Supply {

    uint8 private FOOD_TOKEN_ID = 0;
    uint8 private POOP_TOKEN_ID = 1; 
    uint8 private WATER_TOKEN_ID = 2;
    uint8 private LOVE_TOKEN_ID = 3;
    uint8 private EGG_TOKEN_ID = 4;

    uint256 private TAMO_MIN_TOKEN_ID = 10;
    uint256 private tamoCurrentId = TAMO_MIN_TOKEN_ID;

    uint32 private maxBlocksBeforeStarvation = 19185; // ~3 days
    uint32 private maxBlocksBeforeDehydration = 19185; // ~3 days
    uint32 private maxBlocksPoopInfection = 19185; // ~3 days
    uint32 private poopAfterBlocks = 6395; // ~1 day
    uint32 private cropReadyAfterBlocks = 6395; // ~1 day

    mapping(uint256 => State) private states;

    struct State { 
        uint256 starvationBlock;
        uint256 dehydrationBlock;
        Queue poopQueue;
        Queue cropQueue;
    }

    constructor() ERC1155("") {
        _mint(owner(), EGG_TOKEN_ID, 8888, "");
        _mint(owner(), FOOD_TOKEN_ID, 50000, "");
        _mint(owner(), WATER_TOKEN_ID, 50000, "");
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function starvationBlockOf(uint256 tokenId) public view returns(uint256) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return states[tokenId].starvationBlock;
    }

    function dehydrationBlockOf(uint256 tokenId) public view returns(uint256) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return states[tokenId].dehydrationBlock;
    }

    function poopScheduledForBlock(uint256 tokenId) public view returns(uint256[] memory) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return peekFirst(states[tokenId].poopQueue, 3);
    }

    function cropScheduledForBlock(uint256 tokenId) public view returns(uint256[] memory) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return peekFirst(states[tokenId].cropQueue, 3);
    }

    function hatch(
        address account,
        bytes memory data
    ) public addressOwnerOnly(account) {
        require(balanceOf(account, EGG_TOKEN_ID) >= 1, "Account does not own an egg");
        tamoCurrentId++;
        _mint(account, tamoCurrentId, 1, data);

        State storage state = states[tamoCurrentId];
        state.starvationBlock = block.number + 6395;
        state.dehydrationBlock = block.number + 6395;
        enqueue(state.poopQueue, block.number + poopAfterBlocks);

        _burn(account, EGG_TOKEN_ID, 1); // Spend the egg
    }

    function feed(
        address account,
        uint256 tokenId,
        uint256 foodAmount
    ) public onlyAlive(tokenId) addressOwnerOnly(account) {
        require(balanceOf(account, FOOD_TOKEN_ID) >= foodAmount, "Insuffient amount of food");

        State storage state = states[tokenId];

        // Calculates food to be used up to a max
        uint256 adjustedFoodAmount = uAdjustedAmount(
            foodAmount * 6395, 
            state.starvationBlock,
            maxBlocksBeforeStarvation + block.number
        );

        state.starvationBlock += adjustedFoodAmount;
        enqueue(state.poopQueue, block.number + poopAfterBlocks);
        _burn(account, FOOD_TOKEN_ID, adjustedFoodAmount); // Spend the food
    }

    function water(
        address account,
        uint256 tokenId,
        uint256 waterAmount
    ) public onlyAlive(tokenId) addressOwnerOnly(account) {
        require(balanceOf(account, WATER_TOKEN_ID) >= waterAmount, "Insuffient amount of water");

        State storage state = states[tokenId];

        // Calculates food to be used up to a max
        uint256 adjustedWaterAmount = uAdjustedAmount(
            waterAmount * 6395, 
            state.dehydrationBlock,
            maxBlocksBeforeDehydration + block.number
        );

        state.dehydrationBlock += adjustedWaterAmount;
        _burn(account, WATER_TOKEN_ID, adjustedWaterAmount);
    }

    function clean(
        address account,
        uint256 tokenId
    ) public onlyAlive(tokenId) {
        State storage state = states[tokenId];
        uint256 poopBlock = peekAhead(state.poopQueue, 0);
        require(block.number > poopBlock, "Tamo has not pooped yet");
        dequeue(state.poopQueue);
        _mint(account, POOP_TOKEN_ID, 1, "");
    }

    function pet(
        address account,
        uint256 tokenId
    ) public onlyAlive(tokenId) {
        _mint(account, LOVE_TOKEN_ID, 1, "");
    }

    function plantFood(
        address account,
        uint256 tokenId
    ) public onlyAlive(tokenId) addressOwnerOnly(account) {
        require(balanceOf(account, FOOD_TOKEN_ID) >= 1, "Insuffient amount of food to start crop");
        require(balanceOf(account, WATER_TOKEN_ID) >= 1, "Insuffient amount of water to start crop");
        require(balanceOf(account, POOP_TOKEN_ID) >= 3, "Insuffient amount of poop to start crop");

        // Resources required to plant a crop
        _burn(account, FOOD_TOKEN_ID, 1);
        _burn(account, WATER_TOKEN_ID, 1);
        _burn(account, POOP_TOKEN_ID, 3);

        enqueue(states[tokenId].cropQueue, cropReadyAfterBlocks);
    }

    function harvestFood(
        address account,
        uint256 tokenId
    ) public onlyAlive(tokenId) addressOwnerOnly(account) {
        State storage state = states[tokenId];
        uint256 cropBlock = peekAhead(state.cropQueue, 0);
        require(block.number > cropBlock, "Crop harvest is not available yet");
        dequeue(state.cropQueue);
        _mint(account, WATER_TOKEN_ID, 5, "");
        _mint(account, FOOD_TOKEN_ID, 5, "");
    }

    function mate(
        address account,
        uint256 tamoIdOne,
        uint256 tamoIdTwo
    ) public addressOwnerOnly(account) onlyAlive(tamoIdOne) onlyAlive(tamoIdTwo) {
        require(tamoIdOne != tamoIdTwo, "Tamo One and Tamo Two are the same");
        require(balanceOf(account, tamoIdOne) == 1, "Tamo One is not owned by the address");
        require(balanceOf(account, tamoIdTwo) == 1, "Tamo Two is not owned by the address");

        require(balanceOf(account, FOOD_TOKEN_ID) >= 10, "Insuffient amount of food to start crop");
        require(balanceOf(account, WATER_TOKEN_ID) >= 10, "Insuffient amount of food to start crop");

        _burn(account, FOOD_TOKEN_ID, 10);
        _burn(account, WATER_TOKEN_ID, 10);
        _mint(account, EGG_TOKEN_ID, 1, "");
    }

    modifier onlyAlive(uint256 tokenId) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        require(states[tokenId].starvationBlock > block.number, "Tamo has died of starvation");
        require(states[tokenId].dehydrationBlock > block.number, "Tamo has died of thirst");

        uint256 poopBlock = peekAhead(states[tokenId].poopQueue, 0);
        if (poopBlock != 0) {
            require(poopBlock + maxBlocksPoopInfection > block.number, "Tamo has died of infection");
        }
        _;
    }

    modifier addressOwnerOnly(
        address account
    ) {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );
        _;
    }

    function uMinusOrDefault(uint256 a, uint256 b, uint256 def) private pure returns(uint256) {
        if (b > a) {
            return def;
        }
        return a - b;
    }

    function uAdjustedAmount(
        uint256 amountToAdd,
        uint256 currentAmount,
        uint256 maxAmount
    ) public pure returns(uint256) {
        uint256 totalAmount = amountToAdd + currentAmount;
        if (totalAmount <= maxAmount) {
            // The amountToAdd is still not maxed out. Free to add the entire amount
            return amountToAdd;
        }
        // TotalAmount must be greater than maxAmount

        if (currentAmount >= maxAmount) {
            // current amount is greater than max. Can't do anything but return zero.
            // This should be an error
            return 0;
        }
        // Current amount must be less than maxAmount.
        // amountToAdd must be greater than maxAmount. 

        // Take the maxAmount - currentAmount.
        return maxAmount - currentAmount;
    }

    /**
    * Queue Implementation
    */
    struct Queue { 
        mapping(uint256 => uint256) items;
        uint256 first;
        uint256 last;
    }

    function peekFirst(Queue storage queue, uint n) internal view returns (uint256[] memory) {
        uint256[] memory items = new uint256[](n);
        for (uint i = 0; i < n; i++) {
            items[i] = queue.items[queue.first + i];
        }
        return items;
    }

    function peekAhead(Queue storage queue, uint n) internal view returns (uint256) {
        return queue.items[queue.first + n];
    }

    function enqueue(Queue storage queue, uint256 data) internal {
        queue.items[queue.last] = data;
        queue.last += 1;
    }

    function dequeue(Queue storage queue) internal returns (uint256 data) {
        require(queue.last >= queue.first);  // non-empty queue
        data = queue.items[queue.first];
        delete queue.items[queue.first];
        queue.first += 1;
    }
}
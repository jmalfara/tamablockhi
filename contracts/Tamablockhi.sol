// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract Tamablockhi is ERC1155, Ownable, ERC1155Supply {
    string private ERROR_NOT_TAMO = "1";
    string private ERROR_NO_EGG = "2";
    string private ERROR_INSUFFIENT_FOOD = "3";
    string private ERROR_INSUFFIENT_WATER = "4";
    string private ERROR_INSUFFIENT_POOP = "5";
    string private ERROR_SAME_IDS = "6";
    string private ERROR_NOT_OWNED = "7";
    string private ERROR_UNBORN = "8";
    string private ERROR_DIED = "9";
    string private ERROR_DIED_STARVATION = "10";
    string private ERROR_DIED_DEHYDRATION = "11";
    string private ERROR_DIED_INFECTION = "12";
    string private ERROR_NOT_READY = "13";

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

    // States for the tomas by ID
    mapping(uint256 => _TamablockhiState) private states;

    // Maps the tamos to accounts for on chain lookup.
    mapping(address => Queue) private tamoQueues;

    struct _TamablockhiState { 
        uint256 starvationBlock;
        uint256 dehydrationBlock;
        Queue poopQueue;
        Queue cropQueue;
    }

    struct TamablockhiState { 
        uint256 starvationBlock;
        uint256 dehydrationBlock;
        uint256[] poopQueue;
        uint256[] cropQueue;
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

    function getTamablockhiState(uint256 tokenId, bool aliveCheck) public view returns(TamablockhiState memory) {
        if (aliveCheck) {
            requireAlive(tokenId);
        }
        require(tokenId >= TAMO_MIN_TOKEN_ID, ERROR_NOT_TAMO);
        TamablockhiState memory tamoState;
        tamoState.dehydrationBlock = states[tokenId].dehydrationBlock;
        tamoState.starvationBlock = states[tokenId].starvationBlock;
        tamoState.poopQueue = peekFirst(states[tokenId].poopQueue, states[tokenId].poopQueue.last - states[tokenId].poopQueue.first);
        tamoState.cropQueue = peekFirst(states[tokenId].cropQueue, states[tokenId].cropQueue.last - states[tokenId].cropQueue.first);
        return tamoState;
    }

    function getTamablockhiIds(address account) public view returns(uint256[] memory) {
        return peekFirst(
            tamoQueues[account], 
            tamoQueues[account].last - tamoQueues[account].first
        );
    }

    function hatch(
        address account,
        bytes memory data
    ) public {
        require(account == _msgSender(), ERROR_NOT_OWNED);
        require(balanceOf(account, EGG_TOKEN_ID) >= 1, ERROR_NO_EGG);
        tamoCurrentId++;
        _mint(account, tamoCurrentId, 1, data);

        states[tamoCurrentId].starvationBlock = block.number + 6395;
        states[tamoCurrentId].dehydrationBlock = block.number + 6395;
        enqueue(states[tamoCurrentId].poopQueue, block.number + 6395);
        enqueue(tamoQueues[account], tamoCurrentId);

        _burn(account, EGG_TOKEN_ID, 1); // Spend the egg
    }

    function feed(
        address account,
        uint256 tokenId,
        uint256 foodAmount
    ) public {
        require(account == _msgSender(), ERROR_NOT_OWNED);
        requireAlive(tokenId);
        require(balanceOf(account, FOOD_TOKEN_ID) >= foodAmount, ERROR_INSUFFIENT_FOOD);

        // Calculates food to be used up to a max
        uint256 adjustedFoodAmount = uAdjustedAmount(
            foodAmount * 6395, 
            states[tokenId].starvationBlock,
            maxBlocksBeforeStarvation + block.number
        );

        states[tokenId].starvationBlock += adjustedFoodAmount;
        enqueue(states[tokenId].poopQueue, block.number + 6395);
        _burn(account, FOOD_TOKEN_ID, foodAmount); // Spend the food
    }

    function water(
        address account,
        uint256 tokenId,
        uint256 waterAmount
    ) public {
        require(account == _msgSender(), ERROR_NOT_OWNED);
        requireAlive(tokenId);
        require(balanceOf(account, WATER_TOKEN_ID) >= waterAmount, ERROR_INSUFFIENT_WATER);

        // Calculates food to be used up to a max
        uint256 adjustedWaterAmount = uAdjustedAmount(
            waterAmount * 6395, 
            states[tokenId].dehydrationBlock,
            maxBlocksBeforeDehydration + block.number
        );

        states[tokenId].dehydrationBlock += adjustedWaterAmount;
        _burn(account, WATER_TOKEN_ID, waterAmount);
    }

    function clean(
        address account,
        uint256 tokenId
    ) public {
        requireAlive(tokenId);
        uint256 poopBlock = peekFirst(states[tokenId].poopQueue, 1)[0];
        require(poopBlock < block.number, ERROR_INSUFFIENT_POOP);
        dequeue(states[tokenId].poopQueue);
        _mint(account, POOP_TOKEN_ID, 1, "");
    }

    function pet(
        address account,
        uint256 tokenId
    ) public {
        requireAlive(tokenId);
        _mint(account, LOVE_TOKEN_ID, 1, "");
    }

    function plantFood(
        address account,
        uint256 tokenId
    ) public {
        require(account == _msgSender(), ERROR_NOT_OWNED);
        requireAlive(tokenId);
        require(balanceOf(account, FOOD_TOKEN_ID) >= 1, ERROR_INSUFFIENT_FOOD);
        require(balanceOf(account, WATER_TOKEN_ID) >= 1, ERROR_INSUFFIENT_WATER);
        require(balanceOf(account, POOP_TOKEN_ID) >= 3, ERROR_INSUFFIENT_POOP);

        // Resources required to plant a crop
        _burn(account, FOOD_TOKEN_ID, 1);
        _burn(account, WATER_TOKEN_ID, 1);
        _burn(account, POOP_TOKEN_ID, 3);

        enqueue(states[tokenId].cropQueue, 6395); //Ready after 6395
    }

    function harvestFood(
        address account,
        uint256 tokenId
    ) public {
        requireAlive(tokenId);
        require(account == _msgSender(), ERROR_NOT_OWNED);
        uint256 cropBlock = peekFirst(states[tokenId].poopQueue, 1)[0];
        require(block.number > cropBlock, ERROR_NOT_READY);
        dequeue(states[tokenId].cropQueue);
        _mint(account, WATER_TOKEN_ID, 5, "");
        _mint(account, FOOD_TOKEN_ID, 5, "");
    }

    function mate(
        address account,
        uint256 tamoIdOne,
        uint256 tamoIdTwo
    ) public {
        requireAlive(tamoIdOne);
        requireAlive(tamoIdTwo);
        require(account == _msgSender(), ERROR_NOT_OWNED);
        require(tamoIdOne != tamoIdTwo, ERROR_SAME_IDS);
        require(balanceOf(account, tamoIdOne) == 1, ERROR_NOT_OWNED);
        require(balanceOf(account, tamoIdTwo) == 1, ERROR_NOT_OWNED);

        require(balanceOf(account, FOOD_TOKEN_ID) >= 10, ERROR_INSUFFIENT_FOOD);
        require(balanceOf(account, WATER_TOKEN_ID) >= 10, ERROR_INSUFFIENT_WATER);

        _burn(account, FOOD_TOKEN_ID, 10);
        _burn(account, WATER_TOKEN_ID, 10);
        _mint(account, EGG_TOKEN_ID, 1, "");
    }

    function requireAlive(uint256 tokenId) public view {
        require(tokenId >= TAMO_MIN_TOKEN_ID, ERROR_NOT_TAMO);
        require(states[tokenId].starvationBlock != 0, ERROR_UNBORN);

        uint256 blockDiedOfStarvation = states[tokenId].starvationBlock;
        uint256 blockDiedOfDehydration = states[tokenId].dehydrationBlock;
        uint256 poopBlock = peekFirst(states[tokenId].poopQueue, 1)[0];
        uint256 blockDiedOfInfection = poopBlock + maxBlocksPoopInfection;

        if (states[tokenId].dehydrationBlock > block.number) {
            // Tamo died of dehydration
            blockDiedOfDehydration = states[tokenId].dehydrationBlock;
        }
    
        if (blockDiedOfStarvation < block.number && blockDiedOfStarvation <= blockDiedOfDehydration && blockDiedOfStarvation <= blockDiedOfInfection) {
            // Died of starvation
            revert(ERROR_DIED_STARVATION);
        } else if (blockDiedOfDehydration < block.number && blockDiedOfDehydration < blockDiedOfStarvation && blockDiedOfDehydration < blockDiedOfInfection) {
            // Died of dehydration
            revert(ERROR_DIED_DEHYDRATION);
        } else if (poopBlock != 0 && blockDiedOfInfection < block.number && blockDiedOfInfection < blockDiedOfStarvation && blockDiedOfInfection < blockDiedOfDehydration) {
            // Died of infection
            revert(ERROR_DIED_INFECTION);
        }
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
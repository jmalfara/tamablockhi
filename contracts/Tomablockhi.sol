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

    // Blocks added to the starvation counter
    uint32 private blocksPerFoodToken = 6395;
    // Blocks added to the dehydration counter
    uint32 private blocksPerWaterToken = 6395;
    // Blocks added to the tired counter after a pet
    uint32 private blocksTiredPerPet = 1000;
    // Blocks added to the tired counter after a feed
    uint32 private blocksTiredPerFeed = 3000;

    uint32 private maxBlocksBeforeStarvation = 19185; // ~3 days
    uint32 private maxBlocksBeforeDehydration = 19185; // ~3 days
    uint32 private maxBlocksUntilRested = 6395; // 1 day

    uint32 private restedEnoughToFeed = 5000;
    uint32 private restedEnoughToWater = 5000;

    mapping(uint256 => uint256) public starvationBlock;
    mapping(uint256 => uint256) private dehydrationBlock;
    mapping(uint256 => uint256) private fullyRestedAfterBlock;

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

    // Status's
    function starvationBlockOf(uint256 tokenId) public view returns(uint256) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return starvationBlock[tokenId];
    }

    function dehydrationBlockOf(uint256 tokenId) public view returns(uint256) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return dehydrationBlock[tokenId];
    }

    function fullyRestedAfterBlockOf(uint256 tokenId) public view returns(uint256) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        return fullyRestedAfterBlock[tokenId];
    }

    function hatch(
        address account,
        bytes memory data
    ) public {
        require(balanceOf(account, EGG_TOKEN_ID) >= 1, "Account does not own an egg");
        tamoCurrentId++;
        _mint(account, tamoCurrentId, 1, data);

        // Starting parameters after hatch
        starvationBlock[tamoCurrentId] = block.number + blocksPerFoodToken;
        dehydrationBlock[tamoCurrentId] = block.number + blocksPerWaterToken;
        fullyRestedAfterBlock[tamoCurrentId] = block.number;
        _burn(account, EGG_TOKEN_ID, 1); // Spend the egg
    }

    function feed(
        address account,
        uint256 tokenId,
        uint256 foodAmount
    ) public onlyAlive(tokenId) {
        require(balanceOf(account, FOOD_TOKEN_ID) >= foodAmount, "Insuffient amount of food");

        uint256 blocksTiredFor = uMinusOrDefault(fullyRestedAfterBlock[tokenId], block.number, 0);
        require(blocksTiredFor < restedEnoughToFeed, "Toma is not rested enough");

        // Increase starvation blocks and check if it was too much food
        starvationBlock[tokenId] += blocksPerFoodToken * foodAmount;
        uint256 starvationBlocks = uMinusOrDefault(starvationBlock[tokenId], block.number, 0);
        require(starvationBlocks < maxBlocksBeforeStarvation, "Toma is too full to eat that much food");

        fullyRestedAfterBlock[tokenId] += blocksTiredPerFeed * foodAmount;
        _burn(account, FOOD_TOKEN_ID, foodAmount); // Spend the food
    }

    function water(
        address account,
        uint256 tokenId,
        uint256 waterAmount
    ) public onlyAlive(tokenId) {
        require(balanceOf(account, WATER_TOKEN_ID) >= waterAmount, "Insuffient amount of food");

        uint256 blocksTiredFor = uMinusOrDefault(fullyRestedAfterBlock[tokenId], block.number, 0);
        require(blocksTiredFor < restedEnoughToWater, "Toma is not rested enough");

        uint256 dehydrationBlocks = uMinusOrDefault(dehydrationBlock[tokenId], block.number, 0);
        require(dehydrationBlocks > maxBlocksBeforeDehydration, "Toma is too hydrated to drink");

        dehydrationBlock[tokenId] += blocksPerWaterToken;
        _burn(account, FOOD_TOKEN_ID, waterAmount);
    }

    function pet(
        address account,
        uint256 tokenId
    ) public onlyAlive(tokenId) {
        _mint(account, LOVE_TOKEN_ID, 1, "");
        // tiredUntilBlock[tokenId] += blocksTiredPerPet;
    }

    modifier onlyAlive(uint256 tokenId) {
        require(tokenId >= TAMO_MIN_TOKEN_ID, "Token is not a Tamo");
        require(starvationBlock[tokenId] > block.number, "Tamo has died of starvation");
        require(dehydrationBlock[tokenId] > block.number, "Tamo has died of thirst");
        _;
    }

    function uMinusOrDefault(uint256 a, uint256 b, uint256 def) private pure returns(uint256) {
        if (b > a) {
            return def;
        }
        return a - b;
    }
}
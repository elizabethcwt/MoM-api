// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract Reward is ERC721 {

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        // _name = name;
        // _symbol = symbol;
    }

    function rewarded(address owner) public returns (uint256) {
        _mint(owner, 1);
        return 1;
    }

}
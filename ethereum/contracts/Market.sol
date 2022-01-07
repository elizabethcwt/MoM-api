// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import './Mommom.sol';
import './Reward.sol';

contract Market {
    address payable admin;

    // WORK IN PROGRESS
    event EventBoughtFood(address indexed user, string foodID, uint256 date);

    // WORK IN PROGRESS
    event EventRedeemFood(address indexed user, string foodID, uint256 date);

    // WORK IN PROGRESS
    event EventGiftFood(
        address indexed user,
        address indexed receiver,
        string foodID,
        uint256 date
    );

    struct MommomToken {
        uint256 tokenID;
        bool redeemed;
    }

    struct Customer {
        uint256 buyCount;
        uint256[] ownedMommoms;
    }

    struct Food {
        string foodID;
        uint256 price;
        uint256 stocks;
    }

    Mommom private mommom;
    mapping(uint256 => MommomToken) private mommomTokens;
    mapping(string => Food) public foods;
    mapping(address => Customer) private customers;

    constructor() payable {
        mommom = new Mommom();
        admin = payable(msg.sender);
    }

    function list(
        string memory _foodID,
        uint256 _stocks,
        uint256 _price
    ) public {
        Food memory food = Food({
            foodID: _foodID,
            stocks: _stocks,
            price: _price
        });
        foods[_foodID] = food;
    }

    function buy(string memory foodID) public payable returns (uint256) {
        Food storage food = foods[foodID];
        require(msg.value >= food.price, 'Insufficient money');
        require(food.stocks > 0, 'Insufficient stocks');
        uint256 tokenID = mommom.buy(msg.sender, foodID); // mint token
        food.stocks = food.stocks - 1;
        MommomToken memory mommomToken = MommomToken({
            tokenID: tokenID,
            redeemed: false
        });
        mommomTokens[tokenID] = mommomToken; // track all tokens
        customers[msg.sender].ownedMommoms.push(tokenID); // track all customer tokens

        emit EventBoughtFood(msg.sender, foodID, block.timestamp);
        return tokenID;
    }

    function redeem(uint256 tokenID) public {
        require(mommomTokens[tokenID].redeemed == false);
        revokeOwnership(msg.sender, tokenID);
        mommom.redeem(msg.sender, tokenID);
        mommomTokens[tokenID].redeemed = true;
        string memory foodID = mommom.tokenURI(tokenID);
        emit EventRedeemFood(msg.sender, foodID, block.timestamp);
    }

    function gift(address receiver, uint256 tokenID) public {
        revokeOwnership(msg.sender, tokenID);
        mommom.gift(msg.sender, receiver, tokenID);
        customers[receiver].ownedMommoms.push(tokenID);
        string memory foodID = mommom.tokenURI(tokenID);
        emit EventGiftFood(msg.sender, receiver, foodID, block.timestamp);
    }

    function revokeOwnership(address owner, uint256 tokenID) private {
        uint256 oldTokenBalance = mommom.balanceOf(msg.sender);
        Customer storage customer = customers[owner];
        uint256[] storage ownedMommoms = customer.ownedMommoms;
        for (uint256 i = 0; i < oldTokenBalance; i++) {
            if (ownedMommoms[i] == tokenID) {
                ownedMommoms[i] = ownedMommoms[oldTokenBalance - 1];
                ownedMommoms.pop();
                break;
            }
        }
    }

    function rewarded(string memory name, string memory symbol)
        public
        returns (address)
    {
        Reward reward = new Reward(name, symbol);
        reward.rewarded(msg.sender);
        return address(reward);
    }

    function getCustomerMommoms() public view returns (uint256[] memory) {
        return customers[msg.sender].ownedMommoms;
    }
}

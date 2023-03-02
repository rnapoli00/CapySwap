pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./CapyBuck.sol";

contract CapySwap {
    using SafeMath for uint256;
	CapyBuck public token;
    uint256 public EXCHANGE_RATE = 10000;
	
	event Bought(uint256 amount);
	event Sold(uint256 amount);
	
	constructor(address add) {
        token = CapyBuck(add);
	}
	
	function buy() payable public {
        uint256 amountTobuyInEth = msg.value;
        require(amountTobuyInEth > 0, "You need more ether");
        uint256 amountTobuyInCapy = amountTobuyInEth.mul(EXCHANGE_RATE);
        uint256 dexBalance = token.balanceOf(address(this));
        require(amountTobuyInCapy <= dexBalance, "There are not enough tokens to perform the exchange");
        token.transfer(msg.sender, amountTobuyInCapy);
        emit Bought(amountTobuyInCapy);
    }
	
	function sell(uint256 amountTosellInCapy) public {
        require(amountTosellInCapy > 0, "You must sell at least one token");
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amountTosellInCapy, "You did not give permission to spend your tokens");
        uint256 sellerBalance = token.balanceOf(msg.sender);
        require(sellerBalance >= amountTosellInCapy, "You don't have enough tokens to perform the exchange");
        token.transferFrom(msg.sender, address(this), amountTosellInCapy);
        uint256 amountToTransferInEth = amountTosellInCapy.div(EXCHANGE_RATE);
        payable(msg.sender).transfer(amountToTransferInEth);
        emit Sold(amountToTransferInEth);
    }
}
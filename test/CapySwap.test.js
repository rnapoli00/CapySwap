// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/v2.5.1/test/examples/SimpleToken.test.js

const { expect } = require('chai');

// Import accounts

var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

// Import utilities from Test Helpers
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const CapyBuck = artifacts.require('CapyBuck');
const CapySwap = artifacts.require('CapySwap');

// Start test block
contract('CapySwap', function ([ creator ]) {
  const NAME = 'CapyBuck';
  const SYMBOL = 'CPB';
  const TOTAL_SUPPLY = new BN('1000000000000000000000000000');

  beforeEach(async function () {
    this.token = await CapyBuck.new(NAME, SYMBOL, TOTAL_SUPPLY, {from: creator });
    this.exchange = await CapySwap.new(this.token.address);
    await this.token.transfer(this.exchange.address, TOTAL_SUPPLY, {from: creator});
  });

  it('buy check', async function () {
    const receipt = await this.exchange.buy({from: creator, value : web3.utils.toWei('10', 'ether')});
    expectEvent(receipt, 'Bought');
  });

  it('buy check with 0 ether', async function () {
    await expectRevert(this.exchange.buy({from: creator, value : 0}), 'You need more ether');
  });

  it('buy check with not enough tokens in the dex balance', async function () {
    await expectRevert(this.exchange.buy({from: creator, value : web3.utils.toWei('10000000000000', 'ether')}), 'There are not enough tokens to perform the exchange');
  });

  it('sell check', async function () {
    await this.exchange.buy({from: creator, value : web3.utils.toWei('10', 'ether')});

    const decimals = await this.token.decimals();
    const amountInCapy = 10;
    const amountInDecimals = new BN(amountInCapy).mul(new BN(10).pow(decimals));
    await this.token.approve(this.exchange.address, amountInDecimals); 

    const receipt = await this.exchange.sell(amountInDecimals);
    expectEvent(receipt, 'Sold');
  });

  it('sell check with amount 0', async function () {
    await expectRevert(this.exchange.sell(new BN(0)), 'You must sell at least one token'); 
  });

  it('sell check without allowance', async function () {
    await this.exchange.buy({from: creator, value : web3.utils.toWei('10', 'ether')});

    const decimals = await this.token.decimals();
    const amountInCapy = 10;
    const amountInDecimals = new BN(amountInCapy).mul(new BN(10).pow(decimals));

    await expectRevert(this.exchange.sell(amountInDecimals), 'You did not give permission to spend your tokens'); 
  });

  it('sell check without enough token', async function () {
    const decimals = await this.token.decimals();

    const amountInCapy = 10;
    const amountInDecimals = new BN(amountInCapy).mul(new BN(10).pow(decimals));
    await this.token.approve(this.exchange.address, amountInDecimals); 
    
    await expectRevert(this.exchange.sell(amountInDecimals), "You don't have enough tokens to perform the exchange"); 
  });
});

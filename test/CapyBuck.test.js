// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/v2.5.1/test/examples/SimpleToken.test.js

const { expect } = require('chai');

// Import accounts

var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

// Import utilities from Test Helpers
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const CapyBuck = artifacts.require('CapyBuck');

const ROLE = web3.utils.sha3('MINTER_ROLE');
// Start test block
contract('CapyBuck', function ([ creator, minter, other ]) {
  const NAME = 'CapyBuck';
  const SYMBOL = 'CPB';
  const TOTAL_SUPPLY = new BN('1000000000000000000000000000');

  beforeEach(async function () {
    this.token = await CapyBuck.new(NAME, SYMBOL, TOTAL_SUPPLY, { from: creator });
  });

  it('total supply check', async function () {
    // Use large integer comparisons
    expect(await this.token.totalSupply()).to.be.bignumber.equal(TOTAL_SUPPLY);
  });

  it('has a name', async function () {
    expect(await this.token.name()).to.be.equal(NAME);
  });

  it('has a symbol', async function () {
    expect(await this.token.symbol()).to.be.equal(SYMBOL);
  });

  it('assigns the initial total supply to the creator', async function () {
    expect(await this.token.balanceOf(creator)).to.be.bignumber.equal(TOTAL_SUPPLY);
  });

  it('check if creator is admin', async function () {
    expect(await this.token.isAdmin(creator)).to.be.true;
  });

  it('check addMintRole', async function () {
    expect(await this.token.isMinter(minter)).to.equal(false);

    const receipt = await this.token.addMinterRole(minter, { from: creator });
    expectEvent(receipt, 'RoleGranted', {account: minter, role: ROLE, sender: creator} );
    
    expect(await this.token.isMinter(minter)).to.equal(true);
  });
  
  it('check addMintRole from minter', async function () {
    expect(await this.token.isMinter(other)).to.equal(false);

    await expectRevert(this.token.addMinterRole(other, { from: minter }), 'Restricted to admins');
    
    expect(await this.token.isMinter(minter)).to.equal(false);
  });

  it('check mint from minter', async function () {
    const receipt1 = await this.token.addMinterRole(minter, { from: creator });
    expectEvent(receipt1, 'RoleGranted', {account: minter, role: ROLE, sender: creator} );

    const receipt2 = await this.token.mint(other, new BN('50000000000'), { from: minter });
    expectEvent(receipt2, 'Transfer');
  });

  it('check mint from non-minter', async function () {
    await expectRevert(this.token.mint.call(minter, new BN('50000000000'), { from: other }), 'Caller is not a minter');
  });

  it('check removeMintRole from minter', async function () {
    const receipt1 = await this.token.addMinterRole(minter, { from: creator });
    expectEvent(receipt1, 'RoleGranted', {account: minter, role: ROLE, sender: creator} );

    expect(await this.token.isMinter(minter)).to.equal(true);

    const receipt2 = await this.token.removeMinterRole(minter, { from: minter });
    expectEvent(receipt2, 'RoleRevoked' );
    
    expect(await this.token.isMinter(minter)).to.equal(false);
  });
});

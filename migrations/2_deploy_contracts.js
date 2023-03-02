var CapySwap = artifacts.require("CapySwap");
var CapyBuck = artifacts.require("CapyBuck");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(CapyBuck, 'CapyBuck', 'CPB', '1000000000000000000000000000').then(function() {
    return deployer.deploy(CapySwap, CapyBuck.address)
      .then(function() {
        return CapyBuck.deployed().then(function(instance) {
          return instance.transfer(CapySwap.address, '1000000000000000000000000000', {from: accounts[0]});
        });
      });
  });
};
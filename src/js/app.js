App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);
    if (web3.eth.accounts[0]) {
      $('#swapButton-buy').removeAttr('hidden');
      $('#swapButton-sell').removeAttr('hidden');
      $('#connect-wallet').attr("hidden",true);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('CapySwap.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var CapySwapArtifact = data;
      App.contracts.CapySwap = TruffleContract(CapySwapArtifact);
      // Set the provider for our contract   
      App.contracts.CapySwap.setProvider(App.web3Provider);
    });

    $.getJSON('CapyBuck.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var CapyBuckArtifact = data;
      App.contracts.CapyBuck = TruffleContract(CapyBuckArtifact);
      // Set the provider for our contract     
      App.contracts.CapyBuck.setProvider(App.web3Provider); 
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#swapButton-buy', App.makeTransactionBuy);
    $(document).on('click', '#swapButton-sell', App.makeTransactionSell);
    $(document).on('click', '#connect-wallet', App.connectWallet);
    $(document).on('input', '#amountToBuy', App.updateExchangeRateBuy);
    $(document).on('input', '#buyPreview', App.updateExchangeRateBuyPrev);
    $(document).on('input', '#amountToSell', App.updateExchangeRateSell);
    $(document).on('input', '#sellPreview', App.updateExchangeRateSellPrev);
  },

  connectWallet: async function() {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.enable();
        $('#swapButton-buy').removeAttr('hidden');
        $('#swapButton-sell').removeAttr('hidden');
        $('#connect-wallet').attr("hidden",true);
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
  },

  transactionSuccess: function() {
    alert("Transaction completed successfully!");
  },

  updateExchangeRateBuy: function() {
    App.contracts.CapySwap.deployed().then(function(instance) {
      return instance.EXCHANGE_RATE();
    }).then(function(result) {
      var exRate = parseInt(result.toString());
      var inputText = document.getElementById("amountToBuy");  
      var amount = parseFloat(inputText.value);
      var preview = amount*exRate;
      if(preview) {
        $('#buyPreview').val(preview);
      } else {
        $('#buyPreview').val(0);
      }
    }).catch(function(err) {
      console.error(err);
    });
  },

  updateExchangeRateBuyPrev: function() {
    App.contracts.CapySwap.deployed().then(function(instance) {
      return instance.EXCHANGE_RATE();
    }).then(function(result) {
      var exRate = parseInt(result.toString());
      var inputText = document.getElementById("buyPreview");  
      var amount = parseFloat(inputText.value);
      var preview = amount/exRate;
      if(preview) {
        $('#amountToBuy').val(preview);
      } else {
        $('#amountToBuy').val(0);
      }
    }).catch(function(err) {
      console.error(err);
    });
  },

  updateExchangeRateSell: function() {
    App.contracts.CapySwap.deployed().then(function(instance) {
      return instance.EXCHANGE_RATE();
    }).then(function(result) {
      var exRate = parseInt(result.toString());
      var inputText = document.getElementById("amountToSell");  
      var amount = parseFloat(inputText.value);
      var preview = amount/exRate;
      if(preview) {
        $('#sellPreview').val(preview);
      } else {
        $('#sellPreview').val(0);
      }
    }).catch(function(err) {
      console.error(err);
    });
  },

  updateExchangeRateSellPrev: function() {
    App.contracts.CapySwap.deployed().then(function(instance) {
      return instance.EXCHANGE_RATE();
    }).then(function(result) {
      var exRate = parseInt(result.toString());
      var inputText = document.getElementById("sellPreview");  
      var amount = parseFloat(inputText.value);
      var preview = amount*exRate;
      if(preview) {
        $('#amountToSell').val(preview);
      } else {
        $('#amountToSell').val(0);
      }
    }).catch(function(err) {
      console.error(err);
    });
  },

  makeTransactionBuy: function(event) {
    event.preventDefault();
    var amount = parseFloat($("#amountToBuy").val());
    var amountToSend = web3.toWei(amount, 'ether');
    
    var contractInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.CapySwap.deployed().then(function(instance) {
        contractInstance = instance;
        console.log(contractInstance.EXCHANGE_RATE());
        return contractInstance.buy({from: account, value: amountToSend});
      }).then(function(result) {
        console.log(result);
        return App.transactionSuccess();
      }).catch(function(err) {
        console.log(err);
      });
    });
  },

  makeTransactionSell: function(event) {
    event.preventDefault();
    var amount = parseFloat($("#amountToSell").val());
    var amountToSend = web3.toWei(amount, 'ether');
    
    var contractInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      web3.eth.defaultAccount = web3.eth.accounts[0];

      App.contracts.CapySwap.deployed().then(function(instance) {
        contractInstance = instance;
        App.contracts.CapyBuck.deployed().then(function(instance) {
          capyInstance = instance;
          return capyInstance.approve(contractInstance.address, amountToSend);
        }).then(function(result) {
          console.log(result);
          return contractInstance.sell(amountToSend);
        }).then(function(result){
          return App.transactionSuccess();
        }).catch(function(err) {
          console.log(err);
        });
      }).then(function(result) {
        console.log(result);
      }).catch(function(err) {
        console.log(err);
      });
    });
  }    
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

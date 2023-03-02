pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CapyBuck is ERC20, AccessControl {
   bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

   constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply) ERC20(name, symbol) {
      _mint(msg.sender, initialSupply);
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
   }

   event Debug(address user, address sender, bytes32 role, bytes32 adminRole, bytes32 senderRole);
   event ChecksoloAdmin(address user);
   event ChecksoloMinters(address user);

   modifier soloAdmin() {
      emit ChecksoloAdmin(msg.sender);
      require(isAdmin(msg.sender), "Restricted to admins");
      _;
   }

   modifier soloMinters() {
      emit ChecksoloMinters(msg.sender);
      require(isMinter(msg.sender), "Caller is not a minter");
      _;
   }

   function isAdmin(address account) public virtual view returns (bool) {
      return hasRole(DEFAULT_ADMIN_ROLE, account);
   }

   function isMinter(address account) public virtual view returns (bool) {
      return hasRole(MINTER_ROLE, account);
   }

   function mint(address to, uint256 amount) public soloMinters {
      _mint(to, amount);
   }

   function addMinterRole(address to) public soloAdmin {
      emit Debug(to, msg.sender, MINTER_ROLE, getRoleAdmin(MINTER_ROLE), DEFAULT_ADMIN_ROLE);
      grantRole(MINTER_ROLE, to);
   }

   function removeMinterRole (address to) public {
      renounceRole(MINTER_ROLE, to);
   }
}

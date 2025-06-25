// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./AccessControl.sol";
import "./ERC20Permit.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";


contract Token is AccessControl, ERC20, ERC20Permit, ERC2771Context { 


bytes32 public constant UPDATER_ROLE = keccak256(bytes("UPDATER_ROLE"));
bytes32 public constant MINTER_ROLE = keccak256(bytes("MINTER_ROLE"));
bytes32 public constant BURNER_ROLE = keccak256(bytes("BURNER_ROLE"));

address public owner;

modifier ownerOnly() {
    require(msg.sender == owner, "Must be the owner");
    _;
}

constructor(string memory _name, string memory _symbol, uint8 _decimals, address _trustedForwarder)
    ERC20(_name, _symbol)
    ERC20Permit(_name)
    ERC2771Context(_trustedForwarder)  // Инициализируем ERC2771Context с trustedForwarder
{
    owner = msg.sender;

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(UPDATER_ROLE, msg.sender);
    _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    _setRoleAdmin(BURNER_ROLE, MINTER_ROLE);

    _mint(msg.sender, 100_000_000 * (10 ** _decimals));
}
function initialize(address _owner) public {
    require(owner == address(0), "Already initialized");
    owner = _owner;
}

function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
}

function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
    _burn(from, amount);
}

function update(address from, address to, uint256 value) external onlyRole(UPDATER_ROLE) {
    _transfer(from, to, value);
}

}
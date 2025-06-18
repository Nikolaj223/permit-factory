// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { ERC1967Utils } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
contract MyBeaconController is Ownable {
    UpgradeableBeacon public beacon;
    address public implementation;


event BeaconCreated(address beaconAddress, address implementationAddress);
event ImplementationUpdated(address newImplementation);

constructor(address _initialImplementation, address initialOwner) Ownable(initialOwner) {
    require(_initialImplementation != address(0), "Initial implementation cannot be zero address");
    require(_initialImplementation.code.length > 0, "Implementation must be a contract");

    implementation = _initialImplementation;
    beacon = new UpgradeableBeacon(_initialImplementation, initialOwner); 

    emit BeaconCreated(address(beacon), _initialImplementation);
}


function createProxy(address _owner) external returns (BeaconProxy) {
bytes memory initializer = abi.encodeWithSignature("initialize(address)", _owner);
BeaconProxy proxy = new BeaconProxy(address(beacon), initializer);
return proxy;

}


function updateImplementation(address _newImplementation) external onlyOwner {
    require(_newImplementation != address(0), "New implementation cannot be zero address");
    require(_newImplementation.code.length > 0, "Implementation must be a contract");
    beacon.upgradeTo(_newImplementation);
    implementation = _newImplementation;

    emit ImplementationUpdated(_newImplementation);
}

function getImplementationAddress() external view returns (address) {
    return beacon.implementation();
}

function getBeaconAddress() external view returns (address) {
    return address(beacon);
}

}
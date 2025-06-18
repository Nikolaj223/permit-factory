// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "./MyBeaconController.sol";
import { BeaconProxy } from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";


contract TokenFactory {
    MyBeaconController public beaconController;


// Конструктор принимает адрес начальной реализации и адрес владельца контроллера.
constructor(address _initialImplementation, address _owner) {
    // Создаем экземпляр MyBeaconController, который будет управлять UpgradeableBeacon.
    // Параметры _initialImplementation и _owner используются для инициализации beaconController.
    beaconController = new MyBeaconController(_initialImplementation, _owner);
}


// Функция для создания нового токена (BeaconProxy).
// Принимает только адрес _owner, который станет владельцем прокси.
function createToken(address _owner) public returns (BeaconProxy) {
    // Создаем прокси через beaconController, передавая адрес владельца.
    // beaconController.createProxy() возвращает новый BeaconProxy, который делегирует вызовы на UpgradeableBeacon.
    BeaconProxy proxy = beaconController.createProxy(_owner);


// Возвращаем адрес созданного прокси.
return proxy;

}


// Функция для обновления реализации токена.
// Обновляет реализацию, на которую указывает UpgradeableBeacon.
function upgradeTokenImplementation(address _newImplementation) external {
    // Вызываем функцию updateImplementation в beaconController, чтобы обновить реализацию.
    beaconController.updateImplementation(_newImplementation);
}


// Функция для получения адреса MyBeaconController.
function getBeaconControllerAddress() external view returns (address) {
    // Возвращаем адрес контракта beaconController.
    return address(beaconController);
}


}



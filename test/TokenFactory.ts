
import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenFactory, MyBeaconController, Token } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";


describe("TokenFactory", function () {
  let tokenFactory: TokenFactory;
  let beaconController: MyBeaconController;
  let implementationAddress: string;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let implementation: Token;


beforeEach(async function () {
    [owner, user] = await ethers.getSigners();


const Implementation = await ethers.getContractFactory("Token");
// Развертываем контракт и ждем его развертывания
const implementationContract = await Implementation.deploy("Test Token", "TT",18, owner.address);
await implementationContract.waitForDeployment();


// Получаем адрес развернутого контракта
implementationAddress = await implementationContract.getAddress();
// Приводим тип к Token, используя ethers.getContractAt
implementation = await ethers.getContractAt("Token", implementationAddress) as Token;


const TokenFactoryContract = await ethers.getContractFactory("TokenFactory");
tokenFactory = await TokenFactoryContract.deploy(implementationAddress, owner.address) as TokenFactory;
await tokenFactory.waitForDeployment();


const beaconControllerAddress = await tokenFactory.getBeaconControllerAddress();
beaconController = await ethers.getContractAt("MyBeaconController", beaconControllerAddress) as MyBeaconController;


});


it("Should create a new token proxy", async function () {
    const tx = await tokenFactory.createToken(user.address);
    await tx.wait();

    const beaconControllerInstance = await ethers.getContractAt("MyBeaconController", await tokenFactory.getBeaconControllerAddress()) as MyBeaconController;
    await beaconControllerInstance.getBeaconAddress();

    const tokenFactoryAddress = await tokenFactory.getAddress();
    const proxyAddress = ethers.getCreateAddress({
        from: tokenFactoryAddress,
        nonce: 1,
    });

    expect(proxyAddress).to.not.equal(ethers.ZeroAddress);
});

// !ОШИБКА
it("Should upgrade the token implementation", async function () {
    const NewImplementation = await ethers.getContractFactory("Token");
    const newImplementation = await NewImplementation.deploy("New Token", "NT",18, owner.address);
    await newImplementation.waitForDeployment();
    const newImplementationAddress = await newImplementation.getAddress(); 

await tokenFactory.upgradeTokenImplementation(newImplementationAddress);


expect(await beaconController.getImplementationAddress()).to.equal(newImplementationAddress);


});


it("Should return the correct BeaconController address", async function () {
    const beaconControllerAddress = await tokenFactory.getBeaconControllerAddress();
    expect(beaconControllerAddress).to.equal(await beaconController.getAddress());
});
});

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import type { Token } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Token ERC2771Context Tests", function () {
  let token: Token;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let trustedForwarder: SignerWithAddress;

  async function deployTokenFixture() {
    const [owner, alice, trustedForwarder] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Test Token", "TTK", 18, trustedForwarder.address);
    await token.waitForDeployment();

    return { token, owner, alice, trustedForwarder };
  }

  beforeEach(async function () {
    const { token: deployedToken, owner: _owner, alice: _alice, trustedForwarder: _trustedForwarder } = await loadFixture(deployTokenFixture);
    token = deployedToken as Token;
    owner = _owner;
    alice = _alice;
    trustedForwarder = _trustedForwarder;
  });

  it("Should return the trusted forwarder", async function () {
    expect(await token.isTrustedForwarder(trustedForwarder.address)).to.equal(true);
  });

  it("Should revert if msg.sender is not the trusted forwarder", async function () {
    // Отправляем транзакцию напрямую от alice, минуя trustedForwarder.
    await expect(token.connect(alice).mint(alice.address, 100)).to.be.reverted; // Убедимся, что требует роль MINTER_ROLE
  });

  it("Should allow minting via trusted forwarder", async function () {
    // Предоставляем trustedForwarder роль MINTER_ROLE
    await token.grantRole(await token.MINTER_ROLE(), trustedForwarder.address);

    // Создаем данные для вызова функции mint.
    const mintData = token.interface.encodeFunctionData("mint", [alice.address, 100]);

    // Отправляем транalice.address)).to.equal(100);
  });
});
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import type { Token } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Token Permit", function () {
    let token: Token;
    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let chainId: number;

    async function deployTokenFixture() {
        const [owner, alice, bob] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("Token");
        const token = await Token.deploy("Test Token", "TTK", 18, owner.address); // owner.address как trustedForwarder
        await token.waitForDeployment();
        return { token, owner, alice, bob };
    }

    beforeEach(async function () {
        const { token: deployedToken, owner: _owner, alice: _alice, bob: _bob } = await loadFixture(deployTokenFixture);
        token = deployedToken as Token;
        owner = _owner;
        alice = _alice;
        bob = _bob;
        chainId = network.config.chainId || 31337;
    });

    async function generatePermitSignature(owner: SignerWithAddress, spender: SignerWithAddress, value: bigint, deadline: number, token: Token, chainId: number) {
        const nonce = await token.nonces(owner.address);
        const domain = { name: await token.name(), version: "1", chainId: chainId, verifyingContract: String(token.target) };
        const types = { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
        const message = { owner: owner.address, spender: spender.address, value: value, nonce: nonce, deadline: deadline };
        const signature = await owner.signTypedData(domain, types, message);
        const { v, r, s } = ethers.Signature.from(signature);
        return { v, r, s, nonce };
    }

    it("should allow permit", async function () {
        const value = ethers.parseEther("10");
        const deadline = (await time.latest()) + 3600;
        const { v, r, s } = await generatePermitSignature(owner, bob, value, deadline, token, chainId);
        await token.permit(owner.address, bob.address, value, deadline, v, r, s);
        await token.connect(bob).transferFrom(owner.address, bob.address, value);
        expect(await token.balanceOf(bob.address)).to.equal(value);
        expect(await token.allowance(owner.address, bob.address)).to.equal(0);
    });

    it("should fail with invalid signature", async function () {
        const value = ethers.parseEther("10");
        const deadline = (await time.latest()) + 3600;
        const { v, r, s } = await generatePermitSignature(owner, alice, value, deadline, token, chainId); // alice как spender -> невалидная подпись
        await expect(token.permit(owner.address, bob.address, value, deadline, v, r, s)).to.be.revertedWithCustomError(token, "ERC2612InvalidSigner");
    });

    it("should fail with expired deadline", async function () {
        const value = ethers.parseEther("10");
        const deadline = (await time.latest()) - 3600;
        const { v, r, s } = await generatePermitSignature(owner, bob, value, deadline, token, chainId);
        await expect(token.permit(owner.address, bob.address, value, deadline, v, r, s)).to.be.revertedWithCustomError(token, "ERC2612ExpiredSignature");
    });

    it("should fail with used nonce", async function () {
    const value = ethers.parseEther("10");
    const deadline = (await time.latest()) + 3600;

    let { v, r, s, nonce } = await generatePermitSignature(owner, bob, value, deadline, token, chainId);

    // Используем permit первый раз. Это увеличит nonce владельца.
    await token.permit(owner.address, bob.address, value, deadline, v, r, s);

    // Пытаемся вызвать permit второй раз с той же подписью.
    //    Должна произойти ошибка, так как nonce уже использован.
    //    ошибка может быть ERC2612InvalidNonce или ERC2612InvalidSigner,
    //    поскольку повторное использование подписи с измененным nonce приведет
    //    к неверной подписи (неверный владелец).
    try {
        await token.permit(owner.address, bob.address, value, deadline, v, r, s);
        expect.fail("Permit should have reverted");
    } catch (error: any) {
        expect(error.message).to.satisfy((msg: string) => {
            return msg.includes("ERC2612InvalidNonce") || msg.includes("ERC2612InvalidSigner");
        });
    }
});
    });
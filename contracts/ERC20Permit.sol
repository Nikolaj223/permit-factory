// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IERC20Permit} from "./IERC20Permit.sol";
import {ERC20} from "./ERC20.sol";
import "./crypto/ECDSA.sol";
import "./crypto/EIP712.sol";
import {Nonces} from "./Nonces.sol";

abstract contract ERC20Permit is ERC20, IERC20Permit, EIP712, Nonces {
    bytes32 private constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    error ERC2612ExpiredSignature(uint256 deadline);
    error ERC2612InvalidSigner(address signer, address owner);
    error ERC2612InvalidNonce(address owner, uint256 expectedNonce); 
    constructor(string memory name) EIP712(name, "1") {}

     function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        if (block.timestamp > deadline) {
            revert ERC2612ExpiredSignature(deadline);
        }

        uint256 currentNonce = nonces(owner); 

        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, currentNonce, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);

        if (signer != owner) {
            revert ERC2612InvalidSigner(signer, owner);
        }
        

        uint256 expectedNonce = nonces(owner);
         _useCheckedNonce(owner, currentNonce); 

        _approve(owner, spender, value);
 
        if (currentNonce != expectedNonce) {
            revert ERC2612InvalidNonce(owner, expectedNonce); 
        }

       

    }

    function nonces(address owner) public view virtual override(IERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function DOMAIN_SEPARATOR() external view virtual returns (bytes32) {
        return _domainSeparatorV4();
    }
}


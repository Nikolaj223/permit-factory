
// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Nonces.sol)
pragma solidity ^0.8.20;

abstract contract Nonces {

    error InvalidAccountNonce(address account, uint256 currentNonce);

    mapping(address account => uint256) private _nonces;


    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner];
    }

    function _useCheckedNonce(address owner, uint256 nonce) internal virtual {
        uint256 current = nonces(owner);
        if (nonce != current) {
            revert InvalidAccountNonce(owner, current);
        }
        unchecked {
            _nonces[owner]++;
        }
    }
}
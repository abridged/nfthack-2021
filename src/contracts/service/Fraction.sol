// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./BondingCurve.sol";

contract Fraction is BondingCurve {
    bool public locked = false;

    event Fungified(address nft, string name, string symbol);

    constructor(string memory _name, string memory _symbol)
        BondingCurve(_name, _symbol)
    {}

    /**
     * @param _nftids - An array of NFT ids
     */
    function fungify(ERC721 _nft, uint256[] memory _nftids) public virtual {
        require(locked == false);

        for (uint256 i = 0; i < _nftids.length; i++) {
            _nft.transferFrom(msg.sender, address(this), _nftids[i]);
            require(
                _nft.ownerOf(_nftids[i]) == address(this),
                "nft transfer failed"
            );
        }

        /*
        erc20Token.mint(
            msg.sender,
            _total * (10**uint256(erc20Token.decimals()))
        );
        */

        // (bool success, bytes memory result) = address(this).delegatecall(abi.encodeWithSignature("buyTokens()"));
        // this.buyTokens{value: _total * (10**uint256(erc20Token.decimals()))}();

        locked = true;

        emit Fungified(address(_nft), erc20Token.name(), erc20Token.symbol());
    }
}

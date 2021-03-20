// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./BondingCurve.sol";

contract Fraction is BondingCurve {
    ERC721 public nft;
    bool public locked = false;

    event Fungified(address nft, string name, string symbol, uint256 total);

    constructor(
        ERC721 _nft,
        string memory _name,
        string memory _symbol
    ) BondingCurve(_name, _symbol) {
        nft = _nft;
    }

    /**
     * @param _nftids - An array of NFT ids
     * @param _total
     */
    function fungify(uint256[] memory _nftids, uint256 _total) public virtual {
        require(locked == false);

        for (uint256 i = 0; i < _nftids.length; i++) {
            nft.transferFrom(msg.sender, address(this), _nftids[i]);
            require(
                nft.ownerOf(_nftids[i]) == address(this),
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

        emit Fungified(
            address(nft),
            erc20Token.name(),
            erc20Token.symbol(),
            _total
        );
    }
}

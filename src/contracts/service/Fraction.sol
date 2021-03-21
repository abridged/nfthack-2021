// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./BondingCurve.sol";
//import "./CollabLandDAO.sol";
import "moloch/contracts/Moloch.sol";

contract Fraction is BondingCurve {
    bool public locked = false;
    Moloch public dao;
    address public summoner;
    uint256 public periodDuration;
    uint256 public votingPeriodLength;
    uint256 public gracePeriodLength;
    uint256 public proposalDeposit;
    uint256 public dilutionBond;
    uint256 public processingReward;    

    event Fungified(address nft, string name, string symbol);

    constructor(
        address _summoner, 
        uint256 _periodDuration,
        uint256 _votingPeriodLength,
        uint256 _gracePeriodLength,
        uint256 _proposalDeposit,
        uint256 _dilutionBond,
        uint256 _processingReward,
        string memory _name, 
        string memory _symbol
    ) BondingCurve(
        _name, 
        _symbol
      ) {
        summoner = _summoner;
        periodDuration = _periodDuration;
        votingPeriodLength = _votingPeriodLength;
        gracePeriodLength = _gracePeriodLength;
        proposalDeposit = _proposalDeposit;
        dilutionBond = _dilutionBond;
        processingReward = _processingReward;
    }

    /**
     * @param _nftids - An array of NFT ids
     */
    function fungify(ERC721 _nft, uint256[] memory _nftids) public virtual {
        require(locked == false);

        address[] memory approvedTokens;
        approvedTokens[0] = address(erc20Token);

        dao = new Moloch(
            summoner,
            approvedTokens,
            periodDuration,
            votingPeriodLength,
            gracePeriodLength,
            proposalDeposit,
            dilutionBond,
            processingReward
        );

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

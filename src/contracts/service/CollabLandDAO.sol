// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "moloch/contracts/Moloch.sol";
import "moloch/contracts/v3/core/DaoFactory.sol";
import "moloch/contracts/v3/core/proposals/Proposal.sol";
import "moloch/contracts/v3/core/membership/Member.sol";
import "moloch/contracts/v3/adapters/Voting.sol";

contract CollabLandDAO is Moloch {
    constructor(
        address _summoner,
        address[] memory _approvedTokens,
        uint256 _periodDuration,
        uint256 _votingPeriodLength,
        uint256 _gracePeriodLength,
        uint256 _proposalDeposit,
        uint256 _dilutionBound,
        uint256 _processingReward
    )
        Moloch(
            _summoner,
            _approvedTokens,
            _periodDuration,
            _votingPeriodLength,
            _gracePeriodLength,
            _proposalDeposit,
            _dilutionBound,
            _processingReward
        )
    {}
}

pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../Registry.sol";
import "../Module.sol";
import "../interfaces/IMember.sol";
import "../interfaces/IBank.sol";
import "../../helpers/FlagHelper.sol";
import "../../guards/ModuleGuard.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MemberContract is IMember, Module, ModuleGuard, ReentrancyGuard {
    using FlagHelper for uint256;
    using SafeMath for uint256;

    event UpdateMember(address dao, address member, uint256 shares);
    event UpdateDelegateKey(
        address dao,
        address indexed memberAddress,
        address newDelegateKey
    );

    struct Member {
        uint256 flags;
        address delegateKey;
        uint256 nbShares;
    }

    uint256 public totalShares = 1; // Maximum number of shares 2**256 - 1

    mapping(address => mapping(address => Member)) members;
    mapping(address => mapping(address => address)) memberAddresses;
    mapping(address => mapping(address => address)) memberAddressesByDelegatedKey;

    function isActiveMember(Registry dao, address addr)
        external
        view
        override
        returns (bool)
    {
        address memberAddr = memberAddressesByDelegatedKey[address(dao)][addr];
        uint256 memberFlags = members[address(dao)][memberAddr].flags;
        return
            memberFlags.exists() &&
            !memberFlags.isJailed() &&
            members[address(dao)][memberAddr].nbShares > 0;
    }

    function memberAddress(Registry dao, address memberOrDelegateKey)
        external
        view
        override
        returns (address)
    {
        return memberAddresses[address(dao)][memberOrDelegateKey];
    }

    function updateMember(
        Registry dao,
        address memberAddr,
        uint256 shares
    ) external override onlyModule(dao) {
        Member storage member = members[address(dao)][memberAddr];
        if (member.delegateKey == address(0x0)) {
            member.flags = 1;
            member.delegateKey = memberAddr;
        }

        member.nbShares = shares;

        totalShares = totalShares.add(shares);

        memberAddressesByDelegatedKey[address(dao)][
            member.delegateKey
        ] = memberAddr;

        emit UpdateMember(address(dao), memberAddr, shares);
    }

    function updateDelegateKey(
        Registry dao,
        address memberAddr,
        address newDelegateKey
    ) external override onlyModule(dao) {
        require(newDelegateKey != address(0), "newDelegateKey cannot be 0");

        // skip checks if member is setting the delegate key to their member address
        if (newDelegateKey != memberAddr) {
            require(
                memberAddresses[address(dao)][newDelegateKey] == address(0x0),
                "cannot overwrite existing members"
            );
            require(
                memberAddresses[address(dao)][
                    memberAddressesByDelegatedKey[address(dao)][newDelegateKey]
                ] == address(0x0),
                "cannot overwrite existing delegate keys"
            );
        }

        Member storage member = members[address(dao)][memberAddr];
        require(member.flags.exists(), "member does not exist");
        memberAddressesByDelegatedKey[address(dao)][
            member.delegateKey
        ] = address(0x0);
        memberAddressesByDelegatedKey[address(dao)][
            newDelegateKey
        ] = memberAddr;
        member.delegateKey = newDelegateKey;

        emit UpdateDelegateKey(address(dao), memberAddr, newDelegateKey);
    }

    function burnShares(
        Registry dao,
        address memberAddr,
        uint256 sharesToBurn
    ) external override onlyModule(dao) {
        require(
            _enoughSharesToBurn(dao, memberAddr, sharesToBurn),
            "insufficient shares"
        );

        Member storage member = members[address(dao)][memberAddr];
        member.nbShares = member.nbShares.sub(sharesToBurn);
        totalShares = totalShares.sub(sharesToBurn);

        emit UpdateMember(address(dao), memberAddr, member.nbShares);
    }

    /**
     * Public read-only functions
     */
    function nbShares(Registry dao, address member)
        external
        view
        override
        returns (uint256)
    {
        return members[address(dao)][member].nbShares;
    }

    function getTotalShares() external view override returns (uint256) {
        return totalShares;
    }

    /**
     * Internal Utility Functions
     */

    function _enoughSharesToBurn(
        Registry dao,
        address memberAddr,
        uint256 sharesToBurn
    ) internal view returns (bool) {
        return
            sharesToBurn > 0 &&
            members[address(dao)][memberAddr].nbShares >= sharesToBurn;
    }
}

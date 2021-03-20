// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "../../utils/StringsConcat.sol";

/**
 * @title CollabLandERC721
 * @dev Implementation of the CollabLandERC721
 */
contract CollabLandERC721 is ERC721PresetMinterPauserAutoId {
    constructor(
        string memory name,
        string memory symbol,
        string memory baseUri
    ) ERC721PresetMinterPauserAutoId(name, symbol, baseUri) {
        _setBaseURI(
            StringsConcat.strConcat(
                baseUri,
                "/",
                StringsConcat.toString(uint256(address(this))),
                "/"
            )
        );
    }
}

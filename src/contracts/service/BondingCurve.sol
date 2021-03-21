// SPDX-License-Identifier: MIT

// CREDIT: https://github.com/alexanvl/bloccwarz/blob/master/contracts/BloccWarz.sol

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/ERC20/CollabLandERC20Mintable.sol";

contract BondingCurve {
    using SafeMath for uint256;
    address payable public owner;

    bool public halted;

    // Financial
    CollabLandERC20Mintable public erc20Token;
    uint256 public poolBalance = 0;
    uint256 public minTokenTransactionWei = 400; // enforce a minimum purchase/sale amount
    uint256 public transactionFeeAs1PctDenom = 4; // used to keep fee calculations as integers
    uint256 public tokenBWCWeiLockup = 1e21; // 1000 tokens will stay locked in the contract

    constructor(string memory _name, string memory _symbol) {
        erc20Token = new CollabLandERC20Mintable(_name, _symbol);
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function previewBuy(uint256 value) public view returns (uint256, uint256) {
        // Calculate fee as a fraction of 1%
        uint256 feeWei =
            SafeMath.div(SafeMath.div(value, 100), transactionFeeAs1PctDenom);
        uint256 purchaseWei = SafeMath.sub(value, feeWei);
        // Determine how many tokens to be minted
        // f(x) = 0.001x
        // F(x) = (x^2)/2000 + C
        // purchaseWei = ((erc20Token.totalSupply() + tokensMinted)^2)/2000 - poolBalance
        // tokensMinted = sqrt(2000 * (purchaseWei + poolBalance)) - erc20Token.totalSupply()
        uint256 tokensMinted =
            SafeMath.sub(
                sqrt(
                    SafeMath.mul(2000, SafeMath.add(purchaseWei, poolBalance))
                ),
                erc20Token.totalSupply()
            );
        return (tokensMinted, purchaseWei);
    }

    function buyTokens() public payable {
        // Purchase must be enough wei for contract to collect fee
        require(
            msg.value >= minTokenTransactionWei,
            "Must send minimum transaction amount to buy tokens"
        );

        (uint256 tokensMinted, uint256 purchaseWei) = previewBuy(msg.value);
        // mint tokens for sender
        erc20Token.mint(msg.sender, tokensMinted);
        // incerement pool balance
        poolBalance = SafeMath.add(poolBalance, purchaseWei);
    }

    function previewSell(uint256 _tokensBWCWei) public view returns (uint256) {
        require(
            _tokensBWCWei > 0,
            "Token amount for sale must be greater than 0"
        );
        // Calculate wei value of tokens for sale
        // f(x) = 0.001x
        // F(x) = (x^2)/2000 + C
        // salePriceWei = poolBalance - ((erc20Token.totalSupply() - _tokensBWCWei)^2)/2000
        uint256 targetTokenSupply =
            SafeMath.sub(erc20Token.totalSupply(), _tokensBWCWei);
        uint256 salePriceWei =
            SafeMath.sub(
                poolBalance,
                SafeMath.div(
                    SafeMath.mul(targetTokenSupply, targetTokenSupply),
                    2000
                )
            );
        require(
            salePriceWei >= minTokenTransactionWei,
            "Token sale value must meet minimum transaction amount"
        );
        // This should be impossible to trigger
        // require(poolBalance >= salePriceWei, "Contract balance insufficient for sale");
        // Calculate fee as a fraction of 1% of sale price
        uint256 feeWei =
            SafeMath.div(
                SafeMath.div(salePriceWei, 100),
                transactionFeeAs1PctDenom
            );
        uint256 sellerBalanceWei = SafeMath.sub(salePriceWei, feeWei);
        return sellerBalanceWei;
    }

    function sellTokens(uint256 _tokensBWCWei) public payable {
        uint256 sellerBalanceWei = previewSell(_tokensBWCWei);
        // transfer the tokens
        (bool result, bytes memory data) = address(erc20Token).delegatecall(
            abi.encodeWithSignature(
                "increaseAllowance(address,uint256)",
                address(this),
                _tokensBWCWei
            )
        );

        require(
            erc20Token.transferFrom(msg.sender, address(this), _tokensBWCWei),
            "ERC-20 transferFrom failed"
        );
        // Burn tokens
        erc20Token.burn(_tokensBWCWei);
        // Pay seller
        msg.sender.transfer(sellerBalanceWei);
        // update pool balance
        poolBalance = SafeMath.sub(poolBalance, sellerBalanceWei);
    }

    function withdrawWei(uint256 _amountWei) public onlyOwner {
        // Owner can never take from the pool, only contract profits
        require(
            _amountWei <= SafeMath.sub(address(this).balance, poolBalance),
            "Withdraw exceeds limit"
        );
        owner.transfer(_amountWei);
    }

    function withdrawTokens(uint256 _tokensBWCWei) public onlyOwner {
        // Owner can withdraw tokens collected by the contract above the lockup amount
        require(
            erc20Token.balanceOf(address(this)) > tokenBWCWeiLockup,
            "Not enough tokens locked up"
        );
        require(
            erc20Token.transfer(owner, _tokensBWCWei),
            "Contract has not enough tokens for withdraw"
        );
    }

    // UTIL

    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // FALLBACK
    // fallback() external payable {}

    receive() external payable {}
}

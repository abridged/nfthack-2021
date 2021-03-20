// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { BigNumber } from "@ethersproject/bignumber";
import { expect } from "@loopback/testlab";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { getSigner } from "../contract-utils";
import { DEPLOYER, USER1 } from "../helper";
import { CollabLandERC20Mintable__factory, Fraction, Fraction__factory } from "../types";
import { CollabLandERC721 } from "../types/CollabLandERC721";

describe("Fraction", function () {
  const user = getSigner(USER1, ethers.provider);
  const deployer = getSigner(DEPLOYER, ethers.provider);

  let erc721: CollabLandERC721;

  it("deploys CollabLandERC721 contract", async function () {
    const Factory = await ethers.getContractFactory("CollabLandERC721", deployer);
    erc721 = (await Factory.deploy(
      "TestNFT",
      "TNFT",
      "https://api.collab.land/nft-contracts"
    )) as CollabLandERC721;

    await erc721.deployed();

    const deployerAddress = await erc721.signer.getAddress();
    expect(await erc721.name()).to.eql("TestNFT");
    expect(await erc721.symbol()).to.eql("TNFT");
    const balance: BigNumber = await erc721.balanceOf(deployerAddress);
    expect(balance.toNumber()).to.eql(0);

    await erc721.mint(user.address);
    await erc721.mint(user.address);
    const userBalance = await erc721.balanceOf(user.address);
    expect(userBalance.toNumber()).to.eql(2);
  });

  it("deploys Fraction contract", async function () {
    const Factory = await ethers.getContractFactory("Fraction", deployer);
    const fraction = (await Factory.deploy(
      erc721.address,
      "TestFraction",
      "TF"
    )) as Fraction;

    await fraction.deployed();

    const userERC721 = erc721.connect(user);

    // How many tokens does the receiver have?
    const balance: BigNumber = await userERC721.balanceOf(user.address);
    expect(balance.toNumber()).to.eql(2);

    // Enumerate all token ids owned by the receiver
    const tokenIds: BigNumber[] = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId: BigNumber = await userERC721.tokenOfOwnerByIndex(
        user.address,
        i
      );
      await userERC721.approve(fraction.address, tokenId);
      tokenIds.push(tokenId);
    }

    const userFraction = fraction.connect(user);
    await userFraction.fungify(tokenIds, 1000);
    const erc20 = await userFraction.erc20Token();
    const total = await CollabLandERC20Mintable__factory.connect(
      erc20,
      user
    ).totalSupply();
    expect(total.eq(BigNumber.from(1000).mul(BigNumber.from(10).pow(18))));
  });
});

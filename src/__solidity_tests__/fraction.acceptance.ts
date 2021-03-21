// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BigNumber} from '@ethersproject/bignumber';
import {expect} from '@loopback/testlab';
import '@nomiclabs/hardhat-ethers';
import {Wallet} from 'ethers';
import {ethers} from 'hardhat';
import {getSigner} from '../contract-utils';
import {DEPLOYER, USER1, USER2} from '../helper';
import {BondingCurve, BondingCurve__factory, Fraction, Moloch} from '../types';
import {CollabLandERC721} from '../types/CollabLandERC721';

describe('Fraction', () => {
  const user1 = getSigner(USER1, ethers.provider);
  const user2 = getSigner(USER2, ethers.provider);
  const deployer = getSigner(DEPLOYER, ethers.provider);

  let erc721: CollabLandERC721;
  let curve: BondingCurve;
  let moloch: Moloch;
  let fraction: Fraction;

  it('deploys CollabLandERC721 contract', async () => {
    const Factory = await ethers.getContractFactory(
      'CollabLandERC721',
      deployer,
    );
    erc721 = (await Factory.deploy(
      'TestNFT',
      'TNFT',
      'https://api.collab.land/nft-contracts',
    )) as CollabLandERC721;

    await erc721.deployed();

    const deployerAddress = await erc721.signer.getAddress();
    expect(await erc721.name()).to.eql('TestNFT');
    expect(await erc721.symbol()).to.eql('TNFT');
    const balance: BigNumber = await erc721.balanceOf(deployerAddress);
    expect(balance.toNumber()).to.eql(0);

    await erc721.mint(user1.address);
    await erc721.mint(user1.address);
    const userBalance = await erc721.balanceOf(user1.address);
    expect(userBalance.toNumber()).to.eql(2);
  });

  it('deploys BondingCurve contract', async () => {
    const Factory = await ethers.getContractFactory('BondingCurve', deployer);
    curve = (await Factory.deploy('TestNFT', 'TNFT')) as BondingCurve;
  });

  it('deploys Moloch contract', async () => {
    const Factory = await ethers.getContractFactory('Moloch', deployer);
    moloch = (await Factory.deploy(
      DEPLOYER.address, // _summoner
      [curve.address],
      BigNumber.from(17280), // _periodDuration
      BigNumber.from(35), // _votingPeriodLength
      BigNumber.from(35), // _gracePeriodLength
      BigNumber.from(10).mul(BigNumber.from(10).pow(18)), // _proposalDeposit
      BigNumber.from(3), // _dilutionBound
      BigNumber.from(1000), // _processingReward
    )) as Moloch;
  });

  it('deploys Fraction contract', async () => {
    const Factory = await ethers.getContractFactory('Fraction', deployer);
    fraction = (await Factory.deploy(curve.address, moloch.address, {
      gasLimit: BigNumber.from('8000000'),
    })) as Fraction;

    await fraction.deployed();

    await contributeNFTs(user1);
  });

  it('buys tokens from the bonding curve', async () => {
    const value = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
    const curve = await getBondingCurve(user2);
    await curve.buyTokens({
      value,
      gasLimit: BigNumber.from('100000'),
    });

    const balance = await curve.balanceOf(user2.address);
    expect(balance.toNumber()).to.be.a.Number();
  });

  async function getBondingCurve(signer: Wallet) {
    const curve = await fraction.curve();
    return BondingCurve__factory.connect(curve, signer);
  }

  async function contributeNFTs(owner: Wallet) {
    const userERC721 = erc721.connect(owner);

    // How many tokens does the receiver have?
    const balance: BigNumber = await userERC721.balanceOf(owner.address);
    expect(balance.toNumber()).to.eql(2);

    // Enumerate all token ids owned by the receiver
    const tokenIds: BigNumber[] = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId: BigNumber = await userERC721.tokenOfOwnerByIndex(
        owner.address,
        i,
      );
      await userERC721.approve(fraction.address, tokenId);
      tokenIds.push(tokenId);
    }

    const userFraction = fraction.connect(owner);
    await userFraction.fungify(erc721.address, tokenIds);
  }
});

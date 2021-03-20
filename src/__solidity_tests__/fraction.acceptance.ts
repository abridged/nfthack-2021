// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BigNumber} from '@ethersproject/bignumber';
import {expect} from '@loopback/testlab';
import '@nomiclabs/hardhat-ethers';
import {ethers} from 'hardhat';
import {getSigner} from '../contract-utils';
import {DEPLOYER, USER1, USER2} from '../helper';
import {CollabLandERC20Mintable__factory, Fraction} from '../types';
import {CollabLandERC721} from '../types/CollabLandERC721';

describe('Fraction', function () {
  const user1 = getSigner(USER1, ethers.provider);
  const user2 = getSigner(USER2, ethers.provider);
  const deployer = getSigner(DEPLOYER, ethers.provider);

  let erc721: CollabLandERC721;
  let fraction: Fraction;

  it('deploys CollabLandERC721 contract', async function () {
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

  it('deploys Fraction contract', async function () {
    const Factory = await ethers.getContractFactory('Fraction', deployer);
    fraction = (await Factory.deploy(
      erc721.address,
      'TestFraction',
      'TF',
    )) as Fraction;

    await fraction.deployed();

    const userERC721 = erc721.connect(user1);

    // How many tokens does the receiver have?
    const balance: BigNumber = await userERC721.balanceOf(user1.address);
    expect(balance.toNumber()).to.eql(2);

    // Enumerate all token ids owned by the receiver
    const tokenIds: BigNumber[] = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId: BigNumber = await userERC721.tokenOfOwnerByIndex(
        user1.address,
        i,
      );
      await userERC721.approve(fraction.address, tokenId);
      tokenIds.push(tokenId);
    }

    const userFraction = fraction.connect(user1);
    await userFraction.fungify(tokenIds);
    /*
    const erc20 = await getERC20Contract();
    const total = await erc20.totalSupply();
    expect(total).to.eql(BigNumber.from(10).mul(BigNumber.from(10).pow(18)));
    */
  });

  it('buys tokens from the bonding curve', async () => {
    const userFraction = fraction.connect(user2);
    const value = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
    await userFraction.buyTokens({
      value,
    });
    const erc20 = await getERC20Contract();
    const balance = await erc20.balanceOf(user2.address);
    expect(balance.toNumber()).to.be.a.Number();
  });

  async function getERC20Contract() {
    const erc20 = await fraction.erc20Token();
    return CollabLandERC20Mintable__factory.connect(erc20, fraction.signer);
  }
});

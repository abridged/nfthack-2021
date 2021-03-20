// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BigNumber} from '@ethersproject/bignumber';
import {Contract} from '@ethersproject/contracts';
import {Wallet} from '@ethersproject/wallet';
import {expect} from '@loopback/testlab';
import '@nomiclabs/hardhat-ethers';
import {ethers} from 'hardhat';

describe('CollabLandERC20Factory', function () {
  let erc721: Contract;

  it('deploys CollabLandERC721 contract', async function () {
    const Factory = await ethers.getContractFactory('CollabLandERC721');
    erc721 = await Factory.deploy(
      'TestNFT',
      'TNFT',
      'https://api.collab.land/nft-contracts',
    );

    await erc721.deployed();

    const deployer = await erc721.signer.getAddress();
    expect(await erc721.name()).to.eql('TestNFT');
    expect(await erc721.symbol()).to.eql('TNFT');
    const balance: BigNumber = await erc721.balanceOf(deployer);
    expect(balance.toNumber()).to.eql(0);

    const user = Wallet.createRandom();
    await erc721.mint(user.address);
    const userBalance = await erc721.balanceOf(user.address);
    expect(userBalance.toNumber()).to.eql(1);
  });
});

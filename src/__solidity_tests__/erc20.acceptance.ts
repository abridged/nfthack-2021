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

describe('CollabLandERC20Factory', () => {
  let erc20: Contract;

  it('deploys CollabLandERC20Mintable contract', async () => {
    const Factory = await ethers.getContractFactory('CollabLandERC20Mintable');
    erc20 = await Factory.deploy('TestToken', 'TT');

    await erc20.deployed();

    const deployer = await erc20.signer.getAddress();
    expect(await erc20.name()).to.eql('TestToken');
    expect(await erc20.symbol()).to.eql('TT');
    const balance: BigNumber = await erc20.balanceOf(deployer);
    expect(balance.toNumber()).to.eql(0);

    const user = Wallet.createRandom();
    await erc20.mint(user.address, 10);
    const userBalance = await erc20.balanceOf(user.address);
    expect(userBalance.toNumber()).to.eql(10);
  });
});

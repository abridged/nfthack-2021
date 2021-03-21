// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import '@nomiclabs/hardhat-ethers';
import {ethers} from 'hardhat';
import {getSigner} from '../contract-utils';
import {DEPLOYER, USER1, USER2} from '../helper';
import {createDao} from '../services/molochv3-dao-factory';

describe('Fraction', () => {
  const user1 = getSigner(USER1, ethers.provider);
  const user2 = getSigner(USER2, ethers.provider);
  const deployer = getSigner(DEPLOYER, ethers.provider);

  it('deploys DAO contracts', async () => {
    const result = await createDao({}, deployer);
    console.log(result);
  });
});

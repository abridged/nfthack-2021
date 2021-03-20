// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Wallet} from 'ethers';
import {getSigner} from './contract-utils';

export const DEPLOYER_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export const USER1_PRIVATE_KEY =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

export const USER2_PRIVATE_KEY =
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

export const DEPLOYER = getSigner(new Wallet(DEPLOYER_PRIVATE_KEY));

export const USER1 = getSigner(new Wallet(USER1_PRIVATE_KEY));

export const USER2 = getSigner(new Wallet(USER2_PRIVATE_KEY));

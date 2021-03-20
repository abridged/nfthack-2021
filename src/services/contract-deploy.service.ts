// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {debugFactory} from '@collabland/common';
import {ContractFactory, Signer} from 'ethers';
import {
  ContractAddresses,
  ContractName,
  transferOwnership,
  TypedContractFactory,
} from '../contract-utils';
import {CollabLandERC20Mintable__factory} from '../types';
const debug = debugFactory('collabland:contracts:mint');

export type DeployConfirm = (name: string) => Promise<boolean>;

export class ContractDeployServiceClient {
  constructor(
    readonly signer: Signer,
    private confirm: DeployConfirm = async () => true,
  ) {}

  async deploy(
    addresses: Partial<ContractAddresses> = {},
    name: string,
    symbol: string,
  ) {
    await this.confirmDeploy(
      addresses,
      CollabLandERC20Mintable__factory,
      name,
      symbol,
    );

    debug('Contract addresses: %O', addresses);
    return addresses;
  }

  async confirmDeploy<T extends ContractFactory>(
    addresses: Partial<ContractAddresses>,
    factory: {new (signer: Signer): T},
    ...args: Parameters<T['deploy']>
  ) {
    const name = factory.name.replace(/__factory$/, '') as ContractName;
    if (await this.confirm(name)) {
      const contract = await this.deployContract(factory, ...args);
      addresses[name] = contract.address;
      const transaction = await contract.deployTransaction.wait();
      return {contract, transaction};
    } else {
      return undefined;
    }
  }

  deployContract<T extends ContractFactory>(
    factory: TypedContractFactory<T>,
    ...args: Parameters<T['deploy']>
  ) {
    return new factory(this.signer).deploy(...args);
  }
}

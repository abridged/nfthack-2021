// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {debugFactory} from '@collabland/common';
import {
  ContractFactory,
  ContractInterface,
  providers,
  Signer,
  Wallet,
} from 'ethers';
import {Ownable__factory} from './types';
const debug = debugFactory('collabland:contracts');

/**
 * Compiled Solidity metadata
 */
export type SolidityMetadata = {
  abi: ContractInterface;
  contractName: string;
  sourceName: string;
  bytecode: string;
};

/**
 * Contract names
 */
export type ContractName =
  | 'Ownable'
  | 'CollabLandERC20Factory'
  | 'CollabLandERC721Factory'
  | 'CollabLandERC721'
  | 'CollabLandERC1155Factory'
  | 'CollabLandERC1155'
  | 'CollabLandProxyRegistry'
  | 'Fraction';

export type TypedContractFactory<T extends ContractFactory> = {
  new (signer: Signer): T;
};

/**
 * Deployed contract addresses
 */
export type ContractAddresses = Record<ContractName, string>;

/**
 * Get a signer for the given wallet and provider
 * @param wallet - Wallet
 * @param provider - Ethers.js provider
 * @returns
 */
export function getSigner(wallet: Wallet, provider?: providers.Provider) {
  provider = provider ?? new providers.JsonRpcProvider('http://localhost:8545');
  const signer = wallet.connect(provider);
  return signer;
}

export async function transferOwnership(
  factory: typeof Ownable__factory,
  contractAddress: string,
  newOwnerAddress: string,
  currentOwner: Signer,
  gasLimit = 6000000,
) {
  debug(
    'Transferring ownership of % from % to %s',
    contractAddress,
    await currentOwner.getAddress(),
    newOwnerAddress,
  );
  const contract = factory.connect(contractAddress, currentOwner);

  return contract.transferOwnership(newOwnerAddress, {
    gasLimit,
  });
}

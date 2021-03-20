// Copyright Abridged, Inc. 2021. All Rights Reserved.
// Node module: @collabland/nfthack2021
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { providers, Wallet } from "ethers";
import fs from "fs";
import path from "path";
import { ContractAddresses, getSigner } from "../contract-utils";
import { DEPLOYER, DEPLOYER_PRIVATE_KEY } from "../helper";
import { ContractDeployServiceClient } from "../services";
import { CollabLandERC721__factory } from "../types/factories/CollabLandERC721__factory";

async function main() {
  let signer = DEPLOYER;
  const network = process.argv[2];
  if (network != null) {
    console.log("Deploying to %s", network);
    const wallet = new Wallet(DEPLOYER_PRIVATE_KEY);
    console.log(wallet.address);
    signer = getSigner(
      new Wallet(DEPLOYER_PRIVATE_KEY),
      providers.getDefaultProvider(network)
    );
  }

  const deployer = new ContractDeployServiceClient(signer);

  let addresses: Record<string, ContractAddresses> = {};
  await deployer.deployContract(
    CollabLandERC721__factory,
    "TestNFT",
    "TNFT",
    "https://api.collab.land/nft-tokens"
  );
  await deployer.deploy(addresses, "TestToken", "TT");

  fs.writeFileSync(
    path.join(__dirname, "../contract-addresses.json"),
    JSON.stringify(addresses, null, 2),
    "utf-8"
  );

  console.log("Contract addresses: %O", addresses);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

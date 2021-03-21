import {utils} from 'ethers';
import {BaseCommand} from '../base-command';
import {ContractAddresses} from '../contract-utils';
import {DEPLOYER} from '../helper';
import {ContractDeployServiceClient} from '../services';
import {createDao} from '../services/molochv3-dao-factory';
import {
  CollabLandERC721__factory,
  Fraction__factory,
  MemberContract__factory,
} from '../types';

export class DemoCommand extends BaseCommand {
  async run() {
    const network = await this.menu(
      {
        hardhat: 'hardhat',
        /*
        '100': 'xdai',
        '77': 'sokol (xdai testnet)',
        '137': 'Matic Mainnet',
        '80001': 'Matic Testnet Mumbai',
        hardhat: 'hardhat',
        '3': 'ropsten',
        '4': 'rinkeby',
        '1': 'mainnet',
        */
      },
      'Select the network:',
    );

    const signer = DEPLOYER;
    const deployer = new ContractDeployServiceClient(signer, contractName => {
      return this.confirm(`Deploying ${contractName}?`, 'confirm', true);
    });
    const addresses: ContractAddresses = {};
    await deployer.confirmDeploy(
      addresses,
      CollabLandERC721__factory,
      'CollabLandERC721',
      'CLNFT',
      'https://api.collab.land/nft-tokens',
    );

    await deployer.confirmDeploy(addresses, Fraction__factory, 'UCI', 'UCI');
    this.log(this.print(addresses));

    const registry = await createDao({}, signer);
    const memberModule = utils.keccak256(utils.toUtf8Bytes('member'));
    this.log('member module: %s', memberModule);
    try {
      const memberAddress = await registry.getAddress(memberModule);
      console.log('member address: %s', memberAddress);
      const memberContract = await MemberContract__factory.connect(
        memberAddress,
        signer,
      );
      const total = await memberContract.getTotalShares();
      console.log(total.toNumber());
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

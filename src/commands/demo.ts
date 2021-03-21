import {BigNumber, utils, Wallet} from 'ethers';
import {BaseCommand} from '../base-command';
import {ContractAddresses} from '../contract-utils';
import {DEPLOYER, USER1, USER2} from '../helper';
import {ContractDeployServiceClient} from '../services';
import {createDao} from '../services/molochv3-dao-factory';
import {
  CollabLandERC20Mintable__factory,
  CollabLandERC721,
  CollabLandERC721__factory,
  Fraction,
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
    const {contract: erc721} = (await deployer.confirmDeploy(
      addresses,
      CollabLandERC721__factory,
      'CollabLandERC721',
      'CLNFT',
      'https://api.collab.land/nft-tokens',
    ))!;

    const {contract: fraction} = (await deployer.confirmDeploy(
      addresses,
      Fraction__factory,
      'UCI',
      'UCI',
    ))!;
    this.log(this.print(addresses));

    await this.contributeNFTs(
      USER1,
      erc721 as CollabLandERC721,
      fraction as Fraction,
    );

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

  async contributeNFTs(
    owner: Wallet,
    erc721: CollabLandERC721,
    fraction: Fraction,
  ) {
    const userERC721 = erc721.connect(owner);

    this.log('Minting two NFTs for %s', owner.address);
    await erc721.mint(owner.address);
    await erc721.mint(owner.address);

    // How many tokens does the receiver have?
    const balance: BigNumber = await userERC721.balanceOf(owner.address);
    this.log('NFT balance for %s: %d', owner.address, balance.toNumber());

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
    this.log(
      'Approved NFT tokens: %s',
      tokenIds.map(t => t.toNumber()),
    );

    const userFraction = fraction.connect(owner);
    await userFraction.fungify(erc721.address, tokenIds);
    this.log('Two NFT tokens are added to %s', userFraction.address);

    const value = BigNumber.from(10).mul(BigNumber.from(10).pow(18));

    const cost = await fraction.previewBuy(value);
    this.log('Tokens to be acquired: %s, Fee: %s', cost[0], cost[1]);

    const tokensOwned = await this.buyTokens(USER2, fraction, value);

    // Now sell half of the tokens
    // await this.sellTokens(USER2, fraction, tokensOwned.div(2));
  }

  async buyTokens(user: Wallet, fraction: Fraction, value: BigNumber) {
    this.log('Buying ERC20 tokens from the bonding curve for %s', user.address);
    const userFraction = fraction.connect(user);
    await userFraction.buyTokens({
      value,
    });
    const erc20 = await this.getERC20Contract(fraction);
    const balance = await erc20.balanceOf(user.address);
    this.log('ERC20 balance: %d', balance.toNumber());
    return balance;
  }

  async sellTokens(user: Wallet, fraction: Fraction, value: BigNumber) {
    this.log(
      'Selling ERC20 tokens from the bonding curve for %s',
      user.address,
    );
    const userFraction = fraction.connect(user);
    await userFraction.sellTokens(value, {gasLimit: BigNumber.from('1000000')});
    const erc20 = await this.getERC20Contract(fraction);
    const balance = await erc20.balanceOf(user.address);
    this.log('ERC20 balance: %d', balance.toNumber());
  }

  async getERC20Contract(fraction: Fraction) {
    const erc20 = await fraction.erc20Token();
    return CollabLandERC20Mintable__factory.connect(erc20, fraction.signer);
  }
}

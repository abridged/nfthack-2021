import {Signer} from '@ethersproject/abstract-signer';
import {BigNumber} from '@ethersproject/bignumber';
import {Contract, providers} from 'ethers';
import {BankContract__factory} from '../types/factories/BankContract__factory';
import {DaoFactory__factory} from '../types/factories/DaoFactory__factory';
import {FinancingContract__factory} from '../types/factories/FinancingContract__factory';
import {FlagHelper__factory} from '../types/factories/FlagHelper__factory';
import {ManagingContract__factory} from '../types/factories/ManagingContract__factory';
import {
  MemberContract__factory,
  MemberContractLibraryAddresses,
} from '../types/factories/MemberContract__factory';
import {OnboardingContract__factory} from '../types/factories/OnboardingContract__factory';
import {
  ProposalContractLibraryAddresses,
  ProposalContract__factory,
} from '../types/factories/ProposalContract__factory';
import {RagequitContract__factory} from '../types/factories/RagequitContract__factory';
import {Registry__factory} from '../types/factories/Registry__factory';
import {VotingContract__factory} from '../types/factories/VotingContract__factory';
const GUILD = '0x000000000000000000000000000000000000dead';
const ESCROW = '0x000000000000000000000000000000000000beef';
const TOTAL = '0x000000000000000000000000000000000000babe';
const ETH_TOKEN = '0x0000000000000000000000000000000000000000';

const numberOfShares = BigNumber.from('1000000000000000');
const sharePrice = BigNumber.from(BigNumber.from('120000000000000000'));
const remaining = sharePrice.sub(BigNumber.from('50000000000000'));

async function prepareSmartContracts(
  memberLib: MemberContractLibraryAddresses,
  proposalLib: ProposalContractLibraryAddresses,
  signer: Signer,
) {
  const lib = await new FlagHelper__factory(signer).deploy();
  // await MemberContract.link('FlagHelper', lib.address);
  // await ProposalContract.link('FlagHelper', lib.address);
  const member = await new MemberContract__factory(memberLib, signer).deploy();
  const proposal = await new ProposalContract__factory(
    proposalLib,
    signer,
  ).deploy();
  const voting = await new VotingContract__factory(signer).deploy();
  const ragequit = await new RagequitContract__factory(signer).deploy();
  const managing = await new ManagingContract__factory(signer).deploy();
  const financing = await new FinancingContract__factory(signer).deploy();
  const onboarding = await new OnboardingContract__factory(signer).deploy();
  const bank = await new BankContract__factory(signer).deploy();

  return {
    voting,
    proposal,
    member,
    ragequit,
    managing,
    financing,
    onboarding,
    bank,
  };
}

async function createDao(
  memberLib: MemberContractLibraryAddresses,
  proposalLib: ProposalContractLibraryAddresses,
  overridenModules: Record<string, Contract>,
  senderAccount: Signer,
) {
  const modules = await prepareSmartContracts(
    memberLib,
    proposalLib,
    senderAccount,
  );
  Object.assign(modules, overridenModules);
  const {
    member,
    proposal,
    voting,
    ragequit,
    managing,
    financing,
    onboarding,
    bank,
  } = modules;
  const daoFactory = await new DaoFactory__factory(
    senderAccount,
  ).deploy(
    member.address,
    proposal.address,
    voting.address,
    ragequit.address,
    managing.address,
    financing.address,
    onboarding.address,
    bank.address,
    {gasPrice: BigNumber.from('0')},
  );
  const txInfo = await daoFactory.newDao(sharePrice, numberOfShares, 1000, {
    gasPrice: BigNumber.from('0'),
  });
  // console.log("\t Gas Used: " + txInfo.receipt.gasUsed);
  const pastEvents = await daoFactory.getPastEvents();
  const daoAddress = pastEvents[0].returnValues.dao;
  const dao = new Registry__factory().attach(daoAddress);
  return dao;
}

async function advanceTime(provider: providers.Web3Provider, time: BigNumber) {
  await provider.send('evm_increaseTime', [time]);

  await provider.send('evm_mine', []);
}

module.exports = {
  prepareSmartContracts,
  advanceTime,
  createDao,
  GUILD,
  ESCROW,
  TOTAL,
  numberOfShares,
  sharePrice,
  remaining,
  ETH_TOKEN,
};

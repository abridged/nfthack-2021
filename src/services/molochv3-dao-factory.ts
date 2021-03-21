import {Signer} from '@ethersproject/abstract-signer';
import {BigNumber} from '@ethersproject/bignumber';
import {Contract, providers} from 'ethers';
import {BankContract__factory} from '../types/factories/BankContract__factory';
import {DaoFactory__factory} from '../types/factories/DaoFactory__factory';
import {FinancingContract__factory} from '../types/factories/FinancingContract__factory';
import {FlagHelper__factory} from '../types/factories/FlagHelper__factory';
import {ManagingContract__factory} from '../types/factories/ManagingContract__factory';
import {MemberContract__factory} from '../types/factories/MemberContract__factory';
import {OnboardingContract__factory} from '../types/factories/OnboardingContract__factory';
import {ProposalContract__factory} from '../types/factories/ProposalContract__factory';
import {RagequitContract__factory} from '../types/factories/RagequitContract__factory';
import {Registry__factory} from '../types/factories/Registry__factory';
import {VotingContract__factory} from '../types/factories/VotingContract__factory';

export const GUILD = '0x000000000000000000000000000000000000dead';
export const ESCROW = '0x000000000000000000000000000000000000beef';
export const TOTAL = '0x000000000000000000000000000000000000babe';
export const ETH_TOKEN = '0x0000000000000000000000000000000000000000';

export const numberOfShares = BigNumber.from('1000000000000000');
export const sharePrice = BigNumber.from(BigNumber.from('120000000000000000'));
export const remaining = sharePrice.sub(BigNumber.from('50000000000000'));

export async function prepareSmartContracts(signer: Signer) {
  const lib = await new FlagHelper__factory(signer).deploy();
  // await MemberContract.link('FlagHelper', lib.address);
  // await ProposalContract.link('FlagHelper', lib.address);
  const member = await new MemberContract__factory(
    {__$a61a7c95503f568b3ed0cfd9705b76bf22$__: lib.address},
    signer,
  ).deploy();
  const proposal = await new ProposalContract__factory(
    {__$a61a7c95503f568b3ed0cfd9705b76bf22$__: lib.address},
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

export async function createDao(
  overridenModules: Record<string, Contract>,
  senderAccount: Signer,
) {
  const modules = await prepareSmartContracts(senderAccount);
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
  const receipt = await txInfo.wait();
  const daoAddress = (receipt as any).events.find(
    (e: any) => e.event === 'NewDao',
  ).args[1];
  const dao = Registry__factory.connect(daoAddress, senderAccount);
  return dao;
}

export async function advanceTime(
  provider: providers.Web3Provider,
  time: BigNumber,
) {
  await provider.send('evm_increaseTime', [time]);

  await provider.send('evm_mine', []);
}

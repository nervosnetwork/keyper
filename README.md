Keyper
======

> Keyper is still under development and NOT production ready. Future versions may introduce interface changes which are not backwards compatibile with this version.

Keyper is an ownership layer for the Nervos CKB blockchain.

Nervos LockScripts provide a high level of flexibility, but it can be challenging for wallets to support all the different variations. Keyper is specification for the efficient management of LockScripts. The Keyper reference implementation is written in TypeScript.

Keyper's interface specification provides developers with a standardized way to interact with any Keyper-enabled wallet. This can include mainstream wallets of any type, including integrated wallets in applications, web browser based wallets, and hardware wallets.

The Keyper project is divided into two sub-projects: `specs` and `container`. 

The `specs` subproject contains all specification definitions and tool class support.

The `container` subproject is designed to support the loading of custom LockScripts within wallets.

## Key Manager (Wallet) Integration

A Key Manager is the component of a wallet responsible for managing the user's private keys. Private keys can be either raw private keys or HD wallet keys.

A Key Manager should integrate the `@keyper/container` module or the `@keyper/container` protocol interface in order to support the Keyper architecture.

```
interface PublicKey {
  payload: Bytes
  algorithm: SignatureAlgorithm
}

interface SignProvider {
  sign(context: SignContext, message: Bytes): Promise<Bytes>
}

interface KeyManager {
  addLockScript(lockScript: LockScript): void
  addPublicKey(publicKey: PublicKey): void
  removePublicKey(publicKey: PublicKey): void
}
```

## dApp Integration

```
interface TransactionMeta {
  name: string
  script: Script
  deps: CellDep[]
  headers?: Hash256[]
}

interface LockHashWithMeta {
  hash: Hash256
  meta: TransactionMeta
}

interface ContainerService {
  getAllLockHashesAndMeta(): Promise<LockHashWithMeta[]>
  sign(context: SignContext, rawTx: RawTransaction, config: Config): Promise<RawTransaction>
  send(tx: RawTransaction): Promise<Hash256>
}
```

## LockScript Specification

```
interface LockScript {
  readonly name: string;
  readonly codeHash: Hash256;
  readonly hashType: ScriptHashType;
  setProvider(provider: SignProvider): void;
  script(publicKey: string): Script;
  deps(): CellDep[];
  headers?(): Hash256[];
  signatureAlgorithm(): SignatureAlgorithm;
  sign(context: SignContext, rawTx: RawTransaction, config: Config): Promise<RawTransaction>;
}
```

The LockScript basic information keys are `name`, `codeHash` and `hashType`.

The `setProvider` key is a callback function for implementation of the underlying signature algorithm. This is provided by Keyper `container`.

For example, below is the Keyper Scatter `secp256k1` signature algorithm implementation:

```
public sign(context: SignContext, message: Bytes): Promise<Bytes> {
  const key = keys[context.publicKey];
  if (!key) {
    throw new Error(`no key for address: ${context.address}`);
  }
  const privateKey = keystore.decrypt(key, context.password);

  const ec = new EC('secp256k1');
  const keypair = ec.keyFromPrivate(privateKey);
  const msg = typeof message === 'string' ? hexToBytes(message) : message;
  let { r, s, recoveryParam } = keypair.sign(msg, {
    canonical: true,
  });
  if (recoveryParam === null){
    throw new Error('Fail to sign the message');
  }
  const fmtR = r.toString(16).padStart(64, '0');
  const fmtS = s.toString(16).padStart(64, '0');
  const signature = `0x${fmtR}${fmtS}${this.padToEven(recoveryParam.toString(16))}`;
  return signature;
}
```

The `script` key is a method that implments public key to Script transfer. Below is a Secp256k1 implementation:

```
public script(publicKey: string): Script {
  const args = utils.blake160(publicKey);
  return {
    codeHash: this.codeHash,
    hashType: this.hashType,
    args: `0x${Buffer.from(args).toString("hex")}`
  };
}
```

The `deps` and `headers` keys contain LockScript source details. Below is secp256k1 implementation:

```
public deps(): CellDep[] {
  return [{
    outPoint: {
      txHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
      index: "0x0",
    },
    depType: "depGroup",
  }];
}
```

The `signatureAlgorithm` key returns the supported signature algorithm for this LockScript.

The `sign` key is a method that implements signing functionality for a transaction. Partial signatures can be accomplished using the `config` parameter. Below is seck256k1 signing example:

```
public async sign(context: SignContext, rawTx: RawTransaction, config: Config = {index: 0, length: -1}): Promise<RawTransaction> {
  const txHash = utils.rawTransactionToHash(rawTx);

  if (config.length  === -1) {
    config.length = rawTx.witnesses.length;
  }

  if (config.length + config.index > rawTx.witnesses.length) {
    throw new Error("request config error");
  }
  if (typeof rawTx.witnesses[config.index] !== 'object') {
    throw new Error("first witness in the group should be type of WitnessArgs");
  }

  const emptyWitness = {
    // @ts-ignore
    ...rawTx.witnesses[config.index],
    lock: `0x${'0'.repeat(130)}`,
  };

  const serializedEmptyWitnessBytes = utils.hexToBytes(utils.serializeWitnessArgs(emptyWitness));
  const serialziedEmptyWitnessSize = serializedEmptyWitnessBytes.length;

  const s = utils.blake2b(32, null, null, utils.PERSONAL);
  s.update(utils.hexToBytes(txHash));
  s.update(utils.hexToBytes(utils.toHexInLittleEndian(`0x${numberToBN(serialziedEmptyWitnessSize).toString(16)}`, 8)));
  s.update(serializedEmptyWitnessBytes);

  for (let i = config.index + 1; i < config.index + config.length; i++) {
    const w = rawTx.witnesses[i];
    // @ts-ignore
    const bytes = utils.hexToBytes(typeof w === 'string' ? w : utils.serializeWitnessArgs(w));
    s.update(utils.hexToBytes(utils.toHexInLittleEndian(`0x${numberToBN(bytes.length).toString(16)}`, 8)));
    s.update(bytes);
  }

  const message = `0x${s.digest('hex')}`;
  const signd = await this.provider.sign(context, message);
  // @ts-ignore
  rawTx.witnesses[config.index].lock = signd;
  // @ts-ignore
  rawTx.witnesses[config.index] = utils.serializeWitnessArgs(rawTx.witnesses[config.index]);

  return rawTx;
}
```

## Development of Keyper

### Prerequisites

The following must be installed available to build this project.

- NPM https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Yarn https://classic.yarnpkg.com/en/docs/install

### Setup and Building

Install all dependencies. This must be run once after cloning the repository.
```
yarn install
```

Clean old builds, install dependencies, and bootstrap the project. This should be run after cloning, and can be run repeatedly when needed.
```
yarn run reboot
```

Build all project components.
```
yarn run build
```

Test all project components.
```
yarn run test
```

## Installing as a Dependency

To install Keyper as a dependency in another project without manually building use the following.

```
npm i @keyper/specs
npm i @keyper/container
```

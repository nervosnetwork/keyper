Keyper
======

> Ownership layer for Nervos CKB

> The Keyper is still under development and NOT production ready. We do not guarantee interface compatibility.

Keyper is bridge layer for wallet key manager mudule and dApp. dApp developers can use Keyper to interact with keyper-enabled wallets, include mainstream wallet applications and hardware wallets.

Keyper also a LockScript container for Nervos. Keyper can convert wallet-managed private keys into LockScript instances, so dApp applications can use LockScirpt to build dApp logic.

## Key Manager(Wallet) Integration

Key Manager is responsible for managing the user's private key and the implementation of the core encryption algorithm. The private key can be an independent private keys or HD wallet keys.

Key Manager should integrate `@keyper/container` module or `@keyper/container` protocol interface for support Keyper architecture.

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

`name`, `codeHash` and `hashType` is LockScript basic information.

`setProvider` is callback function for implementation of the underlying signature algorithm. This is provide by keyper container.
For example, below is keyper scatter `secp256k1` signature algorithm implementation:

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

`script` method implment public key to Script transfer, below is Secp256k1 implementation:

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

`deps` and `headers` returns LockScript sources deployed detail, below is secp256k1 implementation:

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

`signatureAlgorithm` returns supported signature algorithm for this LockScript.

`sign` implement sign witnesses progress, can implement partial signature through `config` parameter, below is seck256k1 sign:

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

## Development

```
yarn run reboot
yarn run build
yarn run test
```

## Install

```
npm i @keyper/specs
npm i @keyper/container
```

Keyper
======

> Ownership layer for Nervos CKB

Keyper is bridge layer for wallet key manager mudule and dApp. dApp developers can use Keyper to interact with keyper-enabled wallets, include mainstream wallet applications and hardware wallets.

Keyper also a LockScript container for Nervos. Keyper can convert wallet-managed private keys into LockScript instances, so dApp applications can use LockScirpt to build dApp logic.

## Key Manager(Wallet) Integration

Key Manager is responsible for managing the user's private key and the implementation of the core encryption algorithm. The private key can be an independent private keys or HD wallet keys.

Key Manager should integrate `@keyper/container` module or `@keyper/container` protocol interface for support Keyper architecture.

## dApp Integration

// TODO

## LockScript Specification

```
interface LockScript {
  readonly name: string;
  readonly codeHash: Hash256;
  readonly hashType: ScriptHashType;
  script(publicKey: string): Script;
  deps(): CellDep[];
  headers?(): Hash256[];
  signatureAlgorithm(): SignatureAlgorithm;
  sign(publicKey: string, rawTx: RawTransaction, config: Config): Promise<RawTransaction>;
}
```
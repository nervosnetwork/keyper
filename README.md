Keyper
======

> Ownership layer for Nervos CKB

Keyper is bridge layer for wallet key manager mudule and dApp. dApp developers can use Keyper to interact with keyper-enabled wallets, include mainstream wallet applications and hardware wallets.

Keyper also a LockScript container for Nervos. Keyper can convert wallet-managed private keys into LockScript instances, so dApp applications can use LockScirpt to build dApp logic.

## Key Manager(Wallet) Integration

Key Manager is responsible for managing the user's private key and the implementation of the core encryption algorithm. The private key can be an independent private keys or HD wallet keys.

## dApp Integration



## LockScript Specification

```
interface LockScript {
  readonly name: string;
  hash(): string;
  address(short: boolean): string;
  script(): Script;
  deps(): CellDep[];
  headers?(): Hash256[];
  requiredAlgorithms(): SignatrueAlgorithm[];
  sign(rawTx: RawTransaction): RawTransaction;
}
```
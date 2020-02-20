import * as utils from "@nervosnetwork/ckb-sdk-utils";
import { 
  LockScript, 
  SignatureAlgorithm,
  Bytes,
  Script,
  Hash256,
  RawTransaction,
  Config,
  SignProvider
} from "@keyper/specs";

export interface PublicKey {
  payload: Bytes,
  algorithm: SignatureAlgorithm
}

export interface ContainerService {
  getAllLockScripts(): Promise<Script[]>
  getAllLockHashes(): Promise<Hash256[]>
  sign(lockHash: Hash256, rawTx: RawTransaction, config: Config): Promise<RawTransaction>;
  send(tx: RawTransaction): Promise<Hash256>;
}

export interface KeyManager {
  addLockScript(lockScript: LockScript): void
  addPublicKey(publicKey: PublicKey): void
  removePublicKey(publicKey: PublicKey): void
}

interface LockScriptHolder {
  publicKey: PublicKey,
  script: Script,
  lockScript: LockScript
}

export class Container implements KeyManager, ContainerService {
  private algorithms: SignatureAlgorithm[];
  private providers: SignProvider[];
  private lockScripts: LockScript[];
  private publicKeys: PublicKey[];
  private holders: {
    [lockHash: string]: LockScriptHolder
  };

  public constructor(algorithms: {algorithm: SignatureAlgorithm, provider: SignProvider}[]) {
    this.algorithms = [];
    this.providers = [];
    this.lockScripts = [];
    this.publicKeys = [];
    this.holders = {};

    algorithms.forEach(item => {
      this.algorithms.push(item.algorithm);
      this.providers.push(item.provider);
    });
  }

  public lockScriptSize(): number {
    return this.lockScripts.length;
  }

  public publicKeySize(): number {
    return this.publicKeys.length;
  }

  public addLockScript(lockScript: LockScript) {
    let matched = false;
    let index = 0;
    for (let i = 0; i < this.algorithms.length; i++) {
      if (this.algorithms[i] === lockScript.signatureAlgorithm()) {
        matched = true;
        index = i;
        break;
      }
    }
    if (!matched) {
      throw Error(`container not support ${lockScript.signatureAlgorithm()} signature algorithm.`);
    }
    for (let i = 0; i < this.lockScripts.length; i++) {
      if (lockScript.codeHash === this.lockScripts[i].codeHash && lockScript.hashType === this.lockScripts[i].hashType) {
        return;
      }
    }
    lockScript.setProvider(this.providers[index]);
    this.initLockScriptHolders(lockScript);
    this.lockScripts.push(lockScript);
  }

  public addPublicKey(publicKey: PublicKey) {
    if (publicKey.payload === "") {
      throw Error("public key is empty.");
    }
    for (let i = 0; i < this.publicKeys.length; i++) {
      if(publicKey.payload === this.publicKeys[i].payload 
          && publicKey.algorithm == this.publicKeys[i].algorithm) {
        return;
      }
    }
    this.initPublicKeyHolders(publicKey);
    this.publicKeys.push(publicKey);
  }

  public removePublicKey(publicKey: PublicKey) {
    if (publicKey.payload === "") {
      throw Error("public key is empty.");
    }
    this.publicKeys.forEach( (item, index) => {
      if(publicKey.payload === item.payload 
          && publicKey.algorithm == item.algorithm) {
        this.publicKeys.splice(index, 1);
        Object.keys(this.holders).map(lockHash => {
          const holder = this.holders[lockHash];
          if (holder.publicKey.algorithm === publicKey.algorithm
              && holder.publicKey.payload === publicKey.payload) {
            delete this.holders[lockHash];
          }
        });
        return;
      }
    });
  }

  private initLockScriptHolders(lockScript: LockScript) {
    this.publicKeys.forEach(publicKey => {
      if (publicKey.algorithm === lockScript.signatureAlgorithm()) {
        const script = lockScript.script(publicKey.payload);
        const hash = utils.scriptToHash(script);
        this.holders[hash] = {
          publicKey: publicKey,
          script: script,
          lockScript: lockScript
        };
      }
    });
  }

  private initPublicKeyHolders(publicKey: PublicKey) {
    this.lockScripts.forEach(lockScript => {
      if (publicKey.algorithm === lockScript.signatureAlgorithm()) {
        const script = lockScript.script(publicKey.payload);
        const hash = utils.scriptToHash(script);
        this.holders[hash] = {
          publicKey: publicKey,
          script: script,
          lockScript: lockScript
        };
      }
    });
  }

  public async getAllLockScripts(): Promise<Script[]> {
    return Object.keys(this.holders).map(lockHash => this.holders[lockHash].script);
  }

  public async getAllLockHashes(): Promise<Hash256[]> {
    return Object.keys(this.holders);
  }

  public async sign(lockHash: Hash256, rawTx: RawTransaction, config: Config): Promise<RawTransaction> {
    if (!this.holders[lockHash]) {
      throw Error(`${lockHash} not exists`);
    }
    const holder = this.holders[lockHash];

    // TODO should call user confirm UI
    const result = await holder.lockScript.sign(holder.publicKey.payload, rawTx, config);
    return result;
  }

  public async send(_tx: RawTransaction): Promise<Hash256> {
    throw new Error("unsupport for default container");
  }
}
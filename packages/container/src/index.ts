import * as utils from "@nervosnetwork/ckb-sdk-utils";
import { 
  LockScript, 
  SignatureAlgorithm,
  Bytes,
  Script,
  Hash256,
  RawTransaction,
  Config,
  SignProvider,
  CellDep,
  SignContext
} from "@keyper/specs";

export interface PublicKey {
  payload: Bytes
  algorithm: SignatureAlgorithm
}

export interface TransactionMeta {
  name: string
  script: Script
  deps: CellDep[]
  headers?: Hash256[]
}

export interface LockHashWithMeta {
  hash: Hash256
  meta: TransactionMeta
}

export interface ContainerService {
  getAllLockHashesAndMeta(): Promise<LockHashWithMeta[]>
  getLockHashesAndMetaByPublicKey(publicKey: PublicKey): Promise<LockHashWithMeta[]>
  sign(context: SignContext, rawTx: RawTransaction, config: Config): Promise<RawTransaction>
  send(tx: RawTransaction): Promise<Hash256>
}

export interface KeyManager {
  addLockScript(lockScript: LockScript): void
  addPublicKey(publicKey: PublicKey): void
  getScriptsByPublicKey(publicKey: PublicKey): Script[]
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

  public getScriptsByPublicKey(publicKey: PublicKey): Script[] {
    const result:Script[] = [];
    Object.keys(this.holders).forEach(lockHash => {
      const holder = this.holders[lockHash];
      if (holder.publicKey.algorithm === publicKey.algorithm
          && holder.publicKey.payload === publicKey.payload) {
        result.push(holder.script);
      }
    });
    return result;
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

  public async getAllLockHashesAndMeta(): Promise<LockHashWithMeta[]> {
    return Object.keys(this.holders).map(lockHash => {
      return {
        hash: lockHash,
        meta: {
          name: this.holders[lockHash].lockScript.name,
          script: this.holders[lockHash].script,
          deps: this.holders[lockHash].lockScript.deps(),
          headers: this.holders[lockHash].lockScript.headers? this.holders[lockHash].lockScript.headers!() : undefined,
        },
      };
    });
  }

  public async getLockHashesAndMetaByPublicKey(publicKey: PublicKey): Promise<LockHashWithMeta[]> {
    return Object.keys(this.holders).filter(lockHash => {
      const target = this.holders[lockHash].publicKey;
      return publicKey.algorithm === target.algorithm && publicKey.payload === target.payload;
    }).map(lockHash => {
      return {
        hash: lockHash,
        meta: {
          name: this.holders[lockHash].lockScript.name,
          script: this.holders[lockHash].script,
          deps: this.holders[lockHash].lockScript.deps(),
          headers: this.holders[lockHash].lockScript.headers? this.holders[lockHash].lockScript.headers!() : undefined,
        },
      };
    });
  }

  public async sign(context: SignContext, rawTx: RawTransaction, config: Config): Promise<RawTransaction> {
    if (!context.lockHash || !this.holders[context.lockHash]) {
      throw Error("context hash or holder not exists");
    }
    const holder = this.holders[context.lockHash];
    context["publicKey"] = holder.publicKey.payload;

    const deps = holder.lockScript.deps();
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      let found = false;
      for (let j = 0; j < rawTx.cellDeps.length; j++) {
        const txDep = rawTx.cellDeps[j];
        if (txDep.depType === dep.depType
            && txDep.outPoint?.txHash === dep.outPoint?.txHash
            && txDep.outPoint?.index == dep.outPoint?.index) {
          found = true;
          break;
        }
      }
      if (!found) {
        rawTx.cellDeps.push(dep);
      }
    }
    if (holder.lockScript.headers) {
      const headers = holder.lockScript.headers();
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        let found = false;
        for (let j = 0; j < rawTx.headerDeps.length; j++) {
          const txHeader = rawTx.headerDeps[j];
          if(txHeader === header) {
            found = true;
            break;
          }
        }
        if (!found) {
          rawTx.headerDeps.push(header);
        }
      }
    }

    const result = await holder.lockScript.sign(context, rawTx, config);
    return result;
  }

  public async send(_tx: RawTransaction): Promise<Hash256> {
    throw new Error("unsupport for default container");
  }
}
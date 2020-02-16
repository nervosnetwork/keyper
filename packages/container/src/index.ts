import * as utils from "@nervosnetwork/ckb-sdk-utils";
import { LockScript, SignatureAlgorithm, Bytes, Script, Hash256 } from "@keyper/sepcs";

export interface PublicKey {
  payload: Bytes,
  algorithm: SignatureAlgorithm
}

export interface ContainerService {
  getAllLockScripts(): Promise<Script[]>
  getAllLockHashes(): Promise<Hash256[]>
}

interface LockScriptHolder {
  publicKey: PublicKey,
  script: Script
}

export class Container implements ContainerService {
  private algorithms: SignatureAlgorithm[];
  private lockScripts: LockScript[];
  private publicKeys: PublicKey[];
  private holders: {
    [lockHash: string]: LockScriptHolder
  };

  public constructor(algorithms: SignatureAlgorithm[]) {
    this.algorithms = algorithms;
  }

  public addLockScript(lockScript: LockScript) {
    let matched = false;
    for (let i = 0; i < this.algorithms.length; i++) {
      if (this.algorithms[i] === lockScript.signatureAlgorithm()) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      throw Error(`container not support ${lockScript.signatureAlgorithm()} signature algorithm.`);
    }
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

  private initLockScriptHolders(lockScript: LockScript) {
    this.publicKeys.forEach(publicKey => {
      if (publicKey.algorithm === lockScript.signatureAlgorithm()) {
        const script = lockScript.script(publicKey.payload);
        const hash = utils.scriptToHash(script);
        this.holders[hash] = {
          publicKey: publicKey,
          script: script
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
          script: script
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
}
import { LockScript, SignatureAlgorithm, Bytes } from "@keyper/sepcs";

export interface PublicKey {
  payload: Bytes,
  algorithm: SignatureAlgorithm
}

export interface ContainerService {
}

export class Container implements ContainerService {
  private algorithms: SignatureAlgorithm[];
  private plugins: LockScript[];
  private publicKeys: PublicKey[];

  public constructor(algorithms: SignatureAlgorithm[]) {
    this.algorithms = algorithms;
  }

  public addPlugin(plugin: LockScript) {
    let matched = false;
    for (let i = 0; i < this.algorithms.length; i++) {
      if (this.algorithms[i] === plugin.signatureAlgorithm()) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      throw Error(`container not support ${plugin.signatureAlgorithm()} signature algorithm.`);
    }
    this.plugins.push(plugin);
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
    this.publicKeys.push(publicKey);
  }
}
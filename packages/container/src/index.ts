import { LockScript, SignatureAlgorithm } from "@keyper/sepcs";

export class Container {
  private algorithms: SignatureAlgorithm[];
  private plugins: LockScript[];

  public constructor(algorithms: SignatureAlgorithm[]) {
    this.algorithms = algorithms;
  }

  public addPlugin(plugin: LockScript): void {
    const requiredAlgorithms = plugin.requiredAlgorithms();
    requiredAlgorithms.forEach(algo => {
      for (let i = 0; i < this.algorithms.length; i++) {
        if (this.algorithms[i] === algo) {
          return;
        }
      }
      throw Error(`container not support ${algo} signature algorithm.`);
    });
    this.plugins.push(plugin);
  }
}
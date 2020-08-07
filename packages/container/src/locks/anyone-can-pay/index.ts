const numberToBN = require("number-to-bn");
import * as utils from "@nervosnetwork/ckb-sdk-utils";
import { 
  LockScript, ScriptHashType, Script, CellDep, SignatureAlgorithm, RawTransaction, Config, SignProvider, SignContext
} from "@keyper/specs";

export class AnyPayLockScript implements LockScript {
  public readonly name = "Anyone Can Pay";
  public codeHash: string;
  public hashType: ScriptHashType;
  private _deps: CellDep[];
  private provider: SignProvider;

  public constructor(
    codeHash = "0x390e1c7cb59fbd5cf9bfb9370acb0d2bbbbbcf4136c90b2f3ea5277b4c13b540",
    hashType:ScriptHashType = "type",
    deps:CellDep[] = [{
      outPoint: {
        txHash: "0xf860285b77069801f91d32a316bf07c8caee7ff1ab39b506d6708de7dd88595f",
        index: "0x0"
      },
      depType: "depGroup",
    }]
  ) {
    this.codeHash = codeHash;
    this.hashType = hashType;
    this._deps = deps;
  }

  public deps(): CellDep[] {
    return this._deps;
  }

  public script(publicKey: string): Script {
    const args = utils.blake160(publicKey);
    return {
      codeHash: this.codeHash,
      hashType: this.hashType,
      args: `0x${Buffer.from(args).toString("hex")}`
    };
  }

  public signatureAlgorithm(): SignatureAlgorithm {
    return SignatureAlgorithm.secp256k1;
  }

  public async setProvider(provider: SignProvider): Promise<void> {
    this.provider = provider;
  }

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
}

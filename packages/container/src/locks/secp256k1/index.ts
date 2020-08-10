const numberToBN = require("number-to-bn");
import * as utils from "@nervosnetwork/ckb-sdk-utils";
import { 
  LockScript, ScriptHashType, Script, CellDep, SignatureAlgorithm, RawTransaction, Config, SignProvider, SignContext
} from "@nervosnetwork/keyper-specs";

export class Secp256k1LockScript implements LockScript {
  public readonly name: string = "Secp256k1";
  public codeHash: string = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8";
  public hashType: ScriptHashType = "type";
  private _deps: CellDep[];
  private provider: SignProvider;

  public constructor(
    codeHash = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType:ScriptHashType = "type",
    deps:CellDep[] = [{
      outPoint: {
        txHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
        index: "0x0",
      },
      depType: "depGroup",
    }]
  ) {
    this.codeHash = codeHash;
    this.hashType = hashType;
    this._deps = deps;
  }

  public script(publicKey: string): Script {
    const args = utils.blake160(publicKey);
    return {
      codeHash: this.codeHash,
      hashType: this.hashType,
      args: `0x${Buffer.from(args).toString("hex")}`
    };
  }

  public deps(): CellDep[] {
    return this._deps;
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
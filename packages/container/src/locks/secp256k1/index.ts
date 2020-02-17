import * as utils from "@nervosnetwork/ckb-sdk-utils";
import { 
  LockScript, ScriptHashType, Script, CellDep, DepType, SignatureAlgorithm, RawTransaction, Config
} from "@keyper/specs";

export class Secp256k1LockScript implements LockScript {
  public readonly name: string = "Secp256k1LockScript";
  public readonly codeHash: string = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8";
  public readonly hashType: ScriptHashType = "type";

  public script(publicKey: string): Script {
    const args = utils.blake160(publicKey);
    return {
      codeHash: this.codeHash,
      hashType: this.hashType,
      args: `0x${Buffer.from(args).toString("hex")}`
    };
  }

  public deps(): CellDep[] {
    return [{
      outPoint: {
        txHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
        index: "0x0",
      },
      depType: "dep_group" as DepType,
    }];
  }

  public signatureAlgorithm(): SignatureAlgorithm {
    return SignatureAlgorithm.secp256k1;
  }

  public sign(_publicKey: string, _rawTx: RawTransaction, _config: Config): Promise<RawTransaction> {
    throw new Error("Method not implemented.");
  }
} 
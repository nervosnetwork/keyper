import { Hash256, CellDep, RawTransaction, Script, ScriptHashType } from "./type";
import { SignatureAlgorithm } from "./const";

export interface LockScript {
  readonly name: string;
  readonly codeHash: Hash256;
  readonly hashType: ScriptHashType;
  hash(publicKey: string): string;
  address(publicKey: string, short: boolean): string;
  script(publicKey: string): Script;
  deps(): CellDep[];
  headers?(): Hash256[];
  requiredAlgorithms(): SignatureAlgorithm[];
  sign(publicKey: string, rawTx: RawTransaction): Promise<RawTransaction>;
}
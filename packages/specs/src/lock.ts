import { Hash256, CellDep, RawTransaction, Script, ScriptHashType } from "./type";
import { SignatureAlgorithm } from "./const";

export interface Config {
  index: number;
  length: number;
}

export class DefaultAllConfig implements Config {
  index: number = 0;
  length: number = -1;
}

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
  sign(publicKey: string, rawTx: RawTransaction, config: Config): Promise<RawTransaction>;
}
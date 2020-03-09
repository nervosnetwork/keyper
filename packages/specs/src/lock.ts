import { Hash256, CellDep, RawTransaction, Script, ScriptHashType, Bytes } from "./type";
import { SignatureAlgorithm } from "./const";

export interface Config {
  index: number;
  length: number;
}

export class DefaultAllConfig implements Config {
  index: number = 0;
  length: number = -1;
}

export interface SignProvider {
  sign(publicKey: string, message: Bytes): Promise<Bytes>;
}

export interface LockScript {
  readonly name: string;
  readonly codeHash: Hash256;
  readonly hashType: ScriptHashType;
  setProvider(provider: SignProvider): void;
  script(publicKey: string): Script;
  deps(): CellDep[];
  headers?(): Hash256[];
  signatureAlgorithm(): SignatureAlgorithm;
  sign(privateKey: string, rawTx: RawTransaction, config: Config): Promise<RawTransaction>;
}
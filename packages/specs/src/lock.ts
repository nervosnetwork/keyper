import { Hash256, CellDep, RawTransaction, Script } from "./type";
import { SignatrueAlgorithm } from "./const";

export interface LockScript {
  readonly name: string;
  hash(): string;
  address(short: boolean): string;
  script(): Script;
  deps(): CellDep[];
  headers?(): Hash256[];
  requiredAlgorithms(): SignatrueAlgorithm[];
  sign(rawTx: RawTransaction): Promise<RawTransaction>;
}
export type Hash256 = string;
export type Bytes = string;
export type Since = string;
export type ScriptHashType = "data" | "type";
export type DepType = "code" | "dep_group";

export interface CellDep {
  outPoint: OutPoint | null,
  depType: DepType,
}

export interface WitnessObj {
  lock?: string,
  inputType?: string,
  outputType?: string,
}

export type Witness = WitnessObj | string;

export interface Script {
  args: Bytes,
  codeHash: Hash256,
  hashType: ScriptHashType,
}

export interface OutPoint {
  txHash: Hash256,
  index: string,
}

export interface Input {
  previousOutput: OutPoint | null,
  since: string,
}

export interface Output {
  capacity: string,
  lock: Script,
  type?: Script | null,
}

export interface RawTransaction {
  version: string,
  cellDeps: CellDep[],
  headerDeps: Hash256[],
  inputs: Input[],
  outputs: Output[],
  witnesses: Witness[],
  outputsData: Bytes[],
  confirmMessage?: any,
}
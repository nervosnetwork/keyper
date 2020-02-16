import * as bech32 from "bech32";
import { Script } from "./type";

export function addressToScript(address: string, systemCodeHash = {
  SECP256K1_BLAKE160_SIGHASH_ALL_TYPE_HASH: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
	SECP256K1_BLAKE160_MULTISIG_ALL_TYPE_HASH: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8"
}): Script {
  if (address.length !== 46 && address.length !== 95) {
    throw new Error(`Invalid address: ${address}`);
  }
  const payload = bech32.decode(address, 95);
  if (payload.prefix !== "ckb" && payload.prefix !== "ckt") {
    throw new Error(`Invalid address: ${address}`);
  }
  const data = bech32.fromWords(payload.words);
  if (data[0] === 1) {
    // short address
    if (data[1] === 0) {
      // SECP256K1 + blake160
      return {
        hashType: "type",
        codeHash: systemCodeHash.SECP256K1_BLAKE160_SIGHASH_ALL_TYPE_HASH,
        args: `0x${Buffer.from(data.slice(2)).toString("hex")}`
      };
    } else if (data[1] === 1) {
      // SECP256K1 + multisig
      return {
        hashType: "type",
        codeHash: systemCodeHash.SECP256K1_BLAKE160_MULTISIG_ALL_TYPE_HASH,
        args: `0x${Buffer.from(data.slice(2)).toString("hex")}`
      };
    } else {
      throw new Error(`Invalid address: ${address}`);
    }
  } else if (data[0] === 2) {
    // long hash_type: data
    return {
      hashType: "data",
      codeHash: `0x${Buffer.from(data.slice(1, 33)).toString("hex")}`,
      args: `0x${Buffer.from(data.slice(33)).toString("hex")}`
    };
  } else if (data[0] === 4) {
    // long hash_type: type
    return {
      hashType: "type",
      codeHash: `0x${Buffer.from(data.slice(1, 33)).toString("hex")}`,
      args: `0x${Buffer.from(data.slice(33)).toString("hex")}`
    };
  } else {
    throw new Error(`Invalid address: ${address}`);
  }
}
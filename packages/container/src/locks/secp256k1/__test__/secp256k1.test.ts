import { Secp256k1LockScript } from "..";

describe("secp256k1 lockscript", () => {
  test("basic", () => {
    const lock = new Secp256k1LockScript();
    const script = lock.script("0x020ea44dd70b0116ab44ade483609973adf5ce900d7365d988bc5f352b68abe50b");
    expect(script).toEqual(expect.objectContaining({
      args: "0xedcda9513fa030ce4308e29245a22c022d0443bb",
      codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type"
    }));
  });

  test("sign", async () => {
    const lock = new Secp256k1LockScript();
    await lock.setProvider({
      sign: async function(_publicKey: string, _message: string) {
        return "0x000000000000000000000000000000000000000000000000000000000000000001";
      }
    });

    const tx = await lock.sign("0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890", {
      version: "0x0",
      cellDeps: [{
        outPoint: {
          txHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
          index: "0x0"
        },
        depType: "depGroup",
      }],
      headerDeps: [],
      inputs: [{
        previousOutput: {
          txHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
          index: "0x0",
        },
        since: "0x0",
      }],
      outputs: [{
        capacity: `0x0000000000000000`,
        lock: {
          args: "0xedcda9513fa030ce4308e29245a22c022d0443bb",
          codeHash: "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890",
          hashType: "type"
        },
      }],
      witnesses: [{
        lock: "",
        inputType: "",
        outputType: "",
      }, "0x"],
      outputsData: ["0x"]
    });
    
    console.log(tx);
  });
});
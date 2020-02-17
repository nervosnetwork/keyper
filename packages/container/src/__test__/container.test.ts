import { Container } from "..";
import { SignatureAlgorithm, LockScript, ScriptHashType, Script, CellDep, RawTransaction, Config } from "@keyper/specs";

class TestLockScript implements LockScript {
  name = "TestLockScript";
  codeHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  hashType = "type" as ScriptHashType;

  script(publicKey: string): Script {
    return {
      args: publicKey,
      codeHash: this.codeHash,
      hashType: this.hashType
    };
  }

  deps(): CellDep[] {
    return [];
  }

  signatureAlgorithm(): SignatureAlgorithm {
    return SignatureAlgorithm.secp256k1;
  }
  
  async sign(_publicKey: string, rawTx: RawTransaction, _config: Config): Promise<RawTransaction> {
  return rawTx;
  }
}

describe("container", () => {
  describe("addLockScript", () => {
    const container = new Container([SignatureAlgorithm.secp256k1]);
    const lockScript = new TestLockScript();
    test("add one", () => {
      expect(container.lockScriptSize()).toEqual(0);
      container.addLockScript(lockScript);
      expect(container.lockScriptSize()).toEqual(1);
    });

    test("add repeate", () => {
      expect(container.lockScriptSize()).toEqual(1);
      container.addLockScript(lockScript);
      expect(container.lockScriptSize()).toEqual(1);
    });
  });

  describe("addPublicKey", () => {
    const container = new Container([SignatureAlgorithm.secp256k1]);
    const lockScript = new TestLockScript();
    const publicKey0 = {
      payload: "0x0000000000000000000000000000000000000000000000000000000000000000",
      algorithm: SignatureAlgorithm.secp256k1
    };
    const publicKey1 = {
      payload: "0x0000000000000000000000000000000000000000000000000000000000000001",
      algorithm: SignatureAlgorithm.secp256k1
    };
    test("add one", () => {
      expect(container.publicKeySize()).toEqual(0);
      container.addPublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
    });

    test("add repeate", async () => {
      expect(container.publicKeySize()).toEqual(1);
      container.addPublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      let hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(0);
      container.addLockScript(lockScript);
      hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(1);
    });

    test("add two", async () => {
      container.addPublicKey(publicKey1);
      expect(container.publicKeySize()).toEqual(2);
      let hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(2);
    });

    test("remove one", async () => {
      let hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(2);
      let scripts = await container.getAllLockScripts();
      expect(scripts.length).toEqual(2);
      expect(scripts[0]).toEqual(expect.objectContaining({
        codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        type: "type",
        args: "0x0000000000000000000000000000000000000000000000000000000000000000"
      }));
      expect(scripts[1]).toEqual(expect.objectContaining({
        codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        type: "type",
        args: "0x0000000000000000000000000000000000000000000000000000000000000001"
      }));

      container.removePublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(1);
    });

    test("remove two", async () => {
      let hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(1);
      container.removePublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      hashes = await container.getAllLockHashes();
      expect(hashes.length).toEqual(1);
    });
  });
});
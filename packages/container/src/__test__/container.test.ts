import { Container } from "..";
import { SignatureAlgorithm, LockScript, ScriptHashType, Script, CellDep, RawTransaction, Config, SignProvider, DepType, Hash256, SignContext } from "@keyper/specs";

class TestSignProvider implements SignProvider {
  async sign(_context: SignContext, message: string): Promise<string> {
    return message;
  }
}

class TestLockScript implements LockScript {
  name = "TestLockScript";
  codeHash = "0x0000000000000000000000000000000000000000000000000000000000000100";
  hashType = "type" as ScriptHashType;
  provider: SignProvider;

  script(publicKey: string): Script {
    return {
      args: publicKey,
      codeHash: this.codeHash,
      hashType: this.hashType
    };
  }

  deps(): CellDep[] {
    return [{
      outPoint: {
        txHash: "0x0000000000000000000000000000000000000000000000000000000000000200",
        index: "0x0"
      },
      depType: "dev_group" as DepType
    }];
  }

  signatureAlgorithm(): SignatureAlgorithm {
    return SignatureAlgorithm.secp256k1;
  }

  setProvider(provider: SignProvider): void {
    this.provider = provider;
  }
  
  async sign(_context: SignContext, rawTx: RawTransaction, _config: Config): Promise<RawTransaction> {
    return rawTx;
  }
}

class TestLockScriptWithHeader extends TestLockScript {
  public headers(): Hash256[] {
    return ["0x0000000000000000000000000000000000000000000000000000000000000300"];
  }
}

describe("container", () => {
  describe("addLockScript", () => {
    const signer = new TestSignProvider();
    const container = new Container([{algorithm: SignatureAlgorithm.secp256k1, provider: signer}]);
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
    const signer = new TestSignProvider();
    const container = new Container([{algorithm: SignatureAlgorithm.secp256k1, provider: signer}]);
    const lockScript = new TestLockScript();
    const publicKey0 = {
      payload: "0x0000000000000000000000000000000000000000000000000000000000000001",
      algorithm: SignatureAlgorithm.secp256k1
    };
    const publicKey1 = {
      payload: "0x0000000000000000000000000000000000000000000000000000000000000002",
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
      let hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(0);
      container.addLockScript(lockScript);
      hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);
    });

    test("add two", async () => {
      container.addPublicKey(publicKey1);
      expect(container.publicKeySize()).toEqual(2);
      let hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(2);
    });

    test("remove one", async () => {
      let hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(2);
      expect(hashes[0].meta).toEqual(expect.objectContaining({
        deps: [{
          outPoint: {
            txHash: "0x0000000000000000000000000000000000000000000000000000000000000200",
            index: "0x0"
          },
          depType: "dev_group"
        }]
      }));

      let scripts = await container.getAllLockScripts();
      expect(scripts.length).toEqual(2);
      expect(scripts[0]).toEqual(expect.objectContaining({
        codeHash: "0x0000000000000000000000000000000000000000000000000000000000000100",
        hashType: "type",
        args: "0x0000000000000000000000000000000000000000000000000000000000000001"
      }));
      expect(scripts[1]).toEqual(expect.objectContaining({
        codeHash: "0x0000000000000000000000000000000000000000000000000000000000000100",
        hashType: "type",
        args: "0x0000000000000000000000000000000000000000000000000000000000000002"
      }));

      container.removePublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);

      scripts = await container.getAllLockScripts();
      expect(scripts.length).toEqual(1);
      expect(scripts[0]).toEqual(expect.objectContaining({
        codeHash: "0x0000000000000000000000000000000000000000000000000000000000000100",
        hashType: "type",
        args: "0x0000000000000000000000000000000000000000000000000000000000000002"
      }));

      hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);
      container.removePublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);
    });

    test("remove two", async () => {
      let hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);
      container.removePublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);

      container.removePublicKey(publicKey1);
      expect(container.publicKeySize()).toEqual(0);
      hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(0);
      const scripts = await container.getAllLockScripts();
      expect(scripts.length).toEqual(0);
    });
  });



  describe("addPublicKeyWithHeader", () => {
    const signer = new TestSignProvider();
    const container = new Container([{algorithm: SignatureAlgorithm.secp256k1, provider: signer}]);
    const lockScript = new TestLockScriptWithHeader();
    test("add one", async () => {
      expect(container.lockScriptSize()).toEqual(0);
      container.addLockScript(lockScript);
      expect(container.lockScriptSize()).toEqual(1);

      const publicKey0 = {
        payload: "0x0000000000000000000000000000000000000000000000000000000000000001",
        algorithm: SignatureAlgorithm.secp256k1
      };

      container.addPublicKey(publicKey0);
      expect(container.publicKeySize()).toEqual(1);
      let hashes = await container.getAllLockHashesAndMeta();
      expect(hashes.length).toEqual(1);
      expect(hashes[0].meta).toEqual(expect.objectContaining({
        deps: [{
          outPoint: {
            txHash: "0x0000000000000000000000000000000000000000000000000000000000000200",
            index: "0x0"
          },
          depType: "dev_group"
        }],
        headers: ["0x0000000000000000000000000000000000000000000000000000000000000300"]
      }));
    });
  });
});
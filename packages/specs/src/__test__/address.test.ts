import { addressToScript, scriptToAddress } from "../address";

describe("address", () => {
  describe("addressToScript", () => {
    test("short single decode", () => {
      const script = addressToScript("ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v");
      expect(script).toEqual(expect.objectContaining({
        hashType: "type",
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
      }));
    });
    test("short multiple decode", () => {
      const script = addressToScript("ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg");
      expect(script).toEqual(expect.objectContaining({
        hashType: "type",
        codeHash: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        args: "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a"
      }));
    });
    test("long address decode", () => {
      const script = addressToScript("ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks");
      expect(script).toEqual(expect.objectContaining({
        hashType: "type",
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
      }));
    });
  });

  describe("scriptToAddress", () => {
    test("short single encode", () => {
      const address = scriptToAddress({
        hashType: "type",
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
      });
      expect(address).toEqual("ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v");
    });

    test("short multiple encode", () => {
      const address = scriptToAddress({
        hashType: "type",
        codeHash: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        args: "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a"
      });
      expect(address).toEqual("ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg");
    });

    test("long address encode", () => {
      const address = scriptToAddress({
        hashType: "type",
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
      }, {short: false});
      expect(address).toEqual("ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks");
    });
  });
});
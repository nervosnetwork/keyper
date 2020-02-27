import { encrypt, decrypt } from "../keystore";

describe("keystore", () => {
  test("encrypt", () => {
    const v3 = encrypt(Buffer.from("9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", "hex"), "123456");
    expect(v3).not.toBeNull();
  });

  test("decrypt", () => {
    const seed = decrypt({
      version: 3,
      id: '0ab18d9d-2b56-4d65-87ca-fe9a25f87635',
      crypto: {
        ciphertext: '1d7093f6e04aeaca4354499d3ca8eb80f8f922af1a5b86cbfcb3a2ed62394263',
        cipherparams: { iv: '608059dce8520b4eabddde6ef433eb40' },
        cipher: 'aes-128-ctr',
        kdf: 'scrypt',
        kdfparams: {
          dklen: 32,
          salt: '5f0438ee33e50bcfa70648734fb09ab84be9e5203454e78cde5195ace94136b2',
          n: 262144,
          r: 8,
          p: 1
        },
        mac: '9e511c5ef9174d63fa150e0793321c7953dea4232066f701fdd4a2727a215780'
      }
    }, "123456");
    expect(seed).toEqual("9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8");
  });
});
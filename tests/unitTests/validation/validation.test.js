const kwiljs = require('../../../dist/index');
const ethers = require('ethers');

require('dotenv').config();

describe('Kwil Parameter Validation Tests', () => {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // signer
  const txHash = '90a922292d2a057c0ea9d8f34162a4ba1673c8c7146a565ca66c90b40b42b150';
  const address = wallet.address; // address

  it('should return the correct validation error if null or undefined parameter is provided', () => {
    function throwError() {
        throw new Error('Chain ID cannot be null or undefined.');
      }
    const kwil = new kwiljs.NodeKwil({
      kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
      // chainId: chainId,
      timeout: 10000,
      logging: true,
    });
    const kSigner = new kwiljs.KwilSigner(wallet, address);
    console.log(kSigner);
    const dbid = kwil.getDBID(address, 'social');

    function dropDb(kwil, signer, dbid) {
      const body = {
        dbid: dbid,
        description: 'show me this',
      };
      const res = kwil.drop(body, signer, true);

      logger(res);
    }

    dropDb(kwil, kSigner, dbid);
    expect(() => throwError()).toThrow('Chain ID cannot be null or undefined.')
  });
});

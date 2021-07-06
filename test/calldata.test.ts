import { parse, stringToHex } from '../src';

describe('deserialize', () => {

  it('should have the correct data for a call', () => {
    // vmversion 1, gasprice 18446744073709551615, gaslimit 18446744073709551615, some code and method params
    let oo = "c1";
    let vmversion = "0100";
    let gasprice = "0000000000000000";
    let gasLimit = "ffffffffffffffff";
    let contractAddress = "6400000000000000000000000000000000000000";
    let method = "c9874578656375746580";
    let hex = "c1010000000000000000000000ffffffffffffffff6400000000000000000000000000000000000000c9874578656375746580";
    let txData = parse(hex)
    let opcode = new Uint8Array([192]);

    expect(txData.opCodeType).toEqual(opcode);
    expect(txData.gasPrice).toEqual(BigInt("0x" + gasprice));
    expect(txData.gasLimit).toEqual(BigInt("0x" + gasLimit));
    expect(txData.contractAddress).toEqual(new Uint8Array(stringToHex(contractAddress)));
  });
});
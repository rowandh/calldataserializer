import { bytesToHex, parse, sum } from '../src';

describe('blah', () => {
  it('works', () => {
    expect(sum(1, 1)).toEqual(2);
  });
});

describe('deserialize', () => {
  it('should have the correct opcode', () => {
    let opcode = new Uint8Array([10]);
    let hex = bytesToHex(opcode);
    let txData = parse(hex)

    expect(txData.opCodeType).toEqual(opcode);
  });
})
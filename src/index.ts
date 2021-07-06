export const sum = (a: number, b: number) => {
  if ('development' === process.env.NODE_ENV) {
    console.log('boop');
  }
  console.log('test');
  return a + b;
};

export interface ContractTxData {
  opCodeType: Uint8Array,
  vmVersion: number,
  gasPrice: BigInt,
  gasLimit: BigInt,
  contractAddress: Uint8Array, // TODO check type
  methodName: string,
  methodParameters: string, // TODO serialized/unserialized params?
  contractExecutionCode: Uint8Array
}

/*
  Parses a hexadecimal string and interprets the smart contract data within.
*/
export const parse = (hex: string): ContractTxData => {

  return {

  } as ContractTxData;
}

export const stringToHex = (hex: string): Uint8Array => {
    let bytes: number[] = [];

    for (let c = 0; c < hex.length; c += 2) {
      bytes.push(parseInt(hex.substr(c, 2), 16));
    }

    return new Uint8Array(bytes);
}
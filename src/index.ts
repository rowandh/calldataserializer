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

export const parse = (hex: string): ContractTxData => {
  return {

  } as ContractTxData;
}
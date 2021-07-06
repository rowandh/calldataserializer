export interface ContractTxData {
  opCodeType: Uint8Array,
  vmVersion: number,
  gasPrice: bigint,
  gasLimit: bigint,
  contractAddress: Uint8Array, // TODO check type
  methodName: string,
  methodParameters: string, // TODO serialized/unserialized params?
  contractExecutionCode: Uint8Array
}

/*
  Parses a hexadecimal string and interprets the smart contract data within.
*/
export const parse = (hex: string): ContractTxData => {

  // Lengths, in byte chars (1 byte requires 2 chars)
  let opcodeLength = 1 * 2; // byte
  let vmVersionLength = 4 * 2; // uint32
  let gasPriceLength = 8 * 2; // ulong
  let gasLimitLength = 8 * 2; // ulong
  let contractAddressLength = 20 * 2; // Address
  
  let opcode = stringToHex(hex.slice(0, opcodeLength));

  let currentLength = opcodeLength + vmVersionLength;
  
  let gasPrice = "0x" + hex.slice(currentLength, currentLength + gasPriceLength);
  currentLength = currentLength + gasPriceLength;

  let gasLimit = "0x" + hex.slice(currentLength, currentLength + gasLimitLength);
  currentLength = currentLength + gasLimitLength;

  // Assume we're only deserializing calls
  
  let contractAddress = stringToHex(hex.slice(currentLength, currentLength + contractAddressLength));
  currentLength = currentLength + contractAddressLength;

  return {
    opCodeType: opcode,
    vmVersion: 1,
    gasPrice: BigInt(gasPrice),
    gasLimit: BigInt(gasLimit),
    contractAddress: contractAddress
  } as ContractTxData;
}

export const stringToHex = (hex: string): Uint8Array => {
    let bytes: number[] = [];

    for (let c = 0; c < hex.length; c += 2) {
      bytes.push(parseInt(hex.substr(c, 2), 16));
    }

    return new Uint8Array(bytes);
}

export const bytesToHex = (bytes: Uint8Array) => {
  let hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xF).toString(16));
  }
  return hex.join("");
}
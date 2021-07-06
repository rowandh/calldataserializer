import * as rlp from 'rlp'

export interface ContractTxData {
  opCodeType: Uint8Array,
  vmVersion: number,
  gasPrice: bigint,
  gasLimit: bigint,
  contractAddress: Uint8Array, // TODO check type
  methodName: string,
  methodParameters: MethodParameter[], // TODO serialized/unserialized params?
  contractExecutionCode: Uint8Array
}

export enum Prefix {
  Bool = 1,
  Byte = 2,
  Char = 3,
  String = 4,
  UInt = 5,
  Int = 6,
  ULong = 7,
  Long = 8,
  Address = 9,
  ByteArray = 10,
  UInt128 = 11,
  UInt256 = 12
};

type MethodParameterValue = number | bigint | string | Buffer | boolean;

export interface MethodParameter {
  type: Prefix,
  value: MethodParameterValue
};

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
  
  let gasPrice = hex.slice(currentLength, currentLength + gasPriceLength);
  currentLength = currentLength + gasPriceLength;

  let gasLimit = hex.slice(currentLength, currentLength + gasLimitLength);
  currentLength = currentLength + gasLimitLength;

  // Assume we're only deserializing calls
  
  let contractAddress = stringToHex(hex.slice(currentLength, currentLength + contractAddressLength));
  currentLength = currentLength + contractAddressLength;

  let remaining = hex.slice(currentLength);
  let bbb = Buffer.from(remaining, "hex");
  let decoded = (<unknown>rlp.decode(bbb)) as Buffer[];
  let methodName = decoded[0];
  let methodParams = decoded[1]; 

  let methodParameters = methodParams != null && methodParams.length > 0 ? deserializeMethodParams(methodParams) : [];  

  // The rest of the fields are RLP-encoded
  return {
    opCodeType: opcode,
    vmVersion: 1,
    gasPrice: Buffer.from(gasPrice, 'hex').readBigUInt64LE(),
    gasLimit: Buffer.from(gasLimit, 'hex').readBigUInt64LE(),
    contractAddress: contractAddress,
    methodName: methodName.toString("utf8"),
    methodParameters
  } as ContractTxData;
}

export const deserializeMethodParams = (rawMethodParams: Buffer): MethodParameter[] => {

  let innerList =  (<unknown>rlp.decode(rawMethodParams)) as Buffer[];  

  return innerList.map(deserializeMethodParam);
}

export const deserializeMethodParam = (methodParam: Buffer): MethodParameter => {
  let prefix = methodParam[0];
  let valueBytes = methodParam.slice(1);

  let value = deserializePrimitiveValue(prefix, valueBytes);

  return {
    type: prefix,
    value
  } as MethodParameter;
}

export const deserializePrimitiveValue = (type: number, primitiveBytes: Buffer): MethodParameterValue => {
  switch (type) {
    case Prefix.Address:
      return primitiveBytes;
    case Prefix.Bool:
      return primitiveBytes.readUIntLE(0, 1) == 1 ? true : false;
    case Prefix.Byte:
    case Prefix.ByteArray:
      return primitiveBytes;
    case Prefix.Char:
      return String.fromCharCode(primitiveBytes.readInt8());
    case Prefix.String:
      return primitiveBytes.toString("utf8");
    case Prefix.Int:
      return primitiveBytes.readInt32LE();
    case Prefix.UInt:
      return primitiveBytes.readUInt32LE();
    case Prefix.Long:
      return primitiveBytes.readBigInt64LE();
    case Prefix.ULong:
      return primitiveBytes.readBigUInt64LE();
    case Prefix.UInt128:
    case Prefix.UInt256:
      return primitiveBytes; // TODO use BigNum for these types
    default:
      throw "Invalid type!";      
  }
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
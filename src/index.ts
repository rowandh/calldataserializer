import * as rlp from 'rlp'
import BN from 'bn.js';

export interface ContractTxData {
  opCodeType: number,
  vmVersion: number,
  gasPrice: bigint,
  gasLimit: bigint,
  contractAddress: Buffer,
  methodName: string,
  methodParameters: MethodParameter[]
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

export const OP_CREATECONTRACT = 0xc0;
export const OP_CALLCONTRACT = 0xc1;

export interface MethodParameter {
  type: Prefix,
  value: MethodParameterValue
};

/*
  Accepts the input call data and serializes it to a hex string.
*/
export const serialize = (data: ContractTxData): string => {
  
  if (isCallContract(data.opCodeType)) {
    return serializeCallContract(data);
  }

  return "";
}

const isCallContract = (opCodeType: number): boolean => {
  return opCodeType == OP_CALLCONTRACT;
}

const serializeCallContract = (data: ContractTxData): string => {
  /* Structure:
    {
      opcode byte,
      vmVersion int (4 bytes),
      gasPrice ulong (8 bytes),
      gasLimit ulong (8 bytes),
      contractAddress byte[] (20 bytes),
      RLP encoded list: {
        methodName,
        methodParams
      }
    }
  */
  let opCodeByte = Buffer.alloc(1, data.opCodeType);
  let vmVersionBytes = Buffer.alloc(4);
  vmVersionBytes.writeInt32LE(data.vmVersion);

  let gasPriceBytes = Buffer.alloc(8);
  gasPriceBytes.writeBigUInt64LE(data.gasPrice);

  let gasLimitBytes = Buffer.alloc(8)
  gasLimitBytes.writeBigUInt64LE(data.gasLimit);

  let prefix = Buffer.concat([opCodeByte, vmVersionBytes, gasPriceBytes, gasLimitBytes])

  // RLP bit
  let serializedMethodName = Buffer.from(data.methodName);
  let serializedParams = serializeMethodParameters(data.methodParameters);
  let callDataBytes: Buffer[] = [serializedMethodName, serializedParams];

  // For some reason we double-rlp encode the call data params and then the method name and params.
  let rlpEncodedCallData = rlp.encode(callDataBytes);
  
  let finalBuffer = Buffer.concat([prefix, data.contractAddress, rlpEncodedCallData]);

  return finalBuffer.toString('hex');
}

const serializeCreateContract = () => {

}

const serializeMethodParameters = (methodParameters: MethodParameter[]): Buffer => {
  let callDataBytes: Buffer[] = [];

  for (let p of methodParameters) {
    let serializedParam = serializeParam(p);
    callDataBytes.push(serializedParam);
  }

  return rlp.encode(callDataBytes);
}

const serializeParam = (param: MethodParameter): Buffer => {
  /* Structure:
    {
      prefix byte,
      param byte[]
    }
  */
 let prefixByte = Buffer.alloc(1, param.type);
 let serializedBytes = serializePrimitiveValue(param);

 return Buffer.concat([prefixByte, serializedBytes]);
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
  
  let opcode = Buffer.from(hex.slice(0, opcodeLength), "hex").readUInt8();

  let currentLength = opcodeLength + vmVersionLength;
  
  let gasPrice = hex.slice(currentLength, currentLength + gasPriceLength);
  currentLength = currentLength + gasPriceLength;

  let gasLimit = hex.slice(currentLength, currentLength + gasLimitLength);
  currentLength = currentLength + gasLimitLength;

  // Assume we're only deserializing calls
  
  let contractAddress = Buffer.from(hex.slice(currentLength, currentLength + contractAddressLength), "hex");
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
    gasPrice: Buffer.from(gasPrice, "hex").readBigUInt64LE(),
    gasLimit: Buffer.from(gasLimit, "hex").readBigUInt64LE(),
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

export const serializePrimitiveValue = (parameter: MethodParameter): Buffer => {
  switch (parameter.type) {
    case Prefix.Address: // Should already be a buffer
      return <Buffer>parameter.value;
    case Prefix.Bool:
      return parameter.value ? Buffer.from([1]) : Buffer.from([0]);
    case Prefix.Byte:
    case Prefix.ByteArray:
      return <Buffer>parameter.value;
    case Prefix.Char:
      let char = Buffer.alloc(2); // C# sizeof(char) is 2 bytes, the first is ASCII and the 2nd is blank
      char.writeInt16LE((<string>parameter.value).charCodeAt(0));
      return char;
    case Prefix.String:
      return Buffer.from(<string>parameter.value);
    case Prefix.Int:
      let int32 = Buffer.alloc(4);
      int32.writeInt32LE(<number>parameter.value);
      return int32;
    case Prefix.UInt:
      let uint32 = Buffer.alloc(4);
      uint32.writeUInt32LE(<number>parameter.value);
      return uint32;
    case Prefix.Long:
      let long = Buffer.alloc(8);
      long.writeBigInt64LE(<bigint>parameter.value);
      return long;
    case Prefix.ULong:
      let ulong = Buffer.alloc(8);
      ulong.writeBigUInt64LE(<bigint>parameter.value);
      return ulong;
    case Prefix.UInt128:
    case Prefix.UInt256:
      return <Buffer>parameter.value; // TODO use BigNum for these types
    default:
      throw "Invalid type!";      
  }
}
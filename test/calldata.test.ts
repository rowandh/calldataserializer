import { BN } from 'bn.js';
import { parse, serialize, Prefix, ContractTxData, OP_CREATECONTRACT, MethodParameter, OP_CALLCONTRACT } from '../src';

describe('deserialize', () => {

  it('should have the correct data for a call', () => {
    // vmversion 1, gasprice 1, gaslimit 18446744073709551615, method name
    let oo = "c1";
    let vmversion = "0100";
    let gasprice = "0100000000000000";
    let gasLimit = "ffffffffffffffff";
    let contractAddress = "6400000000000000000000000000000000000000";
    let method = "c9874578656375746580";
    let hex = "c1010000000100000000000000ffffffffffffffff6400000000000000000000000000000000000000c9874578656375746580";
    let txData = parse(hex)
    let opcode = 193;


    expect(txData.opCodeType).toEqual(opcode);
    expect(txData.gasPrice.toBuffer("le", 8)).toEqual(new BN(1, "le").toBuffer("le", 8));
    expect(txData.gasLimit).toEqual(new BN(gasLimit, "hex", "le"));
    expect(txData.contractAddress).toEqual(Buffer.from(contractAddress, "hex"));
    expect(txData.methodName).toEqual("Execute");
  });

  it('should have the correct method params', () => {
    // vmversion 1, gasprice 1, gaslimit 18446744073709551615, method name
    /*
        {
            object[] methodParameters =
            {
                true,
                (byte)1,
                Encoding.UTF8.GetBytes("test"),
                's',
                "test",
                (int)int.MaxValue,
                (uint)uint.MaxValue,
                (long)long.MaxValue,
                (ulong)ulong.MaxValue,
                UInt128.MaxValue,
                UInt256.MaxValue,
                "0x95D34980095380851902ccd9A1Fb4C813C2cb639".HexToAddress()
            };
    */
    let gasLimit = "ffffffffffffffff";
    let contractAddress = "6400000000000000000000000000000000000000";
    let hex = "c1010000000100000000000000ffffffffffffffff6400000000000000000000000000000000000000f88c8745786563757465b882f880820101820201850a74657374830373008504746573748506ffffff7f8505ffffffff8908ffffffffffffff7f8907ffffffffffffffff910bffffffffffffffffffffffffffffffffa10cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff950995d34980095380851902ccd9a1fb4c813c2cb639";
    let txData = parse(hex)
    let opcode = 193;

    expect(txData.opCodeType).toEqual(opcode);
    expect(txData.gasPrice.toBuffer("le", 8)).toEqual(new BN(1).toBuffer("le", 8));
    expect(txData.gasLimit).toEqual(new BN(gasLimit, "hex", "le"));
    expect(txData.contractAddress).toEqual(Buffer.from(contractAddress, "hex"));
    expect(txData.methodName).toEqual("Execute");
    expect(txData.methodParameters[0].type).toEqual(Prefix.Bool);
    expect(txData.methodParameters[0].value).toEqual(true);
    expect(txData.methodParameters[1].type).toEqual(Prefix.Byte);
    expect(txData.methodParameters[1].value).toEqual(Buffer.from([1]));
    expect(txData.methodParameters[2].type).toEqual(Prefix.ByteArray);
    expect(txData.methodParameters[2].value).toEqual(Buffer.from("test", "utf8"));
    expect(txData.methodParameters[3].type).toEqual(Prefix.Char);
    expect(txData.methodParameters[3].value).toEqual("s");
    expect(txData.methodParameters[4].type).toEqual(Prefix.String);
    expect(txData.methodParameters[4].value).toEqual("test");
    expect(txData.methodParameters[5].type).toEqual(Prefix.Int);
    expect(txData.methodParameters[5].value).toEqual(2147483647);
    expect(txData.methodParameters[6].type).toEqual(Prefix.UInt);
    expect(txData.methodParameters[6].value).toEqual(4294967295);
    expect(txData.methodParameters[7].type).toEqual(Prefix.Long);
    expect(txData.methodParameters[7].value).toEqual(new BN("7FFFFFFFFFFFFFFF", "hex", "le")); // long.MaxValue
    expect(txData.methodParameters[8].type).toEqual(Prefix.ULong);
    expect(txData.methodParameters[8].value).toEqual(new BN("FFFFFFFFFFFFFFFF", "hex", "le")); // ulong.MaxValue
    expect(txData.methodParameters[9].type).toEqual(Prefix.UInt128);
    expect(txData.methodParameters[9].value).toEqual(new BN("ffffffffffffffffffffffffffffffff", "hex", "le")); // UInt128.MaxValue
    expect(txData.methodParameters[10].type).toEqual(Prefix.UInt256);
    expect(txData.methodParameters[10].value).toEqual(new BN("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "hex", "le")); // UInt256.MaxValue
    expect(txData.methodParameters[11].type).toEqual(Prefix.Address);
    expect(txData.methodParameters[11].value).toEqual(Buffer.from("95D34980095380851902ccd9A1Fb4C813C2cb639", "hex"));
  });  
});

describe('serialize', () => {

  it('should have the correct data when serializing a call', () => {
    // vmversion 1, gasprice 1, gaslimit 18446744073709551615, method name
    /*
        {
            object[] methodParameters =
            {
                true,
                (byte)1,
                Encoding.UTF8.GetBytes("test"),
                's',
                "test",
                (int)int.MaxValue,
                (uint)uint.MaxValue,
                (long)long.MaxValue,
                (ulong)ulong.MaxValue,
                UInt128.MaxValue,
                UInt256.MaxValue,
                "0x95D34980095380851902ccd9A1Fb4C813C2cb639".HexToAddress()
            };
    */
   
    let gasLimit = "ffffffffffffffff";

    let contractTxData = {
      opCodeType: OP_CALLCONTRACT,
      vmVersion: 1,
      contractAddress: Buffer.from("6400000000000000000000000000000000000000", "hex"),
      gasPrice: new BN(1),
      gasLimit: new BN(gasLimit, "hex", "le"),
      methodName: "Execute",
      methodParameters: [
        {
          type: Prefix.Bool,
          value: true
        },
        {
          type: Prefix.Byte,
          value: Buffer.from([1])
        },
        {
          type: Prefix.ByteArray,
          value: Buffer.from("test", "utf8")
        },
        {
          type: Prefix.Char,
          value: "s"
        },
        {
          type: Prefix.String,
          value: "test"
        },
        {
          type: Prefix.Int,
          value: 2147483647
        },
        {
          type: Prefix.UInt,
          value: 4294967295
        },
        {
          type: Prefix.Long,
          value: new BN("7FFFFFFFFFFFFFFF", "hex", "le")
        },
        {
          type: Prefix.ULong,
          value: new BN("FFFFFFFFFFFFFFFF", "hex", "le")
        },
        {
          type: Prefix.UInt128,
          value: new BN("ffffffffffffffffffffffffffffffff", "hex", "le")
        },
        {
          type: Prefix.UInt256,
          value: new BN("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "hex", "le")
        },
        {
          type: Prefix.Address,
          value: Buffer.from("95D34980095380851902ccd9A1Fb4C813C2cb639", "hex")
        }
      ]
    } as ContractTxData;

    let hex = serialize(contractTxData);
    
    let expectedHex = "c1010000000100000000000000ffffffffffffffff6400000000000000000000000000000000000000f88c8745786563757465b882f880820101820201850a74657374830373008504746573748506ffffff7f8505ffffffff8908ffffffffffffff7f8907ffffffffffffffff910bffffffffffffffffffffffffffffffffa10cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff950995d34980095380851902ccd9a1fb4c813c2cb639";
    
    // Verified in FullNode
    expect(hex).toEqual(expectedHex);
  });
});
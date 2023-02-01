/*
  MIT License Copyright 2021, 2022 - Bitpool Pty Ltd
*/

module.exports = function (RED) {
  var ENUM = require("./enum.js");
  var TEMPLATE = require("./devices/template.js");
  var sourceNodeId;
  var selectedDeviceId;

  function bpModbusDecoder(config) {
    var node = this;
    RED.nodes.createNode(node, config);

    node.bpDeviceDecoderName = config.bpDeviceDecoderName;
    node.bpChkShowDateOnLabel = config.bpChkShowDateOnLabel;
    node.bpChkShowDebugWarnings = config.bpChkShowDebugWarnings;
    node.bpChkConvertPFactor = config.bpChkConvertPFactor;
    node.bpChkSetRealTo3Dp = config.bpChkSetRealTo3Dp;

    this.status({});

    node.on("input", function (msg) {
      try {
        
        if (isValidInputMsg(msg)) {

          sourceNodeId = msg.modbusSource.node.sourceNodeId;
          selectedDeviceId = msg.modbusSource.node.selectedDeviceId;

          if (this.bpChkShowDateOnLabel) {
            this.status({fill: "green", shape: "dot", text: new Date().toLocaleString()});
          } else {
            this.status({});
          }

          let regStartIndex = msg.modbusSource.startRegIndex;
          let regDeviceDataSize = msg.modbusSource.deviceDataSize;
          let regBlock = msg.modbusSource.registers;
          let overrideModbusId;
          let overrideUnitName;

          if (msg.modbusSource.hasOwnProperty("overrideModbusId")) {
            overrideModbusId = parseInt(msg.modbusSource.overrideModbusId);
          }
          if (msg.modbusSource.hasOwnProperty("overrideUnitName")) {
            overrideUnitName = msg.modbusSource.overrideUnitName;
          }

          for (const index in regBlock) {
            let FIX_DECIMAL_PLACES = 3;
            var register = regBlock[index];
            let regAddress = register.regAddress;
            let regTopic = register.topic;
            let regDataFormat = register.regFormat;
            let regMultipler = register.regMultiplier;
            let regSize = register.regSize;
            let registerBuffer;
            let value;

            let msgOut = {};
            msgOut.topic = regTopic;
            msgOut.modbusSource = register;

            if (overrideModbusId !== undefined) {
              msgOut.modbusSource.modbusId = overrideModbusId;
            }
            if (overrideUnitName !== undefined) {
              let updatedTopic =
                convertToCapScore(overrideUnitName) +
                "/" +
                convertToCapScore(register.regName);
              msgOut.modbusSource.topic = updatedTopic;
              msgOut.topic = updatedTopic;
            }

            // Get the buffer from either output
            if (
              msg.hasOwnProperty("responseBuffer") &&
              msg.responseBuffer.hasOwnProperty("buffer")
            ) {
              registerBuffer = getBufferRegisterData(
                msg.responseBuffer.buffer,
                regStartIndex,
                regAddress,
                regSize,
                regDeviceDataSize
              );
            } else {
              registerBuffer = getBufferRegisterData(
                msg.payload.buffer,
                regStartIndex,
                regAddress,
                regSize,
                regDeviceDataSize
              );
            }

            // Reorder the buffer into format MSB to LSB
            let { isSuccess, errMsg, bufferOrdered } = reorderToMsbLsb(
              registerBuffer,
              regDataFormat,
              regSize
            );
            
            if (isSuccess) {

              msgOut.modbusSource.inBuffer = registerBuffer;
              msgOut.modbusSource.outBuffer = bufferOrdered;

              switch (regDataFormat) {
                // 8bit signed integer
                case ENUM.ModbusDataType.T_8_BIT_INT:
                  value = bufferOrdered.readInt8() || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 8bit unsigned integer
                case ENUM.ModbusDataType.T_8_BIT_UINT:
                  value = bufferOrdered.readUInt8() || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 16bit signed integer
                case ENUM.ModbusDataType.T_16_BIT_INT_HI_FIRST:
                case ENUM.ModbusDataType.T_16_BIT_INT_LOW_FIRST:
                  value = bufferOrdered.readInt16BE(0, 2) || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 16bit unsigned integer
                case ENUM.ModbusDataType.T_16_BIT_UINT_HI_FIRST:
                case ENUM.ModbusDataType.T_16_BIT_UINT_LOW_FIRST:
                  value = bufferOrdered.readUInt16BE(0, 2) || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 32bit Floats
                case ENUM.ModbusDataType.T_32_BIT_FLT_1234:
                case ENUM.ModbusDataType.T_32_BIT_FLT_4321:
                case ENUM.ModbusDataType.T_32_BIT_FLT_2143:
                case ENUM.ModbusDataType.T_32_BIT_FLT_3412:
                  value = bufferOrdered.readFloatBE(0, 4) || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 32bit signed unsigned integers
                case ENUM.ModbusDataType.T_32_BIT_INT_1234:
                case ENUM.ModbusDataType.T_32_BIT_INT_4321:
                case ENUM.ModbusDataType.T_32_BIT_INT_2143:
                case ENUM.ModbusDataType.T_32_BIT_INT_3412:
                  value = bufferOrdered.readInt32BE(0, 4) || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                case ENUM.ModbusDataType.T_32_BIT_UINT_1234:
                case ENUM.ModbusDataType.T_32_BIT_UINT_4321:
                case ENUM.ModbusDataType.T_32_BIT_UINT_2143:
                case ENUM.ModbusDataType.T_32_BIT_UINT_3412:

                  value = bufferOrdered.readUInt32BE(0, 4) || 0;
                  value = value * parseFloat(regMultipler) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);

                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 64bit signed integers
                case ENUM.ModbusDataType.T_64_BIT_INT_12345678:
                case ENUM.ModbusDataType.T_64_BIT_INT_56781234:
                  value = bufferOrdered.readBigInt64BE(0) || 0;
                  value =
                    BigInt(value) / BigInt(parseInt(1 / regMultipler)) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // 64bit unsigned integers
                case ENUM.ModbusDataType.T_64_BIT_UINT_12345678:
                case ENUM.ModbusDataType.T_64_BIT_UINT_56781234:
                  value = bufferOrdered.readBigUInt64BE(0) || 0;
                  value =
                    BigInt(value) / BigInt(parseInt(1 / regMultipler)) || 0;
                  msgOut.payload = node.bpChkSetRealTo3Dp
                    ? Number(parseFloat(value).toFixed(FIX_DECIMAL_PLACES))
                    : Number(value);
                  node.send(
                    doValueConversions(
                      msgOut,
                      regAddress,
                      node.bpChkConvertPFactor
                    )
                  );
                  break;

                // ASCII string characters
                case ENUM.ModbusDataType.T_ASCII:
                  value = bufferOrdered.toString("utf8") || "";
                  msgOut.payload = String(value).trim() || "";
                  msgOut.payload = msgOut.payload.replace(/[^ -~]+/g, ""); // Remove non printable
                  node.send(msgOut);
                  break;

                default:
                  if (this.bpChkShowDebugWarnings) {
                    this.warn("Could not decode data format type (" + regDataFormat + "), please refer the documentation.");
                  }
              }
            } else {
              if (this.bpChkShowDebugWarnings) {
                this.warn(errMsg);
              }
            }
          }
        } else {
          if (this.bpChkShowDebugWarnings) {
            this.warn("This module requires specific input parameters to the node, please refer the documentation.");
          }
        }
      } catch (err) {
        if (this.bpChkShowDebugWarnings) {
          this.warn(err);
        }
      }
    });
  }

  function convertToCapScore(text) {
    if (text) {
      let capScore = text.replace(/[^ -~]+/g, "");  // Remove non printable
      capScore = capScore.replace(/\s+/g, " ");     // Remove double spaces
      capScore = capScore.replace(/\s/g, "_");      // Replace space with underscore
      capScore = capScore.replace(/\\/g, "_");      // Replace \ with underscore
      capScore = capScore.replace(/\//g, "_");      // Replace / with underscore
      capScore = capScore.replace(/[^a-zA-Z0-9_]/g, ""); // Replace non-alphanumeric with underscore
      return capScore.toUpperCase();
    }
    return text;
  }
  function getBufferRegisterData(
    byteBuffer,
    startRegIndex,
    targetRegAddr,
    targetRegLen,
    deviceDataSize
  ) {
    var retBuff = [];
    try {
      var dataSize = deviceDataSize || 2;
      var begAddr = (targetRegAddr - startRegIndex) * dataSize;
      var endAddr = begAddr + targetRegLen * dataSize;
      retBuff = byteBuffer.slice(begAddr, endAddr);
    } catch (error) {}
    return retBuff;
  }
  function doValueConversions(msg, regAddress, convertPowerFactor) {

    var msgConverted = Object.assign({}, msg);
    let msgsConverted = [];
    try {
      var pf = msgConverted.payload;
      var pfProp = {};
      if (convertPowerFactor == true) {
        var regUnitMeasure = msgConverted.modbusSource.regUnitName;
        if (regUnitMeasure == "POWER_FACTOR") {
          if (pf < -2) pf = -2;
          if (pf > 2) pf = 2;

          // -2   -1     0     1     2
          // |  Q3 |  Q2 |  Q1 |  Q4 |
          // | IND | CAP | IND | CAP |
          // |  VI |  IV |  VI |  IV |
          // |  EXPORT   |  IMPORT   |
          // |           | PF  |     |
          // |     |   PF_Q2   |     |
          // |         PF_Q4         |
          pfProp.inputPf = pf;

          if (pf >= 0 && pf <= 1) {
            pfProp.quadrant = "Q1";
            pfProp.powerType = pf == 1 ? "RESISTIVE" : "INDUCTIVE";
            pfProp.impExp = "IMPORT";
          } else if (pf >= -1 && pf <= 0) {
            pfProp.quadrant = "Q2";
            pfProp.powerType = pf == -1 ? "RESISTIVE" : "CAPACITIVE";
            pfProp.impExp = "EXPORT";
          } else if (pf >= -2 && pf <= -1) {
            pf = -2 - pf;
            pfProp.quadrant = "Q3";
            pfProp.powerType = pf == -2 ? "RESISTIVE" : "INDUCTIVE";
            pfProp.impExp = "EXPORT";
          } else if (pf >= 1 && pf <= 2) {
            pf = 2 - pf;
            pfProp.quadrant = "Q4";
            pfProp.powerType = pf == 2 ? "RESISTIVE" : "CAPACITIVE";
            pfProp.impExp = "IMPORT";
          }
          pfProp.degsVtoI = parseFloat(convertPfToLeadLagDeg(pf));
          var conv = {};
          conv.powerFactor = pfProp;
          msgConverted.modbusSource.conversion = conv;
          msgConverted.payload = Number(pf);
        }
        
        msgsConverted.push(msgConverted);              
      }
    } catch (err) {
      // Restore the orginal
      msgsConverted.push(msg);
    }
    return [msgsConverted];
  }

  function convertPfToLeadLagDeg(pf) {
    var deg = (180 * Math.acos(pf)) / Math.PI;
    if (pf < 0) deg = 180 - deg;
    return deg.toFixed(2);
  }
  function isValidInputMsg(msg) {
    if (
      msg.hasOwnProperty("modbusSource") &&
      msg.modbusSource.hasOwnProperty("startRegIndex") &&
      msg.modbusSource.hasOwnProperty("fnCodeBlock") &&
      msg.modbusSource.hasOwnProperty("totalBlockSize") &&
      msg.modbusSource.hasOwnProperty("registers")
    ) {
      if (
        (msg.hasOwnProperty("responseBuffer") &&
          msg.responseBuffer.hasOwnProperty("buffer")) ||
        (msg.hasOwnProperty("payload") && msg.payload.hasOwnProperty("buffer"))
      ) {
        return true;
      }
      return true;
    }
    return false;
  }
  function reorderToMsbLsb(bufferUnOrdered, regDataFormat, dataSize) {
    let bufferOrdered;
    let isSuccess = true;
    let errMsg;

    switch (regDataFormat) {
      // 8bit signed unsigned integer
      case ENUM.ModbusDataType.T_8_BIT_INT:
      case ENUM.ModbusDataType.T_8_BIT_UINT:
        bufferOrdered = Buffer.alloc(1);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 0);
        break;

      // 16bit signed unsigned integer
      case ENUM.ModbusDataType.T_16_BIT_INT_HI_FIRST:
      case ENUM.ModbusDataType.T_16_BIT_UINT_HI_FIRST:
        bufferOrdered = Buffer.alloc(2);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 1);
        break;

      // 16bit signed unsigned integer
      case ENUM.ModbusDataType.T_16_BIT_INT_LOW_FIRST:
      case ENUM.ModbusDataType.T_16_BIT_UINT_LOW_FIRST:
        bufferOrdered = Buffer.alloc(2);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 1);
        break;

      // 32bit 1234
      case ENUM.ModbusDataType.T_32_BIT_FLT_1234:
      case ENUM.ModbusDataType.T_32_BIT_INT_1234:
      case ENUM.ModbusDataType.T_32_BIT_UINT_1234:
        bufferOrdered = Buffer.alloc(4);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 1);
        bufferOrdered.writeUInt8(bufferUnOrdered[2], 2);
        bufferOrdered.writeUInt8(bufferUnOrdered[3], 3);
        break;

      // 32bit 4321
      case ENUM.ModbusDataType.T_32_BIT_FLT_4321:
      case ENUM.ModbusDataType.T_32_BIT_INT_4321:
      case ENUM.ModbusDataType.T_32_BIT_UINT_4321:
        bufferOrdered = Buffer.alloc(4);
        bufferOrdered.writeUInt8(bufferUnOrdered[3], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[2], 1);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 2);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 3);
        break;

      // 32bit 2143
      case ENUM.ModbusDataType.T_32_BIT_FLT_2143:
      case ENUM.ModbusDataType.T_32_BIT_INT_2143:
      case ENUM.ModbusDataType.T_32_BIT_UINT_2143:
        bufferOrdered = Buffer.alloc(4);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 1);
        bufferOrdered.writeUInt8(bufferUnOrdered[3], 2);
        bufferOrdered.writeUInt8(bufferUnOrdered[2], 3);
        break;

      // 32bit 3412
      case ENUM.ModbusDataType.T_32_BIT_FLT_3412:
      case ENUM.ModbusDataType.T_32_BIT_INT_3412:
      case ENUM.ModbusDataType.T_32_BIT_UINT_3412:
        bufferOrdered = Buffer.alloc(4);
        bufferOrdered.writeUInt8(bufferUnOrdered[2], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[3], 1);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 2);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 3);
        break;

      // 64bit 12345678
      case ENUM.ModbusDataType.T_64_BIT_INT_12345678:
      case ENUM.ModbusDataType.T_64_BIT_UINT_12345678:
        bufferOrdered = Buffer.alloc(8);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 1);
        bufferOrdered.writeUInt8(bufferUnOrdered[2], 2);
        bufferOrdered.writeUInt8(bufferUnOrdered[3], 3);
        bufferOrdered.writeUInt8(bufferUnOrdered[4], 4);
        bufferOrdered.writeUInt8(bufferUnOrdered[5], 5);
        bufferOrdered.writeUInt8(bufferUnOrdered[6], 6);
        bufferOrdered.writeUInt8(bufferUnOrdered[7], 7);
        break;

      // 64bit 56781234
      case ENUM.ModbusDataType.T_64_BIT_INT_56781234:
      case ENUM.ModbusDataType.T_64_BIT_UINT_56781234:
        bufferOrdered = Buffer.alloc(8);
        bufferOrdered.writeUInt8(bufferUnOrdered[5], 0);
        bufferOrdered.writeUInt8(bufferUnOrdered[6], 1);
        bufferOrdered.writeUInt8(bufferUnOrdered[7], 2);
        bufferOrdered.writeUInt8(bufferUnOrdered[8], 3);
        bufferOrdered.writeUInt8(bufferUnOrdered[0], 4);
        bufferOrdered.writeUInt8(bufferUnOrdered[1], 5);
        bufferOrdered.writeUInt8(bufferUnOrdered[2], 6);
        bufferOrdered.writeUInt8(bufferUnOrdered[3], 7);
        break;

      // Character array
      case ENUM.ModbusDataType.T_ASCII:
        bufferOrdered = Buffer.alloc(dataSize);
        bufferOrdered = bufferUnOrdered;
        break;

      // No format, return error
      default:
        errMsg = "Could not reorder the byte array. This order is undefined (" + dataFormat + ").";
        isSuccess = false;
    }

    return { isSuccess, errMsg, bufferOrdered };
  }

  RED.nodes.registerType("bp-decoder", bpModbusDecoder);
};

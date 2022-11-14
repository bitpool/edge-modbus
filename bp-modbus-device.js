/*
  MIT License Copyright 2021, 2022 - Bitpool Pty Ltd
*/

module.exports = function (RED) {
  var ENUM = require("./enum.js");
  var OPT = require("./option.js")

  function bpModbusDevice(config) {
    var node = this;
    RED.nodes.createNode(node, config);
    node.bpUnitName = config.bpUnitName;
    node.bpModbusId = config.bpModbusId;
    node.bpRegisters = config.bpRegisters;
    node.bpChkShowDateOnLabel = config.bpChkShowDateOnLabel;
    node.bpChkShowDebugWarnings = config.bpChkShowDebugWarnings;
    node.bpChkEnableTurboMode = config.bpChkEnableTurboMode;
    node.bpDeviceDataSize = config.bpDeviceDataSize;
    node.bpSelectedTemplate = config.bpSelectedTemplate;
    node.bpSourceTemplatesFromWeb = config.bpSourceTemplatesFromWeb;

    this.status({});

    node.registerMap = {};
    for (var i = 0; i < this.bpRegisters.length; i++) {
      addRegister(
        node.registerMap,
        node.bpRegisters[i],
        node.bpUnitName,
        node.bpModbusId
      );
    }

    node.on("input", function (msg) {
      try {
        let blocks = buildRegisterBlocks(
          this.registerMap,
          this.bpChkEnableTurboMode,
          this.bpDeviceDataSize
        );

        if (this.bpChkShowDateOnLabel) {
          this.status({
            fill: "green",
            shape: "dot",
            text: new Date().toLocaleString(),
          });
        } else {
          this.status({});
        }

        let msgBlock = [];
        for (const fCodeKey in blocks) {
          var fcRegisterBlocks = blocks[fCodeKey];
          // fCodeKey = ['FC1','FC2',..] all valid function codes
          // Can only send contiguous blocks for each function code
          for (const fcBlock in fcRegisterBlocks) {
            let msgPack = {};
            msgPack.modbusSource = fcRegisterBlocks[fcBlock];
            let msgPayload = {
              fc: parseInt(fCodeKey.match(/\d+/)[0]),
              unitid: parseInt(node.bpModbusId),
              address: parseInt(fcRegisterBlocks[fcBlock].startRegIndex),
              quantity: parseInt(fcRegisterBlocks[fcBlock].totalBlockSize),
            };

            if (msg.hasOwnProperty("modbusId")) {
              msgPayload.unitid = parseInt(msg.modbusId);
              msgPack.modbusSource.overrideModbusId = parseInt(msg.modbusId);
            }
            if (msg.hasOwnProperty("unitName")) {
              msgPack.modbusSource.overrideUnitName = msg.unitName;
            }

            msgPack.modbusSource.readRequestBegTs = Date.now();
            var nodeDets = {
              sourceNodeId: node.id,
              selectedDeviceId: node.bpSelectedTemplate
            }
            msgPack.modbusSource.node = nodeDets;

            msgPack.payload = msgPayload;
            msgBlock.push(msgPack);
          }
        }
        this.send([msgBlock]);
      } catch (err) {
        if (this.bpChkShowDebugWarnings) {
          this.warn(err);
        }
      }
    });
  }
  function buildRegisterBlocks(regMap, doCreateBlocks, modbusDeviceDataSize) {
    let totalRegisterMap = [];
    let fnCodeList = getListOfFnCodes(regMap);

    for (const fnCode of fnCodeList) {
      let registerMapFiltered = filterBlock(regMap, fnCode);
      let doFirst = true;
      let fcodeRegisterMap = [];
      let blockRegisterMap = [];
      let blockStartRegIndex = 0;
      let blockRegSize = 0;
      let prevRegIndex = 0;
      let prevRegSize = 0;
      let regObj = {};

      for (const key in registerMapFiltered) {
        let currRegIndex = parseInt(key);

        if (doFirst) {
          blockRegisterMap = [];
          blockStartRegIndex = currRegIndex;
          blockRegisterMap.push(registerMapFiltered[currRegIndex].modbusSource);
          doFirst = false;
        } else {
          let nextRegIndex = parseInt(prevRegIndex) + parseInt(prevRegSize);
          if (doCreateBlocks && nextRegIndex == currRegIndex) {
            blockRegisterMap.push(
              registerMapFiltered[currRegIndex].modbusSource
            );
          } else {
            regObj = {
              startRegIndex: blockStartRegIndex,
              fnCodeBlock: fnCode,
              totalBlockSize: blockRegSize,
              deviceDataSize: modbusDeviceDataSize,
              registers: blockRegisterMap,
            };
            fcodeRegisterMap.push(regObj);
            blockRegisterMap = [];
            blockStartRegIndex = currRegIndex;
            blockRegSize = 0;
            blockRegisterMap.push(
              registerMapFiltered[currRegIndex].modbusSource
            );
          }
        }
        prevRegIndex = currRegIndex;
        prevRegSize = registerMapFiltered[currRegIndex].modbusSource.regSize;
        blockRegSize = blockRegSize + prevRegSize;
      }
      regObj = {
        startRegIndex: blockStartRegIndex,
        fnCodeBlock: fnCode,
        totalBlockSize: blockRegSize,
        deviceDataSize: modbusDeviceDataSize,
        registers: blockRegisterMap,
      };
      fcodeRegisterMap.push(regObj);
      totalRegisterMap["FC" + fnCode] = fcodeRegisterMap;
    }

    return totalRegisterMap;
  }
  function filterBlock(regMap, fnCode) {
    let filtered = {};

    for (const key in regMap) {
      let currRegIndex = parseInt(key);
      let register = regMap[currRegIndex].modbusSource;
      if (register.regFnCode == fnCode) {
        filtered[currRegIndex] = regMap[currRegIndex];
      }
    }
    return filtered;
  }
  function getListOfFnCodes(regMap) {
    let fnCodes = {};
    for (const key in regMap) {
      let currRegIndex = parseInt(key);
      let register = regMap[currRegIndex].modbusSource;
      fnCodes[register.regFnCode] = register.regFnCode;
    }
    return Object.values(fnCodes);
  }

  function addRegister(registerMap, register, unitName, modbusId) {
    let msg = buildMsg(
      unitName,
      modbusId,
      register.name,
      register.address,
      register.format,
      ENUM.ModbusFunctionCode[register.fnCode],
      register.multiplier,
      register.uom,
      register.scale,
      register.size
    );
    registerMap[register.address] = msg;
  };
  function buildMsg(
    unitName,
    modbusId,
    regName,
    regAddress,
    regDataFormat,
    modbusFunctionCode,
    regMultiplier,
    regUom,
    regScale,
    regSize
  ) {
    let res = {};
    if (
      unitName &&
      modbusId &&
      regName &&
      regAddress &&
      regDataFormat &&
      regMultiplier &&
      regSize &&
      modbusFunctionCode
    ) {
      modbusId = parseInt(modbusId);
      regAddress = parseInt(regAddress);
      regSize = parseInt(regSize);
      regMultiplier = parseFloat(regMultiplier);
      let modbus = {
        unitName: unitName,
        modbusId: modbusId,
        regFnCode: modbusFunctionCode,
        regName: regName,
        regAddress: regAddress,
        regMultiplier: regMultiplier,
        regSize: regSize,
        regFormat: regDataFormat,
        regUnitName: regUom,
        regUnitScale: regScale,
        topic: convertToCapScore(unitName) + "/" + convertToCapScore(regName),
      };
      res.modbusSource = modbus;
      res.payload = {
        fc: modbusFunctionCode,
        unitid: modbusId,
        address: regAddress,
        quantity: regSize,
      };
    }
    return res;
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

  RED.nodes.registerType("bp-device", bpModbusDevice);

  RED.httpAdmin.get('/devices', function (req, res) {
    res.send(JSON.stringify(require("./devices/template.js").DeviceTemplateTypes));
  });

  RED.httpAdmin.get('/devices/:device', function (req, res) {
    // Add validated maps here from v1.0.2
    if (
      req.params.device == 'device-abb-m4m' ||
      req.params.device == 'device-circutor-afq' ||
      req.params.device == 'device-circutor-cvm-e3-mini' ||
      req.params.device == 'device-comap-inteligen-200' ||
      req.params.device == 'device-crompton-integra-2270' ||
      req.params.device == 'device-moxa-e1210' ||
      req.params.device == 'device-schneider-iem3250' ||
      req.params.device == 'device-schneider-powertag-1p' ||
      req.params.device == 'device-schneider-powertag-3p' ||
      req.params.device == 'device-schneider-powertag-a9mem1540' ||
      req.params.device == 'device-schneider-powertag-a9mem1580' ||
      req.params.device == 'device-socomec-diris-a10' ||
      req.params.device == 'device-socomec-diris-a30'
    ) {
      res.send(JSON.stringify(require(`./devices/${req.params.device}.js`).RegisterMap));
    } 
  });

  RED.httpAdmin.get('/options/:option', function (req, res) {
    if (req.params.option == 'option-modbus-register-scale') {
      let opt = { name: req.params.option, opts: OPT.OptionModbusRegisterScale };
      res.send(JSON.stringify(opt));
    } else if (req.params.option == 'option-modbus-function-code') {
      let opt = { name: req.params.option, opts: OPT.OptionModbusFunctionCode };
      res.send(JSON.stringify(opt));
    } else if (req.params.option == 'option-modbus-regsiter-data-type') {
      let opt = { name: req.params.option, opts: OPT.OptionModbusRegisterDataType };
      res.send(JSON.stringify(opt));
    } else if (req.params.option == 'option-modbus-register-uom') {
      let opt = { name: req.params.option, opts: OPT.OptionModbusRegisterUnitOfMeasure };
      res.send(JSON.stringify(opt));
    }
  });

};


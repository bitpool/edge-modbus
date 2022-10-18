/*
  MIT License Copyright 2021, 2022 - Bitpool Pty Ltd
*/

module.exports = function (RED) {
  
  function bpModbusDisplay(config) {
    var node = this;
    RED.nodes.createNode(node, config);

    node.bpModbusDisplayName = config.bpModbusDisplayName;
    node.bpDeviceRegister = config.bpDeviceRegister;
    node.bpChkShowDebugWarnings = config.bpChkShowDebugWarnings;
    this.status({});

    node.on("input", function (msg) {

      try {
        var nodeRegister = parseInt(node.bpDeviceRegister);

        if (nodeRegister && isValidInputMsg(msg)) {
          let regAddress = msg.modbusSource.regAddress;
          if (nodeRegister == regAddress) {
            let regUnitName = msg.modbusSource.regUnitName;
            let regUnitScale = msg.modbusSource.regUnitScale;
            let regValue = msg.payload;
            let prefix = "";
            let suffix = "";

            switch (regUnitScale) {
              case "MICRO":
                prefix = "µ";
                break;
              case "MILLI":
                prefix = "m";
                break;
              case "KILO":
                prefix = "k";
                break;
              case "MEGA":
                prefix = "M";
                break;
              case "GIGA":
                prefix = "G";
                break;
            }

            switch (regUnitName) {
              case "VOLTAGE_V":
                suffix = "volts";
                break;
              case "CURRENT_A":
                suffix = "amps";
                break;
              case "POWER_ACTIVE_P":
                suffix = "W";
                break;
              case "POWER_REACTIVE_Q":
                suffix = "var";
                break;
              case "POWER_APPARENT_S":
                suffix = "VA";
                break;
              case "ENERGY_ACTIVE_P":
                suffix = "Wh";
                break;
              case "ENERGY_REACTIVE_Q":
                suffix = "varh";
                break;
              case "ENERGY_APPARENT_S":
                suffix = "VAh";
                break;
              case "FREQUENCY_HZ":
                suffix = "hz";
                break;
              case "TEMPERATURE_C":
                suffix = "°C";
                break;
              case "TEMPERATURE_F":
                suffix = "°F";
                break;
              case "PERCENT":
                suffix = "%";
                break;
            }

            node.status({
              fill: "green",
              shape: "dot",
              text: String(regValue).trim() + " " + prefix + suffix,
            });
          }
        } else {
          if (this.bpChkShowDebugWarnings) {
            this.warn(
              "This module requires specific input parameters to the node, please refer the documentation."
            );
          }
        }
      } catch (err) {
        if (this.bpChkShowDebugWarnings) {
          this.warn(err);
        }
      } finally {
        node.send(msg);
      }
    });
  }
  function isValidInputMsg(msg) {
    if (
      msg.hasOwnProperty("modbusSource") &&
      msg.hasOwnProperty("payload") &&
      msg.modbusSource.hasOwnProperty("topic") &&
      msg.modbusSource.hasOwnProperty("regUnitName") &&
      msg.modbusSource.hasOwnProperty("regUnitScale")
    ) {
      return true;
    }
    return false;
  }

  RED.nodes.registerType("bp-display", bpModbusDisplay);

  RED.httpAdmin.get('/bpModbusDevices', function(req, res) {

    let nodeNames = []
    RED.nodes.eachNode((val) =>{
      if(val.type == 'bp-device'){
        let obj = {
          id: val.id,
          bpModbusId: val.bpModbusId,
          bpUnitName: val.bpUnitName
        }
        nodeNames.push(obj)
      }
    })
    res.send(JSON.stringify(nodeNames));
  });

  RED.httpAdmin.get('/bpModbusDeviceRegisterMap/:nodeId', function(req, res) {
    let srcNode = RED.nodes.getNode(req.params.nodeId)
    let regMap = []
    for (const [addr, value] of Object.entries(srcNode.registerMap)) {
      let reg = {
        regAddress: parseInt(addr),
        regName: value.modbusSource.regName,
      }
      regMap.push(reg)
    }
    res.send(JSON.stringify(regMap));
  });

};

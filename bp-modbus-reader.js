/*
  MIT License Copyright 2021, 2022 - Bitpool Pty Ltd
*/

module.exports = function (RED) {
    'use strict'
    const mbBasics = require('./modbus-basics')
    const mbCore = require('./core/modbus-core')
    const mbIOCore = require('./core/modbus-io-core')
    const internalDebugLog = require('debug')('contribModbus:flex:getter')

    function bpModbusReader(config) {
        const node = this;
        RED.nodes.createNode(node, config);

        this.name = config.name
        this.unitid = config.unitid
        
        this.showStatusActivities = config.showStatusActivities
        this.showErrors = config.showErrors
        this.showWarnings = config.showWarnings
        this.connection = null

        this.useIOFile = config.useIOFile
        this.ioFile = RED.nodes.getNode(config.ioFile)
        this.useIOForPayload = config.useIOForPayload
        this.logIOActivities = config.logIOActivities

        this.emptyMsgOnFail = config.emptyMsgOnFail
        this.keepMsgProperties = config.keepMsgProperties
        this.internalDebugLog = internalDebugLog        
        this.verboseLogging = RED.settings.verbose

        this.delayOnStart = config.delayOnStart
        this.startDelayTime = parseInt(config.startDelayTime) || 10

        node.bufferMessageList = new Map()
        node.INPUT_TIMEOUT_MILLISECONDS = 1000
        node.delayOccured = false
        node.inputDelayTimer = null

        mbBasics.setNodeStatusTo('waiting', node)

        const modbusClient = RED.nodes.getNode(config.server)
        if (!modbusClient) {
          return
        }
        modbusClient.registerForModbus(node)
        mbBasics.initModbusClientEvents(node, modbusClient)

        // Workaround for issues with udev and permissions
        const { exec } = require("child_process");
        exec("doas sh /usr/local/bin/allowSerial.sh");

        node.onModbusReadDone = function (resp, msg) {
            if (node.showStatusActivities) {
                mbBasics.setNodeStatusTo('reading done', node)
            }
            node.send(mbIOCore.buildMessageWithIO(node, resp.data, resp, msg))
            node.emit('modbusFlexGetterNodeDone')
        }

        node.errorProtocolMsg = function (err, msg) {
            mbBasics.logMsgError(node, err, msg)
            mbBasics.sendEmptyMsgOnFail(node, err, msg)
        }
        //Retry on error logic


        //existing
        node.onModbusReadError = function (err, msg) {
            node.internalDebugLog(err.message)
            const origMsg = mbCore.getOriginalMessage(node.bufferMessageList, msg)
            node.errorProtocolMsg(err, origMsg)
            mbBasics.sendEmptyMsgOnFail(node, err, msg)
            mbBasics.setModbusError(node, modbusClient, err, origMsg)
            node.emit('modbusFlexGetterNodeError')
        }

        node.prepareMsg = function (msg) {
            if (typeof msg.payload === 'string') {
                msg.payload = JSON.parse(msg.payload)
            }
            msg.payload.fc = parseInt(msg.payload.fc) || 3
            msg.payload.unitid = parseInt(msg.payload.unitid)
            msg.payload.address = parseInt(msg.payload.address) || 0
            msg.payload.quantity = parseInt(msg.payload.quantity) || 1
            return msg
        }

        node.isValidModbusMsg = function (msg) {
            let isValid = true

            if (!(Number.isInteger(msg.payload.fc) &&
                msg.payload.fc >= 1 &&
                msg.payload.fc <= 4)) {
                node.error('FC Not Valid', msg)
                isValid &= false
            }
            if (isValid &&
                !(Number.isInteger(msg.payload.address) &&
                    msg.payload.address >= 0 &&
                    msg.payload.address <= 65535)) {
                node.error('Address Not Valid', msg)
                isValid &= false
            }
            if (isValid &&
                !(Number.isInteger(msg.payload.quantity) &&
                    msg.payload.quantity >= 1 &&
                    msg.payload.quantity <= 65535)) {
                node.error('Quantity Not Valid', msg)
                isValid &= false
            }

            return isValid
        }

        node.buildNewMessageObject = function (node, msg) {
            const messageId = mbCore.getObjectId()
            return {
                topic: msg.topic || node.id,
                messageId,
                payload: {
                    value: msg.payload.value || msg.value,
                    unitid: msg.payload.unitid,
                    fc: msg.payload.fc,
                    address: msg.payload.address,
                    quantity: msg.payload.quantity,
                    emptyMsgOnFail: node.emptyMsgOnFail,
                    keepMsgProperties: node.keepMsgProperties,
                    messageId
                }
            }
        }

        function verboseWarn (logMessage) {
            if (RED.settings.verbose && node.showWarnings) {
              node.warn('Flex-Getter -> ' + logMessage)
            }
          }
      
          node.isReadyForInput = function () {
            return (modbusClient.client && modbusClient.isActive() && node.delayOccured)
          }
      
          node.isNotReadyForInput = function () {
            return !node.isReadyForInput()
          }
      
          node.resetInputDelayTimer = function () {
            if (node.inputDelayTimer) {
              verboseWarn('reset input delay timer node ' + node.id)
              clearTimeout(node.inputDelayTimer)
            }
            node.inputDelayTimer = null
            node.delayOccured = false
          }
      
          node.initializeInputDelayTimer = function () {
            node.resetInputDelayTimer()
            if (node.delayOnStart) {
              verboseWarn('initialize input delay timer node ' + node.id)
              node.inputDelayTimer = setTimeout(() => {
                node.delayOccured = true
              }, node.INPUT_TIMEOUT_MILLISECONDS * node.startDelayTime)
            } else {
              node.delayOccured = true
            }
          }
      
          node.initializeInputDelayTimer()

        node.on('input', function (msg) {
            if (mbBasics.invalidPayloadIn(msg)) {
                verboseWarn('Invalid message on input')
                return
            }

            if (node.isNotReadyForInput()) {
                verboseWarn('Inject while node is not ready for input.')
                return
            }
        
              if (modbusClient.isInactive()) {
                verboseWarn('You sent an input to inactive client. Please use initial delay on start or send data more slowly.')
                return
            }


            const origMsgInput = Object.assign({}, msg) // keep it origin
            try {
                const inputMsg = node.prepareMsg(origMsgInput)
                if (node.isValidModbusMsg(inputMsg)) {
                    const newMsg = node.buildNewMessageObject(node, inputMsg)
                    node.bufferMessageList.set(newMsg.messageId, mbBasics.buildNewMessage(node.keepMsgProperties, inputMsg, newMsg))
                    modbusClient.emit('readModbus', newMsg, node.onModbusReadDone, node.onModbusReadError)
                }
            } catch (err) {
                node.errorProtocolMsg(err, origMsgInput)
                mbBasics.sendEmptyMsgOnFail(node, err, origMsgInput)
            }

            if (node.showStatusActivities) {
                mbBasics.setNodeStatusTo(modbusClient.actualServiceState, node)
            }
        })

        node.on('close', function (done) {
            node.resetInputDelayTimer()
            mbBasics.setNodeStatusTo('closed', node)
            node.bufferMessageList.clear()
            modbusClient.deregisterForModbus(node.id, done)
        })

        if (!node.showStatusActivities) {
            mbBasics.setNodeDefaultStatus(node)
        }

    }

    RED.nodes.registerType("bp-reader", bpModbusReader);
};

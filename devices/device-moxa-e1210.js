module.exports.RegisterMap = [
    {address: 48, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: '16BIT_INT_HI_FIRST', size: 1, scale: "NONE", uom: "NONE", name: 'DIGIT_IN_STATUS'},
    {address: 5040, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: 'ASCII', size: 30, scale: "NONE", uom: "NONE", name: 'DEVICE_NAME'},
    {address: 5020, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: '32BIT_INT_1234', size: 2, scale: "NONE", uom: "NONE", name: 'DEVICE_UPTIME_SECS'},
    {address: 5029, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: '32BIT_INT_1234', size: 2, scale: "NONE", uom: "NONE", name: 'DEVICE_VERSION'},
    {address: 5031, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: '32BIT_INT_1234', size: 2, scale: "NONE", uom: "NONE", name: 'DEVICE_BUILD_DATE'},
    {address: 5027, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: '32BIT_INT_1234', size: 2, scale: "NONE", uom: "NONE", name: 'DEVICE_IP_ADDRESS'},
    {address: 5024, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: '32BIT_INT_1234', size: 3, scale: "NONE", uom: "NONE", name: 'DEVICE_MAC_ADDRESS'},
    {address: 5000, fnCode: 'F4_INPUT_REGS', multiplier: 1, format: 'ASCII', size: 10, scale: "NONE", uom: "NONE", name: 'DEVICE_MODEL'},
];
module.exports.EnumMap = [];
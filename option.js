/*
  MIT License Copyright 2021, 2022 - Bitpool Pty Ltd
*/

exports.OptionModbusRegisterScale = [
    {optValue: "NONE", optText: "None"},
    {optValue: "MICRO", optText: "Micro (µ)"},
    {optValue: "MILLI", optText: "Milli (m)"},
    {optValue: "KILO", optText: "Kilo (K)"},
    {optValue: "MEGA", optText: "Mega (M)"},
    {optValue: "GIGA", optText: "Giga (G)"}
]
exports.OptionModbusFunctionCode = [
    {optValue: "F1_READ_COILS", optText: "FC1: Read Status Coils"},
    {optValue: "F2_INPUT_COILS", optText: "FC2: Input Status Colis"},
    {optValue: "F3_HOLDING_REGS", optText: "FC3: Holding Registers"},
    {optValue: "F4_INPUT_REGS", optText: "FC4: Input Registers"}
]
exports.OptionModbusRegisterDataType = [
    {optValue: "8BIT_INT", optText: "8bit Integer"},
    {optValue: "8BIT_UINT", optText: "8bit Unsigned Integer"},
    {optValue: "16BIT_INT_HI_FIRST", optText: "16bit Integer (12)"},
    {optValue: "16BIT_INT_LOW_FIRST", optText: "16bit Integer (21)"},
    {optValue: "16BIT_UINT_HI_FIRST", optText: "16bit Unsigned Integer (12)"},
    {optValue: "16BIT_UINT_LOW_FIRST", optText: "16bit Unsigned Integer (21)"},
    {optValue: "32BIT_FLOAT_1234", optText: "32bit Float (1234)"},
    {optValue: "32BIT_FLOAT_4321", optText: "32bit Float (4321)"},
    {optValue: "32BIT_FLOAT_2143", optText: "32bit Float (2143)"},
    {optValue: "32BIT_FLOAT_3412", optText: "32bit Float (3412)"},
    {optValue: "32BIT_INT_1234", optText: "32bit Integer (1234)"},
    {optValue: "32BIT_INT_4321", optText: "32bit Integer (4321)"},
    {optValue: "32BIT_INT_2143", optText: "32bit Integer (2143)"},
    {optValue: "32BIT_INT_3412", optText: "32bit Integer (3412)"},
    {optValue: "32BIT_UINT_1234", optText: "32bit Unsigned Integer (1234)"},
    {optValue: "32BIT_UINT_4321", optText: "32bit Unsigned Integer (4321)"},
    {optValue: "32BIT_UINT_2143", optText: "32bit Unsigned Integer (2143)"},
    {optValue: "32BIT_UINT_3412", optText: "32bit Unsigned Integer (3412)"},
    {optValue: "64BIT_INT_12345678", optText: "64Bit Integer (12345678)"},
    {optValue: "64BIT_INT_56781234", optText: "64Bit Integer (56781234)"},
    {optValue: "64BIT_UINT_12345678", optText: "64Bit Unsigned Integer (12345678)"},
    {optValue: "64BIT_UINT_56781234", optText: "64Bit Unsigned Integer (56781234)"},
    {optValue: "ASCII", optText: "ASCII String"}
]
exports.OptionModbusRegisterUnitOfMeasure = [
    {optValue: "NONE", optText: "None"},
    {optValue: "VOLTAGE_V", optText: "Volts (V)"},
    {optValue: "CURRENT_A", optText: "Amperes (A)"},
    {optValue: "POWER_ACTIVE_P", optText: "Watts (W)"},
    {optValue: "POWER_REACTIVE_Q", optText: "Voltampere Reactive (var)"},
    {optValue: "POWER_APPARENT_S", optText: "Voltampere (VA)"},
    {optValue: "POWER_FACTOR", optText: "Power Factor"},
    {optValue: "ENERGY_ACTIVE_P", optText: "Watt Hour (Wh)"},
    {optValue: "ENERGY_REACTIVE_Q", optText: "Voltampere Reactive Hour (varh)"},
    {optValue: "ENERGY_APPARENT_S", optText: "Voltampere  Hour (VAh)"},
    {optValue: "FREQUENCY_HZ", optText: "Hertz (Hz)"},
    {optValue: "TEMPERATURE_C", optText: "Celsius (°C)"},
    {optValue: "TEMPERATURE_F", optText: "Farenheit (°F)"},
    {optValue: "VOLTAGE_PHASE_SEQ", optText: "Voltage Phase Sequence"},
    {optValue: "PERCENT", optText: "Percent (%)"},
    {optValue: "RPM", optText: "Revolutions per Minute"},
    {optValue: "VOLUME_M3", optText: "Cubic Meters (m³)"},
    {optValue: "FLOW_M3_PER_SEC", optText: "Cubic Meters per Second (m³/s)"},
    {optValue: "FLOW_M3_PER_HOUR", optText: "Cubic Meters per Hour (m³/h)"},
    {optValue: "VOLUME_LITERS", optText: "Liters (L)"},
    {optValue: "FLOW_LITERS_PER_SECS", optText: "Liters per Seconds (L/s)"},
    {optValue: "FLOW_LITERS_PER_HOUR", optText: "Liters per Seconds (L/h)"},
    {optValue: "PRESSURE_BAR", optText: "Pressure Bars (bar)"},
    {optValue: "PRESSURE_PASCAL", optText: "Pressure Pascal (Pa)"},
    {optValue: "TIME_MSECS", optText: "Milliseconds (ms)"},
    {optValue: "TIME_SECS", optText: "Seconds (s)"},
    {optValue: "TIME_HOUR", optText: "Hours (h)"},
    {optValue: "TIME_DAY", optText: "Days (d)"},
    {optValue: "TIME_WEEK", optText: "Week (wk)"},
    {optValue: "TIME_MONTH", optText: "Month (mth)"},
    {optValue: "TIME_YEAR", optText: "Year (yr)"},
    {optValue: "BINARY", optText: "Binary Data"},
]
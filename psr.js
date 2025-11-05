function calculateQNH(stationPressure, elevation, temperature) {
  // stationPressure in hPa
  // elevation in meters
  // temperature in °C

  const T = temperature + 273.15; // convert °C to Kelvin
  const h = elevation;
  const Ps = stationPressure;

  const QNH = Ps * Math.pow(
    1 - (0.0065 * h) / (T + (0.0065 * h) / 2),-5.257
  );

  return Math.round(QNH * 10) / 10; // round to 1 decimal place
}

// Example:
const qnh = calculateQNH(841.6, 1538, 19.5);
console.log("QNH:", qnh, "hPa");

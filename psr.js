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

// T, Tw in °C; P in hPa
function dewPointFromWetBulb(T, Tw, P, gamma = 0.00066) {
  // Helper: saturation vapor pressure (Tetens)
  function es(t) {
    return 6.112 * Math.exp((17.62 * t) / (243.12 + t)); // hPa
  }

  // parse inputs
  T = parseFloat(T);
  Tw = parseFloat(Tw);
  P = parseFloat(P);

  if (isNaN(T) || isNaN(Tw) || isNaN(P)) return null;

  const esTw = es(Tw);
  const e = esTw - gamma * P * (T - Tw); // hPa

  if (!(e > 0)) return null; // invalid result

  const lnRatio = Math.log(e / 6.112);
  const Td = (243.12 * lnRatio) / (17.62 - lnRatio);
  return Td; // °C
}

// Example:
console.log(dewPointFromWetBulb(18.9, 16.4, 841.8));

// T (°C), RH (%), P (hPa)
function wetBulbFromRH(T, RH, P, gamma = 0.00066, tol = 1e-4, maxIter = 60) {
  function es(t) {
    return 6.112 * Math.exp((17.62 * t) / (243.12 + t)); // hPa
  }

  // Validate inputs
  T = parseFloat(T); RH = parseFloat(RH); P = parseFloat(P);
  if (isNaN(T) || isNaN(RH) || isNaN(P)) return null;

  const e = (RH / 100) * es(T); // actual vapor pressure

  // f(Tw) = es(Tw) - gamma*P*(T-Tw) - e
  function f(tw) {
    return es(tw) - gamma * P * (T - tw) - e;
  }

  // Bisection bounds: Tw_low <= Tw <= Tw_high (Tw_high = T)
  let a = -50.0;
  let b = T;
  let fa = f(a), fb = f(b);

  // If same sign, try extend a bit or fail
  if (fa * fb > 0) {
    // try extending lower bound
    a = -100;
    fa = f(a);
    if (fa * fb > 0) return null; // cannot bracket root
  }

  let mid = (a + b) / 2;
  for (let i = 0; i < maxIter; i++) {
    mid = (a + b) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < tol) return mid;
    if (fa * fm <= 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }
  return mid; // return best estimate
}

console.log(wetBulbFromRH(19.4, 68, 839.9));



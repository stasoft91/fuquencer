/**
 * COPIED FROM Razz21/vue-synth
 * ORIGINAL: https://github.com/Razz21/vue-synth
 * THIS FILE IS UNDER MIT LICENSE ACCORDING TO ORIGINAL AUTHOR
 */

"use-strict";

export function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

/**
 * A favourite of mine is using a sin() function instead.
 * This will have the "unfortunate" side effect of removing
 * odd harmonics if you take it to the extreme: a triangle
 * wave gets mapped to a pure sine wave.
 * https://www.musicdsp.org/en/latest/Effects/43-waveshaper.html
 * @param {Number} k amount [0, 1]
 * @param {Number} x input [-1, 1]
 * @author Jon Watte
 */
const sine = function (k: number) {
  k = k * 0.4 + 0.1; // soft sine-shaping effect [0.1, 0.5]
  const z = Math.PI * k,
    sin = Math.sin,
    s = clamp(1 / sin(z), -3.236068, 3.236068); /* otherwise blowup */
  return function (x: number) {
    return sin(z * x) * s;
  };
};
/**
 * https://www.musicdsp.org/en/latest/Effects/86-waveshaper-gloubi-boulga.html
 * @param {Number} k amount [0, 1]
 * @param {Number} x input [-1, 1]
 * @author Laurent de Soras
 */
const gloubiboulga = function (k: number) {
  const abs = Math.abs,
    exp = Math.exp,
    sqrt = Math.sqrt;
  k = k * 20 + 1; // k range [1, Inf]
  return function (x: number) {
    // x*=0.686306;
    x = x * k * 0.686306;
    const a = 1 + exp(sqrt(abs(x)) * -0.75);
    return (exp(x) - exp(-x * a)) / (exp(x) + exp(-x));
  };
};
/**
 * https://www.musicdsp.org/en/latest/Effects/203-fold-back-distortion.html
 * @param {Number} x input [-1, 1]
 * @param {Number} k threshold [0, 1]
 */
const foldback = function (k: number) {
  k = clamp(k, 0, 0.999);
  k = 1 - k; // inverse threshold to apply relation -> more = stronger effect
  const abs = Math.abs;
  return function (x: number) {
    if (x > k || x < -k) {
      x = abs(abs((x - k) % (k * 4)) - k * 2) - k;
    }
    return x;
  };
};

/**
 * soft clipping algorithm
 * @param {Number} x input [-1, 1]
 * @param {Number} k clipping factor [0, 1] (0 = none, infinity = hard)
 */
const softClip = function (k: number) {
  return function (x: number) {
    const x1 = x * k,
      x2 = x1 * x1 + 0.25;
    return x1 / x2;
  };
};

/**
 * https://www.musicdsp.org/en/latest/Effects/42-soft-saturation.html
 * @param {Number} x input [-1, 1]
 * @param {Number} k amount [0, 1]
 */
const saturator = function (k: number) {
  k = 1 - k;
  // eslint-disable-next-line prefer-const
  let abs = Math.abs,
    // eslint-disable-next-line prefer-const
    sign = Math.sign,
    absx;
  return function (x: number) {
    absx = abs(x);
    // adjust to negative waveform values
    if (x > k || x < -k) {
      return sign(x) * (k + (absx - k) / (1 + ((absx - k) / (1 - k)) ** 2));
    } else if (x > 1) {
      return (sign(x) * (k + 1)) / 2;
    }
    return x;
  };
};

/**
 * Bit crusher algorithm simplified to one parameter
 * @param {Number} x input [-1, 1]
 * @param {Number} k amount [0, 1]
 * @description reduce sample rate in range 16 bit -> 1 bit
 */
const crusher = function (k: number) {
  k = 1 - k;
  k *= 16;
  const m = 2 ** k,
    round = Math.round;
  return function (x: number) {
    return round(x * m) / m;
  };
};

/**
 * Waveshaper \
 * https://www.musicdsp.org/en/latest/Effects/46-waveshaper.html
 * @param {Number} x input [-1, 1]
 * @param {Number} k amount [0, 1]
 * @author Partice Tarrabia and Bram de Jong
 */
const tarrabia = function (k: number) {
  k = clamp(k, 0, 0.997);
  const m = (2 * k) / (1 - k),
    abs = Math.abs;
  return function (x: number) {
    return ((1 + m) * x) / (1 + m * abs(x));
  };
};

/**
 * https://www.musicdsp.org/en/latest/Effects/41-waveshaper.html
 * @param {Number} x input [-1, 1]
 * @param {Number} k clipping factor [0, 1] (0 = none, infinity = hard)
 * @author Bram de Jong
 */
function fuzz(k: number) {
  k = k * 20 + 1;
  const abs = Math.abs,
    pow = Math.pow;
  let absx;
  return function (x: number) {
    absx = abs(x);
    return (x * (absx + k)) / (pow(x, 2) + (k - 1) * absx + 1);
  };
}

// default tone.js distortion algorithm
function distortion(amount: number) {
  const k = amount * 100;
  const deg = Math.PI / 180;
  return ((x: number) => {
    if (Math.abs(x) < 0.001) {
      // should output 0 when input is 0
      return 0;
    } else {
      return (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
  });
}

export const DISTORTION_ALGORITHMS: Record<string, Function> = {
  DISTORTION: distortion,
  SINE: sine,
  GLOUBIBOULGA: gloubiboulga,
  FOLDBACK: foldback,
  SOFTCLIP: softClip,
  SATURATOR: saturator,
  CRUSHER: crusher,
  TARRABIA: tarrabia,
  FUZZ: fuzz,
}

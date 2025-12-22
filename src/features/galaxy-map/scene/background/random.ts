export type RandomFn = () => number;

const stringToSeed = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

export const createSeededRandom = (seed: string): RandomFn => {
  let t = stringToSeed(seed) + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomInRange = (random: RandomFn, min: number, max: number) =>
  min + random() * (max - min);

export const randomGaussian = (random: RandomFn) => {
  // Box-Muller transform (0..1] -> N(0,1)
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};


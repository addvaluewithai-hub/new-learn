export type GasLaw = 'boyle' | 'charles' | 'pressure' | 'combined';
export type MatterPhase = 'solid' | 'liquid' | 'gas';
export const celsiusToKelvin = (celsius: number) => celsius + 273.15;
export const kelvinToCelsius = (kelvin: number) => kelvin - 273.15;

/** Same quantity of ideal gas; reference state = 1 atm, 2.4 L, 300 K. */
export function gasState(law: GasLaw, pressure: number, temperature: number) {
  if (
    !Number.isFinite(pressure) ||
    !Number.isFinite(temperature) ||
    pressure <= 0 ||
    temperature <= 0
  )
    throw new RangeError('Pressure and absolute temperature must be positive');
  const p = law === 'charles' ? 1 : law === 'pressure' ? temperature / 300 : pressure;
  const t = law === 'boyle' ? 300 : temperature;
  const v = law === 'pressure' ? 2.4 : (2.4 * t) / (300 * p);
  return { pressure: p, volume: v, temperature: t };
}

export const phaseChanges = [
  {
    id: 'melting',
    from: 'solid',
    to: 'liquid',
    name: 'Melting — الانصهار',
    heating: true,
  },
  {
    id: 'freezing',
    from: 'liquid',
    to: 'solid',
    name: 'Freezing — التجمد',
    heating: false,
  },
  {
    id: 'vaporization',
    from: 'liquid',
    to: 'gas',
    name: 'Evaporation — التبخر',
    heating: true,
  },
  {
    id: 'condensation',
    from: 'gas',
    to: 'liquid',
    name: 'Condensation — التكثف',
    heating: false,
  },
  {
    id: 'sublimation',
    from: 'solid',
    to: 'gas',
    name: 'Sublimation — التسامي',
    heating: true,
  },
  {
    id: 'deposition',
    from: 'gas',
    to: 'solid',
    name: 'Deposition — الترسيب المباشر',
    heating: false,
  },
] as const satisfies readonly {
  id: string;
  from: MatterPhase;
  to: MatterPhase;
  name: string;
  heating: boolean;
}[];

export const phaseNames: Record<MatterPhase, string> = {
  solid: 'Solid — صلب',
  liquid: 'Liquid — سائل',
  gas: 'Gas — غاز',
};

/** Pure plotting data, also used to verify the mathematical meaning of the visuals. */
export function lawGraph(law: GasLaw, reciprocal = false) {
  return Array.from({ length: 65 }, (_, i) => {
    const x = law === 'boyle' ? (reciprocal ? (2 * i) / 64 : 0.5 + (2.5 * i) / 64) : (550 * i) / 64;
    const y =
      law === 'boyle'
        ? reciprocal
          ? 2.4 * x
          : 2.4 / x
        : law === 'pressure'
          ? x / 300
          : (2.4 * x) / 300;
    return { x, y };
  });
}

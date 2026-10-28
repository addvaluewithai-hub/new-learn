// Cairo under the Sun: how long the day is and how high the Sun stands at noon, for a month
// and an axis tilt. Not to scale; the numbers use the usual sunrise formula at 30° north.
const CAIRO = 30;
const RAD = Math.PI / 180;
/** Mid-month day of the year. */
const dayOf = (month) => [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349][month - 1];
/** How far north of the equator the Sun stands overhead (its declination), in degrees. */
const declination = (month, tilt) => tilt * Math.cos((2 * Math.PI * (dayOf(month) - 172)) / 365);
function cairoSky(month, tilt) {
  const d = declination(month, tilt);
  const cosH = -Math.tan(CAIRO * RAD) * Math.tan(d * RAD);
  const hours = (2 * Math.acos(Math.max(-1, Math.min(1, cosH)))) / RAD / 15;
  return { declination: d, dayHours: hours, noon: 90 - CAIRO + d };
}
/** The Earth's place on its orbit: June puts its north pole toward the Sun. */
const orbitAngle = (month) => Math.PI + (2 * Math.PI * (dayOf(month) - 172)) / 365;
/** The northern season, or none when the axis stands straight. */
function seasonOf(month, tilt) {
  if (tilt < 1) return 'none';
  return [
    'winter',
    'winter',
    'spring',
    'spring',
    'spring',
    'summer',
    'summer',
    'summer',
    'autumn',
    'autumn',
    'autumn',
    'winter',
  ][month - 1];
}

import { useState } from 'react';
import { celsiusToKelvin } from './physics';
import { format } from './format';

export default function KelvinExplorer() {
  const [celsius, setCelsius] = useState(20);
  return (
    <>
      <div className="chem-title">
        <span className="chem-label">مقياس الحرارة المطلقة</span>
        <h2>نفس الحرارة، مقياسين</h2>
        <p>حرّك الحرارة وشوف إن التحويل إضافة ثابتة، مش ضرب.</p>
      </div>
      <div className="chem-temperature-scales">
        <article>
          <span>Celsius — سيلسيوس</span>
          <output dir="ltr">
            {format(celsius, 2)} <small>°C</small>
          </output>
        </article>
        <span className="temperature-bridge" dir="ltr">
          + 273.15
        </span>
        <article>
          <span>Kelvin — كلفن</span>
          <output dir="ltr">
            {format(celsiusToKelvin(celsius), 2)} <small>K</small>
          </output>
        </article>
      </div>
      <label className="chem-slider">
        درجة الحرارة بالسيلسيوس{' '}
        <input
          type="range"
          min="-273.15"
          max="150"
          step="0.05"
          value={celsius}
          onChange={(e) => setCelsius(Number(e.target.value))}
        />
        <output dir="ltr">{format(celsius, 2)}°C</output>
      </label>
      <div className="chem-equation-bar">
        <span>التحويل</span>
        <strong dir="ltr">T(K) = T(°C) + 273.15</strong>
      </div>
      <div className="chem-observation">
        <strong>مضاعفة السيلسيوس ≠ مضاعفة كلفن</strong>
        <p>
          <bdi>20°C = 293.15 K</bdi> و<bdi>40°C = 313.15 K</bdi>. النسبة المطلقة حوالي{' '}
          <bdi>1.068</bdi>، مش <bdi>2</bdi>.
        </p>
        <p>الصفر المطلق حدّ نظري؛ تحويل القيمة لا يعني إن الغاز الحقيقي يظل غازًا عندها.</p>
      </div>
    </>
  );
}

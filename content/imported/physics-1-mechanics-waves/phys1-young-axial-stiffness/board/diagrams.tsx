import React from 'react';
import { Arrow, Dim, Rod, Spring, T, Wall, ink } from './parts';
import type { Beat } from './beats';
// 460 × 340 model panel; the board repositions it above equations on portrait.
export function Diagram({ b }: { b: Beat }) {
  if(b.mode==='square')return <g>
    <rect x={120} y={65} width={200} height={200} fill={ink.c1} fillOpacity={0.15} stroke={ink.c1} strokeWidth={3}/>
    <Dim x1={120} x2={320} y={295} label="1 mm = 10⁻³ m" size={22}/>
    <T x={220} y={40} size={22}>كل ضلع يتحول لوحده</T>
    <T x={220} y={165} size={28} color={ink.c1} math>1 mm²</T>
    <T x={355} y={165} size={20} math>10⁻³ m</T>
  </g>;
  if(b.mode==='curve')return <g>
    <Arrow x1={75} y1={275} x2={75} y2={45} color={ink.soft}/>
    <Arrow x1={75} y1={275} x2={400} y2={275} color={ink.soft}/>
    <T x={48} y={48} math>σ</T><T x={410} y={295} math>ε</T>
    <path d="M75 275 Q250 265 355 65" stroke={ink.c3} strokeWidth={5} fill="none"/>
    <T x={240} y={320} size={20}>نسبة الإجهاد للانفعال مش ثابتة</T>
  </g>;
  if(b.mode==='shear')return <g>
    <path d="M90 255 L330 255 L385 90 L145 90 Z" fill={ink.c1} fillOpacity={0.18} stroke={ink.c1} strokeWidth={3}/>
    <path d="M90 255 V90 H330 V255" fill="none" stroke={ink.muted} strokeDasharray="8 7"/>
    <Arrow x1={190} y1={60} x2={375} y2={60}/><T x={230} y={305} size={22}>قوة موازية للوجه</T>
  </g>;
  const two=b.second!==undefined;
  const rod=(y:number,stretch:number,index:number)=>{
    const len=two?(b.long&&index===0?140:280):b.long?300:280;
    const x=60,end=x+len,extension=stretch;
    return <g key={index}>
      <Wall x={x} y={y-30} h={60}/>
      <Rod x={x} y={y} len={len+extension} h={b.thick?44:26}/>
      {extension>0&&<rect x={end} y={y-13} width={extension} height={26} fill={ink.c1} fillOpacity={0.7} rx={3}/>}
      {b.long&&<line x1={x+len/2} x2={x+len/2} y1={y-13} y2={y+13} stroke={ink.bg} strokeWidth={2}/>}
      <line x1={end} x2={end} y1={y-35} y2={y+32} stroke={ink.muted} strokeDasharray="4 4"/>
      <Arrow x1={end+extension+5} y1={y} x2={Math.min(440,end+extension+65)} y2={y}/>
      <T x={Math.min(425,end+extension+40)} y={y-39} size={20} color={ink.c2} math>{b.force??'F'}</T>
      <Dim x1={x} x2={end} y={y+55} label={two?(b.long?(index?'2L₀':'L₀'):'L₀'):(b.length??'L₀')} size={21}/>
      {extension>0&&b.mode!=='restore'&&<g><line x1={end} x2={end+extension} y1={y+88} y2={y+88} stroke={ink.c1} strokeWidth={3}/><T x={end+extension/2} y={y+105} size={23} color={ink.c1}>{b.extension??'ΔL'}</T></g>}
      <T x={x+len/2} y={y-40} size={20} color={ink.c3}>{two?`قضيب ${b.mode==='pair'?(index?'B':'A'):index+1}`:(b.material??b.area??'A') }</T>
    </g>;
  };
  return <g>
    {rod(two?55:105,b.stretch??0,0)}
    {two&&rod(245,b.second??0,1)}
    {b.mode==='spring'&&<g><Wall x={60} y={235} h={65}/><Spring x1={60} y1={267} x2={320} y2={267} coils={10} amp={17} color={ink.c1}/><Arrow x1={325} y1={267} x2={410} y2={267}/><T x={230} y={320} size={22}>نفس علاقة القوة والاستطالة</T></g>}
    {b.mode==='restore'&&<g><Arrow x1={270} y1={260} x2={130} y2={260} color={ink.c3}/><T x={200} y={300} size={21}>قوة الاسترجاع</T><Arrow x1={285} y1={225} x2={410} y2={225} color={ink.c1}/><T x={360} y={195} math>x</T></g>}
    {!two&&!b.mode&&<T x={230} y={290} size={19} color={ink.muted}>الاستطالة مكبّرة للتوضيح</T>}
  </g>;
}

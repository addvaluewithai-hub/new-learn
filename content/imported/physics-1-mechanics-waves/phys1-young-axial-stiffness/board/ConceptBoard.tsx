import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {VisualProps} from '@learn/lesson-runtime';
import {fontFaces,palette,uiFont} from './mathkit';
import {Defs,Eq,T,ink} from './parts';
import {beats,type Beat} from './beats';
import {Diagram} from './diagrams';

function questionBeat(scene:string, feedback:boolean, arabic:boolean, step:number):Beat {
  if(scene==='S07')return {
    caption:feedback?(arabic?['','حوّل الاستطالة للمتر','الإجهاد: قوة على مساحة','الانفعال: استطالة على طول أصلي','معامل يونج: إجهاد على انفعال','الصلابة: قوة على استطالة'][step]:'Model answer — after your attempt'):(arabic?'احسب الإجهاد والانفعال ومعامل يونج والصلابة':'Calculate stress, strain, Y and k'),
    force:'400 N',length:'0.80 m',area:'4 × 10⁻⁴ m²',extension:'0.40 mm',stretch:25,
    rows:feedback?(arabic?[
      ['ΔL = 0.40\\ \\t{mm}', 'ΔL = 0.00040\\ \\t{m}'],
      ['σ = \\f{F}{A}', 'σ = \\f{400}{4×10^{-4}}', '\\box{σ = 10^{6}\\ \\t{Pa}}'],
      ['ε = \\f{ΔL}{L₀}', 'ε = \\f{0.00040}{0.80}', '\\box{ε = 5×10^{-4}}'],
      ['Y = \\f{σ}{ε}', 'Y = \\f{10^{6}}{5×10^{-4}}', '\\box{Y = 2×10^{9}\\ \\t{Pa}}'],
      ['k = \\f{F}{ΔL}', 'k = \\f{400}{0.00040}', '\\box{k = 10^{6}\\ \\t{N/m}}'],
    ][Math.max(0,step-1)]:[ 'σ = 10^{6}\\ \\t{Pa}', 'ε = 5×10^{-4}', 'Y = 2×10^{9}\\ \\t{Pa}', 'k = 10^{6}\\ \\t{N/m}' ]):[
      'A = 4×10^{-4}\\ \\t{m²}', 'ΔL = 0.40\\ \\t{mm}', 'σ = ? \\q ε = ?', 'Y = ? \\q k = ?',
    ],
  };
  return {
    caption:feedback?(arabic?'نفس المادة… اختلاف الأبعاد يغيّر صلابة العنصر':'Model answer — after your attempt'):(arabic?'نفس المادة والمقطع والقوة — قارن الاستجابة':'Same material, area and force'),
    mode:'pair',long:true,stretch:feedback?20:0,second:feedback?40:0,
    rows:feedback?(arabic?['ΔL ∝ L₀ → ΔLʙ = 2ΔLᴀ','Yᴀ = Yʙ','k = \\f{YA}{L₀} → kᴀ = 2kʙ']:['ΔLʙ = 2ΔLᴀ','Yᴀ = Yʙ','kᴀ = 2kʙ']):['Lʙ = 2Lᴀ','ΔLʙ : ΔLᴀ = ?','Yʙ : Yᴀ = ?','kʙ : kᴀ = ?'],
  };
}
export default function ConceptBoard(props:VisualProps){
  const {frame,fps,recording}=props;
  const scene=String(props.spec.params.scene??'');
  const feedback=props.phase==='feedback';
  // Reading steps are the same public contract used by new-learn; cues handle later audio.
  const now=frame*1000/fps;
  const active=recording.cues.filter(c=>c.atMs<=now);
  const current=active.at(-1)?.id??'';
  const isQuestion=scene==='S07'||scene==='S08';
  const index=Math.max(0,(beats[scene]??[]).findIndex((_,i)=>current===`${scene}-U${i+1}`));
  const arabic=/A0[1-5]$/.test(current);
  const feedbackStep=arabic?Number(current.slice(-1)):0;
  const b=isQuestion?questionBeat(scene,feedback,arabic,feedbackStep):beats[scene]?.[index];
  if(!b)throw new Error(`Missing Physics 802 scene ${scene}`);
  const P=props.layout==='portrait';
  return <AbsoluteFill style={{background:palette.bg,fontFamily:uiFont,color:palette.ink,overflow:'hidden'}}>
    <style>{fontFaces(props.spec.params.assetBase)}</style>
    <svg role="img" aria-label={b.caption} viewBox={P?'0 0 540 960':'0 0 960 540'} style={{width:'100%',height:'100%'}}>
      <Defs/>
      <T x={P?270:480} y={P?55:36} size={P?29:27}>{String(props.spec.params.heading??'معامل يونج')}</T>
      <g transform={P?'translate(40 115)':'translate(15 85)'}><Diagram b={b}/></g>
      {b.rows.map((src,i)=><Eq key={i} x={P?20:500} y={(P?480:95)+i*(P?(b.rows.length>3?95:112):(b.rows.length>3?88:110))} w={P?500:440} h={P?110:100} src={src} size={P?(b.rows.length>3?34:42):(b.rows.length>3?32:36)}/>)}
      <foreignObject x={P?25:35} y={P?890:468} width={P?490:890} height={P?65:60}><div dir="rtl" style={{color:ink.c1,fontSize:P?23:24,textAlign:'center',lineHeight:1.4}}>{b.caption}</div></foreignObject>
    </svg>
  </AbsoluteFill>;
}

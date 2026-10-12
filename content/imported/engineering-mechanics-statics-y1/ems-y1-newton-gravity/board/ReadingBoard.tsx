import {AbsoluteFill} from 'remotion';
import type {VisualProps} from '@learn/lesson-runtime';
import ForceDiagram from './ForceDiagram';
import Models from './Models';
import ConceptMap from './ConceptMap';
import {Cart,Drawing,Arrow,Label,has,entry,palette,type Motion,type Plan} from './motion';
import {Equation,Written,fontFaces,uiFont} from './Notation';

// Green: selected quantity/forward force; rust: opposing force/contact detail.
// Ink: bodies and symbols; muted: context. Every colour has a label or position.
const forces=new Set(['supported','balancedcart','drag','doorforce','vector','interaction','wall']);
const models=new Set(['overview','idealization','particle','rigid','contact','bodyload','gravity','inverse','orbit']);
const generic=new Set(['quantities','branches','mass','massforce','samequantity','fps','derived','foundationrecap','newtonrecap','unitrecap']);
function Acceleration({p}:{p:Motion}){
 const changed=has(p,'change'),done=has(p,'accel'),heavier=has(p,'check');
 return <Drawing p={p} label={heavier?'Same force on twice the mass: speed increases by one meter per second in one second':'Speed changes from zero to two meters per second in one second'}>
  <Cart p={p} x={90} y={165}/><Cart p={p} x={455} y={165}/>
  <Label p={p} x={160} y={122}>0 m/s</Label><Label p={p} x={525} y={122}>{heavier?'1 m/s':'2 m/s'}</Label>
  <path d="M245 200 H425" stroke={palette.line} strokeWidth={3}/>
  <Arrow x1={510} y1={85} x2={620} y2={85}/>
  <Label p={p} x={340} y={305}>{has(p,'check')?'كتلة أكبر: التسارع أقل':done?'2 m/s²':changed?'التغيّر خلال ثانية واحدة':'بعد ثانية واحدة'}</Label>
 </Drawing>;
}
function Ruler({p}:{p:Motion}){
 return <Drawing p={p} label="One length stays unchanged when its unit changes">
  <rect x={85} y={142} width={530} height={72} rx={5} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/>
  {Array.from({length:17},(_,i)=><path key={i} d={`M${101+i*31} 143 v${i%4?20:38}`} stroke={palette.green} strokeWidth={2}/>)}
  <path d="M85 100 H615 M85 89 V112 M615 89 V112" stroke={palette.ink} strokeWidth={2}/>
  <Label p={p} x={350} y={290}>{p.plan.kind==='measure'?'طول يحتاج وحدة':'نفس الطول قبل التحويل وبعده'}</Label>
 </Drawing>;
}
function QuantityPicture({p}:{p:Motion}){
 if(p.plan.kind==='weightlaw')return <Drawing p={p} label="Earth attracts the body downward" viewBox="200 0 300 240">
  <circle cx={350} cy={174} r={58} fill={palette.wash} stroke={palette.green} strokeWidth={3}/>
  <rect x={324} y={15} width={52} height={44} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/>
  <Arrow x1={350} y1={65} x2={350} y2={124}/><Label p={p} x={350} y={190}>الأرض</Label>
 </Drawing>;
 return <Drawing p={p} label="Cart with given mass; acceleration is to the right" viewBox="240 95 300 210">
  <Cart p={p}/>{has(p,'accel')?<Arrow x1={338} y1={132} x2={476} y2={132}/>:null}
 </Drawing>;
}
function Calculation({p}:{p:Motion}){
 const beats=p.plan.beats,now=beats.filter(b=>has(p,b.key)).at(-1)!;
 const portrait=p.layout==='portrait';
 const convert=['lengthcalc','forceconvert','reverseconvert'].includes(p.plan.kind);
 const given=beats.find(b=>b.key==='given'),factor=beats.find(b=>b.key==='factor');
 const show=has(p,'product')||has(p,'cancel');
 if(convert&&!show){
  const fraction=has(p,'fraction'),ratio=has(p,'ratio');
  if(fraction||ratio)return <div style={{height:'100%',display:'grid',alignContent:'center',gap:portrait?40:26}}>
   <Equation text={factor?.math??''} size={portrait?33:29} color={palette.muted}/>
   <div dir="rtl" style={{display:'grid',justifyItems:'center',gap:18}}>
    <div style={{fontSize:portrait?27:24}}>البسط: نفس الطول بالمتر</div>
    <Equation text={ratio?'0.3048 m/1 ft = 1':'0.3048 m/1 ft'} size={portrait?49:45} color={palette.green}/>
    <div style={{fontSize:portrait?27:24}}>المقام: نفس الطول بالقدم</div>
   </div>
  </div>;
  const ruler=p.plan.kind==='lengthcalc'||p.plan.kind==='reverseconvert';
  const initial=beats.filter(b=>['given','factor'].includes(b.key));
  return <div style={{height:'100%',display:'grid',alignContent:'center',gap:portrait?26:16}}>
   {ruler&&<div style={{height:portrait?270:190}}><Ruler p={p}/></div>}
   {initial.map(b=><div key={b.id} style={{visibility:has(p,b.key)?'visible':'hidden'}}>
    <Equation text={b.math} size={portrait?44:34} color={b.id===now.id?palette.ink:palette.muted}/>
   </div>)}
  </div>;
 }
 if(convert&&show){
  const reverse=p.plan.kind==='reverseconvert',force=p.plan.kind==='forceconvert';
  const old=reverse?'m':force?'lbf':'ft',next=reverse?'ft':force?'N':'m';
  const value=reverse?'0.9144':force?'10':'5';
  const numerator=reverse?'1':force?'4.448':'0.3048',denominator=reverse?'0.3048':'1';
  const strike=has(p,'cancel')||reverse&&has(p,'product');
  const unit=(s:string)=><span style={{color:palette.green,textDecoration:strike&&s===old?'line-through':undefined,textDecorationColor:palette.orange,textDecorationThickness:3}}>{s}</span>;
  return <div style={{display:'grid',alignContent:'center',gridTemplateRows:'70px 120px 90px',gap:22,width:'100%',height:'100%'}}>
   {factor?.math&&<Equation text={factor.math} size={portrait?30:28} color={palette.muted}/>}
   <div dir="ltr" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:14,fontSize:portrait?41:42,fontFamily:'STIX Two Text,serif'}}>
    <span>{value} {unit(old)}</span><span>×</span>
    <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',lineHeight:1.35}}>
     <span style={{borderBottom:`2px solid ${palette.ink}`,padding:'0 10px'}}>{numerator} {unit(next)}</span>
     <span>{denominator} {unit(old)}</span>
    </span>
   </div>
   <div style={{visibility:has(p,'result')?'visible':'hidden'}}><Equation text={beats.find(b=>b.key==='result')?.math??''} size={portrait?54:50} color={palette.green}/></div>
  </div>;
 }
 const items=beats.filter(b=>b.math&&(!convert||has(p,b.key)));
 const ruler=p.plan.kind==='lengthcalc'||p.plan.kind==='reverseconvert';
 return <div style={{width:'100%',height:'100%',display:'grid',alignContent:'center',gridTemplateRows:ruler?`${portrait?270:190}px repeat(${items.length},minmax(36px,auto))`:undefined,gridAutoRows:'minmax(36px,auto)',gap:portrait?16:items.length>6?6:10}}>
  {['weightlaw','forcecalc'].includes(p.plan.kind)&&<div style={{height:portrait?190:95}}><QuantityPicture p={p}/></div>}
  {ruler&&<div style={{height:portrait?270:190}}><Ruler p={p}/></div>}
  {items.map(b=><div key={b.id} data-beat={b.key} style={{...entry(p,b.key),padding:items.length>6&&!portrait?'2px':'4px',visibility:has(p,b.key)?'visible':'hidden',opacity:b.id===now.id?1:.65}}>
   <Equation text={b.math} size={portrait?(b.math.length>24?33:44):(items.length>6?26:b.math.length>24?27:34)} color={b.key==='result'?palette.green:palette.ink}/>
  </div>)}
  {!items.length&&given?.math&&<Equation text={given.math}/>} 
 </div>;
}
export default function ReadingBoard(props:VisualProps){
 const plan=props.spec.params as unknown as Plan,p:Motion={...props,plan};
 const portrait=props.layout==='portrait',visible=plan.beats.filter(b=>has(p,b.key)),beat=visible.at(-1);
 const question=props.phase==='question-reading',feedback=props.phase==='feedback';
 const parts=question||feedback?props.reading?.steps.map(step=>({...step,language:/[\u0600-\u06ff]/.test(step.text)?'ar':'en'})):undefined;
 const shown=parts?.filter(part=>props.frame*1000/props.fps>=part.atMs)??[];
 const diagram=forces.has(plan.kind)||models.has(plan.kind)||['firstlaw','measure','prompt','acceleration'].includes(plan.kind);
 return <AbsoluteFill data-board-composition="single" data-board-phase={question?'question-reading':feedback?'feedback':'teaching'} style={{background:palette.paper,color:palette.ink,fontFamily:uiFont,padding:portrait?'32px 30px':'24px 38px',boxSizing:'border-box',display:'flex',flexDirection:'column',gap:portrait?22:12,overflow:'hidden'}}>
  <style>{fontFaces(props.spec.params.assetBase)}</style>
  <header style={{height:portrait?110:78,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div data-safe-element dir="rtl" style={{fontSize:portrait?32:29,fontWeight:600,lineHeight:1.45,textAlign:'center'}}>{question?'اقرأ المسألة ثم حاول':feedback?beat?.label:beat?.label??plan.heading}</div>
  </header>
  {question?<div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:26}}>
   {shown.map((part,i)=><div data-safe-element key={i} dir={part.language==='ar'?'rtl':'ltr'} style={{fontSize:portrait?26:27,lineHeight:1.7,padding:'10px 0'}}><Written text={part.text}/></div>)}
  </div>:feedback?<div style={{flex:1,display:'grid',alignContent:'center',gap:portrait?35:22}}>
   {beat?.math&&<Equation text={beat.math} size={portrait?(beat.math.length>28?32:44):40} color={palette.green}/>}
   <div data-safe-element dir={shown.at(-1)?.language==='ar'?'rtl':'ltr'} style={{fontSize:portrait?28:28,lineHeight:1.8,textAlign:shown.at(-1)?.language==='ar'?'right':'left'}}><Written text={shown.at(-1)?.text??''}/></div>
  </div>:generic.has(plan.kind)?<div style={{flex:1,minHeight:0}}><ConceptMap p={p}/></div>:diagram?<>
   <div style={{height:portrait?560:beat?.math?290:345,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
    {forces.has(plan.kind)?<ForceDiagram p={p}/>:models.has(plan.kind)?<Models p={p}/>:plan.kind==='acceleration'?<Acceleration p={p}/>:plan.kind==='measure'?<Ruler p={p}/>:<ConceptMap p={p}/>} 
   </div>
   <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>{beat?.math?<Equation text={beat.math} size={portrait?(beat.math.length>24?32:44):36} color={palette.green}/>:null}</div>
  </>:<div style={{flex:1,minHeight:0}}><Calculation p={p}/></div>}
 </AbsoluteFill>;
}

import {Equation} from './Notation';
import {Arrow,Cart,Drawing,Label,Reveal,has,entry,onset,palette,type Motion} from './motion';
function Glyph({kind,height=54}:{kind:string;height?:number}){
 const c=palette.green;
 return <svg viewBox="0 0 160 88" style={{width:'100%',height}} aria-hidden="true" fill="none" stroke={c} strokeWidth={3}>
 {kind==='length'?<><path d="M15 36 H145 V69 H15 Z"/>{[30,50,70,90,110,130].map((x,i)=><path key={x} d={`M${x} 36 v${i%2?13:23}`}/>)}</>:
 kind==='time'?<><circle cx={80} cy={45} r={32}/><path d="M80 22 V45 L98 55"/></>:
 kind==='mass'?<><path d="M43 72 L51 30 H109 L117 72 Z"/><path d="M68 29 V19 Q80 8 92 19 V29"/></>:
 kind==='force'||kind==='newton'||kind==='inertia'||kind==='accel'?<Arrow x1={25} y1={45} x2={137} y2={45}/>:
 kind==='statics'||kind==='rest'?<><path d="M30 71 H130 M54 70 V26 H106 V70"/></>:
 kind==='dynamics'||kind==='moving'?<><path d="M40 65 H100 V28 H40 Z M10 36 H29 M5 51 H29"/><Arrow x1={106} y1={47} x2={148} y2={47}/></>:
 kind==='cancel'?<><path d="M29 23 L63 62 M29 62 L63 23" stroke={palette.orange}/><Arrow x1={85} y1={44} x2={137} y2={44}/></>:
 kind==='model'?<><circle cx={55} cy={46} r={28}/><path d="M104 19 V74 M104 19 H139"/></>:
 <><circle cx={80} cy={45} r={30}/><path d="M65 44 L76 55 L99 32"/></>}
 </svg>;
}
export default function ConceptMap({p}:{p:Motion}){
 const k=p.plan.kind,portrait=p.layout==='portrait';
 if(k==='firstlaw'){
  const age=Math.max(0,p.frame-onset(p,'moving')*p.fps/1000),x=p.reducedMotion?360:290+Math.min(age,120)*1.1;
  return <Drawing p={p} label="Zero resultant allows rest or straight line motion with constant velocity">
   <Reveal p={p} at="rest"><Cart p={p} x={102} y={166}/><Label p={p} x={172} y={122}>ساكن</Label><path d="M76 270 H266" stroke={palette.line} strokeWidth={2}/></Reveal>
   <Reveal p={p} at="moving"><Cart p={p} x={x} y={166}/><Arrow x1={x+60} y1={96} x2={x+171} y2={96}/><Label p={p} x={445} y={320}>سرعة واتجاه ثابتان</Label><path d="M293 270 H650" stroke={palette.line} strokeWidth={2}/></Reveal>
  </Drawing>;
 }
 if(k==='measure')return <Drawing p={p} label="A beam marked 4 needs a length unit; mass and weight are different quantities">
  <Reveal p={p} at="body"><rect x={82} y={142} width={536} height={66} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M82 105 H618 M82 95 V117 M618 95 V117" stroke={palette.green} strokeWidth={2}/><Label p={p} x={350} y={79}>4</Label></Reveal>
  <Reveal p={p} at="units"><Label p={p} x={350} y={281}>m  /  ft ?</Label></Reveal>
  <Reveal p={p} at="weight"><Label p={p} x={350} y={331} color={palette.orange}>Mass or weight?</Label></Reveal>
 </Drawing>;
 if(k==='prompt')return <Drawing p={p} label="A body changes speed; branch choice is left unanswered">
  <Reveal p={p} at="body"><Cart p={p}/><Arrow x1={130} y1={109} x2={232} y2={109}/><Arrow x1={306} y1={109} x2={541} y2={109}/></Reveal>
  <Reveal p={p} at="question"><Label p={p} x={350} y={330}>?</Label></Reveal>
 </Drawing>;
 const recap=k.endsWith('recap');
 const selected=p.plan.beats.filter(b=>has(p,b.key)&&(!recap||b.key!=='next'));
 const tiled=recap||['quantities','fps','derived','branches','mass','massforce','samequantity'].includes(k);
 const visible=p.plan.beats.filter(b=>!recap||b.key!=='next');
 return <div data-concept-map={k} role="img" aria-label={p.plan.heading} style={{height:'100%',display:'grid',gridTemplateColumns:tiled?(portrait?'1fr 1fr':visible.length>4?'1fr 1fr 1fr':'1fr 1fr'):'1fr',gridAutoRows:'1fr',alignContent:'center',minHeight:0,gap:portrait?18:12}}>
 {visible.map(b=><div key={b.id} data-beat={b.key} style={{...entry(p,b.key),visibility:has(p,b.key)?'visible':'hidden',display:'flex',flexDirection:tiled?'column':'row',alignItems:'center',justifyContent:'center',gap:portrait?14:8,padding:portrait?'20px 14px':'14px 18px',background:palette.wash,borderRadius:10,border:`1px solid ${palette.line}`,minHeight:0,minWidth:0}}>
  {!recap&&<div style={{width:tiled?'70%':80,flexShrink:0}}><Glyph kind={b.key} height={portrait?62:42}/></div>}
  <div style={{textAlign:'center'}}><div dir="rtl" style={{fontSize:portrait?25:22,fontWeight:550,lineHeight:1.45}}>{b.label}</div>{b.math&&<div dir="ltr" style={{fontSize:portrait?(b.math.length>14?29:40):(b.math.length>14?24:30),fontWeight:650,lineHeight:1.5,color:palette.green,unicodeBidi:'isolate'}}><Equation text={b.math} unitContext={b.key==='length'} size={portrait?(b.math.length>14?29:40):(b.math.length>14?24:30)} color={palette.green}/></div>}</div>
 </div>)}
 </div>;
}

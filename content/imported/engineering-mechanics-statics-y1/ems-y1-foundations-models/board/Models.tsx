import {Arrow,Drawing,Ground,Label,Reveal,has,palette,progress,type Motion} from './motion';
import {Equation} from './Notation';
export default function Models({p}:{p:Motion}){
 const k=p.plan.kind;
 if(k==='overview'&&p.layout==='portrait')return <Drawing p={p} label="Bridge, door and box arranged vertically for the phone" viewBox="0 0 540 710">
  <Reveal p={p} at="bridge"><path d="M110 160 H430 M135 160 V220 M405 160 V220 M135 160 L270 75 L405 160 M135 160 H215 L270 75 L325 160 H405" fill="none" stroke={palette.ink} strokeWidth={3}/><rect x={228} y={130} width={84} height={26} fill={palette.green}/><circle cx={244} cy={160} r={9} fill={palette.ink}/><circle cx={296} cy={160} r={9} fill={palette.ink}/><Label p={p} x={270} y={262}>كوبري يحمل عربيات</Label></Reveal>
  <Reveal p={p} at="door"><path d="M202 300 H338 V465 H202 Z M202 306 L315 324 V452 L202 465 Z" fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><circle cx={298} cy={390} r={5} fill={palette.orange}/><Arrow x1={318} y1={390} x2={414} y2={390}/><Label p={p} x={270} y={505}>باب عليه قوة زق</Label></Reveal>
  <Reveal p={p} at="box"><rect x={175} y={555} width={190} height={78} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M150 638 H390" stroke={palette.ink} strokeWidth={3}/><Label p={p} x={270} y={682}>صندوق ساكن</Label></Reveal>
 </Drawing>;
 if(k==='overview')return <Drawing p={p} label="Bridge, door and stationary box: three physical situations">
  <Reveal p={p} at="bridge"><path d="M48 205 H228 M65 205 V275 M212 205 V275 M65 205 L138 123 L212 205 M65 205 L110 205 L138 123 L169 205 L212 205" stroke={palette.ink} strokeWidth={3} fill="none"/><path d="M102 185 H162 V203 H102 Z" fill={palette.green}/><circle cx={113} cy={203} r={7} fill={palette.ink}/><circle cx={152} cy={203} r={7} fill={palette.ink}/><Label p={p} x={138} y={319}>كوبري</Label></Reveal>
  <Reveal p={p} at="door"><path d="M285 100 H427 V278 H285 Z M285 110 L399 130 V268 L285 278 Z" stroke={palette.ink} fill={palette.wash} strokeWidth={3}/><circle cx={380} cy={202} r={5} fill={palette.orange}/><Arrow x1={402} y1={202} x2={462} y2={202}/><Label p={p} x={355} y={319}>باب</Label></Reveal>
  <Reveal p={p} at="box"><path d="M492 190 H634 V275 H492 Z" stroke={palette.ink} fill={palette.wash} strokeWidth={3}/><path d="M474 279 H652" stroke={palette.ink} strokeWidth={2}/><Label p={p} x={563} y={319}>صندوق</Label></Reveal>
 </Drawing>;
 if(['gravity','inverse','orbit'].includes(k)){
  if(k==='inverse')return <Drawing p={p} label="Same masses: double distance gives one quarter of the force">
   {[['body',1,'r','F'],['double',2,'2r','F/4'],has(p,'guided')?['guided',4,'4r','F/16']:['triple',3,'3r','F/9']].map(([key,n,r,f],i)=> <Reveal key={String(key)} p={p} at={String(key)}>
    <circle cx={70} cy={70+i*110} r={19} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><circle cx={70+Number(n)*110} cy={70+i*110} r={19} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/>
    <path d={`M70 ${101+i*110} H${70+Number(n)*110}`} stroke={palette.muted} strokeWidth={2}/><Label p={p} x={70+Number(n)*55} y={93+i*110}>{r}</Label>
    {has(p,i===0?'body':i===1?'quarter':key==='guided'?'guided':'result')&&<><rect x={570} y={66+i*110} width={85/(Number(n)**2)} height={8} fill={palette.green}/><foreignObject x={555} y={i*110} width={140} height={66}><Equation text={String(f)} size={p.layout==='portrait'?32:25}/></foreignObject></>}
   </Reveal>)}
  </Drawing>;
  if(k==='orbit')return <Drawing p={p} label="Gravity toward Earth in orbit; apparent weightlessness is related to free fall">
   <Reveal p={p} at="body"><circle cx={245} cy={221} r={92} fill={palette.wash} stroke={palette.green} strokeWidth={3}/><path d="M181 172 q55 26 48 60 t73 55 M245 132 q30 23 56 9" fill="none" stroke={palette.green} strokeWidth={2}/><ellipse cx={245} cy={221} rx={210} ry={125} fill="none" stroke={palette.line} strokeDasharray="8 8"/><circle cx={437} cy={172} r={23} fill={palette.paper} stroke={palette.ink} strokeWidth={3}/><path d="M411 194 L431 238 L462 222 L457 190" fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><Label p={p} x={245} y={238}>الأرض</Label></Reveal>
   <Reveal p={p} at="force"><Arrow x1={422} y1={189} x2={337} y2={215} color={palette.orange} t={progress(p,'force')}/><Label p={p} x={531} y={130}>جاذبية موجودة</Label></Reveal>
   <Reveal p={p} at="result"><Label p={p} x={531} y={287}>سقوط معًا</Label></Reveal>
  </Drawing>;
  return <Drawing p={p} label="Mutual gravitational attraction and center-to-center distance">
   <Reveal p={p} at="body"><circle cx={138} cy={181} r={has(p,'center')?76:47} fill={palette.wash} stroke={palette.green} strokeWidth={3}/><circle cx={560} cy={181} r={has(p,'massnames')?32:47} fill="#efe0d3" stroke={palette.orange} strokeWidth={3}/><Label p={p} x={138} y={190}>{has(p,'center')?'الأرض':has(p,'massnames')?'m₁':'جسم 1'}</Label><Label p={p} x={560} y={193}>{has(p,'massnames')?'m₂':'جسم 2'}</Label></Reveal>
   <Reveal p={p} at="force"><Arrow x1={225} y1={181} x2={320} y2={181} t={progress(p,'force')}/><Arrow x1={505} y1={181} x2={410} y2={181} color={palette.orange} t={progress(p,'force')}/><Label p={p} x={355} y={130}>جذب</Label></Reveal>
   <Reveal p={p} at="distance"><path d="M138 248 V294 M560 225 V294 M138 284 H560" stroke={palette.muted} strokeWidth={2} fill="none"/><Label p={p} x={349} y={329}>{has(p,'distanceword')?'r':'المسافة'}</Label></Reveal>
   
   <Reveal p={p} at="center"><circle cx={138} cy={181} r={5} fill={palette.ink}/><path d="M138 181 V284" stroke={palette.muted} strokeDasharray="6 6"/></Reveal>
  </Drawing>;
 }
 if(k==='particle')return <Drawing p={p} label="A small camera moves along a crane path; the particle keeps mass while dimensions are ignored">
  <Reveal p={p} at="body"><rect x={94} y={156} width={110} height={90} rx={10} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><circle cx={149} cy={197} r={20} fill={palette.paper} stroke={palette.green} strokeWidth={3}/><Label p={p} x={149} y={295}>كتلة موجودة</Label></Reveal>
  <Reveal p={p} at="sensor"><path d="M94 153 V92 H650 M150 93 V152" stroke={palette.ink} strokeWidth={3} fill="none"/><path d="M70 94 L96 58 L122 94" stroke={palette.ink} fill="none" strokeWidth={3}/></Reveal>
  <Reveal p={p} at="path"><path d="M215 203 H574" stroke={palette.muted} strokeWidth={2} strokeDasharray="8 7"/><Arrow x1={251} y1={203} x2={399} y2={203}/></Reveal>
  <Reveal p={p} at="path"><circle cx={574} cy={203} r={12} fill={palette.orange}/><Label p={p} x={565} y={292}>نقطة لها كتلة</Label></Reveal>
 </Drawing>;
 if(k==='rigid')return <Drawing p={p} label="Rigid member: distances between points A and B are preserved">
  <Reveal p={p} at="body"><path d="M131 245 V125 H557 V164 H168 V245 Z" fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M113 116 V264" stroke={palette.muted} strokeWidth={4}/></Reveal>
  <Reveal p={p} at="distance"><circle cx={218} cy={145} r={7} fill={palette.orange}/><circle cx={502} cy={145} r={7} fill={palette.orange}/><path d="M218 137 V82 M502 137 V82 M218 95 H502" stroke={palette.green} strokeWidth={2}/><Label p={p} x={218} y={219}>أ</Label><Label p={p} x={502} y={219}>ب</Label><Label p={p} x={359} y={66}>مسافة ثابتة</Label></Reveal>
  <Reveal p={p} at="check"><path d="M168 267 Q380 315 557 269" fill="none" stroke={palette.orange} strokeWidth={3} strokeDasharray="7 7"/></Reveal>
 </Drawing>;
 if(k==='contact'||k==='bodyload')return <Drawing p={p} label="Distributed contact load represented by a concentrated resultant for overall analysis">
  <Reveal p={p} at={k==='contact'?'distributed':'body'}><rect x={64} y={202} width={570} height={44} rx={3} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M104 251 L84 283 H124 Z M594 251 L574 283 H614 Z" fill="none" stroke={palette.muted} strokeWidth={2}/></Reveal>
  <Reveal p={p} at="distributed">{[256,286,316,346,376].map(x=><Arrow key={x} x1={x} y1={80} x2={x} y2={192} color={palette.orange} t={progress(p,'distributed')}/>)}<path d="M240 80 H392" stroke={palette.orange} strokeWidth={2}/></Reveal>
  <Reveal p={p} at={k==='contact'?'model':'force'}><rect x={218} y={54} width={196} height={144} fill={palette.paper}/><Arrow x1={316} y1={78} x2={316} y2={195} t={progress(p,k==='contact'?'model':'force')}/><Label p={p} x={424} y={103}>قوة المسمار</Label></Reveal>
  {k==='bodyload'&&<Reveal p={p} at="model"><Label p={p} x={350} y={334} size={p.layout==='portrait'?30:25}>{has(p,'force')?'جسم جاسئ · قوة مركزة':'جسم جاسئ'}</Label></Reveal>}
  <Reveal p={p} at="check"><Label p={p} x={350} y={334} color={palette.orange}>الضغط المحلي يحتاج التوزيع</Label></Reveal>
 </Drawing>;
 return <Drawing p={p} label="An engineering model keeps the details needed by the question">
  <Reveal p={p} at="body"><path d="M85 238 V118 H219 V148 H115 V238 Z" fill={palette.wash} stroke={palette.ink} strokeWidth={3}/>{[145,185].map(x=><circle key={x} cx={x} cy={133} r={5} fill={palette.orange}/>)}<Label p={p} x={155} y={310}>جسم حقيقي</Label></Reveal>
  <Reveal p={p} at="model"><Arrow x1={274} y1={184} x2={398} y2={184} t={progress(p,'model')}/><path d="M458 240 V131 H605" fill="none" stroke={palette.green} strokeWidth={6}/><Label p={p} x={536} y={310}>نموذج مبسط</Label></Reveal>
 </Drawing>;
}

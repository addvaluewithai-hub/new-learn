import {Arrow,Cart,Drawing,Ground,Label,palette,Reveal,progress,has,type Motion} from './motion';
export default function ForceDiagram({p}:{p:Motion}){
 const k=p.plan.kind,supported=k==='supported',door=k==='doorforce'||k==='vector';
 const bodyKey=p.plan.beats.some(b=>b.key==='body')?'body':p.plan.beats[0].key;
 if(k==='interaction'||k==='wall')return <Drawing p={p} viewBox={k==='interaction'?'0 0 700 420':'0 0 700 360'} label="Separate bodies: each interaction force acts on a different body">
  <Reveal p={p} at={bodyKey}>
   <rect x={100} y={138} width={176} height={104} rx={12} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/>
   <rect x={424} y={138} width={176} height={104} rx={k==='wall'?0:12} fill="#eee4d4" stroke={palette.ink} strokeWidth={3}/>
   <Label p={p} x={188} y={200}>{k==='wall'?'يد':'A'}</Label><Label p={p} x={512} y={200}>{k==='wall'?'حائط':'B'}</Label>
  </Reveal>
  <Reveal p={p} at="right"><Arrow x1={432} y1={95} x2={570} y2={95} t={progress(p,'right')}/><Label p={p} x={512} y={68}>{k==='wall'?'قوة على الحائط':'قوة على B'}</Label><path d="M500 105 V133" stroke={palette.green} strokeDasharray="5 5"/></Reveal>
  <Reveal p={p} at="left"><Arrow x1={266} y1={290} x2={128} y2={290} color={palette.orange} t={progress(p,'left')}/><Label p={p} x={188} y={338} color={palette.orange}>{k==='wall'?'قوة على اليد':'قوة على A'}</Label><path d="M200 280 V250" stroke={palette.orange} strokeDasharray="5 5"/></Reveal>
  {k==='interaction'&&<Reveal p={p} at="result"><Label p={p} x={350} y={398}>قوتان على جسمين مختلفين</Label></Reveal>}
 </Drawing>;
 if(door)return <Drawing p={p} label="Force on a door: magnitude, direction and application point appear separately">
  {!has(p,'body')&&<Reveal p={p} at="length"><path d="M120 172 H580 V232 H120 Z M142 232 V292 M558 232 V292" fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M120 130 H580 M120 120 V142 M580 120 V142" stroke={palette.green} strokeWidth={3}/><Label p={p} x={350} y={105}>2 m</Label></Reveal>}
  <Reveal p={p} at="body"><path d="M242 74 H432 V293 H242 Z" fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M242 100 v26 M242 240 v26" stroke={palette.muted} strokeWidth={8}/><circle cx={406} cy={195} r={5} fill={palette.ink}/>{k==='doorforce'&&<Label p={p} x={337} y={53}>30 N</Label>}</Reveal>
  <Reveal p={p} at="force"><Arrow x1={402} y1={195} x2={588} y2={195} t={progress(p,'force')}/><Label p={p} x={552} y={156}>اتجاه الزق</Label></Reveal>
  <Reveal p={p} at="point"><circle cx={402} cy={195} r={10} fill={palette.orange}/><circle cx={402} cy={195} r={22} fill="none" stroke={palette.orange} strokeWidth={2}/><path d="M402 217 v57 h110" fill="none" stroke={palette.orange} strokeWidth={2}/><Label p={p} x={520} y={317} color={palette.orange}>موضع الزق</Label></Reveal>
 </Drawing>;
 return <Drawing p={p} label={supported?'Gravity and surface support on one box':'Horizontal forces on one cart'}>
  <Reveal p={p} at={bodyKey}>{supported?<><Ground/><rect x={267} y={169} width={166} height={105} rx={4} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/><path d="M282 189 h20 v20" stroke={palette.line} fill="none" strokeWidth={2}/></>:<><Ground/><Cart p={p} label={k==='secondlaw'?'m':undefined}/></>}</Reveal>
  <Reveal p={p} at="down"><Arrow x1={350} y1={220} x2={350} y2={338} color={palette.orange} t={progress(p,'down')}/><Label p={p} x={472} y={329} color={palette.orange}>جذب الأرض</Label></Reveal>
  <Reveal p={p} at="up"><Arrow x1={350} y1={220} x2={350} y2={102} t={progress(p,'up')}/><Label p={p} x={472} y={117}>دعم السطح</Label></Reveal>
  <Reveal p={p} at="right"><Arrow x1={420} y1={214} x2={615} y2={214} t={progress(p,'right')}/><Label p={p} x={536} y={172}>{k==='drag'?'دفع':p.plan.beats.find(b=>b.key==='right')?.math??'قوة'}</Label></Reveal>
  <Reveal p={p} at="left"><Arrow x1={280} y1={214} x2={k==='secondlaw'?140:85} y2={214} color={palette.orange} t={progress(p,'left')}/><Label p={p} x={160} y={172} color={palette.orange}>{k==='drag'?'مقاومة':p.plan.beats.find(b=>b.key==='left')?.math??'قوة'}</Label></Reveal>
  {k==='secondlaw'&&<Reveal p={p} at="formula"><Label p={p} x={350} y={46}>ΣF = ma</Label></Reveal>}
  {k==='drag'&&!has(p,'result')&&<Reveal p={p} at="body"><Label p={p} x={350} y={46}>سرعة ثابتة</Label></Reveal>}
  {k==='balancedcart'&&!has(p,'result')&&<Reveal p={p} at="equal"><Label p={p} x={350} y={46}>قوتان متساويتان ومتعاكستان</Label></Reveal>}
  {has(p,'result')&&<Reveal p={p} at="result"><Label p={p} x={350} y={46}>{supported?'تأثير متوازن':'محصلة صفر'}</Label></Reveal>}

 </Drawing>;
}

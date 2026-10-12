import {has,entry,palette,type Motion} from './motion';
const mathStyle={direction:'ltr' as const,unicodeBidi:'isolate' as const,fontFamily:'system-ui,sans-serif',fontVariantNumeric:'tabular-nums'};
export default function Calculations({p}:{p:Motion}){
 const k=p.plan.kind,portrait=p.layout==='portrait',convert=['lengthcalc','forceconvert','cancel'].includes(k);
 const foot=k!=='forceconvert',old=foot?'ft':'lbf',next=foot?'m':'N',value=foot?'5':'10',factor=foot?'0.3048':'4.448';
 const visible=p.plan.beats.filter(b=>has(p,b.key));
 const stage=(key:string,content:React.ReactNode)=>has(p,key)?<div data-beat={key} key={key} style={{...entry(p,key),...mathStyle}}>{content}</div>:null;
 const term=(v:string,c=palette.ink)=> <span style={{color:c}}>{v}</span>;
 const unit=(u:string)=> <span style={{color:palette.green,position:'relative',display:'inline-block',padding:'0 3px'}}>{u}{has(p,'cancel')&&<span style={{position:'absolute',left:0,right:0,top:'52%',height:3,background:palette.orange,transform:'rotate(-20deg)'}}/>}</span>;
 const size=portrait?49:44;
 return <div role="img" aria-label={p.plan.heading+' — progressively revealed worked calculation'} data-calculation={k} style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:portrait?30:22}}>
 {convert?<>
  {k!=='cancel'&&stage('factor',<div style={{fontSize:portrait?36:29,color:palette.muted}}>{foot?'1 ft = 0.3048 m':'1 lbf ≈ 4.448 N'}</div>)}
  {(has(p,'given')||has(p,'product')||k==='cancel'&&has(p,'factor'))&&<div style={{...mathStyle,fontSize:size,display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap'}}>
   <span>{k==='cancel'?'L':value} {unit(old)}</span>
   {has(p,'product')||k==='cancel'?<><span style={{color:palette.muted}}>×</span><span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',fontSize:size-6,lineHeight:1.25}}>
    <span style={{borderBottom:`2px solid ${palette.ink}`,padding:'0 12px 6px'}}>{k==='cancel'?'':factor+' '}{term(next,palette.green)}</span><span style={{paddingTop:6}}>{unit(old)}</span></span></>:null}
  </div>}
  {stage('result',<div style={{fontSize:portrait?62:56,fontWeight:650,color:palette.green,padding:'14px 24px',borderTop:`2px solid ${palette.green}`}}>{k==='cancel'?'→ m':foot?'= 1.524 m':'≈ 44.48 N'}</div>)}
 </>:<>
  <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:16}}>{visible.filter(b=>['mass','accel','force','weight'].includes(b.key)).map(b=><div key={b.id} data-beat={b.key} style={{...entry(p,b.key),...mathStyle,fontSize:portrait?36:30,color:palette.muted,padding:'14px 20px',background:palette.wash,borderRadius:8}}>{b.math}</div>)}</div>
  {visible.filter(b=>['formula','product'].includes(b.key)).map(b=>stage(b.key,<div style={{fontSize:size,fontWeight:550}}>{b.math}</div>))}
  {stage('result',<div style={{fontSize:k==='dimension'?size-7:size+8,color:palette.green,fontWeight:650,borderTop:`2px solid ${palette.green}`,padding:'16px 0'}}>{p.plan.beats.find(b=>b.key==='result')?.math}</div>)}
  {stage('detail',<div style={{fontSize:portrait?32:28,color:palette.muted}}>{p.plan.beats.find(b=>b.key==='detail')?.math}</div>)}
 </>}
 </div>;
}

import {AbsoluteFill} from 'remotion';
import {visibleQuestionParts,type VisualProps} from '@learn/lesson-runtime';
import ForceDiagram from './ForceDiagram';
import Calculations from './Calculations';
import Models from './Models';
import ConceptMap from './ConceptMap';
import {palette,has,entry,type Motion,type Plan} from './motion';
const forces=new Set(['supported','balancedcart','drag','secondlaw','doorforce','vector','interaction','wall']);
const calculations=new Set(['dimension','forcecalc','accelcalc','weightcalc','lengthcalc','forceconvert','cancel','weightlaw']);
const models=new Set(['overview','idealization','particle','rigid','contact','bodyload','gravity','inverse','orbit']);
function Scene({p}:{p:Motion}){
 if(forces.has(p.plan.kind))return <ForceDiagram p={p}/>;
 if(calculations.has(p.plan.kind))return <Calculations p={p}/>;
 if(models.has(p.plan.kind))return <Models p={p}/>;
 return <ConceptMap p={p}/>;
}
export default function ConceptBoard(props:VisualProps){
 const portrait=props.layout==='portrait',params=props.spec.params;
 const plan=params as unknown as Plan;
 const isQuestion=Boolean(props.question)&&props.phase!=='feedback',isFeedback=props.phase==='feedback';
 const p:Motion={...props,plan};
 const visible=(plan.beats??[]).filter(b=>has(p,b.key)),beat=visible.at(-1);
 const diagram=forces.has(plan.kind)||models.has(plan.kind)||['firstlaw','measure','prompt'].includes(plan.kind);
 // A spoken diagram caption replaces the neutral title on the same board.
 // Scientific notation belongs beside its body, vector or worked calculation.
 const title=isQuestion?'مسألة للتطبيق':isFeedback?'تفسير الإجابة':diagram&&beat?beat.label:plan.heading??String(params.topic??'فكّر في المسألة');
 const parts=isQuestion?visibleQuestionParts(props.question!,props.recording,props.frame,props.fps):isFeedback?(props.answer?.parts?.filter(v=>props.frame*1000/props.fps>=v.atMs)??[]):[];
 return <AbsoluteFill data-board-phase={isQuestion?'question-reading':isFeedback?'feedback':'teaching'} data-board-composition="single" style={{background:palette.paper,color:palette.ink,fontFamily:'system-ui,sans-serif',padding:portrait?'38px 30px':'32px 44px',boxSizing:'border-box',display:'flex',flexDirection:'column',gap:portrait?24:12,overflow:'hidden'}}>
  <header style={{minHeight:portrait?104:84,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div data-safe-element dir="rtl" key={diagram?beat?.id:title} style={{...(diagram&&beat?entry(p,beat.key):{}),fontSize:portrait?37:32,fontWeight:650,lineHeight:1.4,textAlign:'center',maxWidth:'100%'}}>{title}</div>
  </header>
  {isQuestion||isFeedback?<div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:portrait?18:12}}>
   <div dir="rtl" style={{fontSize:portrait?27:23,color:palette.green,fontWeight:600}}>{isFeedback?'راجع طريقة التفكير':'اقرأ · فكّر · أجب'}</div>
   {parts.map((v,i)=><div data-safe-element key={i} dir={v.language==='ar'?'rtl':'ltr'} style={{padding:portrait?'16px 20px':'12px 20px',fontSize:portrait?26:22,lineHeight:1.4,background:palette.wash,borderInlineStart:`4px solid ${palette.green}`,borderRadius:6,overflowWrap:'anywhere'}}>{v.text}</div>)}
   {!parts.length&&<div dir="rtl" style={{fontSize:portrait?30:26,color:palette.muted}}>استمع أولًا…</div>}
  </div>:<div style={{flex:1,minHeight:0,minWidth:0,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>{visible.length>0?<Scene p={p}/>:null}</div>}
 </AbsoluteFill>;
}

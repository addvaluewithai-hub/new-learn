import type {CSSProperties,ReactNode} from 'react';
import {interpolate,spring} from 'remotion';
import type {VisualProps} from '@learn/lesson-runtime';
export const palette={ink:'#163d35',green:'#17745d',orange:'#bb522f',muted:'#61746c',paper:'#f8f5ed',line:'#d4ded5',wash:'#e8efe4'};
export type Beat={id:string;key:string;label:string;math:string};
export type Plan={kind:string;heading:string;sceneId:string;beats:Beat[]};
export type Motion=VisualProps&{plan:Plan};
export function onset(p:Motion,key:string){
 const beat=p.plan.beats.find(b=>b.key===key);
 return p.recording.cues.find(c=>c.id===beat?.id)?.atMs??Infinity;
}
export function has(p:Motion,key:string){return p.frame*1000/p.fps>=onset(p,key);}
export function progress(p:Motion,key:string){
 const age=p.frame-onset(p,key)*p.fps/1000;
 if(age<0)return 0;
 return p.reducedMotion?1:interpolate(age,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
}
export function entry(p:Motion,key:string):CSSProperties{
 const age=p.frame-onset(p,key)*p.fps/1000;
 const t=age<0?0:p.reducedMotion?1:spring({frame:age,fps:p.fps,config:{damping:24,stiffness:180,mass:.7}});
 return {opacity:progress(p,key),transform:`translateY(${(1-t)*12}px)`};
}
export function Reveal({p,at,children}:{p:Motion;at:string;children:ReactNode}){
 return has(p,at)?<g data-beat={at} style={entry(p,at)}>{children}</g>:null;
}
export function Label({x,y,children,p,color=palette.ink,size}:{x:number;y:number;children:ReactNode;p:Motion;color?:string;size?:number}){
 return <text data-safe-element x={x} y={y} textAnchor="middle" fill={color} fontSize={size??(p.layout==='portrait'?35:27)} fontWeight={600} fontFamily="IBM Plex Sans Arabic, sans-serif" direction={typeof children==='string'&&/[\u0600-\u06ff]/.test(children)?'rtl':'ltr'} unicodeBidi="isolate">{children}</text>;
}
export function Arrow({x1,y1,x2,y2,color=palette.green,t=1}:{x1:number;y1:number;x2:number;y2:number;color?:string;t?:number}){
 const angle=Math.atan2(y2-y1,x2-x1)*180/Math.PI; const x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
 return <g><line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round"/>
 <path d="M-14 -8 L0 0 L-14 8" transform={`translate(${x} ${y}) rotate(${angle})`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"/></g>;
}
export function Ground({y=276}:{y?:number}){
 return <g stroke={palette.muted} strokeWidth={2}><path d={`M50 ${y} H650`}/>{Array.from({length:19},(_,i)=><path key={i} d={`M${55+i*32} ${y} l-12 16`} opacity={.35}/>)}</g>;
}
export function Cart({x=280,y=180,label,p}:{x?:number;y?:number;label?:string;p:Motion}){
 return <g><rect x={x} y={y} width={140} height={68} rx={8} fill={palette.wash} stroke={palette.ink} strokeWidth={3}/>
 {[x+27,x+113].map(cx=><g key={cx}><circle cx={cx} cy={y+78} r={15} fill={palette.paper} stroke={palette.ink} strokeWidth={3}/><circle cx={cx} cy={y+78} r={4} fill={palette.ink}/></g>)}
 {label&&<Label p={p} x={x+70} y={y+45} size={p.layout==='portrait'?34:25}>{label}</Label>}</g>;
}
export function Drawing({p,children,label,viewBox="0 0 700 360"}:{p:Motion;children:ReactNode;label:string;viewBox?:string}){
 return <svg data-diagram={p.plan.kind} role="img" aria-label={label} viewBox={p.layout==='portrait'?(p.plan.kind==='supported'?'200 60 420 285':['doorforce','vector'].includes(p.plan.kind)?(has(p,'body')?'200 28 470 310':'100 80 520 250'):p.plan.kind==='rigid'?'100 30 520 310':p.plan.kind==='particle'?'50 40 615 300':p.plan.kind==='idealization'?'60 80 580 260':p.plan.kind==='prompt'?'100 50 500 300':['contact','bodyload'].includes(p.plan.kind)?'30 40 640 310':viewBox):viewBox} style={{display:'block',width:'100%',height:'100%',overflow:'hidden'}}>
 {children}</svg>;
}

import type {CSSProperties,ReactNode} from 'react';

// Identical statics notation kit in every lesson. Variables italic; units upright.
// A slash is a real stacked fraction, not an ASCII approximation on the board.
const units=new Set(['kg','m','s','N','ft','lbf','slug','SI','FPS']);
export const uiFont='"IBM Plex Sans Arabic", "Segoe UI", sans-serif';
const mathFont='"STIX Two Text", "Cambria Math", serif';
function runs(src:string,unitContext=false):ReactNode{
 return src.split(/(\d+(?:\.\d+)?|[A-Za-z]+|[Σ²₁₂]|\s+)/).filter(Boolean).map((s,i)=>
  <span key={i} style={{fontStyle:/^[A-Za-z]+$/.test(s)&&(!units.has(s)||s==='m'&&!unitContext&&!/\d/.test(src))?'italic':'normal'}}>{s.replace(/\s/g,'\u2009')}</span>);
}
function fraction(src:string,unitContext=false):ReactNode{
 const slash=src.indexOf('/');
 if(slash<0)return runs(src,unitContext);
 // Each fraction side is atomic. Multiplication and equality delimit complete fractions.
 const left=src.slice(0,slash).trim(),right=src.slice(slash+1).trim();
 return <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',verticalAlign:'middle',margin:'0 .18em',fontSize:'.92em',lineHeight:1.15}}>
  <span style={{padding:'0 .15em .10em'}}>{runs(left,!/[FGWΣ]/.test(left))}</span>
  <span style={{height:2,minWidth:'100%',background:'currentColor'}}/>
  <span style={{padding:'.10em .15em 0'}}>{runs(right,true)}</span>
 </span>;
}
export function Equation({text,size=40,color='currentColor',style={},unitContext=false}:{text:string;size?:number;color?:string;style?:CSSProperties;unitContext?:boolean}){
 return <div dir="ltr" data-notation style={{fontFamily:mathFont,fontSize:size,color,lineHeight:1.35,unicodeBidi:'isolate',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',columnGap:'.14em',rowGap:'.28em',...style}}>
  {text.split(/(\s*[=≈→↔÷]\s*|\s+×\s+|\s+·\s+)/).filter(Boolean).map((s,i)=><span key={i} style={{display:'inline-flex',alignItems:'center',whiteSpace:'nowrap'}}>{fraction(s,unitContext)}</span>)}
 </div>;
}
export function Written({text}:{text:string}){
 return <>{text.split(/\$([^$]+)\$/).map((s,i)=>i%2?<bdi key={i} dir="ltr" style={{fontFamily:mathFont,unicodeBidi:'isolate'}}>{s}</bdi>:s)}</>;
}
export function fontFaces(base:unknown){
 const root=typeof base==='string'?base:'';
 const names=[['IBM Plex Sans Arabic','ibm-plex-sans-arabic-arabic-400-normal',400],['IBM Plex Sans Arabic','ibm-plex-sans-arabic-arabic-600-normal',600],['IBM Plex Sans Arabic','ibm-plex-sans-arabic-latin-400-normal',400],['IBM Plex Sans Arabic','ibm-plex-sans-arabic-latin-600-normal',600],['STIX Two Text','stix-two-text-latin-400-normal',400],['STIX Two Text','stix-two-text-latin-400-italic',400]];
 return names.map(([family,file,weight])=>`@font-face{font-family:"${family}";src:url("${root}/assets/fonts/${file}.woff2");font-weight:${weight};font-style:${String(file).includes('italic')?'italic':'normal'};font-display:block;}`).join('');
}

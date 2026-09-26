// ══════════════════════════════════════════════════════
// BLACKHOLE STORM V2 — DRAG THE BLACK HOLE
// The player drags the hole with one finger; bodies fall in from the edges, fall into its gravity
// field, spiral in and make it grow. Meteors must be dodged, combos build Rage, a tap unleashes it.
// All sizes and speeds are the V2 baseline in reference px of a 1080×1920 portrait screen,
// scaled to the phone by G2.S. Injected into game.src.html by src/build.py.
// ══════════════════════════════════════════════════════
const V2=true;
const V2K={r0:34,rMax:180,rRage:240,gK:2.2,gMax:450,gMaxOver:500,off:50,follow:.9,
  acc:{min:.15,max:1.8,rage:3},
  rage:{dur:5,r:1.33,g:1.5,acc:1.67,score:2},time:{dur:6,k:.45},over:{dur:15,r:1.25,g:1.4,ctl:1.15},
  mini:{dur:6,r:28,g:70,k:.6},bomb:{r:140,dur:.8,pts:25,max:500},imm:.8,cont:{imm:3,rage:50},
  dodge:{lo:10,hi:35,cd:1.5},perfectK:.2,swallow:.35,
  dur:[0,60,65,70,70,75,75,80,80,90,90],comboT:[0,3,2.7,2.5,2.3]};
// r: radius, v/dv/vm: speed at level 1, per-level increase, maximum (ref px/s); pts: score; grow: radius gain;
// rage: Rage gain; need: hole size (× start radius) required to swallow it
const OBJ2={
  ast:    {r:18,v:220,dv:12,vm:500,pts:10, grow:.3, rage:1, need:1},
  moon:   {r:27,v:170,dv:10,vm:350,pts:25, grow:.7, rage:2, need:1.15},
  planet: {r:48,v:120,dv:8, vm:250,pts:100,grow:2,  rage:4, need:1.35},
  crystal:{r:16,v:260,dv:15,vm:550,pts:200,grow:2.5,rage:6, need:1},
  gold:   {r:30,v:300,dv:0, vm:600,pts:500,grow:4,  rage:10,need:1.15},
  energy: {r:14,v:200,dv:8, vm:420,pts:15, grow:.5, rage:15,need:1},
  time:   {r:16,v:190,dv:6, vm:380,pts:25, grow:.5, rage:2, need:1},
  bomb:   {r:24,v:170,dv:8, vm:360,pts:50, grow:1,  rage:3, need:1},
  mini:   {r:28,v:150,dv:5, vm:300,pts:100,grow:0,  rage:3, need:1},
  meteor: {r:22,v:380,dv:20,vm:750,pts:0,  grow:0,  rage:0, need:99},
  frag:   {r:15,v:150,dv:0, vm:300,pts:30, grow:.6, rage:3, need:1}}; // shed by the giant planet
const SMALL2=new Set(['ast','moon','crystal','energy','frag']);
const GL2=new Set(['moon','planet','gold']);
const MULT2=c=>c>=30?7:c>=20?6:c>=15?5:c>=10?4:c>=5?3:c>=3?2:1;
// what each level brings in (level-start banner, level-complete teaser, map)
const NEW2={2:['☄️','METEOR','Meteorlardan kaç: çarparsa can gider. Kıl payı geçersen PERFECT DODGE.'],
  3:['💎','CRYSTAL','Çok değerli ama genelde bir meteorun yanında. Risk alacak mısın?'],
  4:['⏱','TIME BALL','Yut: her şey 6 saniye yavaşlar, sen hızlı kalırsın.'],
  5:['💣','BOMB PLANET','Yut: yakındaki küçük cisimler zincirleme sana gelir.'],
  6:['⚡','SPEED + OVERLOAD','Cisimler hızlanıyor. Sınıra kadar büyürsen 15 saniyelik OVERLOAD başlar.'],
  7:['↔️','SIDE STREAMS','Cisimler artık yanlardan da geliyor.'],
  8:['🌀','MINI BLACK HOLE','Yut: 6 saniye sana yardım eden ikinci bir kara delik açılır.'],
  9:['🪨','ASTEROID STORM','Yoğun alan: dev combo zamanı.'],
  10:['🪐','GIANT PLANET','Boss: koptukça parçalarını topla, küçülünce bütünüyle yut.'],
  11:['🌐','360°','Cisimler her yönden geliyor.']};
function new2(l){return NEW2[l]||(l%10===0?NEW2[10]:null);}

const G2={on:false,mode:'level',S:1,t:0,dur:60,lv:1,L:null,objs:[],gl:[],parts:[],calls:[],minis:[],waves:[],
  rr:34,cap:46,peak:34,R:34,G:75,vx:0,vy:0,tx:0,ty:0,lx:0,ly:0,
  combo:0,comboT:0,best:0,rage:0,rageT:0,ready:false,readyT:0,timeT:0,overT:0,overDone:false,immT:0,dodgeCD:0,
  eaten:0,perfA:0,perfD:0,dmg:0,acc:0,swarm:0,swarmT:0,script:null,si:0,st:0,touched:false,tut:1,contUsed:false,
  boss:null,ending:0,endT:0,pulse:0,uiT:0,sprLv:6,sprBlock:-1,hud:{}};
const DRAG={id:null,x:0,y:0,sx:0,sy:0,t0:0,moved:false,held:false};

function v2Resize(){G2.S=Math.min(W,H*.5625)/486;}
const sp2=v=>v*G2.S;
function v2Lv(){return gameMode==='survival'?Math.min(40,effLevel()):gameMode==='sprint'?G2.sprLv:level;}
// level rules: counts, spawn odds, directions (spec §26, §36–39)
function v2Rules(l){
  const tb=(arr,d)=>arr[l]!==undefined?arr[l]:d;
  const crystal=l===1?0:tb([0,5,7,10,10,12,12,14,15,15,18],Math.min(20,18+(l-10)*.2));
  const meteor=tb([0,0,8,10,12,14,16,18,20,22,25],Math.min(30,25+(l-10)*.3));
  const gold=l<=3?0:l<=5?2:l<=7?3:l<=9?4:5;
  const w={crystal,meteor:l%10===9?meteor*.5:meteor,gold,moon:l===1?18:15,planet:l>=2?Math.min(10,5+l*.5):0,energy:l>=2?4:0,time:l>=4?3:0,bomb:l>=5?3:0,mini:l>=8?1.5:0};
  let rest=100;for(const k in w)rest-=w[k];w.ast=Math.max(20,rest);
  return {w,cap:l===1?8:l===2?10:12,capMul:Math.min(V2K.rMax/V2K.r0,1.2+.15*l),comboT:tb(V2K.comboT,2),
    speedK:l>=6?1.15:1,dirs:l>=11?4:l>=7?2:1,iv:Math.max(.5,1.05-.025*(l-1))*(l%10===9?.6:1),dense:l%10===9,boss:l%10===0,
    dur:tb(V2K.dur,90),overload:l>=6};
}

// ── start / reset ─────────────────────────────────────
function v2Start(mode){
  v2Resize();G2.on=true;G2.mode=mode;document.body.classList.add('v2');v2Hud();
  balls=[];blocks=[];rifts=[];PU={slow:0,magnet:0,mult:0};MIS=null;holeK=1;isRescueLevel=false;
  const l=v2Lv();G2.lv=l;G2.L=v2Rules(l);
  Object.assign(G2,{t:0,dur:mode==='surv'?1e9:mode==='sprint'?SPR_RUN.dur:G2.L.dur,objs:[],gl:[],calls:[],minis:[],waves:[],
    rr:V2K.r0,cap:V2K.r0*G2.L.capMul,peak:V2K.r0,vx:0,vy:0,combo:0,comboT:0,best:0,rage:0,rageT:0,ready:false,readyT:0,firstRage:false,
    timeT:0,overT:0,overDone:false,immT:0,dodgeCD:0,eaten:0,perfA:0,perfD:0,dmg:0,acc:.6,swarm:0,swarmT:0,
    script:mode==='level'&&level===1&&!REPLAY?v2Script1():null,si:0,st:0,tut:mode==='level'&&level===1?1:0,touched:false,contUsed:false,boss:null,ending:0,endT:0,sprBlock:-1});
  comboCount=0;comboMult=1;diamTimer=0;lostThisLevel=false;lvCombo=0;
  hX=W/2;hY=H*.7;G2.tx=hX;G2.ty=hY;G2.lx=hX;G2.ly=hY;DRAG.id=null;
  if(G2.L.boss&&mode==='level')v2BossInit();
  const nw=mode==='level'?new2(level):null;
  if(mode==='level'&&level>1)v2Call('LEVEL '+level,nw?`NEW: ${nw[0]} ${nw[1]}`:'',nw?'#ffb35c':'#e7e3da',2.2,true);
  else if(mode==='surv')v2Call('SURVIVE THE STORM','','#e7e3da',2);
  gState='playing';lastT=performance.now();v2Ui(true);
}
function v2Stop(){G2.on=false;document.body.classList.remove('v2');DRAG.id=null;curR=BASE_R;tgtR=BASE_R;}

// ── input ─────────────────────────────────────────────
function v2Pt(e){const r=$('fx').getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function v2Aim(x,y){G2.tx=x;G2.ty=y-sp2(V2K.off)-G2.R*.35;}
function v2Down(x,y,id){
  if(!G2.on||gState!=='playing'||DRAG.id!==null)return;
  DRAG.id=id;DRAG.sx=x;DRAG.sy=y;DRAG.x=x;DRAG.y=y;DRAG.t0=performance.now();DRAG.moved=false;
  if(!G2.touched){G2.touched=true;G2.tut=Math.min(G2.tut,.99);}
  if(!G2.ready)v2Aim(x,y); // with Rage ready, a tap must not yank the hole across the screen
}
function v2Move(x,y,id){
  if(id!==DRAG.id||!G2.on)return;DRAG.x=x;DRAG.y=y;
  if(!DRAG.moved&&Math.hypot(x-DRAG.sx,y-DRAG.sy)>10)DRAG.moved=true;
  if(DRAG.moved||!G2.ready)v2Aim(x,y);
}
function v2Up(id){
  if(id!==DRAG.id)return;const tap=!DRAG.moved&&performance.now()-DRAG.t0<260;DRAG.id=null;
  if(tap&&G2.on&&gState==='playing')v2Tap();
}
function v2Tap(){if(G2.ready&&G2.rageT<=0)v2RageGo();}

// ── feedback helpers ──────────────────────────────────
const SFX2={};let sfx2n=[];
function v2Sfx(n,o){const now=performance.now();if(now-(SFX2[n]||0)<45)return;sfx2n=sfx2n.filter(t=>now-t<220);if(sfx2n.length>=8)return;SFX2[n]=now;sfx2n.push(now);sfx(n,o);}
function v2Burst(x,y,n,col,s0,s1,life=.5,sz=1.8){
  const P=G2.parts;for(let i=0;i<n;i++){if(P.length>=150)P.shift();const a=rnd(0,TAU),s=rnd(s0,s1);P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,c:col,sz});}
}
function v2Pop(txt,col,sz=18){ftexts.push(new FText(txt,hX+rnd(-8,8),hY-G2.R-sp2(26)-rnd(0,14),col,sz));if(ftexts.length>14)ftexts.shift();}
// big centred callout (arcade terms stay English in every language)
function v2Call(txt,sub='',col='#fff',life=1.1,top=false){G2.calls=G2.calls.filter(c=>c.top!==top);G2.calls.push({txt,sub,col,life,max:life,top});}

// ── spawning ──────────────────────────────────────────
function v2Speed(k){const K=OBJ2[k],l=G2.lv;return Math.min(K.vm,K.v+K.dv*(l-1))*(G2.L.speedK)*G2.S;}
function v2Obj(k,x,y,vx,vy,opt={}){
  const K=OBJ2[k];const o={k,x,y,vx,vy,rr:K.r*(opt.scale||1),r:0,st:'in',t:0,inG:false,b:1e9,seen:false,rot:rnd(0,TAU),vr:rnd(-1.2,1.2),
    si:Math.floor(rnd(0,6)),wait:k==='meteor'?(opt.wait??.75):0,minGap:1e9,dodged:false,prevD:1e9,boss:!!opt.boss,noScore:false,age:0};
  o.r=o.rr*G2.S;
  if(GL2.has(k)){o.cell=k==='moon'?8:k==='gold'?6:opt.cell??zonePlanetCell();o.sX=1;o.sY=1;o.gs=1;o.suck=null;o.heat=0;giveSpin(o);}
  G2.objs.push(o);return o;
}
function v2Edge(k,side,x0){
  const s=v2Speed(k),r=OBJ2[k].r*G2.S;let x,y,a;
  if(side==null){const d=G2.L.dirs;const q=rng();side=d>=4?(q<.45?0:q<.64?1:q<.83?2:3):d>=2?(q<.7?0:q<.85?1:2):0;}
  for(let tries=0;tries<5;tries++){
    if(side===0){x=x0??rrnd(W*.08,W*.92);y=-r-4;a=Math.PI/2+rrnd(-.26,.26);}
    else if(side===1){x=-r-4;y=rrnd(H*.08,H*.55);a=rrnd(-.15,.5);}
    else if(side===2){x=W+r+4;y=rrnd(H*.08,H*.55);a=Math.PI-rrnd(-.15,.5);}
    else {x=x0??rrnd(W*.12,W*.88);y=H+r+4;a=-Math.PI/2+rrnd(-.22,.22);}
    if(Math.hypot(x-hX,y-hY)>sp2(250))break;x0=null;
  }
  // aim sideways/bottom entries toward the play area so they cross the screen
  return v2Obj(k,x,y,Math.cos(a)*s,Math.sin(a)*s);
}
function v2Pick(){const w=G2.L.w;let tot=0;for(const k in w)tot+=w[k];let r=rng()*tot;for(const k in w){r-=w[k];if(r<=0)return k;}return 'ast';}
function v2Active(){let n=0;for(const o of G2.objs)if(o.st==='in'&&!o.boss)n++;return n;}
function v2Spawn(){
  let k=v2Pick();const l=G2.lv;
  if(k==='meteor'&&G2.objs.filter(o=>o.k==='meteor'&&o.wait>0).length>=3)k='ast'; // never more than 3 meteors released together
  if(k==='bomb'&&G2.objs.some(o=>o.k==='bomb'))k='ast';
  if(k==='mini'&&(G2.minis.length||G2.objs.some(o=>o.k==='mini')))k='ast';
  if(k==='time'&&(G2.timeT>0||G2.objs.some(o=>o.k==='time')))k='ast';
  if(k==='ast'&&rng()<(G2.L.dense?.55:.3)){ // a line of small rocks: combo fodder
    const n=G2.L.dense?rpick([3,4,5]):3,x=rrnd(W*.2,W*.8),gap=sp2(46);for(let i=0;i<n;i++){const o=v2Edge('ast',0,clamp(x+(i-(n-1)/2)*gap,sp2(20),W-sp2(20)));o.y-=Math.abs(i-(n-1)/2)*sp2(30);}return;}
  const o=v2Edge(k);
  if(k==='crystal'&&l>=3&&rng()<.45){ // risk/reward: the crystal rides next to a meteor
    const side=o.x<W/2?1:-1,m=v2Obj('meteor',o.x+side*sp2(64),o.y-sp2(20),o.vx*.9,Math.max(o.vy,v2Speed('meteor')*.7),{wait:.9});}
  if(k==='gold'&&l>=4&&rng()<.5){const m=v2Obj('meteor',clamp(o.x+rrnd(-90,90)*G2.S,20,W-20),o.y-sp2(70),o.vx,v2Speed('meteor'),{wait:.9});}
}
// Level 1 — the 60 second tutorial timeline (spec §27–28): [script time, kind, x (fraction of width or 'hole'), extra]
function v2Script1(){const E=[];
  E.push([3.2,'ast','hole']);
  [8.5,10.6,12.7].forEach((t,i)=>E.push([t,'ast',[.3,.7,.45][i]]));
  [15.2,16.4,17.6,18.8,20].forEach((t,i)=>E.push([t,'ast',[.22,.36,.5,.64,.78][i]]));
  E.push([22.5,'ast',.35],[23.5,'ast',.65],[24.2,'meteor','near'],[27.4,'ast',.5]);
  E.push([30.5,'ast',.25],[32,'crystal','hole'],[34,'ast',.75]);
  E.push([38.5,'ast',.3],[39.5,'ast',.7],[40.5,'energy','hole'],[42,'ast',.5]);
  [45,45.8,46.6,47.4,48.2].forEach((t,i)=>E.push([t,'ast',[.2,.4,.6,.8,.5][i]]));E.push([46.2,'moon',.35],[47.8,'moon',.65]);
  return E;}
function v2RunScript(dt){
  if(!G2.touched)return; // the tutorial waits for the first touch
  if(!(G2.ready&&G2.rageT<=0&&G2.st>=44.5))G2.st+=dt; // hold the clock while Rage waits for its tap
  const E=G2.script;
  while(G2.si<E.length&&E[G2.si][0]<=G2.st){const [t,k,x]=E[G2.si++];
    if(k==='meteor'){const side=hX<W/2?1:-1,mx=clamp(hX+side*(G2.R+sp2(60)),sp2(24),W-sp2(24));v2Obj('meteor',mx,-sp2(30),0,v2Speed('meteor')*.8,{wait:1});v2Call('☄️ METEOR!','DODGE IT','#ff7a5c',1.2,true);continue;}
    const xx=x==='hole'?clamp(hX+rnd(-10,10),sp2(30),W-sp2(30)):W*x;const o=v2Edge(k,0,xx);o.vx=0;if(k==='ast'&&G2.si<=1)o.vy*=.75;}
  if(G2.st>=42&&!G2.firstRage&&G2.rage<100&&G2.rageT<=0&&!G2.ready)G2.rage=Math.min(100,G2.rage+dt*40); // the first Rage always arrives, once
  if(G2.ready&&G2.readyT>5)v2RageGo(); // tutorial only: nobody leaves level 1 without seeing Rage
  if(G2.st>=G2.dur-3)G2.script=[]; // spawning stops for the finale
}

// ── giant planet boss (every 10th level) ─────────────
function v2BossInit(){
  const hp=22+Math.floor(level/10)*4;
  const b={k:'boss',x:W/2,y:H*.24,rr:95,r:95*G2.S,hp,max:hp,cell:[2,5,15,13][(Math.floor(level/10)+3)%4],vx:sp2(28),shed:1.4,edible:false,sw:0,
    sX:1,sY:1,gs:1,suck:null,heat:0,isBoss:false,age:0,meteorT:6};giveSpin(b);b.spinV*=.25;G2.boss=b;
  v2Call('GIANT PLANET','EAT ITS FRAGMENTS','#ffb35c',2.4,true);sfx('bossIntro',{vol:.7,rev:.4});
}
function v2BossStep(dt,tk){
  const b=G2.boss;if(!b)return;b.age+=dt;b.spinA+=b.spinV*dt;
  if(b.sw>0){ // being swallowed
    b.sw+=dt;const p=Math.min(1,b.sw/1.2);b.x+=(hX-b.x)*Math.min(1,dt*4);b.y+=(hY-b.y)*Math.min(1,dt*4);b.gs=1-.9*p;
    b.suck={ph:'fall'};b.radAng=Math.atan2(hY-b.y,hX-b.x);b.stretch=1+p;b.squeeze=1-.5*p;b.fade=1-p;b.sp=p;
    if(p>=1){G2.boss=null;G2.ending=1;G2.endT=1.4;}return;}
  b.rr=40+55*b.hp/b.max;b.r=b.rr*G2.S;
  if(!b.edible){b.x+=b.vx*dt*tk;if(b.x<b.r+10||b.x>W-b.r-10)b.vx*=-1;
    b.shed-=dt*tk;if(b.shed<=0){b.shed=Math.max(.75,1.5*b.hp/b.max+.35);const a=rrnd(.3,Math.PI-.3),s=rrnd(.6,1.1)*v2Speed('frag')/G2.L.speedK;
      const k=rng()<.14?'crystal':rng()<.1?'energy':'frag';const o=v2Obj(k,b.x+Math.cos(a)*b.r,b.y+Math.sin(a)*b.r,Math.cos(a)*s,Math.sin(a)*s);o.fromBoss=true;}
    if(level>=20){b.meteorT-=dt*tk;if(b.meteorT<=0){b.meteorT=6;const a=Math.atan2(hY-b.y,hX-b.x),s=v2Speed('meteor')*.8;v2Obj('meteor',b.x,b.y+b.r,Math.cos(a)*s,Math.sin(a)*s,{wait:.6});}}}
  // solid until it is small enough: the hole is pushed out instead of passing through
  const dx=hX-b.x,dy=hY-b.y,d=Math.hypot(dx,dy)||1,min=b.r+G2.R*.7;
  if(b.edible&&d<G2.R+b.r*.45&&G2.R/(V2K.r0*G2.S)>=1.25){b.sw=.001;v2BossEaten();}
  else if(d<min){hX=b.x+dx/d*min;hY=b.y+dy/d*min;if(b.edible&&b.warnT===undefined){b.warnT=1;v2Call('GROW BIGGER','','#ffb35c',1);}}
}
function v2BossHit(){const b=G2.boss;if(!b||b.edible)return;b.hp=Math.max(0,b.hp-1);shock=Math.max(shock,.3);
  if(b.hp===0){b.edible=true;v2Call('SWALLOW IT!','','#8dffcb',1.6,true);sfx('bell',{vol:.8});}}
function v2BossEaten(){
  const pts=Math.round(1000*MULT2(G2.combo+1)*(G2.rageT>0?2:1));totalScore+=pts;levelScore+=pts;G2.combo++;G2.comboT=G2.L.comboT;
  G2.rr=Math.min(V2K.rMax,G2.rr+10);G2.cap=Math.max(G2.cap,G2.rr);v2AddRage(25);G2.eaten++;bossSlain=true;
  shake=Math.max(shake,14);flash=1;shock=1;sfx('bossDie',{vol:.9,rev:.5});sfx('boom',{vol:.7,rate:.6});vib([60,40,120]);
  v2Call('GIANT PLANET SWALLOWED','SIZE UP','#ffd76a',2.4,true);v2Pop('+'+pts.toLocaleString(LOC),'#ffd76a',26);
  v2Burst(hX,hY,60,'#ffcf8a',2,9,1.1,2.4);addMass(5);updateUI();
}

// ── core update ───────────────────────────────────────
function v2Dims(){
  const S=G2.S;let rr=G2.rr;if(G2.overT>0)rr*=V2K.over.r;if(G2.rageT>0)rr=Math.min(rr*V2K.rage.r,V2K.rRage);
  G2.R=rr*S;
  let g=G2.rr*(G2.overT>0?V2K.over.r:1)*V2K.gK;if(G2.rageT>0)g*=V2K.rage.g;if(diamTimer>0)g*=1.5;
  G2.G=Math.min(g,G2.overT>0?V2K.gMaxOver:V2K.gMax)*S;G2.peak=Math.max(G2.peak,rr);
}
function v2Size(){return G2.R/(V2K.r0*G2.S);}
function v2Edible(o){if(o.k==='meteor'||o.boss)return false;let need=OBJ2[o.k].need;if(level===1&&G2.mode==='level')need=1;return v2Size()>=need-1e-6;}
function v2AddRage(n){if(G2.rageT>0||G2.ready)return;G2.rage=Math.min(G2.script&&G2.st<42?90:100,G2.rage+n);} // level 1: the first Rage is saved for its moment (~42 s)
function v2ComboLost(){if(G2.combo>=5)v2Pop('COMBO LOST','#9aa3b2',13);G2.combo=0;comboCount=0;}

function v2Update(dt){
  const S=G2.S,tk=G2.timeT>0?V2K.time.k:1,lv=G2.lv;
  // timers
  G2.t+=dt;if(G2.immT>0)G2.immT-=dt;if(G2.dodgeCD>0)G2.dodgeCD-=dt;if(G2.pulse>0)G2.pulse=Math.max(0,G2.pulse-dt*4);
  if(G2.timeT>0){G2.timeT-=dt;if(G2.timeT<=0)v2Call('TIME NORMAL','','#8fd0ff',.8);}
  if(diamTimer>0){diamTimer-=dt;if(diamTimer<=0)diamTimer=0;}
  if(G2.overT>0){G2.overT-=dt;if(G2.overT<=0){G2.rr=V2K.r0+(G2.cap-V2K.r0)*.6;v2Call('COLLAPSE','THE HOLE SHRINKS','#b9a8ff',1.3);sfx('slow',{vol:.6,rate:.6});v2Burst(hX,hY,26,'#b9a8ff',2,6,.7);}}
  if(G2.rageT>0){G2.rageT-=dt;G2.rage=Math.max(0,G2.rageT/V2K.rage.dur*100);heat=Math.max(heat,.55);if(G2.rageT<=0){G2.rage=0;G2.rageT=0;SND.setDrone(.14,650);}}
  if(G2.ready)G2.readyT+=dt;
  if(G2.combo>0){G2.comboT-=dt;if(G2.comboT<=0)v2ComboLost();}
  if(gameMode==='survival'){survTime+=dt;survSpeed=survTime/60;const sc=Math.floor(survTime);if(sc!==lastSurvSec){lastSurvSec=sc;dmEvent('surv',sc,true);}
    const nl=Math.min(40,effLevel());if(nl!==G2.lv){G2.lv=nl;const cap=G2.cap;G2.L=v2Rules(nl);G2.cap=Math.max(cap,V2K.r0*G2.L.capMul);v2Call('LEVEL UP','SPEED '+nl,'#ffb35c',1.2,true);const z=zoneOf(nl);if(z!==curZone)setZone(z);}}
  if(gameMode==='sprint'){const sec=Math.ceil(SPR_RUN.dur-SPR_RUN.t);SPR_RUN.t+=dt;const s2=Math.ceil(SPR_RUN.dur-SPR_RUN.t);
    if(s2!==sec&&s2<=5&&s2>0)sfx('tickHi',{vol:.6,rev:0});if(SPR_RUN.t>=SPR_RUN.dur){sprintEnd();return;}}

  // hole: follows the finger closely; overload overshoots a little (harder to steer)
  if(G2.tut>=1&&!G2.touched){const ph=G2.t*1.6;G2.tx=W/2+Math.sin(ph)*W*.22;G2.ty=H*.68;}
  const k=1-Math.pow(1-V2K.follow,dt*60),kk=G2.overT>0?Math.min(1.3,k*V2K.over.ctl+.05):k;
  const ox=hX,oy=hY;hX+=(G2.tx-hX)*kk;hY+=(G2.ty-hY)*kk;
  if(G2.overT>0){hX+=Math.sin(G2.t*7.3)*sp2(1.2);hY+=Math.cos(G2.t*6.1)*sp2(1.2);}
  v2Dims();const R=G2.R,m=R+4;hX=clamp(hX,m,W-m);hY=clamp(hY,m+2,H-m-50);
  const ivx=(hX-ox)/Math.max(dt,1e-3),ivy=(hY-oy)/Math.max(dt,1e-3);G2.vx+=(ivx-G2.vx)*.35;G2.vy+=(ivy-G2.vy)*.35;
  if(G2.touched&&G2.tut>=1)G2.tut=.99;if(G2.tut<1&&G2.tut>0)G2.tut=Math.max(0,G2.tut-dt*2);

  // spawning
  if(!G2.ending){
    if(G2.script)v2RunScript(dt);
    else{const cap=G2.rageT>0?20:G2.boss?24:G2.L.cap;G2.acc-=dt*tk;
      if(G2.acc<=0&&v2Active()<cap&&G2.t<G2.dur-3){G2.acc=G2.L.iv*rrnd(.75,1.25)*(G2.boss?1.6:1);v2Spawn();}}
    if(G2.swarm>0){G2.swarmT-=dt;if(G2.swarmT<=0&&v2Active()<20){G2.swarmT=.09;G2.swarm--;const q=rng();v2Edge(q<.08?'crystal':q<.25?'moon':'ast',rng()<.75?0:null);}}
  }
  // level timer
  if(G2.mode==='level'&&!G2.ending){
    if(G2.boss&&G2.t>=G2.dur){
      if(SHOP.time>0&&monOn()){SHOP.time--;saveG();G2.dur+=30;v2Call('TIME CRYSTAL','+30 s','#8fd0ff',1.4,true);sfx('slow',{vol:.7,rate:1.2});} // a time crystal buys the boss fight 30 s
      else{v2Fail('DEV GEZEGEN KAÇTI');return;}}
    if(!G2.L.boss&&(G2.script?G2.st>=G2.dur:G2.t>=G2.dur)){G2.ending=1;G2.endT=.5;}
  }
  if(G2.ending){G2.endT-=dt;if(G2.endT<=0&&gState==='playing'){G2.ending=2;v2Complete();}}

  // minis, bomb waves, boss
  for(let i=G2.minis.length-1;i>=0;i--){const q=G2.minis[i];q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=dt*5;if(q.x<q.r||q.x>W-q.r)q.vx*=-1;if(q.t<=0||q.y>H+q.r){v2Burst(q.x,q.y,14,'#c9a8ff',1,4,.5);G2.minis.splice(i,1);}}
  for(let i=G2.waves.length-1;i>=0;i--){const w=G2.waves[i];w.t+=dt;const st=w.t<.27?1:w.t<.53?2:3;w.rad=sp2(V2K.bomb.r)*st/3*Math.min(1,(w.t%.27)/.12+.3);
    for(const o of G2.objs){if(o.st!=='in'||w.hit.has(o)||o.boss||!(SMALL2.has(o.k)||o.k==='meteor'||o.k==='energy'))continue;if(Math.hypot(o.x-w.x,o.y-w.y)>sp2(V2K.bomb.r)*st/3+o.r)continue;
      w.hit.add(o);w.n++;const add=Math.min(V2K.bomb.pts,V2K.bomb.max-w.bonus);w.bonus+=add;totalScore+=add;levelScore+=add;v2AddRage(5);
      if(o.k==='meteor'){o.st='dead';v2Burst(o.x,o.y,14,'#ff8a4c',2,6,.5);}else{o.noScore=false;o.chain=true;v2Swallow(o,null);}
      if(w.n>=2)v2Call('CHAIN ×'+w.n,'','#ffb35c',.9);}
    if(w.t>=V2K.bomb.dur){if(w.n>=3){shake=Math.max(shake,9);v2Pop('CHAIN ×'+w.n+'  +'+w.bonus,'#ffb35c',17);}G2.waves.splice(i,1);}}
  v2BossStep(dt,tk);

  // bodies
  const Gr=G2.G,rageK=G2.rageT>0?V2K.rage.acc:1,overK=G2.overT>0?V2K.over.g:1;
  for(let i=G2.objs.length-1;i>=0;i--){const o=G2.objs[i];o.age+=dt;o.r=o.rr*S;
    if(o.st==='dead'){G2.objs.splice(i,1);continue;}
    if(o.st==='sw'){if(v2SwallowStep(o,dt)){G2.objs.splice(i,1);}continue;}
    if(o.spinA!==undefined)o.spinA+=o.spinV*dt;o.rot+=o.vr*dt;
    if(o.wait>0){o.wait-=dt*tk;continue;}
    const odt=dt*tk;
    // gravity of the main hole (and any mini hole) — meteors fly straight
    let dx=hX-o.x,dy=hY-o.y,d=Math.hypot(dx,dy)||1;
    if(o.k!=='meteor'){
      const ed=v2Edible(o)||G2.ending;
      if(d<Gr){
        if(!o.inG){o.inG=true;const rx=-dx,ry=-dy,rvx=o.vx-G2.vx,rvy=o.vy-G2.vy,rv=Math.hypot(rvx,rvy)||1;o.b=Math.abs(rx*rvy-ry*rvx)/rv;}
        const q=1-d/Gr;let a=(V2K.acc.min+(V2K.acc.max-V2K.acc.min)*q*q)*rageK*overK;a=Math.min(a,G2.rageT>0?V2K.acc.rage:V2K.acc.max*overK);
        if(!ed)a*=.3;if(G2.ending)a*=3;const A=a*S*3600*odt;o.vx+=dx/d*A;o.vy+=dy/d*A;
        // swirl + damping so bodies fall in instead of slingshotting around
        o.vx+=-dy/d*A*.22;o.vy+=dx/d*A*.22;const damp=Math.pow(1-.9*q,odt);o.vx*=damp;o.vy*=damp;
      }else if(d>Gr*1.2)o.inG=false;
      for(const q of G2.minis){if(!SMALL2.has(o.k))continue;const mx=q.x-o.x,my=q.y-o.y,md=Math.hypot(mx,my)||1;if(md<q.g){const A=(V2K.acc.min+1.2*(1-md/q.g))*V2K.mini.k*S*3600*odt;o.vx+=mx/md*A;o.vy+=my/md*A;}
        if(md<q.r+o.r*.65){v2Swallow(o,q);break;}}
      if(o.st!=='in')continue;
      o.x+=o.vx*odt;o.y+=o.vy*odt;dx=hX-o.x;dy=hY-o.y;d=Math.hypot(dx,dy)||1;
      if(d<G2.R+o.r*.65){
        if(ed)v2Swallow(o,null);
        else{ // too big: bounces off the event horizon
          const nx=-dx/d,ny=-dy/d,vn=o.vx*nx+o.vy*ny;if(vn<0){o.vx-=1.8*vn*nx;o.vy-=1.8*vn*ny;}o.x=hX+nx*(G2.R+o.r*.66);o.y=hY+ny*(G2.R+o.r*.66);
          if(!o.bounced){o.bounced=true;v2Call('TOO BIG','GROW FIRST','#ffb35c',.9);v2Sfx('armor',{vol:.35,rate:.7});}}}
    }else{ // meteor
      o.x+=o.vx*odt;o.y+=o.vy*odt;dx=hX-o.x;dy=hY-o.y;d=Math.hypot(dx,dy)||1;
      const gap=d-G2.R-o.r;
      if(gap<-o.r*.25&&!o.hit){o.hit=true;
        if(G2.rageT>0||G2.ending){o.st='dead';v2Burst(o.x,o.y,20,'#ff8a4c',2,7,.6);const p=50;totalScore+=p;levelScore+=p;v2Pop('SMASH +'+p,'#ff9a6c',15);v2Sfx('boom',{vol:.5,rate:1.4});continue;}
        v2Hit(o);o.st='dead';continue;}
      if(gap<o.minGap)o.minGap=gap;
      // closest approach passed without a hit: a near miss within 35 px of the horizon is a PERFECT DODGE
      if(!o.dodged&&d>o.prevD+.1&&o.prevD<1e8){o.dodged=true;if(o.minGap<sp2(V2K.dodge.hi)&&G2.dodgeCD<=0)v2Dodge(o);}
      o.prevD=d;
    }
    // off screen
    const mg=o.r*3+20;if(o.x>-o.r&&o.x<W+o.r&&o.y>-o.r&&o.y<H+o.r)o.seen=true;
    if((o.seen||o.age>12)&&(o.x<-mg||o.x>W+mg||o.y<-mg||o.y>H+mg)){if(o.fromBoss&&G2.boss)G2.boss.shed=Math.min(G2.boss.shed,.3);G2.objs.splice(i,1);}
  }
  // particles
  for(let i=G2.parts.length-1;i>=0;i--){const p=G2.parts[i];p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=Math.pow(.95,dt*60);p.vy*=Math.pow(.95,dt*60);p.life-=dt;if(p.life<=0)G2.parts.splice(i,1);}
  for(let i=G2.calls.length-1;i>=0;i--){G2.calls[i].life-=dt;if(G2.calls[i].life<=0)G2.calls.splice(i,1);}
  if(G2.overT<=0&&!G2.overDone&&G2.L.overload&&G2.rr>=G2.cap-.01&&!G2.ending){G2.overT=V2K.over.dur;G2.overDone=true;v2Call('OVERLOAD','MORE POWER · HARDER TO STEER','#c9a8ff',1.8,true);sfx('bossIntro',{vol:.5,rate:1.5});shake=Math.max(shake,8);}
}

// swallow: attract 0.15 s → spiral 0.12 s → vanish 0.08 s (spec §7)
function v2Swallow(o,mini){
  o.st='sw';o.t=0;o.sc=1;o.mini=mini||null;const cx=mini?mini.x:hX,cy=mini?mini.y:hY;o.a=Math.atan2(o.y-cy,o.x-cx);o.d0=Math.max(1,Math.hypot(o.x-cx,o.y-cy));
  o.dir=((o.vx*(cy-o.y)-o.vy*(cx-o.x))>0?-1:1);
  if(o.cell!==undefined){o.suck={ph:'fall'};o.stretch=1;o.squeeze=1;o.fade=1;o.sp=0;}
  if(G2.ending&&!o.chain){o.noScore=true;return;}
  v2Score(o,mini);
}
function v2SwallowStep(o,dt){
  o.t+=dt;const p=Math.min(1,o.t/V2K.swallow),cx=o.mini?o.mini.x:hX,cy=o.mini?o.mini.y:hY;
  const e=p<.43?p/.43*.35:p<.77?.35+(p-.43)/.34*.45:.8+(p-.77)/.23*.2; // attract, spiral, vanish
  const d=o.d0*(1-e);o.a+=o.dir*(2+10*p)*dt*(p>.43?2.2:1);o.x=cx+Math.cos(o.a)*d;o.y=cy+Math.sin(o.a)*d;o.sc=Math.max(.05,1-e*.95);
  if(o.cell!==undefined){o.gs=o.sc;o.radAng=Math.atan2(cy-o.y,cx-o.x);o.stretch=1+p*1.4;o.squeeze=1-p*.5;o.fade=1-p*.6;o.sp=p;}
  if(p>=1){v2Eaten(o);return true;}return false;
}
function v2Score(o,mini){
  const K=OBJ2[o.k];G2.combo++;comboCount=G2.combo;G2.comboT=G2.L.comboT;
  if(G2.combo>G2.best){G2.best=G2.combo;lvCombo=G2.best;}if(G2.combo>maxCombo)maxCombo=G2.combo;
  const perf=!mini&&o.inG&&o.b<V2K.perfectK*G2.G&&!o.chain;
  const m=MULT2(G2.combo);let pts=K.pts*m;if(perf)pts*=1.5;if(G2.rageT>0)pts*=V2K.rage.score;pts=Math.round(pts);
  totalScore+=pts;levelScore+=pts;G2.eaten++;
  v2AddRage((K.rage+(perf?4:0))*(G2.script?1.6:1));
  if(m>MULT2(G2.combo-1)){v2Call('COMBO ×'+m,'','#ffd76a',1,false);v2Sfx('mult',{vol:.55,rate:.8+m*.1});if(m>=4)shake=Math.max(shake,4);totalCombos++;}
  if(perf){G2.perfA++;perfectCount++;dmEvent('perfect',1);v2Pop('PERFECT +'+pts,'#fff1b8',18);v2Sfx('sparkle',{vol:.5,rate:1.2});shake=Math.max(shake,2.2);}
  else v2Pop('+'+pts,o.k==='crystal'?'#9ef3ff':o.k==='gold'?'#ffd76a':m>=4?'#ffcf8a':'#e7e3da',o.k==='ast'?15+m:19+m);
  const snd={ast:['capture',.45,1.2],moon:['capture2',.55,1],planet:['boom',.6,.7],crystal:['gem',.7,1.3],gold:['master',.8,1],energy:['sparkle',.6,.8],time:['slow',.7,1.2],bomb:['bomb',.7,1],mini:['magnet',.7,1],frag:['capture2',.5,1.3]}[o.k]||['capture',.5,1];
  v2Sfx(snd[0],{vol:snd[1],rate:snd[2]*(1+Math.min(.5,G2.combo*.015)),x:hX});
  dmEvent('catch',1);dmEvent('combo',G2.combo,true);if(o.k==='crystal')dmEvent('comet',1);dmEvent('score',totalScore,true);
  if(gameMode==='sprint'){const bi=Math.min(9,Math.floor(SPR_RUN.t/6));SPR_RUN.blocks[bi].c++;if(perf)SPR_RUN.blocks[bi].p++;SPR_RUN.caught++;}
  if(o.fromBoss)v2BossHit();
  if(o.k==='energy')v2Call('+15 RAGE','','#ff7ad9',.8);
  vib(o.k==='ast'?8:15);
}
function v2Eaten(o){ // the body has crossed the event horizon
  const K=OBJ2[o.k];const cx=o.mini?o.mini.x:hX,cy=o.mini?o.mini.y:hY;
  const n=Math.min(G2.rageT>0?12:8,4+Math.floor(G2.combo/3));const col={crystal:'#9ef3ff',gold:'#ffd76a',energy:'#ff7ad9',time:'#8fd0ff',bomb:'#ff8a4c',mini:'#c9a8ff'}[o.k]||'#e6dcff';
  v2Burst(cx,cy,n,col,1.2,3.5+Math.min(3,G2.combo*.1),.45,1.6);
  if(o.noScore)return;
  if(!o.mini){const cap=G2.cap;G2.rr=Math.min(cap,G2.rr+K.grow);G2.pulse=1;}
  addMass(1);
  if(o.k==='time'){G2.timeT=V2K.time.dur;v2Call('TIME SLOW','6 s','#8fd0ff',1.2);}
  else if(o.k==='bomb'){G2.waves.push({x:hX,y:hY,t:0,rad:0,hit:new Set(),n:0,bonus:0});shake=Math.max(shake,6);flash=Math.max(flash,.5);sfx('boom',{vol:.7});v2Call('BOMB!','','#ff8a4c',.8);}
  else if(o.k==='mini'){const q={x:W-hX,y:Math.max(sp2(90),hY-H*.35),vx:sp2(rrnd(-40,40)),vy:sp2(22),t:V2K.mini.dur,r:sp2(V2K.mini.r),g:sp2(V2K.mini.g),a:0};q.x=clamp(q.x,q.r+10,W-q.r-10);G2.minis.push(q);v2Call('MINI BLACK HOLE','6 s','#c9a8ff',1.2);}
}
function v2Dodge(o){
  G2.dodgeCD=V2K.dodge.cd;G2.perfD++;const p=50*(G2.rageT>0?2:1);totalScore+=p;levelScore+=p;v2AddRage(8);G2.combo++;comboCount=G2.combo;G2.comboT=G2.L.comboT;if(G2.combo>G2.best)G2.best=G2.combo;
  v2Call('PERFECT DODGE','+50','#8dffcb',1);v2Sfx('thrust',{vol:.5,rate:1.5});dmEvent('edge',1);shake=Math.max(shake,2);
  v2Burst(o.x,o.y,10,'#8dffcb',1,3,.4);
}
function v2Hit(o){
  v2Burst(o.x,o.y,22,'#ff7a5c',2,7,.6,2.2);
  if(G2.immT>0)return;G2.immT=V2K.imm;
  if(SHOP.shield>0&&monOn()&&gameMode!=='sprint'){SHOP.shield--;saveG();updateUI();sfx('armor',{vol:.9});v2Call('SHIELD','','#8fe9ff',1);shake=Math.max(shake,6);return;}
  G2.dmg++;lostThisLevel=true;v2ComboLost();G2.rage=G2.ready?G2.rage:Math.max(0,G2.rage-15);
  shake=Math.max(shake,11);flash=Math.max(flash,.35);shock=Math.max(shock,.7);flashPenal(120);vib([80,40,80]);
  v2Sfx('miss',{vol:.8,x:hX});v2Sfx('buzz',{vol:.35});
  const tutorial=level===1&&G2.mode==='level';
  if(!(tutorial&&lives<=1)){lives--;heartFx(Math.max(0,lives),'drain');}
  v2Pop('-1 ♥','#ff7a5c',20);updateUI();
  if(lives<=0){v2Fail(null);}
}
function v2Fail(msg){
  if(gState!=='playing')return;gState='over';G2.failMsg=msg;SND.setDrone(.08,300);SND.duck(.35,2);
  if(msg){lives=0;v2Call(msg==='DEV GEZEGEN KAÇTI'?'THE PLANET ESCAPED':msg,'','#ff7a5c',2,true);}
  setTimeout(()=>{if(!G2.on||gState!=='over')return;if(gameMode==='sprint'){sprintEnd();return;}if(gameMode==='survival'){gameOver();return;}showCont();},850);
}
function v2Revive(){ // one continue per run (spec §42)
  G2.contUsed=true;lives=1;G2.combo=0;comboCount=0;G2.rage=V2K.cont.rage;G2.ready=false;G2.rageT=0;G2.immT=V2K.cont.imm;
  hideModals();updateUI();gState='playing';lastT=performance.now();saveG();SND.setDrone(.14,650);SND.duck(1,0);sfx('powerup',{vol:.6});
  if(G2.failMsg==='DEV GEZEGEN KAÇTI'){G2.dur+=30;v2Call('+30 s','','#8dffcb',1.2);}
  for(const o of G2.objs)if(o.k==='meteor'&&Math.hypot(o.x-hX,o.y-hY)<sp2(260))o.st='dead';
}
function v2RageGo(){
  if(!G2.ready)return;G2.firstRage=true;G2.ready=false;G2.readyT=0;G2.rageT=V2K.rage.dur;G2.rage=100;G2.swarm=16;G2.swarmT=.15;
  shake=Math.max(shake,10);flash=Math.max(flash,.8);shock=1;heat=.6;
  v2Call('BLACK HOLE RAGE!','','#ff6a3d',1.8,true);sfx('powerup',{vol:.8,rate:.7});sfx('magnet',{vol:.6,rate:.7});sfx('boom',{vol:.5,rate:.5});SND.setDrone(.24,420);vib([40,30,90]);
  v2Burst(hX,hY,40,'#ff8a4c',2,8,.8,2.2);dmEvent('rescue',1);
}

// ── level end ─────────────────────────────────────────
function v2Complete(){
  if(gState!=='playing')return;
  const sz=G2.peak/V2K.r0;G2.rec=sz>bestSize+1e-6;if(G2.rec){bestSize=sz;saveG();}
  if(!G2.dmg)dmEvent('clean',1);
  G2.objs=G2.objs.filter(o=>o.st==='sw');
  if(gameMode==='survival'){gameOver();return;}
  levelSuccess();
}
function v2SizeTxt(x){return (x||0).toFixed(2)+'M';}
function v2Result(){ // level-complete card body
  const sz=G2.peak/V2K.r0;const row=(k,v,hl)=>`<div class="r2"><span>${T(k)}</span><b${hl?' class="hl"':''}>${v}</b></div>`;
  return `<div class="how2">HOW BIG CAN YOU GET?</div><div class="size2">${v2SizeTxt(sz)}${G2.rec?`<i>${T('YENİ REKOR!')}</i>`:''}</div>`+
    `<div class="res2">${row('SKOR',levelScore.toLocaleString(LOC))}${row('EN İYİ COMBO','×'+G2.best)}${row('YUTULAN',G2.eaten)}${row('PERFECT ABSORB',G2.perfA)}${row('PERFECT DODGE',G2.perfD)}${row('ÖDÜL','+5 ⭐'+(level%5===0?' +3 💎':''),true)}</div>`;
}
function v2Teaser(l){const n=new2(l);return n?`<b>${T('SIRADA')}</b>LEVEL ${l} · NEW: ${n[0]} ${n[1]}`:'';}

// ── drawing ───────────────────────────────────────────
function v2Frame(dt){
  const f=dt*60;clock+=dt;
  heat=Math.max(G2.rageT>0?.55:Math.min(.4,G2.combo*.02),heat-dt*.8);shock=Math.max(0,shock-dt*1.6);flash=Math.max(0,flash-dt*1.4);
  if(gState==='playing')v2Update(dt);
  else{for(let i=G2.parts.length-1;i>=0;i--){const p=G2.parts[i];p.x+=p.vx*f;p.y+=p.vy*f;p.life-=dt;if(p.life<=0)G2.parts.splice(i,1);}
    for(const o of G2.objs)if(o.st==='sw'&&gState==='lvlup_anim'&&v2SwallowStep(o,dt))o.st='dead';G2.objs=G2.objs.filter(o=>o.st!=='dead');}
  v2Dims();curR=G2.R*RING_K;tgtR=curR;holeK=1;lockK=0;dangerK=0;
  G2.gl.length=0;for(const o of G2.objs)if(o.cell!==undefined&&o.wait<=0)G2.gl.push(o);if(G2.boss)G2.gl.push(G2.boss);
  let sx=0,sy=0;if(shake>0){sx=(Math.random()-.5)*shake;sy=(Math.random()-.5)*shake;shake*=Math.pow(.8,f);if(shake<.3)shake=0;}
  const gl=glDraw(clock,sx,sy);if(!gl)drawFallbackBG();
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);ctx.translate(sx,sy);
  ctx.save();ctx.globalCompositeOperation='lighter';for(const d of dust){d.update(dt);d.draw();}ctx.restore();ctx.globalAlpha=1;
  drawScreenFx(dt);
  v2DrawField();
  for(const w of G2.waves){ctx.save();ctx.globalAlpha=Math.max(0,1-w.t/V2K.bomb.dur);ctx.strokeStyle='#ff8a4c';ctx.lineWidth=3;ctx.shadowColor='#ff6a2c';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(w.x,w.y,w.rad,0,TAU);ctx.stroke();ctx.restore();}
  for(const q of G2.minis)v2DrawMini(q);
  for(const o of G2.objs){if(o.cell!==undefined&&gl){if(o.k==='gold'&&o.st==='in')v2DrawGold(o);continue;}v2DrawObj(o,gl);}
  if(G2.boss)v2DrawBoss(G2.boss,gl);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const p of G2.parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.strokeStyle=p.c;ctx.lineWidth=p.sz;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2,p.y-p.vy*2);ctx.stroke();}
  for(let i=sparks.length-1;i>=0;i--){if(!sparks[i].update(dt,f))sparks.splice(i,1);else sparks[i].draw();}
  ctx.restore();ctx.globalAlpha=1;
  for(let i=ftexts.length-1;i>=0;i--){if(!ftexts[i].update(dt))ftexts.splice(i,1);else ftexts[i].draw();}
  for(let i=cols.length-1;i>=0;i--){if(!cols[i].update(dt,f)){const c=cols.splice(i,1)[0];if(c.gem){diamonds++;sfx('gem',{vol:.45,rate:1+Math.random()*.2});}else{stars++;sfx('coin',{vol:.4,rate:1+Math.random()*.25});}updateUI();}else cols[i].draw();}
  if(explA>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(230,220,255,${explA})`;ctx.lineWidth=14*explA+2;ctx.beginPath();ctx.arc(hX,hY,explR,0,TAU);ctx.stroke();ctx.restore();explR+=9*f;explA-=.012*f;}
  v2DrawCalls();v2DrawTut();
  recFrame();
  G2.uiT-=dt;if(G2.uiT<=0){G2.uiT=.1;v2Ui(false);}
}
function v2DrawField(){ // gravity field, rage aura, overload wobble, damage blink
  if(gState!=='playing'&&gState!=='paused')return;
  const R=G2.R,Gr=G2.G;ctx.save();ctx.translate(hX,hY);
  let pull=false;for(const o of G2.objs)if(o.st==='in'&&o.inG&&o.k!=='meteor'){pull=true;break;}
  ctx.setLineDash([3,7]);ctx.lineDashOffset=-clock*14;ctx.lineWidth=1.2;
  ctx.strokeStyle=G2.rageT>0?`rgba(255,120,70,${.45+.2*Math.sin(clock*18)})`:diamTimer>0?'rgba(120,240,255,.45)':pull?'rgba(190,210,255,.42)':'rgba(170,190,255,.16)';
  ctx.beginPath();ctx.arc(0,0,Gr,0,TAU);ctx.stroke();ctx.setLineDash([]);
  if(G2.rageT>0){const g=ctx.createRadialGradient(0,0,R,0,0,Gr);g.addColorStop(0,'rgba(255,90,40,.28)');g.addColorStop(1,'rgba(255,90,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,Gr,0,TAU);ctx.fill();}
  if(G2.overT>0){ctx.strokeStyle=`rgba(201,168,255,${.35+.25*Math.sin(clock*9)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R*1.12+Math.sin(clock*11)*2,0,TAU);ctx.stroke();}
  if(G2.immT>0&&Math.sin(clock*40)>0){ctx.strokeStyle='rgba(255,90,80,.8)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,R*1.08,0,TAU);ctx.stroke();}
  if(G2.pulse>0){ctx.globalAlpha=G2.pulse*.6;ctx.strokeStyle='#e6dcff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,R*(1.05+.25*(1-G2.pulse)),0,TAU);ctx.stroke();}
  ctx.restore();
}
function v2Rock(o,s,tint){
  const im=sprImg('rocks',o.si%6);const r=o.r*s;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);
  if(im){ctx.drawImage(im,-r*1.15,-r*1.15,r*2.3,r*2.3);}else{ctx.fillStyle='#8a8a86';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();}
  if(tint){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint;ctx.fillRect(-r*1.2,-r*1.2,r*2.4,r*2.4);}
  ctx.restore();
}
function v2DrawObj(o,gl){
  const s=o.st==='sw'?(o.sc??1):1,r=o.r*s;if(!(r>=.6))return;const k=o.k;
  if(o.wait>0){v2DrawWarn(o);return;}
  ctx.save();if(o.st==='sw')ctx.globalAlpha=Math.max(.15,s);
  if(k==='ast'||k==='frag'){v2Rock(o,s);if(k==='frag'){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,150,70,.25)';ctx.beginPath();ctx.arc(o.x,o.y,r*1.1,0,TAU);ctx.fill();}}
  else if(k==='meteor'){const sp=Math.hypot(o.vx,o.vy)||1,ux=o.vx/sp,uy=o.vy/sp;ctx.globalCompositeOperation='lighter';
    const tl=r*5.5,g=ctx.createLinearGradient(o.x,o.y,o.x-ux*tl,o.y-uy*tl);g.addColorStop(0,'rgba(255,150,60,.9)');g.addColorStop(.4,'rgba(255,70,40,.45)');g.addColorStop(1,'rgba(255,40,30,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(o.x-uy*r*.9,o.y+ux*r*.9);ctx.lineTo(o.x-ux*tl,o.y-uy*tl);ctx.lineTo(o.x+uy*r*.9,o.y-ux*r*.9);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='source-over';v2Rock(o,s,'rgba(255,90,40,.45)');
    ctx.strokeStyle=`rgba(255,80,60,${.55+.35*Math.sin(clock*14)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,r*1.25,0,TAU);ctx.stroke();}
  else if(k==='crystal'){ctx.translate(o.x,o.y);ctx.rotate(o.rot*.5);const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#e8fdff');g.addColorStop(.45,'#5fd8ff');g.addColorStop(1,'#7a5cff');
    ctx.shadowColor='#6fe8ff';ctx.shadowBlur=14;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r*.95,-r*.25);ctx.lineTo(r*.55,r*1.1);ctx.lineTo(-r*.55,r*1.1);ctx.lineTo(-r*.95,-r*.25);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.95,-r*.25);ctx.lineTo(r*.95,-r*.25);ctx.moveTo(0,-r*1.25);ctx.lineTo(-r*.3,-r*.25);ctx.lineTo(0,r*1.1);ctx.lineTo(r*.3,-r*.25);ctx.closePath();ctx.stroke();
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(200,250,255,${.5+.5*Math.sin(clock*6+o.si)})`;for(let i=0;i<4;i++){const a=i*Math.PI/2+clock;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*1.4,Math.sin(a)*r*1.4);ctx.lineTo(Math.cos(a)*r*2,Math.sin(a)*r*2);ctx.stroke();}}
  else if(k==='energy'){const pu=.8+.2*Math.sin(clock*9+o.si);ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r*2.4);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,120,220,.95)');g.addColorStop(1,'rgba(255,60,200,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,r*2.4*pu,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,170,240,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(o.x,o.y,Math.max(.5,r*1.3+Math.sin(clock*5)*2*s),0,TAU);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font=`900 ${Math.round(r*1.2)}px "IBM Plex Sans Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⚡',o.x,o.y+1);}
  else if(k==='time'){ctx.translate(o.x,o.y);const g=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);g.addColorStop(0,'#e4f6ff');g.addColorStop(.6,'#5aa9e6');g.addColorStop(1,'#1b4f8f');
    ctx.shadowColor='#8fd0ff';ctx.shadowBlur=16;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r*.72,0,TAU);ctx.stroke();
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*.55);ctx.moveTo(0,0);const a=clock*2;ctx.lineTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);ctx.stroke();}
  else if(k==='bomb'){ctx.translate(o.x,o.y);ctx.rotate(o.rot);const g=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);g.addColorStop(0,'#7a2a1c');g.addColorStop(.7,'#3a0d08');g.addColorStop(1,'#140404');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,${120+60*Math.sin(clock*10)|0},40,.9)`;ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(-r*.6,-r*.2);ctx.lineTo(-r*.1,r*.1);ctx.lineTo(r*.2,-r*.4);ctx.moveTo(-r*.1,r*.1);ctx.lineTo(r*.1,r*.6);ctx.moveTo(r*.2,-r*.4);ctx.lineTo(r*.65,-r*.1);ctx.stroke();
    ctx.strokeStyle=`rgba(255,110,50,${.4+.4*Math.sin(clock*12)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.3,0,TAU);ctx.stroke();}
  else if(k==='mini'){v2DrawMini({x:o.x,y:o.y,r,a:o.rot*3,t:9});}
  else if(!gl&&o.cell!==undefined){const im=SPR.byCell&&SPR.byCell[o.cell];if(im)ctx.drawImage(im,o.x-r,o.y-r,r*2,r*2);else{ctx.fillStyle='#9aa';ctx.beginPath();ctx.arc(o.x,o.y,r,0,TAU);ctx.fill();}}
  ctx.restore();
}
function v2DrawGold(o){ctx.save();ctx.globalCompositeOperation='lighter';const r=o.r,g=ctx.createRadialGradient(o.x,o.y,r*.7,o.x,o.y,r*1.8);g.addColorStop(0,'rgba(255,215,106,.55)');g.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,r*1.8,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,220,120,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(o.x,o.y,r+2,0,TAU);ctx.stroke();ctx.strokeStyle='#ffe7a0';ctx.lineWidth=1.2;for(let i=0;i<3;i++){const a=clock*1.3+i*2.1;ctx.beginPath();ctx.arc(o.x+Math.cos(a)*r*1.3,o.y+Math.sin(a)*r*1.3,1.6,0,TAU);ctx.stroke();}ctx.restore();}
function v2DrawMini(q){const r=Math.max(1,q.r);ctx.save();ctx.translate(q.x,q.y);const al=Math.min(1,q.t);ctx.globalAlpha=al;ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(0,0,r*.8,0,0,r*2.6);g.addColorStop(0,'rgba(190,150,255,.55)');g.addColorStop(1,'rgba(120,80,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*2.6,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(220,200,255,.8)';ctx.lineWidth=1.4;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(1.15+i*.28),q.a+i*2,q.a+i*2+2.2);ctx.stroke();}
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.restore();}
function v2DrawWarn(o){ // meteor about to enter: a red marker where it will come in
  const x=clamp(o.x,14,W-14),y=clamp(o.y,14,H-14),pu=.55+.45*Math.sin(clock*18);ctx.save();ctx.translate(x,y);
  const a=Math.atan2(o.vy,o.vx);ctx.globalAlpha=pu;ctx.fillStyle='#ff5a45';ctx.beginPath();ctx.moveTo(Math.cos(a)*14,Math.sin(a)*14);ctx.lineTo(Math.cos(a+2.5)*9,Math.sin(a+2.5)*9);ctx.lineTo(Math.cos(a-2.5)*9,Math.sin(a-2.5)*9);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.font='900 11px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,1);ctx.restore();}
function v2DrawBoss(b,gl){
  ctx.save();if(!gl){const im=SPR.byCell&&SPR.byCell[b.cell];if(im)ctx.drawImage(im,b.x-b.r,b.y-b.r,b.r*2,b.r*2);}
  if(b.sw)return ctx.restore();
  const hpK=b.hp/b.max;ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(b.x,b.y,b.r+9,-Math.PI/2,-Math.PI/2+TAU);ctx.stroke();
  ctx.strokeStyle=b.edible?`rgba(141,255,203,${.6+.4*Math.sin(clock*10)})`:'#ffb35c';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r+9,-Math.PI/2,-Math.PI/2+TAU*(b.edible?1:hpK));ctx.stroke();
  ctx.font='900 11px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.fillStyle=b.edible?'#8dffcb':'#ffcf8a';ctx.fillText(b.edible?'SWALLOW!':'GIANT PLANET · '+b.hp,b.x,b.y-b.r-16);
  ctx.restore();
}
function v2DrawCalls(){
  for(const c of G2.calls){const age=c.max-c.life,a=Math.min(1,c.life/.25,age/.08),sc=age<.12?.7+age/.12*.3+.15*Math.sin(age/.12*Math.PI):1;
    const y=c.top?H*.3:Math.max(H*.14,hY-G2.G-sp2(40));ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,y);ctx.scale(sc,sc);ctx.textAlign='center';
    ctx.font=`900 ${c.top?28:22}px "IBM Plex Sans Condensed",sans-serif`;ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.strokeText(c.txt,0,0);ctx.shadowColor=c.col;ctx.shadowBlur=18;ctx.fillStyle=c.col;ctx.fillText(c.txt,0,0);
    if(c.sub){ctx.shadowBlur=0;ctx.font='800 12px "IBM Plex Sans Condensed",sans-serif';ctx.lineWidth=3;ctx.strokeText(c.sub,0,20);ctx.fillStyle='#e7e3da';ctx.fillText(c.sub,0,20);}ctx.restore();}
  if(G2.ready&&gState==='playing'){const pu=.6+.4*Math.sin(clock*8);ctx.save();ctx.textAlign='center';ctx.globalAlpha=.8+.2*pu;ctx.font='900 20px "IBM Plex Sans Condensed",sans-serif';
    ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.6)';const y=Math.min(H-40,hY+G2.G+sp2(40));ctx.strokeText('TAP → RAGE',W/2,y);ctx.fillStyle=`rgb(255,${110+60*pu|0},70)`;ctx.shadowColor='#ff6a3d';ctx.shadowBlur=16;ctx.fillText('TAP → RAGE',W/2,y);ctx.restore();}
}
function v2DrawTut(){ // level 1: a ghost finger drags the hole until the player touches
  if(G2.tut<=0)return;const a=Math.min(1,G2.tut);const fx=hX,fy=hY+sp2(V2K.off)+G2.R*.35+26;ctx.save();ctx.globalAlpha=a*.9;
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(fx,fy,22+4*Math.sin(clock*6),0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(fx,fy,10,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(W/2-W*.22,fy+34);ctx.lineTo(W/2+W*.22,fy+34);ctx.stroke();ctx.setLineDash([]);
  ctx.font='900 26px "IBM Plex Sans Condensed",sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.strokeText('DRAG',W/2,fy+70);ctx.fillStyle='#fff';ctx.fillText('DRAG',W/2,fy+70);
  ctx.font='700 18px "IBM Plex Sans Condensed",sans-serif';ctx.fillText('←   →',W/2,fy+95);ctx.restore();
}

// ── HUD ───────────────────────────────────────────────
function v2Hud(){
  if(G2.hud.done)return;G2.hud.done=true;
  const sb=$('scoreBox');const rb=document.createElement('div');rb.id='rage2';rb.innerHTML='<span class="l notr">RAGE</span><div class="bar"><i></i></div>';sb.appendChild(rb);
  const tm=document.createElement('div');tm.id='tmr2';tm.className='notr';tm.innerHTML='<span>⏱</span><b id="tmr2v">60</b>';$('hdr').insertBefore(tm,$('pauseBtn'));
  rb.addEventListener('click',()=>{if(G2.on&&gState==='playing')v2Tap();});
}
function v2Ui(force){
  const h=G2.hud;const rg=Math.round(G2.rage),rd=G2.ready,rt=G2.rageT>0;
  if(force||h.rg!==rg||h.rd!==rd||h.rt!==rt){h.rg=rg;h.rd=rd;h.rt=rt;const rb=$('rage2');if(rb){rb.querySelector('i').style.width=rg+'%';rb.className=rt?'on':rd?'ready':'';}}
  const left=G2.mode==='surv'?Math.floor(survTime):Math.max(0,Math.ceil((G2.mode==='sprint'?SPR_RUN.dur-SPR_RUN.t:G2.dur-(G2.script?G2.st:G2.t))));
  if(force||h.left!==left){h.left=left;const v=$('tmr2v');if(v)v.textContent=left;const tp=$('tmr2');if(tp)tp.classList.toggle('low',G2.mode==='level'&&left<=10);
    const pct=G2.mode==='surv'?(survTime%30)/30*100:G2.mode==='sprint'?SPR_RUN.t/SPR_RUN.dur*100:(G2.script?G2.st:G2.t)/G2.dur*100;$('pb').style.width=Math.min(100,pct)+'%';}
  if(force||h.sc!==totalScore){h.sc=totalScore;$('scVal').textContent=totalScore.toLocaleString(LOC);}
  const m=MULT2(G2.combo),ck=G2.combo+'|'+m;
  if(force||h.ck!==ck){h.ck=ck;const el=$('combo');if(G2.combo>=2){el.innerHTML=`<b>COMBO ×${m}</b><span>${G2.combo}</span>`;el.style.opacity='1';el.style.color=m>=5?'#ff8a5c':m>=3?'#ffcf8a':'#e7e3da';}else el.style.opacity='0';}
  const ct=$('combo');if(ct&&G2.combo>=2)ct.style.setProperty('--ct',Math.max(0,G2.comboT/G2.L.comboT).toFixed(2));
  if(!G2.ready&&G2.rage>=100&&G2.rageT<=0&&gState==='playing'){G2.ready=true;G2.readyT=0;v2Call('RAGE READY','TAP ANYWHERE','#ff8a4c',1.4);sfx('bell',{vol:.7,rate:.8});vib(30);}
}

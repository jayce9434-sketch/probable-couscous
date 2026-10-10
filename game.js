(()=>{
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=1280,H=720,TAU=Math.PI*2,MAX_WAVE=BUGBREAK_DATA.maxWave||50;
let last=performance.now(),running=false,paused=false,selectedBug='ant',state=null,save=loadSave();
const keys={},touchMove={x:0,y:0};
const demo=new URLSearchParams(location.search).get('demo');

function defaultUpgrades(){return Object.fromEntries(BUGBREAK_DATA.permanent.map(u=>[u.id,0]))}
function loadSave(){
  let raw={};try{raw=JSON.parse(localStorage.getItem('bugbreakSave')||'{}')}catch{}
  const s={bestWave:0,gems:0,upgrades:defaultUpgrades(),v2Gift:false,...raw};s.upgrades={...defaultUpgrades(),...(raw.upgrades||{})};
  if(!s.v2Gift){s.gems=(s.gems||0)+18;s.v2Gift=true;s.justGifted=true}
  return s
}
function persist(){try{localStorage.setItem('bugbreakSave',JSON.stringify({...save,justGifted:false}))}catch{}UI.updateMenu(save)}
function rand(a,b){return a+Math.random()*(b-a)}function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function norm(x,y){const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}}function lerp(a,b,t){return a+(b-a)*t}

const deco=[];for(let i=0;i<190;i++)deco.push({x:rand(0,W),y:rand(0,H),r:rand(3,19),t:Math.random(),rot:rand(0,TAU),h:rand(0,1)});
const stones=[];for(let i=0;i<28;i++)stones.push({x:rand(0,W),y:rand(0,H),rx:rand(8,34),ry:rand(5,18),rot:rand(0,TAU),v:rand(.5,1)});
const fireflies=[];for(let i=0;i<16;i++)fireflies.push({x:rand(0,W),y:rand(0,H),p:rand(0,TAU),s:rand(.25,.7)});

function setupMenuBg(){state=null;running=false;paused=false;SFX.stopBoss();UI.setHud(false);UI.show('menu');UI.updateMenu(save);UI.renderBugSelect(save,selectedBug,id=>{selectedBug=id;rerenderSelect()})}
function rerenderSelect(){UI.renderBugSelect(save,selectedBug,id=>{selectedBug=id;rerenderSelect()})}
function basePlayer(){
  const b=BUGBREAK_DATA.bugs[selectedBug],u=save.upgrades;
  const hp=b.hp*(1+.09*(u.shell||0)),dashCd=Math.max(1.05,2.0*(1-.06*(u.dash||0)));
  return{x:W*.52,y:H*.55,r:20,angle:0,hp,maxHp:hp,speed:b.speed*(1+.04*(u.legs||0)),damage:b.damage*(1+.08*(u.fangs||0)),attackRate:b.attackRate,attackCd:0,attackRange:88,dashPower:b.dash,dashCooldown:dashCd,dashCd:0,dashTime:0,level:1,xp:0,nextXp:55,crit:.05+.02*(u.crit||0),killHeal:0,nestRegen:1.5*(u.workers||0),nestDR:b.nestGuard||0,lifesteal:b.lifesteal||0,pickupRadius:85+24*(u.magnet||0),repairAmount:82+18*(u.repair||0),id:selectedBug,color:b.color,accent:b.accent}
}
function newRun(){
  SFX.init();const p=basePlayer(),nestMax=760*(1+.14*(save.upgrades.nest||0));
  state={time:0,wave:1,crumbs:0,runGems:0,kills:0,player:p,nest:{x:W/2,y:H/2,r:62,hp:nestMax,maxHp:nestMax},enemies:[],drops:[],particles:[],slashes:[],shockwaves:[],shake:0,startedWave:false,boss:false,bossName:'',regenClock:0,repairCd:0,bossSpawnClock:0};
  running=true;paused=false;UI.hideAll();UI.setHud(true);spawnWave();UI.toast('Protect the nest · survive to Wave 50')
}
function waveBoss(){return BUGBREAK_DATA.bosses[state.wave]||null}
function spawnWave(){
  const s=state;s.enemies=[];s.startedWave=true;const boss=waveBoss();s.boss=!!boss;s.bossName=boss?.name||'';s.bossSpawnClock=0;
  if(boss){UI.bossBanner(true,boss.name);SFX.boss();SFX.startBoss(boss.music||0);setTimeout(()=>UI.bossBanner(false,boss.name),2300);spawnEnemy(boss.type,1,true)}
  else{
    SFX.stopBoss();const count=Math.min(28,3+Math.floor(s.wave*.63));for(let i=0;i<count;i++)spawnEnemy(pickEnemyType(s.wave));
  }
}
function pickEnemyType(w){const r=Math.random();if(w<3)return'spider';if(w<7)return r<.62?'spider':'beetle';if(w<14)return r<.42?'spider':r<.73?'beetle':'centipede';if(w<20)return r<.30?'spider':r<.56?'beetle':r<.80?'centipede':'roach';return r<.24?'spider':r<.45?'beetle':r<.66?'centipede':r<.84?'roach':'wasp'}
function spawnPoint(){const edge=Math.floor(Math.random()*4);if(edge===0)return{x:rand(-20,W+20),y:-45};if(edge===1)return{x:W+45,y:rand(-20,H+20)};if(edge===2)return{x:rand(-20,W+20),y:H+45};return{x:-45,y:rand(-20,H+20)}}
function spawnEnemy(type='spider',amount=1,isBoss=false){for(let k=0;k<amount;k++){
  const pos=spawnPoint(),w=state.wave,hpScale=1+w*.065+Math.max(0,w-28)*.012,dmgScale=1+w*.038;let base={r:18,speed:68+w*.55,hp:38*hpScale,damage:5.4*dmgScale,xp:15,crumbs:3};
  if(type==='beetle')base={r:23,speed:53+w*.44,hp:82*hpScale,damage:7.1*dmgScale,xp:24,crumbs:5};
  if(type==='centipede')base={r:17,speed:104+w*.65,hp:52*hpScale,damage:6.5*dmgScale,xp:22,crumbs:4};
  if(type==='roach')base={r:24,speed:78+w*.52,hp:112*hpScale,damage:8.1*dmgScale,xp:30,crumbs:6};
  if(type==='wasp')base={r:19,speed:126+w*.72,hp:61*hpScale,damage:7.4*dmgScale,xp:28,crumbs:5};
  if(isBoss){
    const mult={mantis:1,hornet:.9,wolfspider:1.12,stag:1.35,scorpion:1.2,empress:1.72}[type]||1,bhp=(430+w*31)*mult;
    base={r:type==='empress'?52:45,speed:74+w*.35,hp:bhp,damage:(9.5+w*.31)*(type==='stag'?1.1:1),xp:210+w*6,crumbs:45+Math.floor(w*1.5)}
  }
  state.enemies.push({x:pos.x,y:pos.y,vx:0,vy:0,angle:0,hitFlash:0,attackCd:rand(.1,.6),type,r:base.r,speed:base.speed,hp:base.hp,maxHp:base.hp,damage:base.damage,xp:base.xp,crumbs:base.crumbs,boss:isBoss,phase:rand(0,TAU),spawnClock:0,color:isBoss?waveBoss()?.color:null})
}}
function drop(x,y,kind='crumb',value=1){state.drops.push({x,y,kind,value,r:kind==='gem'?10:7,life:14,spin:rand(0,TAU)})}
function particles(x,y,color,count=7,spd=130){for(let i=0;i<count;i++){const a=rand(0,TAU),v=rand(spd*.25,spd);state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.28,.7),max:.7,r:rand(2,5),color})}}
function shockwave(x,y,color='#dfff8e'){state.shockwaves.push({x,y,r:8,life:.45,max:.45,color})}
function bite(){
  if(!running||paused||!state||state.player.attackCd>0)return;const p=state.player;p.attackCd=p.attackRate;SFX.bite();state.slashes.push({x:p.x,y:p.y,a:p.angle,life:.14,max:.14});let hit=false,totalHeal=0;
  for(const e of state.enemies){const d=dist(p,e);if(d<p.attackRange+e.r){const ang=Math.atan2(e.y-p.y,e.x-p.x),dif=Math.atan2(Math.sin(ang-p.angle),Math.cos(ang-p.angle));if(Math.abs(dif)<.82){const crit=Math.random()<p.crit,dmg=p.damage*(crit?1.85:1),dealt=Math.max(0,Math.min(e.hp,dmg));e.hp-=dmg;e.hitFlash=.09;const n=norm(e.x-p.x,e.y-p.y);e.x+=n.x*(e.boss?7:14);e.y+=n.y*(e.boss?7:14);particles(e.x,e.y,crit?'#fff2a6':'#f7d6b0',crit?9:5,crit?145:100);totalHeal+=dealt*p.lifesteal;hit=true}}
  }
  if(totalHeal>0)p.hp=Math.min(p.maxHp,p.hp+totalHeal);if(hit)state.shake=Math.max(state.shake,3)
}
function dash(){if(!running||paused||!state||state.player.dashCd>0)return;const p=state.player;p.dashCd=p.dashCooldown;p.dashTime=.18;SFX.dash();for(let i=0;i<12;i++)particles(p.x+rand(-9,9),p.y+rand(-9,9),'#a9f5ff',1,42)}
function repairNest(){if(!running||paused||!state)return;const s=state,p=s.player,n=s.nest;if(s.repairCd>0){UI.toast(`Repair recharging: ${s.repairCd.toFixed(1)}s`);return}if(s.crumbs<12){UI.toast('Need 12 crumbs to repair');return}if(n.hp>=n.maxHp-1){UI.toast('Nest is already healthy');return}s.crumbs-=12;s.repairCd=5;const bonus=p.id==='ladybug'?1.25:1,amt=p.repairAmount*bonus;n.hp=Math.min(n.maxHp,n.hp+amt);SFX.repair();shockwave(n.x,n.y,'#ffd56b');particles(n.x,n.y,'#ffd56b',18,120);UI.reward(`🛠️ Nest repaired +${Math.round(amt)} HP`)}
function levelCheck(){const p=state.player;if(p.xp>=p.nextXp){p.xp-=p.nextXp;p.level++;p.nextXp=Math.round(p.nextXp*1.28);paused=true;SFX.level();const opts=[...BUGBREAK_DATA.mutations].sort(()=>Math.random()-.5).slice(0,3);UI.renderMutations(opts,m=>{m.apply(p);UI.hideAll();paused=false;levelCheck()});UI.show('levelup')}}
function enemyDeath(e){
  const s=state,p=s.player;s.kills++;s.crumbs+=e.crumbs;p.xp+=e.xp;if(p.killHeal)p.hp=Math.min(p.maxHp,p.hp+p.killHeal);
  for(let i=0;i<Math.min(6,e.crumbs);i++)drop(e.x+rand(-16,16),e.y+rand(-16,16),'crumb');
  if(e.boss){const g=2+Math.floor(s.wave/10);s.runGems+=g;UI.reward(`💎 Boss defeated! +${g} gems`)}else{const chance=.08+.015*(save.upgrades.luck||0)+(s.wave<=5?.045:0);if(Math.random()<chance)drop(e.x,e.y,'gem')}
  particles(e.x,e.y,e.boss?'#ffd76c':'#c38a64',e.boss?36:12,e.boss?280:155);if(e.boss)shockwave(e.x,e.y,'#ffcf67');SFX.hit();levelCheck()
}
function clearWaveRewards(){
  const s=state,p=s.player,n=s.nest,boss=s.boss;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.27);n.hp=Math.min(n.maxHp,n.hp+n.maxHp*.13+22);let g=0;if(s.wave<=5)g=1;else if(s.wave%3===0)g=1;if(boss)g+=1;if(g){s.runGems+=g;SFX.gem()}else SFX.waveClear();
  save.bestWave=Math.max(save.bestWave,s.wave);persist();rerenderSelect();UI.reward(`Wave ${s.wave} clear · ❤️ healed · 🏠 repaired${g?` · 💎 +${g}`:''}`)
}
function nextWave(){clearWaveRewards();if(state.wave>=MAX_WAVE){winRun();return}state.wave++;state.startedWave=false;const start=()=>{if(!running||!state)return;if(paused){setTimeout(start,220);return}spawnWave();UI.toast(`Wave ${state.wave} / ${MAX_WAVE}`)};setTimeout(start,1050)}
function statMarkup(s){return`<div><span>Wave reached</span><b>${s.wave}/${MAX_WAVE}</b></div><div><span>Predators defeated</span><b>${s.kills}</b></div><div><span>Crumbs gathered</span><b>${s.crumbs}</b></div><div><span>Gems banked</span><b>+${s.runGems}</b></div>`}
function endRun(){if(!running)return;running=false;paused=false;SFX.stopBoss();save.gems+=state.runGems;save.bestWave=Math.max(save.bestWave,Math.min(MAX_WAVE,state.wave-1));persist();UI.setHud(false);SFX.death();UI.$('#runStats').innerHTML=statMarkup(state);UI.show('gameover')}
function winRun(){if(!running)return;running=false;paused=false;SFX.stopBoss();save.gems+=state.runGems;save.bestWave=MAX_WAVE;persist();UI.setHud(false);SFX.victory();UI.$('#victoryStats').innerHTML=statMarkup(state);UI.show('victory')}

function update(dt){
  if(!state||!running||paused)return;const s=state,p=s.player,n=s.nest;s.time+=dt;s.repairCd=Math.max(0,s.repairCd-dt);p.attackCd=Math.max(0,p.attackCd-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.dashTime=Math.max(0,p.dashTime-dt);
  let mx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0)+touchMove.x,my=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0)+touchMove.y;if(mx||my){const q=norm(mx,my);mx=q.x;my=q.y;p.angle=Math.atan2(my,mx)}
  const sp=p.dashTime>0?p.dashPower:p.speed;p.x=clamp(p.x+mx*sp*dt,24,W-24);p.y=clamp(p.y+my*sp*dt,24,H-24);if(keys.Space||keys.KeyJ)bite();if(keys.ShiftLeft||keys.ShiftRight||keys.KeyK)dash();if(keys.KeyR){keys.KeyR=false;repairNest()}
  s.regenClock+=dt;if(s.regenClock>=1){s.regenClock-=1;const regen=p.nestRegen+(p.id==='ladybug'?1.25:0);if(regen)n.hp=Math.min(n.maxHp,n.hp+regen)}
  for(const e of s.enemies){
    e.hitFlash=Math.max(0,e.hitFlash-dt);e.attackCd=Math.max(0,e.attackCd-dt);e.phase+=dt;e.spawnClock+=dt;let target=dist(e,p)<225?p:n;const q=norm(target.x-e.x,target.y-e.y);e.angle=Math.atan2(q.y,q.x);let es=e.speed;
    if(e.boss){if(Math.sin(e.phase*1.32)>.91)es*=1.52;if(e.hp<e.maxHp*.38)es*=1.12;if(state.wave>=20&&e.spawnClock>8.2&&s.enemies.length<7){e.spawnClock=0;spawnEnemy(state.wave>=35?'wasp':'spider',state.wave>=40?2:1);UI.toast(`${state.bossName} called reinforcements!`)}}
    if(e.type==='wasp'||e.type==='hornet')e.y+=Math.sin(e.phase*5)*10*dt;e.x+=q.x*es*dt;e.y+=q.y*es*dt;const hitD=e.r+(target===p?p.r:n.r);
    if(dist(e,target)<hitD&&e.attackCd<=0){e.attackCd=e.boss?.82:(e.type==='wasp'?1.2:1.08);let dmg=e.damage*(e.boss&&e.hp<e.maxHp*.38?1.12:1);if(target===n)dmg*=Math.max(.38,1-p.nestDR);target.hp-=dmg;if(target===p){SFX.hit();s.shake=Math.max(s.shake,5)}else s.shake=Math.max(s.shake,2);particles(target.x,target.y,target===p?'#ff8874':'#8be7d2',6,90)}
  }
  const dead=s.enemies.filter(e=>e.hp<=0);dead.forEach(enemyDeath);s.enemies=s.enemies.filter(e=>e.hp>0);
  for(const d of s.drops){d.life-=dt;d.spin+=dt*5;if(dist(d,p)<p.pickupRadius){const q=norm(p.x-d.x,p.y-d.y);d.x+=q.x*390*dt;d.y+=q.y*390*dt}if(dist(d,p)<p.r+d.r+5){d.life=0;if(d.kind==='gem'){s.runGems+=d.value||1;SFX.gem()}else SFX.pickup()}}
  s.drops=s.drops.filter(d=>d.life>0);for(const z of s.particles){z.life-=dt;z.x+=z.vx*dt;z.y+=z.vy*dt;z.vx*=.94;z.vy*=.94}s.particles=s.particles.filter(z=>z.life>0);for(const a of s.slashes)a.life-=dt;s.slashes=s.slashes.filter(a=>a.life>0);for(const q of s.shockwaves){q.life-=dt;q.r+=220*dt}s.shockwaves=s.shockwaves.filter(q=>q.life>0);s.shake*=.84;
  if(p.hp<=0||n.hp<=0)endRun();else if(s.startedWave&&s.enemies.length===0){s.startedWave=false;nextWave()}UI.updateHud(s)
}

function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function ellipse(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);if(fill)ctx.fill()}
function drawMap(t){
  const g=ctx.createRadialGradient(W*.52,H*.48,70,W*.5,H*.5,820);g.addColorStop(0,'#345d32');g.addColorStop(.52,'#1f4727');g.addColorStop(1,'#0b261b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // fence and flower-bed edge
  ctx.save();ctx.fillStyle='rgba(82,55,37,.72)';for(let x=-10;x<W+40;x+=64){rr(x,-10,58,70,7);ctx.fill();ctx.fillStyle='rgba(142,101,64,.22)';ctx.fillRect(x+7,0,4,52);ctx.fillStyle='rgba(82,55,37,.72)'}ctx.fillStyle='rgba(49,33,25,.45)';ctx.fillRect(0,45,W,12);ctx.restore();
  // pond
  ctx.save();const pg=ctx.createRadialGradient(180,155,10,180,155,130);pg.addColorStop(0,'rgba(79,172,169,.58)');pg.addColorStop(1,'rgba(24,92,88,.48)');ctx.fillStyle=pg;ctx.beginPath();ctx.ellipse(165,162,145,91,-.12,0,TAU);ctx.fill();ctx.strokeStyle='rgba(161,217,190,.15)';ctx.lineWidth=5;ctx.stroke();for(let i=0;i<5;i++){ctx.fillStyle='rgba(79,124,65,.65)';ctx.beginPath();ctx.arc(95+i*40,145+Math.sin(i)*19,10+i%2*4,0,TAU);ctx.fill()}ctx.restore();
  // winding soil trail
  ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle='#aa8658';ctx.lineWidth=78;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-65,H*.77);ctx.bezierCurveTo(W*.19,H*.69,W*.26,H*.35,W*.49,H*.55);ctx.bezierCurveTo(W*.72,H*.73,W*.82,H*.28,W+70,H*.36);ctx.stroke();ctx.globalAlpha=.12;ctx.strokeStyle='#f0d3a1';ctx.lineWidth=3;ctx.setLineDash([4,15]);ctx.stroke();ctx.restore();
  // grass, leaves and flowers
  for(const d of deco){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);if(d.y<72){ctx.restore();continue}if(d.t<.52){ctx.strokeStyle=`rgba(${80+Math.floor(d.h*35)},${145+Math.floor(d.h*45)},72,${.22+d.t*.3})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,d.r*.8);ctx.quadraticCurveTo(3,-d.r*.2,0,-d.r);ctx.moveTo(2,d.r*.6);ctx.quadraticCurveTo(10,-d.r*.05,7,-d.r*.6);ctx.stroke()}else if(d.t<.76){ctx.fillStyle='rgba(68,118,57,.45)';ctx.beginPath();ctx.ellipse(-4,0,7,3,-.6,0,TAU);ctx.ellipse(5,-2,7,3,.45,0,TAU);ctx.fill()}else if(d.t<.88){ctx.fillStyle='rgba(189,104,63,.28)';ctx.beginPath();ctx.ellipse(0,0,d.r*.65,d.r*.25,0,0,TAU);ctx.fill()}else{const cols=['rgba(255,210,92,.72)','rgba(237,140,177,.66)','rgba(202,222,255,.66)'];ctx.fillStyle=cols[Math.floor(d.h*cols.length)%cols.length];for(let a=0;a<TAU;a+=TAU/5){ctx.beginPath();ctx.arc(Math.cos(a)*4,Math.sin(a)*4,3,0,TAU);ctx.fill()}ctx.fillStyle='rgba(255,235,122,.8)';ctx.beginPath();ctx.arc(0,0,2.5,0,TAU);ctx.fill()}ctx.restore()}
  for(const s of stones){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);const sg=ctx.createLinearGradient(-s.rx,-s.ry,s.rx,s.ry);sg.addColorStop(0,`rgba(150,157,132,${.18*s.v})`);sg.addColorStop(1,`rgba(42,65,49,${.32*s.v})`);ctx.fillStyle=sg;ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=6;ctx.beginPath();ctx.ellipse(0,0,s.rx,s.ry,0,0,TAU);ctx.fill();ctx.restore()}
  // fallen log
  ctx.save();ctx.translate(1060,575);ctx.rotate(-.22);ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=14;ctx.fillStyle='#4c3021';rr(-120,-31,240,62,27);ctx.fill();const lg=ctx.createLinearGradient(0,-30,0,30);lg.addColorStop(0,'#785035');lg.addColorStop(1,'#493020');ctx.fillStyle=lg;rr(-115,-26,220,52,23);ctx.fill();ctx.fillStyle='rgba(35,21,14,.32)';for(let i=-88;i<94;i+=31)ctx.fillRect(i,-24,4,48);ctx.fillStyle='#ad7544';ctx.beginPath();ctx.ellipse(111,0,25,28,0,0,TAU);ctx.fill();ctx.strokeStyle='#6b452a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(111,0,15,0,TAU);ctx.stroke();ctx.restore();
  // mushrooms and acorn
  for(const [x,y,s] of [[180,578,1],[226,598,.7],[1130,168,.9]]){ctx.save();ctx.translate(x,y);ctx.fillStyle='#ddcf9e';rr(-5,-2,10,25*s,4);ctx.fill();ctx.fillStyle='#bc5d47';ctx.beginPath();ctx.ellipse(0,0,23*s,11*s,0,Math.PI,TAU);ctx.fill();ctx.fillStyle='rgba(255,237,192,.7)';for(const px of [-8,4,10]){ctx.beginPath();ctx.arc(px*s,-4*s,2*s,0,TAU);ctx.fill()}ctx.restore()}
  ctx.save();ctx.translate(916,128);ctx.rotate(.35);ctx.fillStyle='#84542f';ctx.beginPath();ctx.ellipse(0,8,17,22,0,0,TAU);ctx.fill();ctx.fillStyle='#4d3925';ctx.beginPath();ctx.ellipse(0,-5,19,9,0,0,TAU);ctx.fill();ctx.fillRect(-2,-18,4,11);ctx.restore();
  // fireflies
  for(const f of fireflies){const a=.18+.22*(.5+.5*Math.sin(t*2*f.s+f.p));ctx.fillStyle=`rgba(214,255,104,${a})`;ctx.shadowColor='rgba(214,255,104,.8)';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(f.x+Math.sin(t*f.s+f.p)*18,f.y+Math.cos(t*f.s*.7+f.p)*12,1.7,0,TAU);ctx.fill();ctx.shadowBlur=0}
}
function bodyShadow(x,y,rx=25,ry=13){ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x+4,y+8,rx,ry,0,0,TAU);ctx.fill();ctx.restore()}
function drawNest(n){ctx.save();ctx.translate(n.x,n.y);const pulse=1+Math.sin(performance.now()/470)*.018;ctx.scale(pulse,pulse);ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=18;for(let i=0;i<5;i++){const ng=ctx.createLinearGradient(0,-35,0,35);ng.addColorStop(0,`rgba(111,78,46,${.38+i*.07})`);ng.addColorStop(1,`rgba(43,29,20,${.46+i*.06})`);ctx.fillStyle=ng;ctx.beginPath();ctx.ellipse(0,13-i*7,86-i*12,39-i*4,0,0,TAU);ctx.fill()}ctx.shadowBlur=0;ctx.fillStyle='#20150f';ctx.beginPath();ctx.ellipse(0,-5,33,19,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(125,255,193,.32)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,69,0,TAU);ctx.stroke();for(let i=0;i<4;i++){const a=performance.now()/900+i*TAU/4;ctx.fillStyle='rgba(218,183,126,.7)';ctx.beginPath();ctx.arc(Math.cos(a)*53,Math.sin(a)*25,3,0,TAU);ctx.fill()}ctx.restore()}
function localLegs(col='#241d18',wide=false){ctx.strokeStyle=col;ctx.lineWidth=wide?3:2;ctx.lineCap='round';for(const sy of[-1,1])for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*8,sy*6);ctx.lineTo(i*9+3,sy*(15+Math.abs(i)*2));ctx.lineTo(i*12+8,sy*(21+Math.abs(i)*3));ctx.stroke()}}
function drawAnt(p){bodyShadow(p.x,p.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);localLegs('#3b2620',true);const g=ctx.createLinearGradient(-30,-10,30,12);g.addColorStop(0,'#71372f');g.addColorStop(.55,p.color);g.addColorStop(1,'#c46c4d');ctx.fillStyle=g;ctx.strokeStyle='rgba(28,13,11,.55)';ctx.lineWidth=1.5;for(const [x,rx,ry] of[[-18,14,11],[2,10,9],[21,12,11]]){ctx.beginPath();ctx.ellipse(x,0,rx,ry,0,0,TAU);ctx.fill();ctx.stroke()}ctx.strokeStyle='#553126';ctx.lineWidth=2;for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(28,sy*4);ctx.quadraticCurveTo(39,sy*15,46,sy*12);ctx.stroke()}ctx.fillStyle='#11180e';ctx.beginPath();ctx.arc(24,-4,2.2,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,220,170,.4)';ctx.beginPath();ctx.ellipse(-20,-5,6,2,-.2,0,TAU);ctx.fill();ctx.restore()}
function drawTermite(p){bodyShadow(p.x,p.y,31,14);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);localLegs('#6d4a35',true);const g=ctx.createLinearGradient(-35,-11,35,11);g.addColorStop(0,'#cbb78f');g.addColorStop(.55,'#ead8ad');g.addColorStop(1,'#b88b63');ctx.fillStyle=g;ctx.strokeStyle='rgba(92,61,41,.6)';for(const [x,rx,ry]of[[-17,16,12],[4,13,11],[24,14,13]]){ctx.beginPath();ctx.ellipse(x,0,rx,ry,0,0,TAU);ctx.fill();ctx.stroke()}ctx.fillStyle='#9d5f3e';ctx.shadowColor='rgba(122,68,41,.35)';ctx.shadowBlur=6;for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(31,sy*7);ctx.quadraticCurveTo(56,sy*23,48,sy*2);ctx.quadraticCurveTo(42,sy*7,31,0);ctx.closePath();ctx.fill()}ctx.shadowBlur=0;ctx.fillStyle='#1b120d';ctx.beginPath();ctx.arc(27,-4,1.5,0,TAU);ctx.fill();ctx.restore()}
function drawLadybug(p){bodyShadow(p.x,p.y,29,16);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);localLegs('#191414',true);ctx.fillStyle='#161719';ctx.beginPath();ctx.ellipse(-15,0,11,10,0,0,TAU);ctx.fill();const g=ctx.createLinearGradient(-8,-17,24,17);g.addColorStop(0,'#f65b4f');g.addColorStop(1,'#a91e28');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(9,0,26,18,0,0,TAU);ctx.fill();ctx.strokeStyle='#25191a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-17);ctx.lineTo(8,17);ctx.stroke();ctx.fillStyle='#1c1b1c';for(const [x,y,r]of[[-2,-7,4],[-2,8,3],[17,-9,3.5],[19,7,4],[8,0,2.8]]){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(-1,-11,9,3,-.2,0,TAU);ctx.fill();ctx.fillStyle='#d9e6d8';ctx.beginPath();ctx.arc(-20,-4,1.7,0,TAU);ctx.fill();ctx.restore()}
function drawFly(p){bodyShadow(p.x,p.y,27,15);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=.52;ctx.fillStyle='#c8f5ff';ctx.strokeStyle='rgba(92,149,158,.45)';for(const sy of[-1,1]){ctx.beginPath();ctx.ellipse(-2,sy*15,22,9,sy*.42,0,TAU);ctx.fill();ctx.stroke()}ctx.globalAlpha=1;localLegs('#1b2b2d');const g=ctx.createLinearGradient(-25,-10,24,10);g.addColorStop(0,'#263b40');g.addColorStop(1,'#5b7776');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(-12,0,15,11,0,0,TAU);ctx.ellipse(9,0,14,13,0,0,TAU);ctx.fill();ctx.fillStyle='#b64b50';ctx.shadowColor='#da6469';ctx.shadowBlur=5;ctx.beginPath();ctx.arc(16,-5,5,0,TAU);ctx.arc(16,5,5,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.restore()}
function drawMosquito(p){bodyShadow(p.x,p.y,29,11);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle='#4d4036';ctx.lineWidth=1.6;for(const sy of[-1,1])for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*5,sy*3);ctx.lineTo(i*7-4,sy*(15+i*2));ctx.lineTo(i*12-10,sy*(26+i*3));ctx.stroke()}ctx.globalAlpha=.45;ctx.fillStyle='#d6f4ee';for(const sy of[-1,1]){ctx.beginPath();ctx.ellipse(-5,sy*12,22,6,sy*.25,0,TAU);ctx.fill()}ctx.globalAlpha=1;ctx.fillStyle='#6d5845';ctx.beginPath();ctx.ellipse(-13,0,17,7,0,0,TAU);ctx.ellipse(7,0,10,8,0,0,TAU);ctx.arc(20,0,8,0,TAU);ctx.fill();ctx.strokeStyle='#8d6b54';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(27,0);ctx.lineTo(51,0);ctx.stroke();ctx.fillStyle='#b44e53';ctx.beginPath();ctx.arc(21,-3,2.4,0,TAU);ctx.fill();ctx.restore()}
function drawPlayer(p){if(p.id==='termite')drawTermite(p);else if(p.id==='ladybug')drawLadybug(p);else if(p.id==='fly')drawFly(p);else if(p.id==='mosquito')drawMosquito(p);else drawAnt(p);if(p.dashTime>0){ctx.strokeStyle='rgba(123,239,255,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r+12,0,TAU);ctx.stroke()}}
function enemyShadow(e){bodyShadow(e.x,e.y,e.r*1.15,e.r*.55)}
function drawBossBody(e){
  const flash=e.hitFlash>0?'#fff':e.color||'#6b803a';ctx.fillStyle=flash;ctx.strokeStyle='rgba(20,12,10,.55)';ctx.lineWidth=3;
  if(e.type==='hornet'||e.type==='empress'){ctx.globalAlpha=.38;ctx.fillStyle='#d8f5f2';for(const sy of[-1,1]){ctx.beginPath();ctx.ellipse(-8,sy*26,31,10,sy*.25,0,TAU);ctx.fill()}ctx.globalAlpha=1;ctx.fillStyle=flash;ctx.beginPath();ctx.ellipse(-20,0,26,19,0,0,TAU);ctx.ellipse(16,0,25,23,0,0,TAU);ctx.fill();ctx.fillStyle=e.type==='empress'?'#f2b84d':'#2f251c';for(let x=-29;x<4;x+=12)ctx.fillRect(x,-17,7,34);ctx.fillStyle='#a33e38';ctx.beginPath();ctx.arc(29,-8,5,0,TAU);ctx.arc(29,8,5,0,TAU);ctx.fill();ctx.strokeStyle='#39251d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-42,0);ctx.lineTo(-58,0);ctx.stroke()}
  else if(e.type==='wolfspider'){ctx.fillStyle=flash;for(const sy of[-1,1])for(let i=0;i<4;i++){ctx.strokeStyle='#4a302a';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8+i*6,sy*8);ctx.lineTo(-30+i*10,sy*(25+i*4));ctx.lineTo(-43+i*13,sy*(31+i*6));ctx.stroke()}ctx.beginPath();ctx.ellipse(-16,0,24,20,0,0,TAU);ctx.ellipse(18,0,27,24,0,0,TAU);ctx.fill();ctx.fillStyle='#e36a54';for(const yy of[-8,0,8]){ctx.beginPath();ctx.arc(34,yy,2.5,0,TAU);ctx.fill()}}
  else if(e.type==='stag'){ctx.fillStyle=flash;ctx.beginPath();ctx.ellipse(-12,0,34,25,0,0,TAU);ctx.arc(25,0,20,0,TAU);ctx.fill();ctx.strokeStyle='#2d1d1a';ctx.lineWidth=7;for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(36,sy*8);ctx.quadraticCurveTo(62,sy*28,70,sy*8);ctx.quadraticCurveTo(59,sy*15,48,0);ctx.stroke()}}
  else if(e.type==='scorpion'){ctx.fillStyle=flash;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(i*12,0,14,17,0,0,TAU);ctx.fill()}ctx.strokeStyle='#6d5534';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-35,0);ctx.quadraticCurveTo(-66,-20,-61,-47);ctx.quadraticCurveTo(-56,-68,-39,-61);ctx.stroke();ctx.fillStyle='#3a2b20';ctx.beginPath();ctx.moveTo(-36,-62);ctx.lineTo(-22,-70);ctx.lineTo(-28,-54);ctx.closePath();ctx.fill();ctx.strokeStyle='#6d5534';ctx.lineWidth=8;for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(29,sy*8);ctx.lineTo(50,sy*25);ctx.lineTo(62,sy*12);ctx.stroke()}}
  else{ctx.fillStyle=flash;ctx.beginPath();ctx.ellipse(-18,0,26,19,0,0,TAU);ctx.ellipse(18,0,22,23,0,0,TAU);ctx.fill();ctx.strokeStyle='#8eae50';ctx.lineWidth=8;for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(8,sy*11);ctx.lineTo(34,sy*38);ctx.lineTo(58,sy*18);ctx.stroke()}ctx.fillStyle='#151c0f';ctx.beginPath();ctx.arc(28,-8,3,0,TAU);ctx.arc(28,8,3,0,TAU);ctx.fill()}
}
function drawEnemy(e){enemyShadow(e);ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);if(e.boss)drawBossBody(e);else if(e.type==='spider'){ctx.fillStyle=e.hitFlash?'#fff':'#34262c';for(const sy of[-1,1])for(let i=0;i<4;i++){ctx.strokeStyle='#281d22';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5+i*4,sy*5);ctx.lineTo(-20+i*7,sy*(14+i*3));ctx.lineTo(-29+i*9,sy*(18+i*4));ctx.stroke()}ctx.beginPath();ctx.arc(-8,0,10,0,TAU);ctx.arc(8,0,12,0,TAU);ctx.fill();ctx.fillStyle='#e7664f';ctx.beginPath();ctx.arc(13,-4,2,0,TAU);ctx.arc(13,4,2,0,TAU);ctx.fill()}
  else if(e.type==='beetle'){const bg=ctx.createLinearGradient(-23,-18,23,18);bg.addColorStop(0,e.hitFlash?'#fff':'#315c4d');bg.addColorStop(1,e.hitFlash?'#fff':'#162e29');ctx.fillStyle=bg;ctx.beginPath();ctx.ellipse(0,0,24,18,0,0,TAU);ctx.fill();ctx.strokeStyle='#6aa082';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,-17);ctx.lineTo(-3,17);ctx.stroke();ctx.fillStyle='#14231f';ctx.beginPath();ctx.arc(20,0,8,0,TAU);ctx.fill()}
  else if(e.type==='centipede'){ctx.strokeStyle='#4b2e24';ctx.lineWidth=2;for(let i=-24;i<=24;i+=8){ctx.beginPath();ctx.moveTo(i,-4);ctx.lineTo(i-2,-14);ctx.moveTo(i,4);ctx.lineTo(i-2,14);ctx.stroke()}for(let i=-24;i<=24;i+=9){ctx.fillStyle=e.hitFlash?'#fff':'#995235';ctx.beginPath();ctx.arc(i,0,7,0,TAU);ctx.fill()}}
  else if(e.type==='roach'){ctx.fillStyle=e.hitFlash?'#fff':'#684737';ctx.beginPath();ctx.ellipse(0,0,27,17,0,0,TAU);ctx.fill();ctx.strokeStyle='#38271f';ctx.lineWidth=2;for(const sy of[-1,1]){ctx.beginPath();ctx.moveTo(-13,sy*9);ctx.lineTo(-20,sy*24);ctx.moveTo(0,sy*10);ctx.lineTo(3,sy*25);ctx.moveTo(13,sy*8);ctx.lineTo(22,sy*20);ctx.stroke()}ctx.beginPath();ctx.moveTo(22,-5);ctx.quadraticCurveTo(40,-18,45,-12);ctx.moveTo(22,5);ctx.quadraticCurveTo(40,18,45,12);ctx.stroke()}
  else{ctx.globalAlpha=.4;ctx.fillStyle='#d7f6ef';for(const sy of[-1,1]){ctx.beginPath();ctx.ellipse(-5,sy*13,18,7,sy*.35,0,TAU);ctx.fill()}ctx.globalAlpha=1;ctx.fillStyle=e.hitFlash?'#fff':'#9c6e32';ctx.beginPath();ctx.ellipse(-8,0,18,11,0,0,TAU);ctx.arc(12,0,11,0,TAU);ctx.fill();ctx.fillStyle='#28231c';ctx.fillRect(-10,-10,6,20);ctx.fillRect(2,-10,5,20)}ctx.restore();
  if(e.boss||e.hp<e.maxHp){const w=e.boss?128:40;ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(e.x-w/2,e.y-e.r-21,w,6);ctx.fillStyle=e.boss?'#ff866f':'#d9ef78';ctx.fillRect(e.x-w/2,e.y-e.r-21,w*clamp(e.hp/e.maxHp,0,1),6);if(e.boss){ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText(state.bossName,e.x,e.y-e.r-28)}}
}
function drawDrops(){for(const d of state.drops){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.spin);if(d.kind==='gem'){ctx.shadowBlur=16;ctx.shadowColor='#78f4ff';const gg=ctx.createLinearGradient(-8,-10,8,10);gg.addColorStop(0,'#d7feff');gg.addColorStop(.45,'#6feaff');gg.addColorStop(1,'#2baec9');ctx.fillStyle=gg;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(9,0);ctx.lineTo(0,11);ctx.lineTo(-9,0);ctx.closePath();ctx.fill()}else{ctx.fillStyle='#ebca78';rr(-6,-5,12,10,3);ctx.fill();ctx.fillStyle='#a98242';ctx.fillRect(-4,-3,3,3);ctx.fillRect(1,1,2,2)}ctx.restore()}}
function render(){ctx.save();let sx=0,sy=0;if(state&&state.shake){sx=rand(-state.shake,state.shake);sy=rand(-state.shake,state.shake)}ctx.translate(sx,sy);drawMap(performance.now()/1000);if(state){drawNest(state.nest);drawDrops();for(const e of state.enemies)drawEnemy(e);drawPlayer(state.player);for(const a of state.slashes){ctx.save();ctx.globalAlpha=a.life/a.max;ctx.strokeStyle='#efffae';ctx.shadowColor='#dfff81';ctx.shadowBlur=8;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.arc(a.x,a.y,58,a.a-.72,a.a+.72);ctx.stroke();ctx.restore()}for(const q of state.shockwaves){ctx.save();ctx.globalAlpha=q.life/q.max;ctx.strokeStyle=q.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,TAU);ctx.stroke();ctx.restore()}for(const p of state.particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill()}ctx.globalAlpha=1}else{const t=performance.now()/1000;drawLadybug({x:W*.77+Math.sin(t*.65)*30,y:H*.45+Math.cos(t*.8)*15,angle:-2.7+Math.sin(t*.45)*.2});drawTermite({x:W*.83+Math.sin(t*.5)*18,y:H*.68+Math.cos(t*.6)*12,angle:-2.45,color:'#ead7ae'});drawMosquito({x:W*.17+Math.sin(t*.75)*28,y:H*.34+Math.cos(t*.9)*18,angle:.35})}ctx.restore()}
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);

// UI wiring
UI.$('#playBtn').onclick=()=>{SFX.click();newRun()};UI.$('#shopBtn').onclick=()=>{SFX.click();UI.renderShop(save,buyUpgrade);UI.show('shop')};UI.$('[data-close="shop"]').onclick=()=>{SFX.click();UI.show('menu')};
function buyUpgrade(u,cost){const rank=save.upgrades[u.id]||0;if(rank>=u.max||save.gems<cost)return;save.gems-=cost;save.upgrades[u.id]=rank+1;persist();SFX.gem();UI.renderShop(save,buyUpgrade);UI.toast(`${u.name} upgraded`)}
UI.$('#pauseBtn').onclick=()=>{if(!running)return;paused=true;SFX.stopBoss();UI.show('pause')};UI.$('#resumeBtn').onclick=()=>{SFX.click();UI.hideAll();paused=false;if(state?.boss)SFX.startBoss(waveBoss()?.music||0)};UI.$('#quitBtn').onclick=()=>{SFX.click();running=false;state=null;SFX.stopBoss();UI.setHud(false);setupMenuBg();rerenderSelect()};
UI.$('#againBtn').onclick=()=>{SFX.click();newRun()};UI.$('#menuBtn').onclick=()=>{SFX.click();state=null;setupMenuBg();rerenderSelect()};UI.$('#victoryAgainBtn').onclick=()=>{SFX.click();newRun()};UI.$('#victoryMenuBtn').onclick=()=>{SFX.click();state=null;setupMenuBg();rerenderSelect()};
UI.$('#resetBtn').onclick=()=>{if(confirm('Erase BUGBREAK save data? A fresh save gets the 18 starter gems again.')){localStorage.removeItem('bugbreakSave');save=loadSave();selectedBug='ant';persist();setupMenuBg();rerenderSelect();UI.toast('Fresh colony: +18 starter gems')}};
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'&&running){paused=!paused;if(paused){SFX.stopBoss();UI.show('pause')}else{UI.hideAll();if(state?.boss)SFX.startBoss(waveBoss()?.music||0)}}});window.addEventListener('keyup',e=>keys[e.code]=false);
UI.$('#biteBtn').onpointerdown=e=>{e.preventDefault();bite()};UI.$('#dashBtn').onpointerdown=e=>{e.preventDefault();dash()};UI.$('#repairBtn').onpointerdown=e=>{e.preventDefault();repairNest()};
const base=UI.$('#stickBase'),knob=UI.$('#stickKnob');let stickId=null;function stick(e){const r=base.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.min(42,Math.hypot(x,y)),a=Math.atan2(y,x);touchMove.x=Math.cos(a)*(m/42);touchMove.y=Math.sin(a)*(m/42);knob.style.transform=`translate(${touchMove.x*34}px,${touchMove.y*34}px)`}base.onpointerdown=e=>{stickId=e.pointerId;base.setPointerCapture(stickId);stick(e)};base.onpointermove=e=>{if(e.pointerId===stickId)stick(e)};function stopStick(e){if(e.pointerId===stickId){stickId=null;touchMove.x=touchMove.y=0;knob.style.transform=''}}base.onpointerup=stopStick;base.onpointercancel=stopStick;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused){paused=true;SFX.stopBoss();UI.show('pause')}});

function demoState(kind){
  save=JSON.parse(JSON.stringify(save));save.bestWave=Math.max(save.bestWave,16);save.gems=Math.max(save.gems,74);save.upgrades={...defaultUpgrades(),shell:3,fangs:3,legs:2,nest:3,workers:2,magnet:2,luck:2,dash:1,repair:2,crit:1};UI.updateMenu(save);
  if(kind==='shop'){UI.renderShop(save,buyUpgrade);UI.show('shop');return}if(kind==='menu'){setupMenuBg();rerenderSelect();return}
  selectedBug=kind==='boss'?'termite':kind==='mosquito'?'mosquito':'ladybug';newRun();
  if(kind==='boss'){state.wave=20;state.enemies=[];spawnWave();state.player.level=9;state.player.damage*=2.1;state.player.x=520;state.player.y=410;state.runGems=14;state.crumbs=151;const e=state.enemies[0];e.x=900;e.y=365;e.hp=e.maxHp*.68;UI.bossBanner(true,state.bossName)}
  else if(kind==='battle'){state.wave=8;state.enemies=[];for(let i=0;i<10;i++)spawnEnemy(['spider','beetle','centipede'][i%3]);state.player.level=6;state.player.damage*=1.65;state.player.x=575;state.player.y=390;state.crumbs=96;state.runGems=8;const pos=[[790,340],[860,465],[410,315],[955,265],[355,520],[755,560],[1060,420],[460,575],[1020,545],[330,405]];state.enemies.forEach((e,i)=>{e.x=pos[i][0];e.y=pos[i][1]})}
  else{state.wave=12;state.enemies=[];for(let i=0;i<8;i++)spawnEnemy(i%3===0?'wasp':i%2?'centipede':'beetle');state.player.level=7;state.player.damage*=1.8;state.player.x=620;state.player.y=335;state.crumbs=128;state.runGems=11;const pos=[[790,285],[885,395],[730,530],[455,250],[1040,465],[390,480],[980,205],[510,565]];state.enemies.forEach((e,i)=>{e.x=pos[i][0];e.y=pos[i][1]})}
  paused=true;UI.hideAll();UI.setHud(true);UI.updateHud(state)
}

persist();setupMenuBg();rerenderSelect();if(save.justGifted&&!demo)setTimeout(()=>UI.toast('🎁 Update gift: +18 starter gems!'),350);if(demo)setTimeout(()=>demoState(demo),120)
})();

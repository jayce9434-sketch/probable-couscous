window.UI = (()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const screens=['menu','shop','levelup','pause','gameover','victory'];let toastTimer,rewardTimer;
  function show(name){screens.forEach(x=>$('#'+x).classList.toggle('active',x===name))}
  function hideAll(){screens.forEach(x=>$('#'+x).classList.remove('active'))}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1700)}
  function reward(msg){const t=$('#waveReward');t.textContent=msg;t.classList.add('show');clearTimeout(rewardTimer);rewardTimer=setTimeout(()=>t.classList.remove('show'),1700)}
  function renderBugSelect(save,selected,onSelect){
    const wrap=$('#bugSelect');wrap.innerHTML='';Object.entries(BUGBREAK_DATA.bugs).forEach(([id,b])=>{
      const locked=b.unlockWave&&save.bestWave<b.unlockWave,el=document.createElement('button');el.className='bug-option'+(selected===id?' selected':'')+(locked?' locked':'');
      el.innerHTML=`<span class="emoji">${b.icon}</span><div><b>${b.name}</b><small>${locked?`Reach wave ${b.unlockWave}`:b.desc}</small></div>${locked?'<span class="tag">LOCKED</span>':'<span class="ready">READY</span>'}`;
      el.onclick=()=>{SFX.click();if(locked){toast(`Reach wave ${b.unlockWave} to unlock ${b.name}`);return}onSelect(id)};wrap.appendChild(el)
    })
  }
  function renderShop(save,onBuy){
    $('#shopGems').textContent=save.gems;const g=$('#upgradeGrid');g.innerHTML='';BUGBREAK_DATA.permanent.forEach(u=>{
      const rank=save.upgrades[u.id]||0,cost=Math.round(u.base*Math.pow(1.38,rank)),maxed=rank>=u.max,el=document.createElement('div');el.className='upgrade'+(maxed?' maxed':'');
      el.innerHTML=`<div class="upgrade-icon">${u.icon}</div><div class="upgrade-copy"><h4>${u.name}</h4><p>${u.desc}</p><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<rank?'on':''}"></i>`).join('')}</div></div><div class="upgrade-buy"><span>Rank ${rank}/${u.max}</span><button ${maxed||save.gems<cost?'disabled':''}>${maxed?'MAX':`💎 ${cost}`}</button></div>`;
      el.querySelector('button').onclick=()=>onBuy(u,cost);g.appendChild(el)
    })
  }
  function renderMutations(options,onPick){const c=$('#cards');c.innerHTML='';options.forEach(m=>{const b=document.createElement('button');b.className='mut-card';b.innerHTML=`<span class="icon">${m.icon}</span><h4>${m.name}</h4><p>${m.desc}</p><span class="choose">CHOOSE →</span>`;b.onclick=()=>{SFX.click();onPick(m)};c.appendChild(b)})}
  function updateMenu(save){$('#bestWave').textContent=Math.min(50,save.bestWave||0);$('#menuGems').textContent=save.gems||0}
  function updateHud(state){
    const p=state.player,n=state.nest;$('#hpBar').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;$('#hpText').textContent=`${Math.ceil(p.hp)}/${Math.ceil(p.maxHp)}`;$('#nestBar').style.width=`${Math.max(0,n.hp/n.maxHp*100)}%`;$('#nestText').textContent=`${Math.ceil(n.hp)}/${Math.ceil(n.maxHp)}`;$('#waveText').textContent=state.wave;$('#enemyCount').textContent=state.boss&&state.enemies.length?state.bossName:`${state.enemies.length} left`;$('#crumbsText').textContent=state.crumbs;$('#gemsText').textContent=state.runGems;$('#levelText').textContent=p.level;$('#xpBar').style.width=`${Math.min(100,p.xp/p.nextXp*100)}%`;
    const rb=$('#repairBtn');if(rb){const ready=state.repairCd<=0&&state.crumbs>=12&&n.hp<n.maxHp;rb.classList.toggle('not-ready',!ready);rb.innerHTML=state.repairCd>0?`REPAIR<br><small>${state.repairCd.toFixed(1)}s</small>`:`REPAIR<br><small>12 🍞</small>`}
  }
  function setHud(on){$('#hud').classList.toggle('hidden',!on);$('#mobileControls').classList.toggle('hidden',!on)}
  function bossBanner(on,name='APEX PREDATOR'){if(name)$('#bossName').textContent=name.toUpperCase();$('#bossBanner').classList.toggle('show',on)}
  return {$,$$,show,hideAll,toast,reward,renderBugSelect,renderShop,renderMutations,updateMenu,updateHud,setHud,bossBanner}
})();

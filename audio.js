window.SFX = (()=>{
  let ctx, master=.24, music=.16, bossTimer=null, step=0, bossTrack=0;
  const scales=[
    [55,65.41,73.42,82.41,98,110],
    [61.74,73.42,82.41,92.5,110,123.47],
    [49,58.27,65.41,73.42,87.31,98],
    [46.25,55,61.74,69.3,82.41,92.5],
    [51.91,61.74,69.3,77.78,92.5,103.83],
    [43.65,51.91,58.27,65.41,77.78,87.31]
  ];
  function init(){if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume()}
  function tone(freq=440,dur=.08,type='sine',vol=.3,slide=0,when=0){
    init();const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),t+dur);
    g.gain.setValueAtTime(Math.max(.0001,vol*master),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur+.02);
  }
  function musicTone(freq,dur,type='triangle',vol=.18,when=0){
    init();const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
    f.type='lowpass';f.frequency.value=1450;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol*music),t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(f);f.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur+.03);
  }
  function drum(low=false,when=0){
    init();const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(low?115:185,t);o.frequency.exponentialRampToValueAtTime(low?48:70,t+.09);g.gain.setValueAtTime((low?.20:.09)*music,t);g.gain.exponentialRampToValueAtTime(.0001,t+.11);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.12)
  }
  function startBoss(track=0){
    init();stopBoss();bossTrack=track%scales.length;step=0;const seq=()=>{
      const s=scales[bossTrack],bar=step%16,root=s[(Math.floor(step/4)+bossTrack)%s.length];
      if(bar%4===0){musicTone(root,.42,'sawtooth',.15);musicTone(root*2,.30,'triangle',.09,.02);drum(true)}
      if(bar===2||bar===6||bar===10||bar===14)drum(false);
      if(bar%2===0){const note=s[(step*3+bossTrack)%s.length]*2;musicTone(note,.16,'square',.045,.015)}
      if(bar===7||bar===15){musicTone(root*1.5,.20,'sawtooth',.055);musicTone(root*3,.12,'triangle',.045,.04)}
      step++;
    };seq();bossTimer=setInterval(seq,145);
  }
  function stopBoss(){if(bossTimer){clearInterval(bossTimer);bossTimer=null}}
  return {
    init,
    bite(){tone(185,.05,'square',.29,-55)}, dash(){tone(220,.11,'sawtooth',.20,480)},
    hit(){tone(82,.08,'square',.22,-22)}, pickup(){tone(690,.055,'sine',.11,230)},
    level(){tone(430,.13,'triangle',.2,460);setTimeout(()=>tone(730,.16,'triangle',.17,400),75)},
    boss(){tone(92,.32,'sawtooth',.28,-25);setTimeout(()=>tone(138,.24,'square',.16,-34),110)},
    click(){tone(510,.03,'sine',.10,55)}, death(){stopBoss();tone(160,.45,'sawtooth',.22,-110)},
    gem(){tone(1050,.09,'sine',.16,390);setTimeout(()=>tone(1450,.08,'sine',.10,250),55)},
    repair(){tone(360,.1,'triangle',.16,260);setTimeout(()=>tone(620,.11,'triangle',.12,180),65)},
    waveClear(){tone(520,.09,'triangle',.13,120);setTimeout(()=>tone(690,.11,'triangle',.12,170),70)},
    victory(){stopBoss();[392,523.25,659.25,783.99].forEach((n,i)=>setTimeout(()=>tone(n,.45,'triangle',.22,70),i*115))},
    startBoss, stopBoss,
    setMaster(v){master=v},setMusic(v){music=v}
  }
})();

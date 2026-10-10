window.BUGBREAK_DATA = {
  maxWave: 50,
  bugs: {
    ant: {name:'Ant', icon:'🐜', speed:255, hp:125, damage:28, attackRate:.34, dash:520, color:'#a84d3e', accent:'#ff9b6f', desc:'Balanced • easy starter'},
    termite: {name:'Termite', icon:'🪵', speed:225, hp:175, damage:36, attackRate:.46, dash:455, color:'#ead7ae', accent:'#b9784f', desc:'Tank • giant mandibles', unlockWave:2},
    ladybug: {name:'Ladybug', icon:'🐞', speed:240, hp:155, damage:25, attackRate:.36, dash:500, color:'#d94343', accent:'#171717', desc:'Guardian • protects the nest', unlockWave:3, nestGuard:.28},
    fly: {name:'Fly', icon:'🪰', speed:315, hp:105, damage:23, attackRate:.25, dash:650, color:'#405f66', accent:'#b34e4f', desc:'Speedster • rapid bites', unlockWave:5},
    mosquito: {name:'Mosquito', icon:'🦟', speed:295, hp:112, damage:24, attackRate:.29, dash:610, color:'#735a48', accent:'#c95f5f', desc:'Vampire • lifesteal bites', unlockWave:8, lifesteal:.12}
  },
  permanent: [
    {id:'shell',name:'Reinforced Shell',icon:'🛡️',desc:'+9% starting max HP per rank.',base:5,max:8},
    {id:'fangs',name:'Serrated Mandibles',icon:'🦷',desc:'+8% bite damage per rank.',base:5,max:8},
    {id:'legs',name:'Spring Legs',icon:'⚡',desc:'+4% movement speed per rank.',base:4,max:8},
    {id:'nest',name:'Resin Nest',icon:'🏠',desc:'+14% nest health per rank.',base:5,max:8},
    {id:'workers',name:'Worker Crew',icon:'🛠️',desc:'Nest regenerates +1.5 HP/sec per rank.',base:7,max:7},
    {id:'magnet',name:'Crumb Magnet',icon:'🧲',desc:'+24 pickup radius per rank.',base:4,max:6},
    {id:'luck',name:'Shiny Instinct',icon:'💎',desc:'+1.5% gem drop chance per rank.',base:6,max:7},
    {id:'dash',name:'Wingbeat Burst',icon:'💨',desc:'Dash cooldown -6% per rank.',base:5,max:7},
    {id:'repair',name:'Resin Patches',icon:'🩹',desc:'Emergency repair restores +18 nest HP per rank.',base:6,max:6},
    {id:'crit',name:'Hunter Eyes',icon:'✨',desc:'+2% critical chance per rank.',base:7,max:6}
  ],
  mutations: [
    {id:'damage',icon:'🦷',name:'Razor Bite',desc:'+20% bite damage.',apply:p=>p.damage*=1.20},
    {id:'speed',icon:'⚡',name:'Leg Day',desc:'+11% movement speed.',apply:p=>p.speed*=1.11},
    {id:'hp',icon:'❤️',name:'Chitin Plates',desc:'+34 max HP and heal 34.',apply:p=>{p.maxHp+=34;p.hp=Math.min(p.maxHp,p.hp+34)}},
    {id:'rate',icon:'💥',name:'Snap Jaws',desc:'Bite 12% faster.',apply:p=>p.attackRate*=.88},
    {id:'dash',icon:'💨',name:'Rocket Abdomen',desc:'Dash farther and recharge 15% faster.',apply:p=>{p.dashPower*=1.12;p.dashCooldown*=.85}},
    {id:'heal',icon:'🍯',name:'Honey Reserve',desc:'Heal 6 HP after every kill.',apply:p=>p.killHeal=(p.killHeal||0)+6},
    {id:'arc',icon:'⚔️',name:'Wide Mandibles',desc:'Bite reaches 20% farther.',apply:p=>p.attackRange*=1.20},
    {id:'crit',icon:'✨',name:'Predator Instinct',desc:'+11% critical hit chance.',apply:p=>p.crit=Math.min(.65,(p.crit||.05)+.11)},
    {id:'nestheal',icon:'🧪',name:'Worker Repair Crew',desc:'Nest repairs +2 HP/sec.',apply:p=>p.nestRegen=(p.nestRegen||0)+2},
    {id:'guard',icon:'🧱',name:'Resin Armor',desc:'Nest takes 13% less damage.',apply:p=>p.nestDR=Math.min(.55,(p.nestDR||0)+.13)},
    {id:'magnet',icon:'🧲',name:'Hungry Colony',desc:'Pickup radius +55.',apply:p=>p.pickupRadius+=55},
    {id:'leech',icon:'🩸',name:'Hemolymph Feast',desc:'Bites heal 5% of damage dealt.',apply:p=>p.lifesteal=Math.min(.35,(p.lifesteal||0)+.05)}
  ],
  bosses: {
    5:  {type:'mantis',name:'Garden Mantis',color:'#84a64d',music:0},
    10: {type:'hornet',name:'Red Hornet',color:'#d96c34',music:1},
    15: {type:'mantis',name:'Feral Mantis',color:'#758c39',music:0},
    20: {type:'wolfspider',name:'Wolf Spider',color:'#6d493a',music:2},
    25: {type:'hornet',name:'Royal Hornet',color:'#d79b38',music:1},
    30: {type:'stag',name:'Stag Beetle',color:'#492d28',music:3},
    35: {type:'mantis',name:'Emerald Reaper',color:'#4c8d55',music:0},
    40: {type:'scorpion',name:'Bark Scorpion',color:'#9d7c4d',music:4},
    45: {type:'wolfspider',name:'Night Wolf',color:'#4f3844',music:2},
    50: {type:'empress',name:'BACKYARD EMPRESS',color:'#b75945',music:5}
  }
};

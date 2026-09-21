/* 242-konta-factory / 敵キャラ型テーブル
 *
 * 設計方針（2026-09-20）:
 *   class は使わない。1体あたり必要なのは update(e) と draw(e,x,y,fl) の2つだけで、
 *   new/this/継承を持ち込むと本体より定義のほうが長くなる。プレーンな定義テーブルにして、
 *   「敵を1体増やす＝ここに1エントリ足す」だけで済む形にする。
 *
 * index.html より先に classic script として読むこと（同一グローバルスコープ前提）。
 * 使えるグローバル: p / GY / W / H / frame / enemies / bullets / solids / ctx
 *                   move() / hit() / burst() / spawnEnemy() / bossSfx()
 *
 * 1エントリの形:
 *   hp,w,h        必須。初期HPと当たり判定サイズ
 *   ground        true なら接地させて配置（yを省略したとき GY-h に置く）
 *   tough         true なら一切ダメージが通らない（破壊不可の罠）
 *   spawn(e)      任意。配置時の初期化
 *   update(e)     任意。毎フレーム
 *   hazard(e)     任意。体当たり判定とは別の攻撃判定（レーザー・爆風・電撃）を rect で返す
 *   guard(e,fx)   任意。fx（攻撃が来た方向のx）からの攻撃を防ぐなら true
 *   onDeath(e)    任意。撃破時（分裂など）
 *   draw(e,x,y,fl) 必須。x,yはカメラ適用済みの整数、flは被弾フラッシュ中か
 */
(function(){
  const M='#8d86a8',D='#6a5f8a',P='#9b6bd6',R='#ff6b6b',Y='#f2c14e',
        O='#e8762f',C='#6fd6c2',K='#f7e6c4',S='#5b4f7a',G='#4a3f66';
  const fill=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const body=(fl,c)=>fl?'#fff':c;
  const near=(e,r)=>Math.abs(p.x-e.x)<r;
  const dirTo=e=>Math.sign(p.x-e.x)||1;
  const shot=(x,y,vx,vy,c,g)=>bullets.push({x,y,w:6,h:4,vx,vy:vy||0,g:g||0,c:c||R});
  // 接地歩行の共通処理（重力＋壁で折り返し）
  const patrol=(e,sp)=>{
    e.vy=Math.min(e.vy+.5,10);e.bump=false;
    const d=Math.sign(e.vx)||1;e.vx=d*sp;move(e);e.vx=d;
    if(e.bump||e.x<e.a||e.x>e.b)e.vx=-d;
  };

  window.ET={

  /* 1 歯車兵：地面を往復するだけの基本兵 */
  gear:{hp:2,w:20,h:20,ground:true,
    update(e){patrol(e,1);},
    draw(e,x,y,fl){
      ctx.save();ctx.translate(x+10,y+10);ctx.rotate(e.x*.08);
      ctx.fillStyle=body(fl,M);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(-3,-12,6,5);}
      ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();ctx.restore();
      fill(R,x+7,y+7,6,6);}},

  /* 2 コウモリ型：上下に揺れながら近づく */
  bat:{hp:1,w:18,h:12,
    spawn(e){e.by=e.y;e.ph=e.x;},
    update(e){e.ph+=.04;e.y=e.by+Math.sin(e.ph)*22;if(near(e,220))e.x+=dirTo(e)*.7;},
    draw(e,x,y,fl){
      const w=Math.sin(frame*.4)*5;ctx.fillStyle=body(fl,P);
      ctx.beginPath();ctx.moveTo(x+9,y+6);ctx.lineTo(x-6,y+w);ctx.lineTo(x+2,y+10);ctx.fill();
      ctx.beginPath();ctx.moveTo(x+9,y+6);ctx.lineTo(x+24,y+w);ctx.lineTo(x+16,y+10);ctx.fill();
      ctx.fillRect(x+4,y+2,10,9);fill(R,x+6,y+5,2,2);fill(R,x+10,y+5,2,2);}},

  /* 3 タレット：射程に入ると水平弾 */
  tur:{hp:3,w:20,h:22,ground:true,
    spawn(e){e.cd=60;},
    update(e){if(near(e,260)&&--e.cd<=0){e.cd=110;const d=dirTo(e);shot(e.x+10+d*12,e.y+6,d*2.6);}},
    draw(e,x,y,fl){
      const d=dirTo(e);fill(body(fl,D),x,y+6,20,16);
      fill(M,d>0?x+14:x-6,y+4,12,5);fill(e.cd<20?R:Y,x+7,y+11,6,6);}},

  /* 4 這行機：体高が低く速い。ジャンプで飛び越す前提の圧力役 */
  crawler:{hp:1,w:22,h:10,ground:true,
    update(e){patrol(e,1.9);},
    draw(e,x,y,fl){
      fill(body(fl,M),x,y+2,22,8);fill(D,x+2,y,18,3);
      const k=Math.sin(frame*.5)*2;
      fill(S,x+3,y+9,4,2+k);fill(S,x+15,y+9,4,2-k);fill(R,x+(dirTo(e)>0?17:1),y+3,4,3);}},

  /* 5 跳ね機：一定間隔で跳ぶ。着地の間だけ安全 */
  hopper:{hp:2,w:18,h:18,ground:true,
    spawn(e){e.cd=40;},
    update(e){
      e.vy=Math.min(e.vy+.5,10);e.bump=false;
      if(e.on&&--e.cd<=0){e.cd=70;e.vy=-7.6;e.vx=dirTo(e)*1.4;}
      move(e);if(e.on)e.vx*=.8;},
    draw(e,x,y,fl){
      const sq=e.on&&e.cd<10?4:0;
      fill(body(fl,O),x,y+sq,18,18-sq);fill(G,x+3,y+4+sq,12,6);
      fill(C,x+5,y+6+sq,3,3);fill(C,x+11,y+6+sq,3,3);
      fill(S,x+1,y+16,5,2);fill(S,x+12,y+16,5,2);}},

  /* 6 突進機：検知するまで静止、検知後は止まらない */
  charger:{hp:2,w:24,h:20,ground:true,
    spawn(e){e.run=0;},
    update(e){
      e.vy=Math.min(e.vy+.5,10);e.bump=false;
      if(!e.run&&near(e,170))e.run=dirTo(e);
      e.vx=e.run?e.run*3.4:0;move(e);
      if(e.bump)e.run=-e.run;},
    draw(e,x,y,fl){
      const sh=e.run?Math.sin(frame*.9)*1.5:0;
      fill(body(fl,e.run?R:D),x,y+4+sh,24,16);
      fill(M,e.run>0?x+20:x-4,y+7+sh,8,9);
      fill(Y,x+8,y+8+sh,8,5);
      if(e.run){fill(O,x-e.run*8,y+10,6,3);}}},

  /* 7 盾持ち：正面からのヤリが通らない。回り込むかビームで上から抜く */
  shielder:{hp:3,w:22,h:24,ground:true,
    update(e){patrol(e,.7);e.fc=Math.sign(e.vx)||1;},
    guard(e,fx){return Math.sign(fx-e.x)===(e.fc||1);},
    draw(e,x,y,fl){
      const d=e.fc||1;fill(body(fl,D),x+4,y+4,14,20);fill(M,x+7,y+8,8,6);
      fill(C,d>0?x+18:x-2,y,6,24);fill(K,d>0?x+19:x-1,y+8,4,8);}},

  /* 8 自爆機：接近すると点滅して爆発。倒しても爆風は出る */
  bomber:{hp:1,w:16,h:16,
    spawn(e){e.by=e.y;e.fuse=0;e.blast=0;},
    update(e){
      if(e.blast>0){if(--e.blast<=0)e.dead=true;return;}
      e.y=e.by+Math.sin(frame*.07+e.x)*6;
      if(e.fuse>0){if(--e.fuse<=0){e.blast=14;burst(e.x+8,e.y+8,O,22);}return;}
      if(near(e,200)){e.x+=dirTo(e)*1.15;if(near(e,34))e.fuse=34;}},
    onDeath(e){e.dead=false;e.hp=1;e.blast=14;e.fuse=0;burst(e.x+8,e.y+8,O,18);},
    hazard(e){return e.blast>0?{x:e.x-18,y:e.y-18,w:52,h:52}:null;},
    draw(e,x,y,fl){
      if(e.blast>0){const r=(14-e.blast)*3;ctx.fillStyle=`rgba(242,193,78,${e.blast/16})`;
        ctx.beginPath();ctx.arc(x+8,y+8,r+8,0,7);ctx.fill();return;}
      const bl=e.fuse>0&&frame%6<3;
      fill(body(fl||bl,bl?R:O),x+1,y+1,14,14);fill(G,x+4,y+4,8,8);fill(bl?K:R,x+6,y+6,4,4);
      fill(M,x+6,y-3,4,4);}},

  /* 9 分裂機：撃破すると小型が2体飛び出す */
  splitter:{hp:2,w:26,h:24,ground:true,
    update(e){patrol(e,.9);},
    onDeath(e){
      for(const d of[-1,1]){
        const m=spawnEnemy('mini',e.x+9+d*12,e.y+6);
        m.vx=d*2;m.vy=-4;}},
    draw(e,x,y,fl){
      fill(body(fl,P),x,y+2,26,22);fill(G,x+3,y+5,20,7);
      fill(Y,x+5,y+7,4,3);fill(Y,x+17,y+7,4,3);
      fill(S,x+12,y+2,2,22);fill(M,x+2,y+20,22,3);}},

  /* 10 小型機：分裂で出てくる素早い個体（初期配置はしない） */
  mini:{hp:1,w:12,h:12,
    update(e){
      e.vy=Math.min(e.vy+.4,10);e.bump=false;move(e);
      if(e.on){e.vx+=(dirTo(e)*1.9-e.vx)*.2;}},
    draw(e,x,y,fl){
      fill(body(fl,P),x,y,12,12);fill(R,x+3,y+4,2,2);fill(R,x+7,y+4,2,2);
      fill(S,x+1,y+11,3,2);fill(S,x+8,y+11,3,2);}},

  /* 11 浮遊砲台：空中に居座り3方向へ撃つ */
  sentry:{hp:2,w:20,h:16,
    spawn(e){e.by=e.y;e.cd=90;},
    update(e){
      e.y=e.by+Math.sin(frame*.05)*10;
      if(near(e,300)&&--e.cd<=0){e.cd=150;const d=dirTo(e);
        shot(e.x+8,e.y+12,d*2.2,0,Y);shot(e.x+8,e.y+12,d*1.9,1.2,Y);shot(e.x+8,e.y+12,d*1.9,-1.2,Y);}},
    draw(e,x,y,fl){
      fill(body(fl,D),x,y+2,20,10);fill(M,x+2,y,16,3);
      const hot=e.cd<28;
      fill(hot?R:Y,x+3,y+12,4,4);fill(hot?R:Y,x+8,y+12,4,4);fill(hot?R:Y,x+13,y+12,4,4);
      fill(C,x+8,y+4,4,4);}},

  /* 12 レーザー柱：周期的に真下へ光を落とす。止まらず抜けるかタイミングを待つ */
  laser:{hp:4,w:14,h:24,
    spawn(e){e.t0=(e.x|0)%150;},
    update(e){e.t0=(e.t0+1)%150;},
    hazard(e){return e.t0>=110?{x:e.x+4,y:e.y+22,w:6,h:GY+24-(e.y+22)}:null;},
    draw(e,x,y,fl){
      const ph=e.t0,top=y+22,len=GY+24-top;
      if(ph>=110){ctx.fillStyle='rgba(155,107,214,.3)';ctx.fillRect(x+1,top,12,len);
        fill(P,x+4,top,6,len);fill(K,x+6,top,2,len);}
      else if(ph>=86){ctx.fillStyle='rgba(255,107,107,.5)';
        for(let yy=top;yy<GY+24;yy+=8)ctx.fillRect(x+6,yy,2,4);}
      fill(body(fl,D),x,y,14,22);fill(M,x+2,y+2,10,6);
      fill(ph>=86?R:C,x+4,y+16,6,5);}},

  /* 13 スパイク：破壊不可。出ている間だけ痛い */
  spike:{hp:1,w:20,h:14,ground:true,tough:true,
    spawn(e){e.t0=(e.x|0)%120;},
    update(e){e.t0=(e.t0+1)%120;},
    hazard(e){return e.t0>=60?{x:e.x+2,y:e.y,w:16,h:14}:null;},
    draw(e,x,y){
      const up=e.t0>=60?14:(e.t0>=50?7:0);
      fill(G,x,y+10,20,4);
      if(up){ctx.fillStyle=M;
        for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+3+i*6,y+14);ctx.lineTo(x+6+i*6,y+14-up);ctx.lineTo(x+9+i*6,y+14);ctx.fill();}}}},

  /* 14 ドリル：地中に潜り、近づくと突き上げてくる */
  driller:{hp:2,w:18,h:18,ground:true,
    spawn(e){e.gy=e.y;e.up=0;},
    update(e){
      const want=near(e,120);
      e.up+=((want?1:0)-e.up)*.06;
      e.y=e.gy+18-e.up*18;},
    draw(e,x,y,fl){
      fill(G,x-2,y+16,22,6);
      ctx.save();ctx.translate(x+9,y);
      ctx.fillStyle=body(fl,M);
      ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(7,8);ctx.lineTo(-7,8);ctx.fill();
      const sp=(frame*.6)%6;
      fill(S,-7,2+sp,14,2);fill(D,-8,8,16,10);fill(R,-3,11,6,4);
      ctx.restore();}},

  /* 15 高速飛行機：直線でレーンを往復する。反応速度を試す */
  flyer:{hp:1,w:22,h:10,
    spawn(e){e.vx=-3.2;},
    update(e){e.x+=e.vx;if(e.x<e.a||e.x>e.b)e.vx=-e.vx;},
    draw(e,x,y,fl){
      const d=Math.sign(e.vx)||1;
      fill(body(fl,C),x,y+2,22,6);
      ctx.fillStyle=D;ctx.beginPath();
      ctx.moveTo(d>0?x+22:x,y+5);ctx.lineTo(d>0?x+8:x+14,y-2);ctx.lineTo(d>0?x+8:x+14,y+10);ctx.fill();
      fill(K,x+(d>0?18:1),y+3,3,3);
      ctx.fillStyle='rgba(111,214,194,.4)';ctx.fillRect(d>0?x-10:x+22,y+3,10,3);}},

  /* 16 浮遊球：8の字を描いて読みにくい軌道を作る */
  orb:{hp:1,w:14,h:14,
    spawn(e){e.cx=e.x;e.cy=e.y;e.ph=(e.x|0)%628/100;},
    update(e){e.ph+=.035;e.x=e.cx+Math.sin(e.ph)*40;e.y=e.cy+Math.sin(e.ph*2)*26;},
    draw(e,x,y,fl){
      ctx.fillStyle=`rgba(155,107,214,.3)`;ctx.beginPath();ctx.arc(x+7,y+7,11,0,7);ctx.fill();
      ctx.fillStyle=body(fl,P);ctx.beginPath();ctx.arc(x+7,y+7,7,0,7);ctx.fill();
      fill(K,x+5,y+5,4,4);}},

  /* 17 迫撃砲：放物線で撃つ。平地では避けにくく段差では当たらない */
  mortar:{hp:3,w:24,h:18,ground:true,
    spawn(e){e.cd=80;},
    update(e){
      if(near(e,300)&&--e.cd<=0){e.cd=170;
        const d=dirTo(e);shot(e.x+12,e.y-2,d*1.9,-5.2,O,.16);}},
    draw(e,x,y,fl){
      fill(body(fl,D),x,y+8,24,10);fill(M,x+3,y+14,18,4);
      const d=dirTo(e);ctx.save();ctx.translate(x+12,y+8);ctx.rotate(d*-.7);
      fill(M,-3,-12,6,14);ctx.restore();
      fill(e.cd<30?R:Y,x+9,y+11,6,4);}},

  /* 18 放電機：周期的に自分の周囲へ電撃を張る。張っている間は近寄れない */
  shocker:{hp:2,w:18,h:20,ground:true,
    spawn(e){e.t0=(e.x|0)%140;},
    update(e){e.t0=(e.t0+1)%140;},
    hazard(e){return e.t0>=100?{x:e.x-16,y:e.y-14,w:50,h:48}:null;},
    draw(e,x,y,fl){
      if(e.t0>=100){
        ctx.strokeStyle=frame%4<2?C:K;ctx.lineWidth=2;ctx.beginPath();
        for(let i=0;i<7;i++){const a=frame*.1+i;ctx.moveTo(x+9,y+6);
          ctx.lineTo(x+9+Math.cos(a)*24,y+6+Math.sin(a)*22);}ctx.stroke();}
      else if(e.t0>=80){ctx.strokeStyle='rgba(111,214,194,.5)';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(x+9,y+6,20,0,7);ctx.stroke();}
      fill(body(fl,D),x,y+4,18,16);fill(M,x+4,y,10,6);
      fill(e.t0>=80?C:S,x+6,y+9,6,6);}},

  /* 19 ローラー：歯車の上位。速く大きく、止まらない */
  roller:{hp:3,w:22,h:22,ground:true,
    update(e){patrol(e,2.6);},
    draw(e,x,y,fl){
      ctx.save();ctx.translate(x+11,y+11);ctx.rotate(e.x*.14);
      ctx.fillStyle=body(fl,O);ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.fill();
      ctx.fillStyle=G;for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(-2,-11,4,7);}
      ctx.restore();
      fill(K,x+8,y+8,6,6);}},

  /* 20 積層機：上下に伸び縮みする壁。縮んだ瞬間だけ頭上を越せる */
  stacker:{hp:2,w:18,h:12,ground:true,
    spawn(e){e.gy=e.y+e.h;e.t0=(e.x|0)%160;},
    update(e){
      e.t0=(e.t0+1)%160;
      const t=e.t0<80?e.t0/80:(160-e.t0)/80;
      e.h=12+Math.round(t*34);e.y=e.gy-e.h;},
    draw(e,x,y,fl){
      const n=Math.ceil(e.h/12);
      for(let i=0;i<n;i++){fill(body(fl,i%2?D:M),x,y+i*12,18,11);}
      fill(C,x+6,y+3,6,4);}},

  /* 21 群れ虫：小さく数で来る。1体ずつ配置して群れに見せる */
  swarm:{hp:1,w:10,h:10,
    spawn(e){e.by=e.y;e.ph=(e.x|0)%628/100;},
    update(e){
      e.ph+=.13;e.y=e.by+Math.sin(e.ph)*14;
      if(near(e,240))e.x+=dirTo(e)*.95;},
    draw(e,x,y,fl){
      fill(body(fl,Y),x+1,y+2,8,6);
      const w=Math.sin(frame*.8)*3;
      fill(K,x-2,y+2+w,4,2);fill(K,x+8,y+2-w,4,2);fill(R,x+6,y+3,2,2);}},

  /* 22 ブロック兵：動かない硬い壁。ビーム or 回り込みで処理する */
  blocker:{hp:5,w:20,h:34,ground:true,
    draw(e,x,y,fl){
      fill(body(fl,S),x,y,20,34);fill(G,x+2,y+2,16,30);
      for(let i=0;i<3;i++)fill(M,x+3,y+5+i*10,14,3);
      fill(R,x+7,y+26,6,4);}},

  /* 23 狙撃機：赤い線で予告してから高速弾。線を見て動く */
  sniper:{hp:2,w:20,h:16,
    spawn(e){e.by=e.y;e.cd=120;e.aim=0;},
    update(e){
      e.y=e.by+Math.sin(frame*.03)*5;
      if(e.aim>0){if(--e.aim<=0){const d=dirTo(e);shot(e.x+10,e.y+8,d*5.4,0,R);}return;}
      if(near(e,330)&&--e.cd<=0){e.cd=190;e.aim=40;}},
    draw(e,x,y,fl){
      if(e.aim>0&&frame%4<2){ctx.fillStyle='rgba(255,107,107,.6)';
        const d=dirTo(e);ctx.fillRect(d>0?x+16:x-300,y+7,300,1);}
      fill(body(fl,D),x+2,y+2,16,12);fill(M,dirTo(e)>0?x+16:x-8,y+6,10,4);
      fill(e.aim>0?R:C,x+6,y+5,6,4);}},

  /* 24 跳躍兵：射程に入ると飛びかかる。着地硬直が反撃の窓 */
  leaper:{hp:2,w:18,h:18,ground:true,
    spawn(e){e.cd=0;e.rec=0;},
    update(e){
      e.vy=Math.min(e.vy+.5,10);e.bump=false;
      if(e.on){
        if(e.rec>0){e.rec--;e.vx=0;}
        else if(near(e,150)&&--e.cd<=0){e.cd=90;e.vy=-8.4;e.vx=dirTo(e)*2.8;e.rec=28;}
        else e.vx*=.7;}
      move(e);},
    draw(e,x,y,fl){
      const crouch=e.rec>0&&e.on?4:0;
      fill(body(fl,P),x,y+crouch,18,18-crouch);
      fill(G,x+3,y+3+crouch,12,6);fill(Y,x+5,y+5+crouch,3,3);fill(Y,x+11,y+5+crouch,3,3);
      fill(D,x-2,y+12,5,4);fill(D,x+15,y+12,5,4);}},

  /* 25 回転刃：固定。当たり判定が広く、通過タイミングを測らせる */
  spinner:{hp:3,w:24,h:24,
    spawn(e){e.cy=e.y;},
    update(e){e.y=e.cy+Math.sin(frame*.025)*30;},
    draw(e,x,y,fl){
      ctx.save();ctx.translate(x+12,y+12);ctx.rotate(frame*.3);
      ctx.fillStyle=body(fl,M);
      for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);
        ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(14,-2);ctx.lineTo(0,4);ctx.fill();}
      ctx.restore();
      ctx.fillStyle=D;ctx.beginPath();ctx.arc(x+12,y+12,5,0,7);ctx.fill();
      fill(R,x+10,y+10,4,4);}},

  /* 26 磁力機：プレイヤーを引き寄せる。他の敵と組ませると効く */
  magnet:{hp:2,w:18,h:22,ground:true,
    spawn(e){e.t0=(e.x|0)%180;},
    update(e){
      e.t0=(e.t0+1)%180;
      if(e.t0>=110&&near(e,190))p.vx+=Math.sign(e.x-p.x)*.16;},
    draw(e,x,y,fl){
      const on=e.t0>=110;
      if(on){ctx.strokeStyle=`rgba(242,193,78,${.15+.2*Math.sin(frame*.3)})`;ctx.lineWidth=2;
        for(let i=1;i<4;i++){ctx.beginPath();ctx.arc(x+9,y+10,i*22,0,7);ctx.stroke();}}
      fill(body(fl,D),x,y+6,18,16);
      fill(on?R:M,x+1,y,6,10);fill(on?C:M,x+11,y,6,10);
      fill(Y,x+6,y+12,6,5);}},

  /* 27 追跡犬：地上を走って追ってくる。段差では撒ける */
  hound:{hp:2,w:24,h:14,ground:true,
    update(e){
      e.vy=Math.min(e.vy+.5,10);e.bump=false;
      e.vx=near(e,280)?dirTo(e)*2.2:0;
      move(e);
      if(e.bump&&e.on)e.vy=-6.4;},
    draw(e,x,y,fl){
      const run=Math.abs(e.vx)>.5?Math.sin(frame*.5)*3:0;
      const d=dirTo(e);
      fill(body(fl,S),x+2,y+2,20,8);
      fill(D,d>0?x+18:x-2,y,8,8);fill(R,d>0?x+22:x+1,y+2,3,3);
      fill(M,x+4,y+10,4,4+run);fill(M,x+16,y+10,4,4-run);
      fill(M,d>0?x:x+22,y+1,3,7);}},

  /* 28 浮遊機雷：動かないが触れると即爆発。通路の幅を削る */
  mine:{hp:1,w:14,h:14,
    spawn(e){e.by=e.y;e.blast=0;},
    update(e){
      if(e.blast>0){if(--e.blast<=0)e.dead=true;return;}
      e.y=e.by+Math.sin(frame*.04+e.x)*5;
      if(near(e,26)&&Math.abs(p.y-e.y)<30){e.blast=14;burst(e.x+7,e.y+7,R,20);}},
    onDeath(e){e.dead=false;e.hp=1;e.blast=14;burst(e.x+7,e.y+7,R,16);},
    hazard(e){return e.blast>0?{x:e.x-14,y:e.y-14,w:42,h:42}:null;},
    draw(e,x,y,fl){
      if(e.blast>0){const r=(14-e.blast)*2.6;ctx.fillStyle=`rgba(255,107,107,${e.blast/16})`;
        ctx.beginPath();ctx.arc(x+7,y+7,r+7,0,7);ctx.fill();return;}
      ctx.fillStyle=body(fl,S);ctx.beginPath();ctx.arc(x+7,y+7,7,0,7);ctx.fill();
      for(let i=0;i<6;i++){const a=Math.PI/3*i;fill(M,x+7+Math.cos(a)*8-1,y+7+Math.sin(a)*8-1,3,3);}
      fill(frame%30<15?R:G,x+5,y+5,4,4);}},

  /* 29 監視塔：高所に立ち、真下へ弾を落とす。塔の下が危険地帯になる */
  warden:{hp:3,w:20,h:28,
    spawn(e){e.cd=50;},
    update(e){if(Math.abs(p.x-e.x)<150&&--e.cd<=0){e.cd=95;shot(e.x+7,e.y+28,0,2.4,C);}},
    draw(e,x,y,fl){
      fill(G,x+6,y+8,8,20);fill(body(fl,D),x,y,20,12);
      fill(M,x+2,y+2,16,3);
      fill(e.cd<24?R:C,x+6,y+5,8,5);
      fill(S,x+4,y+26,12,3);}},

  /* 30 監督機：この工場の大型機。扇状に撃ちながらゆっくり詰めてくる */
  overseer:{hp:6,w:34,h:32,
    spawn(e){e.by=e.y;e.cd=100;},
    update(e){
      e.y=e.by+Math.sin(frame*.03)*12;
      if(near(e,340)){
        e.x+=dirTo(e)*.35;
        if(--e.cd<=0){e.cd=140;const d=dirTo(e);
          for(let k=-2;k<=2;k++)shot(e.x+16,e.y+20,d*2.1,k*.75,P);}}},
    draw(e,x,y,fl){
      ctx.fillStyle='rgba(155,107,214,.18)';ctx.beginPath();ctx.arc(x+17,y+16,24,0,7);ctx.fill();
      fill(body(fl,G),x,y+4,34,24);fill(D,x+3,y+7,28,18);
      fill(M,x+6,y,22,5);fill(M,x-4,y+12,6,10);fill(M,x+32,y+12,6,10);
      const hot=e.cd<34;
      fill(hot?R:C,x+8,y+12,18,7);fill(K,x+11,y+14,3,3);fill(K,x+20,y+14,3,3);
      fill(hot?Y:S,x+14,y+24,6,4);}},

  /* 31 天井プレス：壊せない。予告のあと廊下一本を叩き潰し、開いているあいだに通る */
  press:{hp:1,w:72,h:12,tough:true,
    spawn(e){e.top=e.y;e.t0=(e.x|0)%192;e.maxH=GY-e.top;},
    update(e){
      e.t0=(e.t0+1)%192;
      const t=e.t0;
      let k=0;
      if(t>=96&&t<112)k=(t-96)/16;
      else if(t>=112&&t<148)k=1;
      else if(t>=148)k=1-(t-148)/44;
      e.h=12+Math.round(k*(e.maxH-12));e.y=e.top;
    },
    draw(e,x,y){
      const warn=e.t0>=72&&e.t0<96,hot=e.t0>=96&&e.t0<148;
      fill(G,x+10,0,8,y+6);fill(G,x+e.w-18,0,8,y+6);
      fill(S,x,y,e.w,e.h);
      fill(hot?O:M,x+3,y+3,e.w-6,Math.max(4,Math.min(12,e.h-6)));
      if(e.h>18){
        ctx.save();ctx.beginPath();ctx.rect(x,y+e.h-10,e.w,10);ctx.clip();
        fill(Y,x,y+e.h-10,e.w,10);
        fill('#14101c');
        const off=(frame*.5)%16;
        for(let i=-16;i<e.w+16;i+=16){
          ctx.beginPath();
          ctx.moveTo(x+i+off,y+e.h);ctx.lineTo(x+i+8+off,y+e.h-10);
          ctx.lineTo(x+i+12+off,y+e.h-10);ctx.lineTo(x+i+4+off,y+e.h);ctx.fill();
        }
        ctx.restore();
      }
      if(warn&&frame%8<4)fill(R,x,GY-5,e.w,5);
    }},

  /* 32 心拍シャッター：壊せない扉。拍動で開閉。開いているあいだだけ通れる */
  shutter:{hp:1,w:16,h:76,tough:true,block:true,
    spawn(e){e.full=e.h;e.open=0;e.t0=(e.x*3|0)%108;},
    update(e){
      e.t0=(e.t0+1)%108;
      const want=e.t0>=32&&e.t0<78?1:0;
      e.open+=(want-e.open)*.18;
      e.h=14+Math.round((1-e.open)*(e.full-14));e.y=GY-e.h;
    },
    draw(e,x,y){
      const beat=e.t0<10||(e.t0>14&&e.t0<24);
      fill('#0f2622',x,y,e.w,e.h);
      fill(beat?'#7fe3a8':'#265046',x+2,y+2,e.w-4,Math.max(4,e.h-6));
      ctx.strokeStyle=beat?'#f7e6c4':'#7fe3a8';ctx.lineWidth=1.2;ctx.beginPath();
      const mid=y+Math.max(10,e.h*.42);
      ctx.moveTo(x+1,mid);ctx.lineTo(x+4,mid);
      if(beat){ctx.lineTo(x+6,mid-9);ctx.lineTo(x+9,mid+7);ctx.lineTo(x+11,mid);}
      ctx.lineTo(x+e.w-1,mid);ctx.stroke();
      if(e.open<.3&&frame%10<5)fill(R,x-2,GY-5,e.w+4,5);
    }},

  /* 廃材落下：影が先、本体が落ちる。壊せない */
  scrap:{hp:1,w:14,h:12,tough:true,drop:true,
    spawn(e){e.t0=(e.x*5|0)%180;e.vy=0;},
    update(e){
      e.t0=(e.t0+1)%180;
      if(e.t0<50){e.y=-22;e.vy=0;}
      else if(e.t0<56){e.y=-22;}
      else{
        if(e.t0===56){e.y=-16;e.vy=0;}
        e.vy=Math.min(e.vy+.5,9);e.y+=e.vy;
        if(e.y>GY-e.h){e.y=GY-e.h;e.vy=0;}
        if(e.t0>92)e.y=-22;
      }
    },
    hazard(e){return e.vy>0&&e.y>-8?{x:e.x,y:e.y,w:e.w,h:e.h}:null;},
    draw(e,x,y){
      if(e.t0<56){
        const a=.15+.2*(e.t0/56);
        ctx.fillStyle=`rgba(20,16,38,${a})`;ctx.beginPath();ctx.ellipse(x+7,GY-4,10,4,0,0,7);ctx.fill();
        if(e.t0>=40&&frame%6<3)fill(R,x,GY-6,14,3);
        return;
      }
      fill('#2e3350',x,y,14,12);fill('#39406a',x+2,y+2,10,8);
      fill('#5b4f7a',x+4,y+4,3,3);fill('#ff6b6b',x+8,y+5,2,2);
    }},

  /* 33 プロトタイプ００４号：未完成のコン太型。片耳、飛び込み＋1発 */
  proto004:{hp:5,w:88,h:128,ground:true,boss:true,
    spawn(e){e.cd=80;e.vx=1;},
    update(e){
      patrol(e,.8);
      if(near(e,210)&&--e.cd<=0){
        e.cd=100;e.vy=-6.2;e.vx=dirTo(e)*2.5;
        shot(e.x+40,e.y+56,dirTo(e)*2.5,0,O);
        bossSfx('proto004');
      }
    },
    draw(e,x,y,fl){
      fill('#1a4f44',x+2,y+24,6,8);fill('#1a4f44',x+13,y+24,6,8);
      fill(body(fl,O),x+2,y+12,18,13);fill(K,x+5,y+14,12,7);fill(C,x+8,y+15,5,4);
      fill(K,x+4,y+2,14,12);fill(O,x+3,y-1,16,4);
      fill(O,x+4,y-8,4,8);                         // 片耳だけ
      fill('#2b2140',x+6,y+5,11,5);fill(C,x+7,y+6,3,3);fill('#5b4f7a',x+13,y+6,3,3);
      ctx.strokeStyle='#6fd6c2';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+2,y+20);ctx.lineTo(x-4,y+28);ctx.stroke();
    }},

  /* 34 警備ロボ１００５：黄黒の盾。近いと突進、遠いと弾 */
  guard1005:{hp:6,w:112,h:136,ground:true,boss:true,
    spawn(e){e.cd=55;e.dash=0;e.vx=1;},
    update(e){
      if(e.dash>0){e.dash--;e.vx=dirTo(e)*3.4;e.vy=Math.min(e.vy+.5,10);move(e);}
      else{
        patrol(e,1);
        if(near(e,240)&&--e.cd<=0){
          e.cd=86;
          if(Math.abs(p.x-e.x)<90)e.dash=16;
          else shot(e.x+56,e.y+48,dirTo(e)*3.3,0,Y);
          bossSfx('guard1005');
        }
      }
    },
    draw(e,x,y,fl){
      fill(body(fl,G),x+4,y+18,20,16);
      fill(Y,x,y+8,28,12);fill('#14101c',x,y+8,28,3);fill('#14101c',x,y+17,28,3);
      fill(body(fl,S),x+6,y,16,10);fill(e.dash>0?R:C,x+10,y+3,8,4);
      fill(Y,x+22,y+10,8,18);                       // 盾
      fill('#14101c',x+8,y+30,5,4);fill('#14101c',x+16,y+30,5,4);
    }},

  /* 35 ロボ人体の模型３号：骨格が見える。弧を描く腕弾 */
  model3:{hp:7,w:80,h:152,ground:true,boss:true,
    spawn(e){e.cd=48;e.vx=1;},
    update(e){
      patrol(e,.45);
      if(near(e,250)&&--e.cd<=0){
        e.cd=76;shot(e.x+32,e.y+40,dirTo(e)*2.3,-2.4,C,.22);
        bossSfx('model3');
      }
    },
    draw(e,x,y,fl){
      fill('#1d3a33',x+7,y+8,6,22);
      fill(body(fl,K),x+3,y+12,14,10);
      fill(frame%20<10?R:'#5b2f3a',x+7,y+14,6,6);   // 拍動する心臓
      fill(K,x+4,y,12,10);fill('#0f2622',x+6,y+3,8,4);
      fill('#265046',x+1,y+22,5,16);fill('#265046',x+14,y+22,5,16);
      ctx.strokeStyle='#7fe3a8';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(x+18,y+14);ctx.lineTo(x+28,y+8);ctx.stroke();
    }},

  /* 36 人造人間の集合体：胴が重なる。低HPで mini を剥がす */
  aggregate:{hp:8,w:144,h:112,ground:true,boss:true,
    spawn(e){e.cd=70;e.vx=1;e.shed=0;},
    update(e){
      patrol(e,1.15);
      if(near(e,260)&&--e.cd<=0){
        e.cd=98;const d=dirTo(e);
        shot(e.x+32,e.y+32,d*2.3,-.5,R);shot(e.x+88,e.y+48,d*2.8,.3,R);
        if(e.hp<=4&&e.shed<2){e.shed++;spawnEnemy('mini',e.x+32,e.y,{});}
        bossSfx('aggregate');
      }
    },
    draw(e,x,y,fl){
      const c=body(fl,O);
      fill(c,x+2,y+8,14,14);fill(c,x+12,y+6,16,16);fill(c,x+20,y+10,14,14);
      fill(K,x+6,y+2,10,8);fill(K,x+16,y,12,9);fill(K,x+24,y+3,10,8);
      fill('#2b2140',x+8,y+4,6,3);fill('#2b2140',x+18,y+3,7,3);fill('#2b2140',x+26,y+5,6,3);
      fill(C,x+9,y+5,2,2);fill(C,x+20,y+4,2,2);fill(C,x+27,y+6,2,2);
      fill('#1a4f44',x+8,y+22,6,6);fill('#1a4f44',x+22,y+22,6,6);
    }},

  /* 37 開発者騎乗機：監督機の胴に人が乗っている */
  rider:{hp:10,w:160,h:152,boss:true,
    spawn(e){e.by=e.y;e.cd=90;},
    update(e){
      e.y=e.by+Math.sin(frame*.03)*10;
      if(near(e,360)){
        e.x+=dirTo(e)*.42;
        if(--e.cd<=0){
          e.cd=108;const d=dirTo(e);
          for(let k=-2;k<=2;k++)shot(e.x+72,e.y+88,d*2.15,k*.7,P);
          bossSfx('rider');
        }
      }
    },
    draw(e,x,y,fl){
      ctx.fillStyle='rgba(155,107,214,.2)';ctx.beginPath();ctx.arc(x+20,y+22,26,0,7);ctx.fill();
      fill(body(fl,G),x,y+12,40,22);fill(D,x+4,y+15,32,16);
      fill(M,x+8,y+8,24,6);fill(M,x-5,y+18,8,10);fill(M,x+37,y+18,8,10);
      fill(K,x+14,y,12,10);                         // 搭乗者
      fill('#2b2140',x+16,y+3,8,4);fill(O,x+18,y+10,4,3);
      const hot=e.cd<36;
      fill(hot?R:C,x+12,y+20,16,6);fill(K,x+15,y+22,3,2);fill(K,x+22,y+22,3,2);
      fill(hot?Y:S,x+16,y+30,8,4);
    }}

  };

  window.ET_LIST=Object.keys(window.ET);
})();

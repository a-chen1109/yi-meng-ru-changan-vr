(() => {
  const sceneEl = document.querySelector('#vrScene');
  const sky = document.querySelector('#sky');
  const hotspotRoot = document.querySelector('#hotspots');
  const camera = document.querySelector('#camera');
  const intro = document.querySelector('#intro');
  const toastEl = document.querySelector('#toast');
  const fade = document.querySelector('#fade');
  const bgm = document.querySelector('#bgm');
  const audioFile = document.querySelector('#audioFile');
  const musicBtn = document.querySelector('#musicBtn');
  const chooseAudioBtn = document.querySelector('#chooseAudioBtn');
  const gyroBtn = document.querySelector('#gyroBtn');
  const qqMusicPlayer = document.getElementById('qqMusicPlayer');
  const qqMusicUrl = 'https://i.y.qq.com/n2/m/outchain/player/index.html?songid=607205557&songtype=0';
  let musicSource = 'local';
  let currentScene = 0;
  let toastTimer;
  let localAudioUrl = null;
  let gestureTimer;
  const friendName = '亲爱的你'; // 可替换为收礼人的名字。
  document.getElementById('finalName').textContent = friendName;
  const sceneData = [
    {id:'pano-gate', chapter:'壹 / 入梦', title:'入梦长安', hint:'今夜，借满城灯火，迎你入梦。'},
    {id:'pano-street', chapter:'贰 / 流光', title:'灯映星河', hint:'一河流光，载着未说尽的祝愿。'},
    {id:'pano-pavilion', chapter:'叁 / 寄愿', title:'月下寄愿', hint:'借此间月色，愿你岁岁常安。'},
    {id:'pano-lanterns', chapter:'肆 / 贺辰', title:'烟火贺辰', hint:'万家灯火起，今夜为你贺芳辰。'}
  ];
  const blessings = [
    {title:'岁岁欢愉',text:'愿你岁岁常欢愉，年年皆胜意。平凡的日子有小小欢喜，漫长的旅途有温柔相伴。'},
    {title:'所遇皆暖',text:'愿你所遇之人皆真诚，所行之路皆有光。有人懂你的言外之意，也有人珍惜你的明媚与善良。'},
    {title:'前路生花',text:'愿你奔赴热爱时有勇气，面对未知时有底气。走过的每一步，都算数；期待的每一程，都值得。'},
    {title:'自在如风',text:'愿你自在如风，明朗如月。不必迎合所有目光，只管成为自己喜欢的模样。'},
    {title:'心有星河',text:'愿你心中常有星河，眼里总有惊喜。即使偶尔行经长夜，也始终相信天会亮，花会开。'}
  ];

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }
  function showModal(id) { document.getElementById(id).hidden = false; }
  function closeModal(id) { document.getElementById(id).hidden = true; }

  function addHotspot({label, action, angle, height=2.2, color='#d8bd87', scale=1, scene=0}) {
    const rad = angle * Math.PI / 180;
    const radius = 5.2;
    const x = Math.sin(rad) * radius;
    const z = -Math.cos(rad) * radius;
    const yaw = Math.atan2(x, z) * 180 / Math.PI;
    const holder = document.createElement('a-entity');
    holder.classList.add('hotspot');
    holder.dataset.action = action;
    holder.dataset.scene = String(scene);
    holder.dataset.label = label;
    holder.setAttribute('aria-label', label);
    holder.setAttribute('position', `${x.toFixed(3)} ${height.toFixed(2)} ${z.toFixed(3)}`);
    holder.setAttribute('rotation', `0 ${yaw.toFixed(2)} 0`);
    const orb = document.createElement('a-sphere');
    orb.setAttribute('radius', (0.17*scale).toFixed(2));
    orb.setAttribute('material', `shader: standard; color: ${color}; emissive: ${color}; emissiveIntensity: 0.65; roughness: 0.3; metalness: 0.1`);
    orb.setAttribute('animation__pulse', 'property: scale; from: 0.92 0.92 0.92; to: 1.13 1.13 1.13; dir: alternate; dur: 1100; loop: true; easing: easeInOutSine');
    orb.classList.add('hotspot-orb');
    holder.appendChild(orb);
    const ring = document.createElement('a-ring');
    ring.setAttribute('radius-inner', (0.22*scale).toFixed(2));
    ring.setAttribute('radius-outer', (0.29*scale).toFixed(2));
    ring.setAttribute('rotation', '0 0 0');
    ring.setAttribute('material', `shader: flat; color: ${color}; opacity: 0.82; side: double`);
    holder.appendChild(ring);
    hotspotRoot.appendChild(holder);
    return holder;
  }

  function buildHotspots() {
    hotspotRoot.innerHTML = '';
    addHotspot({label:'循灯赏流光', action:'scene:1', angle:0, height:2.0, scale:1.1, scene:0});
    const lampAngles = [-125,-65,0,65,125];
    blessings.forEach((b,i) => addHotspot({label:`花灯${i+1} · ${b.title}`,action:`blessing:${i}`,angle:lampAngles[i],height:2.15+(i%2)*0.25,scale:0.88,scene:1}));
    addHotspot({label:'月下寄愿',action:'scene:2',angle:155,height:2.0,scale:1.0,scene:1});
    addHotspot({label:'展开诗笺',action:'poem',angle:0,height:2.0,scale:1.1,scene:2});
    addHotspot({label:'放灯许愿',action:'scene:3',angle:135,height:2.0,scale:1.0,scene:2});
    addHotspot({label:'放灯许愿',action:'release',angle:0,height:2.0,scale:1.1,scene:3});
    addHotspot({label:'再游长安',action:'scene:1',angle:135,height:2.0,scale:1.0,scene:3});
    setHotspotVisibility();
  }
  function setHotspotVisibility() {
    hotspotRoot.querySelectorAll('.hotspot').forEach(el => {
      el.object3D.visible = Number(el.dataset.scene) === currentScene;
    });
  }
  function updateSceneUI() {
    document.getElementById('sceneNumber').textContent = sceneData[currentScene].chapter;
    document.getElementById('sceneTitle').textContent = sceneData[currentScene].title;
    document.getElementById('sceneHint').textContent = sceneData[currentScene].hint;
    document.querySelectorAll('.scene-tab').forEach(btn => {
      const active = Number(btn.dataset.scene) === currentScene;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }
  function resetView() {
    const controls = camera.components && camera.components['look-controls'];
    if (controls && controls.yawObject && controls.pitchObject) {
      controls.yawObject.rotation.y = 0;
      controls.pitchObject.rotation.x = 0;
    }
  }
  function switchScene(index) {
    const next = Math.max(0,Math.min(3,Number(index)));
    if (!Number.isFinite(next)) return;
    currentScene = next;
    fade.classList.add('active');
    setTimeout(() => {
      sky.setAttribute('src', `#${sceneData[currentScene].id}`);
      setHotspotVisibility();
      updateSceneUI();
      resetView();
      setTimeout(() => fade.classList.remove('active'), 80);
    }, 260);
  }
  function handleAction(action) {
    if (!action) return;
    if (action.startsWith('scene:')) { switchScene(Number(action.split(':')[1])); return; }
    if (action.startsWith('blessing:')) {
      const b = blessings[Number(action.split(':')[1])];
      if (!b) return;
      document.getElementById('blessingTitle').textContent = b.title;
      document.getElementById('blessingText').textContent = b.text;
      showModal('blessingModal'); return;
    }
    if (action === 'poem') { showModal('poemModal'); return; }
    if (action === 'release') { releaseLanterns(); return; }
  }
  function releaseLanterns() {
    switchScene(3);
    const root = document.getElementById('lanternParticles');
    root.innerHTML = '';
    const count = window.innerWidth < 600 ? 22 : 40;
    for(let i=0;i<count;i++) {
      const item = document.createElement('span'); item.className='float-lantern';
      item.style.left = `${Math.random()*100}%`;
      item.style.setProperty('--dur',`${6+Math.random()*5}s`);
      item.style.setProperty('--drift',`${Math.random()*100-50}px`);
      item.style.animationDelay = `${Math.random()*1.5}s`;
      root.appendChild(item);
    }
    showModal('finalModal');
  }

  // 通过真实的 Pointer Events + THREE.Raycaster 处理鼠标和手机点按，拖动视角时不误触。
  function initSceneInteractions() {
    buildHotspots();
    updateSceneUI();
    const canvas = sceneEl.canvas;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = {x:e.clientX,y:e.clientY}; });
    canvas.addEventListener('pointerup', e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX-down.x,e.clientY-down.y);
      down = null;
      if (moved > 12 || document.querySelector('.overlay:not([hidden])')) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX-rect.left)/rect.width)*2-1;
      pointer.y = -((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(pointer, sceneEl.camera);
      sceneEl.object3D.updateMatrixWorld(true);
      const visible = [...hotspotRoot.querySelectorAll('.hotspot')].filter(el => el.object3D.visible);
      const hits = raycaster.intersectObjects(visible.map(el=>el.object3D),true);
      if (!hits.length) return;
      let node = hits[0].object; let entity = null;
      while(node && !entity) { if(node.el && node.el.classList && node.el.classList.contains('hotspot')) entity=node.el; node=node.parent; }
      if (entity) handleAction(entity.dataset.action);
    });
  }
  if (!window.AFRAME) document.getElementById('sceneError').hidden = false;
  else if (sceneEl.hasLoaded) initSceneInteractions();
  else sceneEl.addEventListener('loaded', initSceneInteractions, { once: true });

  document.getElementById('enterVrBtn').addEventListener('click', async () => {
    intro.hidden = true;
    document.body.classList.add('dream-entered');
    document.getElementById('gestureTip').classList.add('visible');
    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(() => document.getElementById('gestureTip').classList.remove('visible'), 6500);
    await playMusic(false);
  });
  document.querySelectorAll('.scene-tab').forEach(btn=>btn.addEventListener('click',()=>switchScene(btn.dataset.scene)));
  document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
  document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;}));
  document.getElementById('backToStreetBtn').addEventListener('click',()=>{closeModal('finalModal');switchScene(1);});

  function updateMusicUI(playing) {
    if (musicSource === 'qq') {
      musicBtn.removeAttribute('aria-pressed');
      musicBtn.setAttribute('aria-haspopup', 'dialog');
      musicBtn.setAttribute('aria-label', '打开 QQ 音乐播放器');
      musicBtn.title = '打开 QQ 音乐播放器';
      return;
    }
    musicBtn.removeAttribute('aria-haspopup');
    musicBtn.setAttribute('aria-pressed', String(playing));
    const label = playing ? '暂停音乐' : '播放音乐';
    musicBtn.setAttribute('aria-label', label);
    musicBtn.title = label;
  }
  async function playMusic(showMissing=true) {
    try {
      if (!bgm.src || bgm.error) throw new Error('missing');
      await bgm.play(); updateMusicUI(true);
      return true;
    } catch(err) {
      updateMusicUI(false);
      if(showMissing) toast('浏览器暂未允许播放，请再次点击音乐图标。');
      return false;
    }
  }
  function openQQMusic() {
    musicSource = 'qq';
    bgm.pause();
    updateMusicUI(false);
    document.getElementById('settings').open = false;
    if (!qqMusicPlayer.hasAttribute('src')) qqMusicPlayer.src = qqMusicUrl;
    showModal('qqMusicModal');
  }
  document.getElementById('qqMusicBtn').addEventListener('click', openQQMusic);
  musicBtn.addEventListener('click',async()=>{
    if (musicSource === 'qq') { openQQMusic(); return; }
    if(bgm.paused) await playMusic(true);
    else {bgm.pause();updateMusicUI(false);}
  });
  chooseAudioBtn.addEventListener('click',()=>{document.getElementById('settings').open=false;audioFile.click();});
  audioFile.addEventListener('change',async e=>{
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    musicSource = 'local';
    // 卸载外链播放器，避免与本地音乐同时播放。
    qqMusicPlayer.removeAttribute('src');
    closeModal('qqMusicModal');
    if(localAudioUrl)URL.revokeObjectURL(localAudioUrl);
    localAudioUrl=URL.createObjectURL(file);
    bgm.src=localAudioUrl;
    await playMusic(true);
    toast('已载入本地音乐；这只在当前设备与本次会话有效。');
  });
  bgm.addEventListener('play',()=>updateMusicUI(true));
  bgm.addEventListener('pause',()=>updateMusicUI(false));

  // 页面载入后立即尝试播放；被浏览器拦截时，在第一次普通交互中自动重试。
  async function tryAutoplay() {
    const started = await playMusic(false);
    if (started) return;
    const resumeMusic = async event => {
      if (event.target.closest && event.target.closest('#musicBtn')) return;
      const resumed = await playMusic(false);
      if (resumed) {
        document.removeEventListener('click', resumeMusic, true);
        document.removeEventListener('keydown', resumeMusic, true);
      }
    };
    document.addEventListener('click', resumeMusic, true);
    document.addEventListener('keydown', resumeMusic, true);
  }
  tryAutoplay();

  gyroBtn.addEventListener('click',async()=>{
    try {
      if (typeof DeviceOrientationEvent === 'undefined') { toast('当前设备或浏览器不支持陀螺仪；仍可用手指滑动环视。'); return; }
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') { toast('未获得传感器权限，仍可用触屏滑动环视。'); return; }
      }
      camera.setAttribute('look-controls', 'magicWindowTrackingEnabled: true; touchEnabled: true');
      toast('已请求陀螺仪权限；如果设备支持，转动手机即可环视。');
    } catch (e) { toast('无法启用陀螺仪，请检查浏览器权限；触屏环视仍可使用。'); }
  });

  // 支持键盘 Esc 关闭弹窗。
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal').forEach(m=>m.hidden=true);document.getElementById('settings').open=false;}});
  document.addEventListener('click',e=>{if(!e.target.closest('.settings'))document.getElementById('settings').open=false;});
})();

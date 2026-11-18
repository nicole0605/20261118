let idleSheet; // 儲存角色待機動畫的精靈圖
let attackSheet; // 儲存角色攻擊動畫的精靈圖
let backgroundImage; // 儲存背景圖片
let lightningSheet; // 儲存閃電特效精靈圖
let explosionSheet; // 儲存藍色爆炸特效精靈圖
let thunderSound; // 儲存閃電播放時使用的雷聲音效
const idleFrameCount = 6; // 設定待機動畫的圖片格數
const attackFrameCount = 8; // 設定攻擊動畫的圖片格數
const lightningFrameCount = 14; // 設定閃電動畫的圖片格數
const explosionFrameCount = 10; // 設定爆炸動畫的圖片格數
const idleFrameDuration = 120; // 設定待機動畫每格顯示的毫秒數
const attackFrameDuration = 90; // 設定攻擊動畫每格顯示的毫秒數
const effectDuration = 1000; // 設定每次特效動畫的播放時間
const backgroundSpeed = 5; // 設定按住方向鍵時的背景捲動速度
const spriteScale = 2; // 設定角色圖片的顯示放大倍率
let backgroundOffset = 0; // 記錄背景圖片的水平位移
let facing = 1; // 記錄角色朝向，1為右方，-1為左方
let characterX = 0; // 記錄角色在畫面上的水平位置
let rightEdgeEffectStartedAt = null; // 記錄背景抵達右側邊界時的特效循環起始時間
let isAttacking = false; // 記錄目前是否正在播放攻擊動作
let attackStartedAt = 0; // 記錄攻擊動畫開始播放的時間
let activeAttackKey = 0; // 記錄目前觸發攻擊的方向鍵

function preload() { // 在畫面建立前載入動畫與背景圖片
  idleSheet = loadImage("2/stop/stop.png"); // 載入六格待機精靈圖
  attackSheet = loadImage("2/attack/attack.png"); // 載入八格攻擊精靈圖
  backgroundImage = loadImage("background/0.png"); // 載入遊戲背景圖片
  lightningSheet = loadImage("2/effect/1/effect1.png"); // 載入十四格閃電特效精靈圖
  explosionSheet = loadImage("2/effect/2/effect2.png"); // 載入十格藍色爆炸特效精靈圖
  thunderSound = loadSound("audio/freesound_community-clean-thunder-69077.mp3"); // 載入閃電使用的雷聲音效
} // 結束圖片載入函式

function setup() { // 設定畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合目前視窗大小的全螢幕畫布
  imageMode(CORNER); // 使用圖片左上角作為繪製座標
  characterX = width / 2; // 將角色初始位置設在畫面中央
  const backgroundScale = Math.max(width / backgroundImage.width, height / backgroundImage.height); // 計算背景滿版時的縮放倍率
  const backgroundTileWidth = backgroundImage.width * backgroundScale; // 計算單張滿版背景的寬度
  backgroundOffset = (width - backgroundTileWidth * 2) / 2; // 將兩張相連的背景置中以保留左右移動空間
} // 結束畫布設定函式

function draw() { // 每一影格更新背景與角色
  const backgroundScale = Math.max(width / backgroundImage.width, height / backgroundImage.height); // 依畫布比例計算背景滿版縮放倍率
  const backgroundTileWidth = backgroundImage.width * backgroundScale; // 計算單張背景縮放後的寬度
  const backgroundTileHeight = backgroundImage.height * backgroundScale; // 計算單張背景縮放後的高度
  const minimumBackgroundOffset = width - backgroundTileWidth * 2; // 計算最右側背景邊緣剛好碰到視窗右側時的位移
  const characterMargin = (attackSheet.width / attackFrameCount * spriteScale) / 2; // 計算角色到達畫面邊緣時所需保留的半身寬度
  const direction = keyIsDown(RIGHT_ARROW) ? 1 : keyIsDown(LEFT_ARROW) ? -1 : 0; // 判斷目前按住的方向鍵
  if (direction === 1) { // 按住右鍵時先向左捲動背景，再移動角色
    if (characterX < width / 2) { // 角色在中央左側時先回到中央
      characterX = Math.min(characterX + backgroundSpeed, width / 2); // 逐步將角色移回畫面中央
    } else if (backgroundOffset > minimumBackgroundOffset) { // 背景尚未到達最右側邊界時繼續捲動
      backgroundOffset = Math.max(backgroundOffset - backgroundSpeed, minimumBackgroundOffset); // 向左移動背景並限制在最右側邊界
    } else { // 背景到達最右側邊界後改由角色移動
      characterX = Math.min(characterX + backgroundSpeed, width - characterMargin); // 將角色向右移至畫面邊緣並停下
    } // 結束右移背景與角色判斷
  } else if (direction === -1) { // 按住左鍵時先向右捲動背景，再移動角色
    if (characterX > width / 2) { // 角色在中央右側時先回到中央
      characterX = Math.max(characterX - backgroundSpeed, width / 2); // 逐步將角色移回畫面中央
    } else if (backgroundOffset < 0) { // 背景尚未到達最左側邊界時繼續捲動
      backgroundOffset = Math.min(backgroundOffset + backgroundSpeed, 0); // 向右移動背景並限制在最左側邊界
    } else { // 背景到達最左側邊界後改由角色移動
      characterX = Math.max(characterX - backgroundSpeed, characterMargin); // 將角色向左移至畫面邊緣並停下
    } // 結束左移背景與角色判斷
  } // 結束背景捲動判斷
  const isAtRightBoundary = backgroundOffset <= minimumBackgroundOffset; // 判斷背景是否已抵達最右側邊界
  const rightmostTileX = backgroundOffset + backgroundTileWidth; // 計算最右側背景副本目前的左側座標
  const rightmostQuarterStart = rightmostTileX + backgroundTileWidth * 0.75; // 計算最右側背景四分之一區域的起點
  const isRightmostQuarterVisible = rightmostTileX + backgroundTileWidth > 0 && rightmostQuarterStart < width; // 判斷最右側背景四分之一區域是否仍在畫面內
  if (isAtRightBoundary && rightEdgeEffectStartedAt === null) { // 首次抵達右側邊界時啟動特效循環
    rightEdgeEffectStartedAt = millis(); // 記錄閃電與爆炸特效循環開始時間
  } else if (rightEdgeEffectStartedAt !== null && !isRightmostQuarterVisible) { // 最右側背景四分之一區域離開畫面時停止特效
    rightEdgeEffectStartedAt = null; // 清除特效循環時間以便下次抵達時重新開始
  } // 結束右側邊界特效狀態更新
  if (rightEdgeEffectStartedAt !== null && !thunderSound.isPlaying()) { // 閃電區域仍在畫面內且雷聲尚未播放時啟動循環音效
    thunderSound.loop(); // 持續播放雷聲直到最右側背景四分之一離開畫面
  } else if (rightEdgeEffectStartedAt === null && thunderSound.isPlaying()) { // 特效區域離開畫面後停止雷聲
    thunderSound.stop(); // 停止循環播放的雷聲
  } // 結束雷聲播放狀態更新
  background(0); // 清除畫布並以黑色填滿可能露出的空隙
  for (let tile = 0; tile < 2; tile += 1) { // 並排繪製原背景與一張複製背景
    const tileX = backgroundOffset + tile * backgroundTileWidth; // 計算兩張相連背景各自的水平座標
    const tileY = (height - backgroundTileHeight) / 2; // 將背景垂直置中以填滿畫面
    image(backgroundImage, tileX, tileY, backgroundTileWidth, backgroundTileHeight); // 繪製背景圖片並與相鄰圖片首尾相接
  } // 結束背景重複繪製迴圈
  drawRightEdgeEffect(); // 在背景右側邊界播放循環閃電與爆炸特效
  drawCharacter(); // 繪製目前位置的角色動畫
} // 結束每影格更新函式

function drawRightEdgeEffect() { // 在背景右側停止時播放三次閃電與一次爆炸
  if (rightEdgeEffectStartedAt === null) { // 背景尚未抵達最右側時不繪製特效
    return; // 結束本次特效繪製
  } // 結束特效啟動狀態判斷
  const elapsedTime = millis() - rightEdgeEffectStartedAt; // 計算特效循環已播放的時間
  const cycleDuration = effectDuration * 4; // 設定三次閃電加一次爆炸的循環總長度
  const cycleTime = elapsedTime % cycleDuration; // 取得目前循環中的播放時間
  const effectX = width * 0.75; // 將特效中心定位在距離視窗右側四分之一寬的位置
  if (cycleTime < effectDuration * 3) { // 在循環前三秒依序播放三次閃電
    const lightningTime = cycleTime % effectDuration; // 取得本次閃電動畫的播放時間
    const lightningFrame = Math.floor(lightningTime / effectDuration * lightningFrameCount); // 計算本次閃電要顯示的動畫格
    const lightningFrameWidth = lightningSheet.width / lightningFrameCount; // 計算閃電精靈圖單格寬度
    const lightningScale = height / lightningSheet.height; // 依畫面高度等比例放大閃電特效
    const lightningDisplayWidth = lightningFrameWidth * lightningScale; // 計算等比例放大後的閃電寬度
    image(lightningSheet, effectX - lightningDisplayWidth / 2, 0, lightningDisplayWidth, height, lightningFrame * lightningFrameWidth, 0, lightningFrameWidth, lightningSheet.height); // 由視窗頂端播放閃電直到視窗底端
  } else { // 三次閃電完成後播放一次藍色爆炸
    const explosionTime = cycleTime - effectDuration * 3; // 計算爆炸動畫的播放時間
    const explosionFrame = Math.floor(explosionTime / effectDuration * explosionFrameCount); // 計算爆炸特效要顯示的動畫格
    const explosionFrameWidth = explosionSheet.width / explosionFrameCount; // 計算爆炸精靈圖單格寬度
    const explosionFrameHeight = explosionSheet.height; // 取得爆炸精靈圖單格高度
    image(explosionSheet, effectX - explosionFrameWidth / 2, height - explosionFrameHeight, explosionFrameWidth, explosionFrameHeight, explosionFrame * explosionFrameWidth, 0, explosionFrameWidth, explosionFrameHeight); // 在視窗底端播放藍色爆炸特效
  } // 結束閃電與爆炸播放階段判斷
} // 結束右側邊界特效繪製函式

function drawCharacter() { // 依照目前狀態繪製待機或攻擊動畫
  const isPlayingAttack = isAttacking; // 判斷是否顯示攻擊精靈圖
  const spriteSheet = isPlayingAttack ? attackSheet : idleSheet; // 選擇目前要使用的精靈圖
  const frameCount = isPlayingAttack ? attackFrameCount : idleFrameCount; // 取得目前動畫的圖片格數
  const frameWidth = spriteSheet.width / frameCount; // 依總寬度與格數計算單格寬度
  const frameHeight = spriteSheet.height; // 取得精靈圖的單格高度
  let frameIndex = 0; // 預設使用動畫的第一格
  if (isPlayingAttack) { // 攻擊動畫循環播放全部圖片格
    frameIndex = Math.floor((millis() - attackStartedAt) / attackFrameDuration) % attackFrameCount; // 持續循環播放八格攻擊畫面
  } else { // 沒有攻擊時循環播放待機動畫
    frameIndex = Math.floor(millis() / idleFrameDuration) % idleFrameCount; // 依時間循環切換六格待機畫面
  } // 結束動畫格數判斷
  const sourceX = frameIndex * frameWidth; // 計算目前動畫格在精靈圖中的水平位置
  const displayWidth = frameWidth * spriteScale; // 計算角色畫面顯示寬度
  const displayHeight = frameHeight * spriteScale; // 計算角色畫面顯示高度
  push(); // 暫存畫布的座標與縮放狀態
  translate(characterX, height * 0.8); // 將角色繪製在目前位置的畫面偏下處
  if (facing === -1) { // 按左鍵時水平翻轉角色方向
    scale(-1, 1); // 將角色圖片左右鏡像
  } // 結束角色翻轉判斷
  image(spriteSheet, -displayWidth / 2, -displayHeight, displayWidth, displayHeight, sourceX, 0, frameWidth, frameHeight); // 擷取並繪製目前動畫格
  pop(); // 還原畫布的座標與縮放狀態
} // 結束角色繪製函式

function keyPressed() { // 按下方向鍵時設定角色攻擊狀態
  if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) { // 只處理左右方向鍵輸入
    userStartAudio(); // 透過使用者按鍵啟用瀏覽器音訊播放
    if (keyCode !== activeAttackKey) { // 忽略按住同一方向鍵時產生的重複按鍵事件
      facing = keyCode === RIGHT_ARROW ? 1 : -1; // 依按鍵方向設定角色面向
      isAttacking = true; // 切換到攻擊動畫
      attackStartedAt = millis(); // 從攻擊動畫第一格開始計時
      activeAttackKey = keyCode; // 記錄觸發攻擊的方向鍵
    } // 結束重複按鍵判斷
    return false; // 阻止方向鍵捲動瀏覽器頁面
  } // 結束左右方向鍵判斷
} // 結束按鍵按下函式

function keyReleased() { // 放開方向鍵時恢復待機動畫
  if (keyCode === activeAttackKey) { // 確認放開的是目前記錄的攻擊方向鍵
    activeAttackKey = 0; // 清除已放開的方向鍵記錄
  } // 結束方向鍵記錄判斷
  if (!keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) { // 確認左右方向鍵都已放開
    isAttacking = false; // 切回循環播放的待機動畫
  } // 結束按鍵放開狀態判斷
  if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) { // 只處理左右方向鍵輸入
    return false; // 阻止方向鍵捲動瀏覽器頁面
  } // 結束左右方向鍵判斷
} // 結束按鍵放開函式

function windowResized() { // 視窗尺寸改變時同步調整畫布
  resizeCanvas(windowWidth, windowHeight); // 讓畫布配合目前的瀏覽器視窗大小
  characterX = width / 2; // 視窗改變後將角色重新置於畫面中央
  const backgroundScale = Math.max(width / backgroundImage.width, height / backgroundImage.height); // 重新計算背景滿版時的縮放倍率
  const backgroundTileWidth = backgroundImage.width * backgroundScale; // 重新計算單張背景的滿版寬度
  backgroundOffset = (width - backgroundTileWidth * 2) / 2; // 重新置中兩張相連的背景
  rightEdgeEffectStartedAt = null; // 視窗改變後重設邊界特效循環
  if (thunderSound.isPlaying()) { // 視窗改變時若雷聲正在播放則一併停止
    thunderSound.stop(); // 停止重設前的雷聲循環
  } // 結束視窗調整時的雷聲處理
} // 結束視窗調整函式

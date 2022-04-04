// load animated image assets
function loadAnimation(filename, num) {
  let anim = [];
  for(let n = 1; n <= num; n++) {
    anim.push(loadImage(filename + n + '.png'));
  }
  return anim;
}

// draw the image of the mouse:
// (position X, positionY, face direction, moving state, if has pizza, how many mice are sticking together)
function drawMouse(x, y, dir, ifRunning, hasPizza, miceNum , membersPizzaPicked) {
  
  
// NOTES:
// to know if each group member picked pizza, use a for loop 
// for(let [index, pizzaPicked] of membersPizzaPicked.entries()){
  
//     index: 0,1,2,3 ... (indicates the nth player in the group)
//     pizzaPicked: true, false, false, true ... (indicate if the nth player has pizza)

    
// }
  
      
  push();
  imageMode(CORNER);
  let img, movingState = ifRunning ? 'run' : 'stand', animSpeed = ifRunning ? 24 : 45;
  let imgIndex = floor(frameCount % animSpeed / (animSpeed / 6));
  
  // select the image
  if(miceNum <= 1) {
    img = ASSETSManager.get("mouse_" + movingState)[imgIndex];
  } else {
    img = ASSETSManager.get("mouse_multi_" + movingState)[imgIndex];
  }
  // calculate the position
  let posX = x - 56, posY = y - img.height + 30;
  // check the face direction
  if(dir === 'right') {
    scale(-1, 1);
    posX = -56 - x;
  }
  
  image(img, posX, posY); // draw the mouse image
  
  if(miceNum >= 3) { // draw additional mice
    for(let m = 0; m <= miceNum - 3; m++) {
      let addImgs;
      if(m % 2 === 0) addImgs = ASSETSManager.get("mouse_multi_forward_" + movingState);
      else addImgs = ASSETSManager.get("mouse_multi_back_" + movingState);
      posY = y - addImgs[imgIndex].height + 30;
      image(addImgs[imgIndex], posX, posY - (ifRunning ? 40 : 32) * m);
    }
  }
  
  // check if has pizza
  let pizzaImg_forward = ASSETSManager.get("pizza_forward_" + movingState)[imgIndex];
  let pizzaImg_back = ASSETSManager.get("pizza_back_" + movingState)[imgIndex];
  // check each group member


  for (let i=0; i < membersPizzaPicked.length; i++){
    let pizzaPicked = membersPizzaPicked[i];

    
    if(pizzaPicked) {
      if(i % 2 === 0) {
        posY = y - pizzaImg_forward.height + 30 - i / 2 * (ifRunning ? 40 : 32);
        image(pizzaImg_forward, posX, posY);
      } else {
        posY = y - pizzaImg_back.height + 30 - floor(i / 2) * (ifRunning ? 40 : 32);
        image(pizzaImg_back, posX, posY);
      }
    } else continue;
  }
  pop();
}
// draw the black mask
function drawMask(x, y) {
  push();
  imageMode(CENTER);
  image(ASSETSManager.get("mask"), x, y - 15);
  
  pop();
}

// play an animation effect
function playAnime(name, speed = 0.2) {
  let anime = ASSETSManager.get(name);
  
}

// draw the black mask
function drawMask(x, y) {
  push();
  imageMode(CENTER);
  image(ASSETSManager.get("mask"), x, y - 15);
  
  pop();
}

// subscribed event for playing sound
function playSound(name) {
  ASSETSManager.get(name).play();
}

// rectangle collide box check
// obj need to have property: x, y, width, height
function ifCollideRect(obj1, obj2, mode = "CENTER") {
  let x1 = obj1.x, y1 = obj1.y, x2 = obj2.x, y2 = obj2.y;
  let w1 = obj1.width, h1 = obj1.height, w2 = obj2.width, h2 = obj2.height;
  switch(mode) {
    case "CENTER":
      if(x1 + w1/2 > x2 - w2/2 || x1 - w1/2 < x2 + w2/2 || y1 + h1/2 > y2 - h2/2 || y1 - h1/2 < y2 + h2/2)
        return true;
      else return false;
      break;
    case "CORNER":
      if(x1 + w1 > x2 || x1 < x2 + w2 || y1 + h1 > y2 || y1 < y2 + h2)
        return true;
      else return false;
      break;
  }
}

// camera object
class camera2D {
  constructor(mapSize, x = 0, y = 0, w = width, h = height) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.mapSize = mapSize;
  }
  
  // move the camera
  moveTo(newX, newY) {
    if(newX < mapSize.x - this.width / 2 && newX > this.width / 2 && newY < mapSize.y - this.height / 2 && newY > this.height / 2) {
      this.x = newX;
      this.y = newY;
    }
  }
  addX(deltaX) {
    let newX = this.x + deltaX;
    if(newX < mapSize.x - this.width / 2 && newX > this.width / 2)
      this.x += deltaX;
  }
  addY(deltaY) {
    let newY = this.y + deltaY;
    if(newY < mapSize.y - this.height / 2 && newY > this.height / 2)
      this.y += deltaY;
  }
  
  // translate the absolute coordinate to relative coordinate
  transX(absX) {
    return absX - this.x + this.width / 2;
  }
  transY(absY) {
    return absY - this.y + this.height / 2;
  }
}
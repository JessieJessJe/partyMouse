/////////////////////define classes for info of collision groups 
//only host will need to modify them

class ColliGroup{
  constructor(body = null){
    this.members = new Set();
    this.body = body;
    this.id = Math.random()
    
    this.addMember.bind(this);
    this.updatePosition.bind(this);
    this.getPosition.bind(this);
    this.clone.bind(this);
  }
  
  setPosition(prop){
    this.body = {x:prop.body.x , y:prop.body.y} 
  }
  
  addMember(index){
    this.members.add(index)
    
  }
  
  updatePosition(prop){  
    this.body.x += prop.dX;
    this.body.y += prop.dY;
  }
  
  getPosition(index){
    let arr = Array.from(this.members.keys())
    
    let offset = (arr.indexOf(index)+1) * 25 - arr.length * 25;
    let x = this.body.x;
    let y = this.body.y  + offset ;

    return [x , y]
  }
  
  clone(){
  
    let newGroup = new ColliGroup(); 
    let prop = {};
    prop.body = { x: this.body.x, y: this.body.y}
    
    newGroup.setPosition(prop);
    
    this.members.forEach((memberIdx)=>{
      newGroup.addMember(memberIdx);
    });
  
    return newGroup;
  }
}

class ColliGroups{
  constructor(prop, firstIdx = 0){
    //assume 'my' is the first item in participants array, so firstIdx = 0 
    this.groups = [];
    
    let newGroup = new ColliGroup();
    newGroup.addMember(firstIdx); 
    newGroup.setPosition(prop);
    this.groups.push(newGroup);
    
    this.addGroup.bind(this);
    this.mergeGroup.bind(this);
  }
  
  ifHasGroup(index){
    let result = false
    this.groups.forEach( (group)=>{
      
     if (group.members.has(index)){
       result = group;
     }
      
    })
    return result;
  }  
  
  addGroup(index, prop){
    
    let newGroup = new ColliGroup();
    newGroup.addMember(index)
    newGroup.setPosition(prop);
    this.groups.push(newGroup);
    
    return newGroup
  }
  
  mergeGroup(groupA, groupB){
  
    //create a new group
    let newMergedGroup = groupA.clone();
    
    groupB.members.forEach((memberIdx)=>{
      newMergedGroup.addMember(memberIdx)
    })
    
    //create a new group lists without groupA, groupB
    let newGroups = []
    this.groups.forEach((group)=>{
      if (groupA.id !== group.id && groupB.id !== group.id){
        newGroups.push(group)
      }      
    })
    
    //add the merged group to the new group lists
    newGroups.push(newMergedGroup)
    this.groups = newGroups;
    
    return newMergedGroup;   
  }
}

let colliGroups = null;

/////////////////////////

let shared;
let my;
let participants;
//let others = [];

let myBody;
// let bodyA;
let obst;

const ASSETSManager = new Map();

function preload() {
  partyConnect("wss://deepstream-server-1.herokuapp.com", "arteam3", "newroom0");
  shared = partyLoadShared("shared");
  my = partyLoadMyShared();
  participants = partyLoadParticipantShareds();
  
  // load assets
  // single mouse animation
  ASSETSManager.set("mouse_stand", loadAnimation("assets/Mouse_stand_", 6));
  ASSETSManager.set("mouse_run", loadAnimation("assets/Mouse_run_", 6));
  // multi mice animation
  ASSETSManager.set("mouse_multi_stand", loadAnimation("assets/Mouse_stand_multi_", 6));
  ASSETSManager.set("mouse_multi_run", loadAnimation("assets/Mouse_run_multi_", 6));
  ASSETSManager.set("mouse_multi_forward_stand", loadAnimation("assets/Mouse_stand_multi_forward_", 6));
  ASSETSManager.set("mouse_multi_forward_run", loadAnimation("assets/Mouse_run_multi_forward_", 6));
  ASSETSManager.set("mouse_multi_back_stand", loadAnimation("assets/Mouse_stand_multi_back_", 6));
  ASSETSManager.set("mouse_multi_back_run", loadAnimation("assets/Mouse_run_multi_back_", 6));
  // pizza animation
  ASSETSManager.set("pizza_forward_stand", loadAnimation("assets/Pizza_stand_forward_", 6));
  ASSETSManager.set("pizza_forward_run", loadAnimation("assets/Pizza_run_forward_", 6));
  ASSETSManager.set("pizza_back_stand", loadAnimation("assets/Pizza_stand_back_", 6));
  ASSETSManager.set("pizza_back_run", loadAnimation("assets/Pizza_run_back_", 6));
  // objects
  ASSETSManager.set("pizza_on_ground", loadImage("assets/Pizza_on_ground.png"));
  ASSETSManager.set("objects", loadAnimation("assets/Obstacle_", 9));
  ASSETSManager.set("hole", loadImage("assets/Targethole.png"));
  ASSETSManager.set("hole_EX", loadImage("assets/Targethole_EX.png"));
  ASSETSManager.set("target_arrow", loadAnimation("assets/Target_arrow_", 4));
  // background
  ASSETSManager.set("background", loadImage("assets/Background.png"));
  ASSETSManager.set("mask", loadImage("assets/Mask.png"));
}

function loadAnimation(filename, num) {
  let anim = [];
  for(let n = 1; n <= num; n++) {
    anim.push(loadImage(filename + n + '.png'));
  }
  return anim;
}

// draw the image of the mouse:
// (position X, positionY, face direction, moving state, if has pizza, how many mice are sticking together)
function drawMouse(x, y, dir, ifRunning, hasPizza, miceNum = 1) {
  push();
  imageMode(CORNER);
  let img, movingState = ifRunning ? 'run' : 'stand', animSpeed = ifRunning ? 24 : 45;
  // select the image
  if(miceNum <= 1) {
    img = ASSETSManager.get("mouse_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))];
  } else {
    img = ASSETSManager.get("mouse_multi_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))];
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
      if(m % 2 === 0) image(ASSETSManager.get("mouse_multi_forward_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))], posX, posY - (ifRunning ? 40 : 32));
      else image(ASSETSManager.get("mouse_multi_back_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))], posX, posY - (ifRunning ? 40 : 32));
    }
  }
  
  // check if has pizza
  if(hasPizza) {
    let pizzaImg = ASSETSManager.get("pizza_forward_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))];
    posY = y - pizzaImg.height + 30
    image(pizzaImg, posX, posY);
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

function setup() {
  partyToggleInfo(false);

  createCanvas(800, 600);
  rectMode(CENTER);
  frameRate(30);
  noStroke();
  
  my.id = random(1);
  my.body = {x: int(random(width)), y: random(height)};  
  my.dX = 0;
  my.dY = 0;
  my.pizza = {x: random(width), y: random(height)}; 
  my.target = {x: random(width), y: random(height)};
  my.dir = 'none';
  my.facing = 'left';
  my.pizzaPicked = false;
  my.members = [];
  my.ready = true;
  
  if(partyIsHost()){
    
    partySetShared(shared, {obsts: [], score: 0, timer: 90})
    // shared.obsts = [];
    // shared.score = 0;
    for(let i = 0; i < 20; i++){
      shared.obsts.push({
        x: int(random(-20, width + 20)),
        y: int(height / 20 * i),
        type: floor(random(ASSETSManager.get("objects").length))});
    }
    
    //initialize colli groups
    colliGroups = new ColliGroups(my)

  }
  
}

function draw() {

  imageMode(CORNER);
  image(ASSETSManager.get("background"), 0, 0);
  
  if(partyIsHost()){
    if(frameCount % 60 === 0){
      shared.timer--;
    }
    if(shared.timer === 0){
      // endscreen here use shared.score for number of pizzas collected in total
      //shared.timer = 90;
    }
  }

  if(keyIsDown(38) && my.body.y > 10){
    my.dY = -3;
    my.dir = 'top';
  }else if(keyIsDown(40) && my.body.y < height - 10){
    my.dY = 3;
    my.dir = 'bottom';
  }else{
    my.dY = 0;
    //my.dir = 'none';
  }

  if(keyIsDown(37) && my.body.x > 10){
    my.dX = -3;
    my.dir = 'left';
    my.facing = 'left';
  }else if(keyIsDown(39) && my.body.x < width - 10){
    my.dX = 3;
    my.dir = 'right';
    my.facing = 'right';
  }else{
    my.dX = 0;
    //my.dir = 'none';
  }

  ///////////front end 
  
  if (!keyIsDown(39) && !keyIsDown(37) && !keyIsDown(38) && !keyIsDown(40)){
    handleParentEvent();
  }
  

  if(partyIsHost() ){
    
    let len = participants.length;
    
    //if switched host in the middle of the game
    if (!colliGroups){
     
      //first locate where's my among participants
      let myIdx = participants.map((p) => p.id).indexOf(my.id);
      
      //initialize groups
      colliGroups = new ColliGroups(my, myIdx)
    }
    
    //STEP 1: detect collisions 
    for (let i = 0; i < len-1; i++){ 
      
      //check if i has been assigned to a colli group
      let currentGroup = colliGroups.ifHasGroup(i);
   
      
       for (let j = i+1; j < len; j++){
         
         if (participants[j].ready){
                   
            //if two players collide: 
           if(dist(participants[i].body.x, participants[i].body.y, participants[j].body.x, participants[j].body.y) < 30){
             
             //check if j has been assigned to a colli group
             let currentGroupB = colliGroups.ifHasGroup(j);
             
             
             //then add i or j to the group -- there're 4 scenerios
             
             if (!currentGroup && !currentGroupB){
               //1: neither i, j has colli group
               currentGroup = colliGroups.addGroup(i, participants[i]);
               currentGroup.addMember(j, participants[j] ) 
               console.log('1')
               
             }else if(!currentGroup && currentGroupB){
               //2: add i to j's group
                currentGroup = currentGroupB.clone();
                currentGroup.addMember(i, participants[i])
               console.log('2')
               
             }else if(currentGroup && !currentGroupB){
               //3: add j to i's group
               //TBD if setTimeout is helpful
                setTimeout(()=>{
                  currentGroup.addMember(j, participants[j]) 
                } ,50)
              
                console.log('3')
               
             }else if(currentGroup.id !== currentGroupB.id){
              //4: i, j belong to different groups
              //so we need to merge the two groups
                currentGroup = colliGroups.mergeGroup(currentGroup, currentGroupB)
               console.log('4')
              }
            
          }
           
         }
 
        }
  
    } //STEP1: detect collisions ends
    
    //STEP 2: update positions
    //approach 1 --
    participants.forEach( (player, index)=>{
      
      let group = colliGroups.ifHasGroup(index);
      if (group){
        
        //add each group member's dX, dY
        group.updatePosition(player)
        
        player.dX = 0;
        player.dY = 0;
        
        let [x, y] = group.getPosition(index)      
        player.body = {x:x , y:y}
        
        player.members = Array.from(group.members.keys());
      }
      
    }) 

  }//end of partyIsHost()
  
  //update locations if no group assigned
  if (my.ready){//////////////////data validation
   
      if (my.members.length === 0){
      my.body.x += my.dX;
      my.body.y += my.dY;
    }
  }

  
  ////////////////////////////////
 
  participants.forEach((p, index) => {
      // fill(234, 33, 124);
      // ellipse(p.body.x, p.body.y, 20);
      if(p.id !== my.id){
        //others = participants.splice(index, 1);
        //console.log(my.id, others);
        if (p.ready){//////////////////data validation
         
          if(dist(p.body.x, p.body.y, my.body.x, my.body.y) < 20){
          //shared.score -= 1;
        }
        }
      }
    
      shared.obsts.forEach((obst) => {
        if (p.ready){//////////////////data validation
          if(dist(p.body.x, p.body.y, obst.x, obst.y) < 30){
            let disX = p.body.x - obst.x;
            let disY = p.body.y - obst.y;
            if(disX < 0 && obst.x < width - 40){
              obst.x++;
            }else if(disX > 0 && obst.x > 40){
              obst.x--;
            }
            if(disY < 0 && obst.y < height - 40){
              obst.y++;
            }else if(disY > 0 && obst.y > 40){
              obst.y--;
            }
          }
          
          shared.obsts.forEach((o) => {
            if (o === obst) return;
            if(dist(o.x, o.y, obst.x, obst.y) < 40){
              let disX = o.x - obst.x;
              let disY = o.y - obst.y;
              if(disX < 0){
                obst.x++;
              }else if(disX > 0){
                obst.x--;
              }
              if(disY < 0){
                obst.y++;
              }else if(disY > 0){
                obst.y--;
              }
            }
          });
          
        }
      });
      
  })
  
  if (my.ready){//////////////////data validation
    if(dist(my.body.x, my.body.y, my.pizza.x, my.pizza.y) < 30){
      my.pizza.x = my.body.x;
      my.pizza.y = my.body.y + 10;
      my.pizzaPicked = true;
    }
    if(dist(my.pizza.x, my.pizza.y, my.target.x, my.target.y) < 30){
      shared.score += 1;
      my.pizza.x = random(width);
      my.pizza.y = random(height);
      my.pizzaPicked = false;
      //my.target.x = random(width);
      //my.target.y = random(height);
    }
  }
  
  
  ////////////////////draw obstacles
  
  shared.obsts.forEach((obst) => {
    fill(24, 233, 14);
    imageMode(CENTER);
    image(ASSETSManager.get("objects")[obst.type], obst.x, obst.y);
    // ellipse(obst.x, obst.y, 40);
  });
  
  drawMask(my.body.x, my.body.y);
  ////////////////////draw pizza and hole
  push();
  fill(0);
  textSize(20);
  text(shared.timer, width/2, 20);
  
  fill(32, 54, 123);
  image(ASSETSManager.get("hole_EX"), my.target.x, my.target.y);
  // rect(my.target.x, my.target.y, 20, 20);
  
  fill(120, 135, 163);
  if(!my.pizzaPicked) {
    image(ASSETSManager.get("pizza_on_ground"), my.pizza.x, my.pizza.y);
    image(ASSETSManager.get("target_arrow")[floor(frameCount % 40 / 10)], my.pizza.x, my.pizza.y - 40);
  } else {
    image(ASSETSManager.get("target_arrow")[floor(frameCount % 40 / 10)], my.target.x, my.target.y - 40);
  }
  // rect(my.pizza.x, my.pizza.y, 20, 20);
  pop();
  
  ////////////////////draw groups of players
  
  if (my.members.length){

    let member = my.members[0];

    let dir = participants[member].dir !== 'none' ? participants[member].dir : (participants[member].facing == 'left' ? 'left' : 'right');
    let ifRunning = participants[member].dir !== 'none' ? true : false;
    drawMouse(participants[member].body.x, participants[member].body.y, dir, ifRunning, participants[member].pizzaPicked, my.members,length);
      // for (let member of my.members){
      //       fill(234, 33, 124);
   
      //   if (participants[member]){//////////////////data validation
      //     // draw the mouse -- jessie
      //     let dir = participants[member].dir !== 'none' ? participants[member].dir : (participants[member].facing == 'left' ? 'left' : 'right');
      //     let ifRunning = participants[member].dir !== 'none' ? true : false;
      //     drawMouse(participants[member].body.x, participants[member].body.y, dir, ifRunning, participants[member].pizzaPicked, my.members,length);
      //     // ellipse(participants[member].body.x, participants[member].body.y, 20);
          
          
      //   }
           
      // }
        
      }else{
        //draw the mouse -- jessie
        let dir = my.dir !== 'none' ? my.dir : (my.facing == 'left' ? 'left' : 'right');
        let ifRunning = my.dir !== 'none' ? true : false;
        drawMouse(my.body.x, my.body.y, dir, ifRunning, my.pizzaPicked,  my.members,length);
        fill(234, 33, 124);

      }
  
  my.dir = 'none';
}

///////////front end 
let parentKeyCode = 0; 

window.addEventListener("message", (e)=>{
    console.log(e.data, 'receive')
    parentKeyCode = e.data;
}) 

function handleParentEvent(){

  if(parentKeyCode === 38 && my.body.y > 10){
    my.dY = -3;
    my.dir = 'top';
  }else if(parentKeyCode === 40 && my.body.y < height - 10){
    my.dY = 3;
    my.dir = 'bottom';
  }else{
    my.dY = 0;
    //my.dir = 'none';
  }

  if(parentKeyCode === 37 && my.body.x > 10){
    my.dX = -3;
    my.dir = 'left';
    my.facing = 'left';
  }else if( parentKeyCode === 39 && my.body.x < width - 10){
    my.dX = 3;
    my.dir = 'right';
    my.facing = 'right';
  }else{
    my.dX = 0;
    //my.dir = 'none';
  }

}
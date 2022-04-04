let colliGroups = null;

/////////////////////////

let shared;
let my;
let participants;
//let others = [];

let myBody;
// let bodyA;
let obst;
let gameOver = false;

var mouseState = {
  ifRunning: false,
  ifSqueak: false
};
var myCamera;
const _mapWIDTH = 800, _mapHEIGHT = 600;
// assets manager
const ASSETSManager = new Map();
const imgFolder = "image/", audioFolder = "audio/";

function preload() {
  partyConnect("wss://deepstream-server-1.herokuapp.com", "arteam3", "room0");
  shared = partyLoadShared("shared");
  my = partyLoadMyShared();
  participants = partyLoadParticipantShareds();
  
  // load assets
  ASSETSManager.set("timer_font", loadFont("pixelmix.ttf"));
  // single mouse animation
  ASSETSManager.set("mouse_stand", loadAnimation(imgFolder + "Mouse_stand_", 6));
  ASSETSManager.set("mouse_run", loadAnimation(imgFolder + "Mouse_run_", 6));
  // multi mice animation
  ASSETSManager.set("mouse_multi_stand", loadAnimation(imgFolder + "Mouse_stand_multi_", 6));
  ASSETSManager.set("mouse_multi_run", loadAnimation(imgFolder + "Mouse_run_multi_", 6));
  ASSETSManager.set("mouse_multi_forward_stand", loadAnimation(imgFolder + "Mouse_stand_multi_forward_", 6));
  ASSETSManager.set("mouse_multi_forward_run", loadAnimation(imgFolder + "Mouse_run_multi_forward_", 6));
  ASSETSManager.set("mouse_multi_back_stand", loadAnimation(imgFolder + "Mouse_stand_multi_back_", 6));
  ASSETSManager.set("mouse_multi_back_run", loadAnimation(imgFolder + "Mouse_run_multi_back_", 6));
  // pizza animation
  ASSETSManager.set("pizza_forward_stand", loadAnimation(imgFolder + "Pizza_stand_forward_", 6));
  ASSETSManager.set("pizza_forward_run", loadAnimation(imgFolder + "Pizza_run_forward_", 6));
  ASSETSManager.set("pizza_back_stand", loadAnimation(imgFolder + "Pizza_stand_back_", 6));
  ASSETSManager.set("pizza_back_run", loadAnimation(imgFolder + "Pizza_run_back_", 6));
  // objects
  ASSETSManager.set("pizza_on_ground", loadImage(imgFolder + "Pizza_on_ground.png"));
  ASSETSManager.set("objects", loadAnimation(imgFolder + "Obstacle_", 9));
  ASSETSManager.set("hole", loadImage(imgFolder + "Targethole.png"));
  ASSETSManager.set("hole_EX", loadImage(imgFolder + "Targethole_EX.png"));
  ASSETSManager.set("target_arrow", loadAnimation(imgFolder + "Target_arrow_", 4));
  // background
  ASSETSManager.set("background", loadImage(imgFolder + "Background.png"));
  ASSETSManager.set("mask", loadImage(imgFolder + "Mask.png"));
  
  // sound effects
  ASSETSManager.set("step", loadSound(audioFolder + "reitanna_step.wav"));
  ASSETSManager.set("squeak", loadSound(audioFolder + "rat_noise.ogg"));
  ASSETSManager.set("friction", loadSound(audioFolder + "friction.ogg"));
  ASSETSManager.set("pickup", loadSound(audioFolder + "pickup.wav"));
  ASSETSManager.set("score", loadSound(audioFolder + "score.wav"));
  ASSETSManager.set("collide", loadSound(audioFolder + "collide.wav"));
  ASSETSManager.set("subway", loadSound(audioFolder + "passing-train.wav"));
}

function setup() {
  partyToggleInfo(false);

  createCanvas(800, 600);
  rectMode(CENTER);
  frameRate(30);
  textFont(ASSETSManager.get("timer_font"));
  textAlign(CENTER);
  noStroke();
  
  my.id = random(1);
  my.body = {x: int(random(_mapWIDTH)), y: random(_mapHEIGHT)};  
  my.dX = 0;
  my.dY = 0;
  my.pizza = {x: random(_mapWIDTH), y: random(_mapHEIGHT)}; 
  my.target = {x: random(_mapWIDTH), y: random(_mapHEIGHT)};
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
        x: int(random(-20, _mapWIDTH + 20)),
        y: int(_mapHEIGHT / 20 * i),
        type: floor(random(ASSETSManager.get("objects").length))});
    }
    
    //initialize colli groups
    colliGroups = new ColliGroups(my)
    
    // subscribe party functions
    partySubscribe("playSound", playSound);
  }
  
  // set up the camera
  myCamera = new camera2D(createVector(_mapWIDTH, _mapHEIGHT));
}

function draw() {

  imageMode(CORNER);
  image(ASSETSManager.get("background"), 0, 0);
  
  if(partyIsHost()){
    if(frameCount % 30 === 0){
      shared.timer--;
      
      // play subway passing by sound
      if(frameCount % 1200 === 0) partyEmit("playSound", 'subway');
    }
    if(shared.timer === 0){
      // endscreen here use shared.score for number of pizzas collected in total
      //shared.timer = 90;
      gameOver = true;
    }
  }

  if(keyIsDown(38) && my.body.y > 10){
    my.dY = -3;
    my.dir = 'top';
  }else if(keyIsDown(40) && my.body.y < _mapHEIGHT - 10){
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
  }else if(keyIsDown(39) && my.body.x < _mapWIDTH - 10){
    my.dX = 3;
    my.dir = 'right';
    my.facing = 'right';
  }else{
    my.dX = 0;
    //my.dir = 'none';
  }
  
  // play step sound
  if(!mouseState.ifRunning) {
    ASSETSManager.get("step").loop();
    mouseState.ifRunning = true;
  }
  // play squeak sound
  if(!mouseState.ifSqueak && my.dir !== 'none' && random() < 0.02) {
    ASSETSManager.get("squeak").play();
    mouseState.ifSqueak = true;
  } else if(my.dir == 'none'){
    mouseState.ifSqueak = false;
  }
  ///////////front end 
  
  if (!keyIsDown(39) && !keyIsDown(37) && !keyIsDown(38) && !keyIsDown(40)){
    handleParentEvent();
    // stop playing step sound
    if(mouseState.ifRunning) {
      ASSETSManager.get("step").stop();
      mouseState.ifRunning = false;
    }
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
               // console.log('1')
               
             }else if(!currentGroup && currentGroupB){
               //2: add i to j's group
                currentGroup = currentGroupB.clone();
                currentGroup.addMember(i, participants[i])
               // console.log('2')
               
             }else if(currentGroup && !currentGroupB){
               //3: add j to i's group
                  currentGroup.addMember(j, participants[j]) 
  
                // console.log('3')
               
             }else if(currentGroup.id !== currentGroupB.id){
              //4: i, j belong to different groups
              //so we need to merge the two groups
                currentGroup = colliGroups.mergeGroup(currentGroup, currentGroupB)
               // console.log('4')
              }
            
             // play colliding sound
             // partyEmit("playSound", 'collide');
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
        
//         player.dX = 0;
//         player.dY = 0;
        
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
            if(disX < 0 && obst.x < _mapWIDTH - 40){
              obst.x++;
            }else if(disX > 0 && obst.x > 40){
              obst.x--;
            }
            if(disY < 0 && obst.y < _mapHEIGHT - 40){
              obst.y++;
            }else if(disY > 0 && obst.y > 40){
              obst.y--;
            }
            // play friction sound
            partyEmit("playSound", 'friction');
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
              // play friction sound
              partyEmit("playSound", 'friction');
            }
          });
          
        }
      });
      
  })
  
  if (my.ready){//////////////////data validation
    if(dist(my.body.x, my.body.y, my.pizza.x, my.pizza.y) < 30 && !my.pizzaPicked){
  
      my.pizza.x = my.body.x;
      my.pizza.y = my.body.y + 10;
      
      // play pick up sound
      ASSETSManager.get("pickup").play();
      
      my.pizzaPicked = true;
    }

    // if(dist(my.pizza.x, my.pizza.y, my.target.x, my.target.y) < 30){
    if( my.pizzaPicked === true && dist(my.body.x, my.body.y, my.target.x, my.target.y) < 30){
      shared.score += 1;
      my.pizza.x = random(_mapWIDTH);
      my.pizza.y = random(_mapHEIGHT);
      my.pizzaPicked = false;
      //my.target.x = random(width);
      //my.target.y = random(height);
      
      // play score sound
      ASSETSManager.get("score").play();
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
  
  ////////////////////draw player(s)
  let dir = my.dir !== 'none' ? my.dir : (my.facing == 'left' ? 'left' : 'right');
  let ifRunning = my.dir !== 'none' ? true : false;
  
  if (my.members.length){

      //draw player who belongs to a sticking group

      let leader = my.members[0];
      let pizzaPicked = participants[leader].pizzaPicked;

      //boolean array 
      //if each group member has pizza 
      let membersPizzaPicked = my.members.map((m)=>{    
        return (participants[m] && participants[m].pizzaPicked) ? true : false;   
      })


      drawMouse(participants[leader].body.x, participants[leader].body.y, dir, ifRunning, pizzaPicked, my.members.length , membersPizzaPicked);

      }else{

        //draw player who does not have a group
        
        //boolean array     
        let myPizzaPicked = []
        myPizzaPicked.push(my.pizzaPicked)
        
        drawMouse(my.body.x, my.body.y, dir, ifRunning, my.pizzaPicked,  my.members, 1 , myPizzaPicked);
    

      }
  
  my.dir = 'none';

  push();
  fill(255);
  textSize(32);
  text(shared.timer, width/2, 72);
  pop();
  
  if(gameOver){
    push();
    fill(255, 220);
    rect(width/2, height/2, width, height);
    fill(0);
    textFont(ASSETSManager.get("timer_font"));
    textSize(40);
    text(`Well done! You collected ${shared.score} pizzas.`, width/2, height/2);
    pop();
  }
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
  }else if(parentKeyCode === 40 && my.body.y < _mapHEIGHT - 10){
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
  }else if( parentKeyCode === 39 && my.body.x < _mapWIDTH - 10){
    my.dX = 3;
    my.dir = 'right';
    my.facing = 'right';
  }else{
    my.dX = 0;
    //my.dir = 'none';
  }

}
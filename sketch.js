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
  partyConnect("wss://deepstream-server-1.herokuapp.com", "arteam3", "newroom");
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
  // pizza animation
  ASSETSManager.set("pizza_forward_stand", loadAnimation("assets/Pizza_stand_forward_", 6));
  ASSETSManager.set("pizza_forward_run", loadAnimation("assets/Pizza_run_forward_", 6));
  ASSETSManager.set("pizza_back_stand", loadAnimation("assets/Pizza_stand_back_", 6));
  ASSETSManager.set("pizza_back_run", loadAnimation("assets/Pizza_run_back_", 6));
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
  if(miceNum < 3) {
    if(miceNum == 1) {
      img = ASSETSManager.get("mouse_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))];
    } else {
      img = ASSETSManager.get("mouse_multi_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))];
    }
  }
  // calculate the position
  let posX = x - 56, posY = y - img.height + 30;
  // check the face direction
  if(dir === 'right') {
    scale(-1, 1);
    posX = -56 - x;
  }
  image(img, posX, posY);
  
  // check if has pizza
  if(hasPizza) {
    let pizzaImg = ASSETSManager.get("pizza_forward_" + movingState)[floor(frameCount % animSpeed / (animSpeed / 6))];
    posY = y - pizzaImg.height + 30
    image(pizzaImg, posX, posY);
  }
  pop();
}

function setup() {
  createCanvas(600, 600);
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
    for(let i = 0; i < 40; i++){
      shared.obsts.push({x: int(random(-20, width+20)), y: int(random(-20, height+20))});
    }
    
    //initialize colli groups
    colliGroups = new ColliGroups(my)

  }
  
}

function draw() {


  background(220);
  
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
  
  
  /////////////////////////////////////
  //will update positions later
  // my.body.x += my.dX;
  // my.body.y += my.dY;
  

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
    //approach 2 --
//     colliGroups.groups.forEach((group)=>{
//       //update locations
//       group.members.forEach((memberIdx)=>{
//         group.updatePosition(participants[memberIdx])
//       })
//       //broadcast to all members
//       group.members.forEach((memberIdx)=>{
//         let [x, y] = group.getPosition(memberIdx)  
       
//         participants[memberIdx].body = {x:x , y:y }
//         participants[memberIdx].members = Array.from(group.members.keys())
//       })
      
    // })
    //STEP 2:ends
    
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
    if(dist(my.body.x, my.body.y, my.pizza.x, my.pizza.y) < 20){
      my.pizza.x = my.body.x;
      my.pizza.y = my.body.y + 10;
      my.pizzaPicked = true;
    }
    if(dist(my.pizza.x, my.pizza.y, my.target.x, my.target.y) < 20){
      shared.score += 1;
      my.pizza.x = random(width);
      my.pizza.y = random(height);
      my.pizzaPicked = false;
      //my.target.x = random(width);
      //my.target.y = random(height);
    }
  }
  ////////////////////draw groups of players
  
  if (my.members){  //////////////////data validation
  if (my.members.length){
      for (let member of my.members){
            fill(234, 33, 124);
   
        if (participants[member]){//////////////////data validation
          // draw the mouse
//           let dir = my.dir !== 'none' ? my.dir : (my.facing == 'left' ? 'left' : 'right');
//           let ifRunning = my.dir !== 'none' ? true : false;
//           drawMouse(participants[member].body.x, participants[member].body.y, dir, ifRunning, my.pizzaPicked);
//           ellipse(participants[member].body.x, participants[member].body.y, 20);
          
          // draw the mouse -- jessie
          let dir = participants[member].dir !== 'none' ? participants[member].dir : (participants[member].facing == 'left' ? 'left' : 'right');
          let ifRunning = participants[member].dir !== 'none' ? true : false;
          drawMouse(participants[member].body.x, participants[member].body.y, dir, ifRunning, participants[member].pizzaPicked);
          ellipse(participants[member].body.x, participants[member].body.y, 20);
          
          
        }
           
      }
        
      }else{
        //draw the mouse -- jessie
        let dir = my.dir !== 'none' ? my.dir : (my.facing == 'left' ? 'left' : 'right');
          let ifRunning = my.dir !== 'none' ? true : false;
          drawMouse(my.body.x, my.body.y, dir, ifRunning, my.pizzaPicked);
        fill(234, 33, 124);
        ellipse(my.body.x, my.body.y, 20);
      }
  
}

  ////////////////////
  
  shared.obsts.forEach((obst) => {
    fill(24, 233, 14);
    ellipse(obst.x, obst.y, 40);
  });
  
  //console.log(my.facing);
  
  push();
  fill(0);
  textSize(20);
  text(shared.timer, width/2, 20);
  
  fill(32, 54, 123);
  rect(my.target.x, my.target.y, 20, 20);
  
  fill(120, 135, 163);
  rect(my.pizza.x, my.pizza.y, 20, 20);
  push();
  
  my.dir = 'none';
}
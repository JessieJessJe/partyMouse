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
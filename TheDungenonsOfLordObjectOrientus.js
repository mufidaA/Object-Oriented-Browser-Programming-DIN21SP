const prompts = require('prompts');

class room {
    constructor(name, doors) {
        this.name = name;
        this.doors = doors;
        this.entities = [];
    }
    //slecting the door according to the existing true condition so door can take both ways 
    selectExit(door){
        return this.name == door.exit1 ? door.exit2 : door.exit1;
    }

    actionChoises(){
        var ActionChoices = [
            { title: 'Look around', value: 'look' },            
        ];

        for(var i=0; i<this.entities.length; i++)
            ActionChoices.push({title: 'Attack ' + this.entities[i].name, value: this.entities[i].name});
        
        // dont let the player leave without dealing with the enemies
        if(this.entities.length==0){ 
            for(var i=0; i<this.doors.length; ++i){
                var otherRoom = this.selectExit(this.doors[i]);
                ActionChoices.push( {title: 'Go to Room ' + otherRoom, value: otherRoom } );
            }
        }
        ActionChoices.push({ title: 'Exit game', value: 'exit'});
        return ActionChoices;
    }

    getEntity(name){
        for(var i=0; i<this.entities.length; i++){
            if(this.entities[i].name==name){
                return this.entities[i];
            }
        }
        return null;
    }
    //function to remove entities such enemy from the room 
    remEntity(name){
        for(var i=0; i<this.entities.length; i++){
            if(this.entities[i].name==name){
                this.entities.splice(i, 1);
            }
        }
    }

    entityReaction(){
        for(var i=0; i<this.entities.length; ++i){
            if(this.entities[i].isSeen()){
                attack(this.entities[i], Player);
            }            
        }
    }

    action(value){
        switch(value){
            case "look":
                console.log("You are in "+ this.name + "." )
                console.log("There is " + this.doors.length + " doors. That lead to: ");
                for(var i=0; i<this.doors.length; ++i){
                    var wTo = this.doors[i].exit1 == this.name ? this.doors[i].exit2 : this.doors[i].exit1;
                    console.log(wTo);
                }
                if(this.entities.length>0){
                    console.log("There is ");
                    for(var i=0; i<this.entities.length; ++i){
                        console.log("a " + this.entities[i].name);
                        this.entities[i].setSeen();
                    }
                    console.log("In the room.");
                }
                return;
            case "exit":
                console.log("Exiting game");
                process.exit(0);
        }
        var ent = this.getEntity(value);
        if(ent!=null){
            attack(Player, ent);
            if(!ent.isAlive()){
                console.log(ent.name + " is dead.");
                this.remEntity(ent.name);
            }
            return;
        }
        
        var gotor = dungeon.getRoom(value);
        if(gotor!=null){
            Player.setLocation(gotor);
            Player.locatePlayer().discreptions();
        }
        else
            console.log("error: gotor=" + gotor);
    }
};
//each room of the game has an extended class to easily associate the discription function related to the each room
class entrance extends room {
    constructor(doors) {
        super("entrance", doors);
     }

     action(value) { 
        super.action(value);
        if (value == "look") {
            
        }
    }
    discreptions(){console.log("You are now about to start your dungeons journey, be ready!");}
};

class hallWay extends room {
    constructor(doors) {
        super("hallway", doors);
    }

    action(value) { 
        super.action(value);
        if (value == "look") {
            
        }
    }
    discreptions(){console.log("It is long narrow hallway, there is barely enough light to see,\n"+
                                "the smell is so bad and the water dropping sound is distructing :z \n"
                                +"Something might attack soon");}
};

class chamber extends room {
    constructor(doors){
        super("chamber", doors)
    }
    discreptions(){console.log("You are in a dark chamber, you cannot see well but you hear a horrible noise");}

};

class portal extends room {
    constructor(doors) {
        super("portal", doors);
    }
    discreptions(){console.log("You step through the glowing portal!");}
};

class door {
     constructor(exit1, exit2) {
     this.exit1 = exit1;
     this.exit2 = exit2;

    }
};

class map {
    constructor(rooms) {
        this.rooms = rooms; 
    }

    getRoom(roomName) {
       for(var i=0; i<this.rooms.length; i++) {
           if(roomName == this.rooms[i].name) {
               return this.rooms[i];
           }
       }
       return null;
    }
};
//class entity has the game 3 types of entities: 2 enemies and the player
class entity {
    constructor(name, hitPoints, percentHitting, damage) {
        this.name = name;
        this.hitPoints = hitPoints;
        this.percentHitting = percentHitting;
        this.damage = damage;
        this.seen = false;
    }
    isAlive() { return this.hitPoints > 0; }
    takeDamage(damage){ this.hitPoints -= damage; }
    damage() { return this.damage; }
    attackSucceed(){
        if (Math.random() < (this.percentHitting/100)) 
            return true;
        else return false;
        }
    isSeen() { return this.seen; }
    setSeen(){ this.seen = true; }
};
// Player is extended class from entity class with location proprity used to link player with the room he goes too
class player extends entity {
    constructor(location) {
        super("Player", 10, 75, 2);
        this.location = location;
    }
    setLocation(location) { this.location = location; }
    locatePlayer() { return this.location; } //return the value of location that the player has
};



function attack(who, whom){
    if( who.attackSucceed() ){        
        whom.takeDamage(who.damage);
        console.log(who.name + " attacks " + whom.name + " and causes " + who.damage + " damage");
    }else
        console.log(who.name + " attacks " + whom.name + " and misses.");
}

var entranceDoor = new door ("entrance", "hallway");
var chamberDoor = new door("hallway", "chamber");
var portalDoor = new door("chamber", "portal");

var rEntrance = new entrance([entranceDoor]);
var rChamber = new chamber([chamberDoor, portalDoor]);
rChamber.entities.push(new entity("Dragon", 4, 90, 8));

var rHallWay = new hallWay([entranceDoor, chamberDoor]);
rHallWay.entities.push(new entity("Sewer Rat", 2, 50, 1));

var rPortal = new portal([portalDoor]);

var dungeon = new map([rEntrance, rHallWay, rChamber, rPortal]);
var Player = new player(rEntrance);

async function gameLoop() {
    
    var playerRoom = Player.locatePlayer();
    var actCh = playerRoom.actionChoises();
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: 'Choose your action',
      choices: actCh
    });

    playerRoom.action(response.value);
    playerRoom.entityReaction();

    if(Player.isAlive()){
        if (Player.locatePlayer().name == rPortal.name) {
        console.log("Congratulation, you made it through the dungeons!")
        }
        else {gameLoop();} 
    }
    else{
        console.log("You are dead! Game over.");
    }
}


process.stdout.write('\033c'); // clear screen on windows

console.log('WELCOME TO THE DUNGEONS OF LORD OBJECT ORIENTUS!')
console.log('================================================')
console.log('You walk down the stairs to the dungeons')
gameLoop();









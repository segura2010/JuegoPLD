
var GAMESIZE = [ 900, 550 ];
var LOCAL = "local";
var VISITANT = "visitant";
var iaPlayers = 0;
var twoPlayers = false;
var goalLimit = 0;

// how many frames wait to update moves on IA players
var IA_FRAMES_UPDATE = 1;
// how many frames wait to save data to train neural network
var NEURAL_DATA_FRAMES_SAVE = 20;
// max data saved to train neural network
var MAX_NEURAL_DATA = 1000;

// Neural Network Initialization
var neuralNet = null;

var game = new Phaser.Game(GAMESIZE[0], GAMESIZE[1], Phaser.AUTO, 'gameDiv');

// One player or two players game main state
var mainState = {

    preload: function() {
        game.stage.backgroundColor = '#04B404';

        // Load images
        game.load.image('visitantPlayer', 'assets/visitant.png'); 
        game.load.image('localPlayer', 'assets/local.png'); 
        game.load.image('porteria', 'assets/porteria.png');
        game.load.image('ball', 'assets/ball.png'); 
        game.load.image('field', 'assets/campo.jpeg'); 

        // Load sounds
        game.load.audio('goalAudio', 'assets/goal.mp3');
        game.load.audio('collisionAudio', 'assets/collision.mp3'); 
    },

    create: function() { 

        this.IAUpdateCounter = 0;
        this.NeuralNetSaveCounter = 0;
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.restitution = 0.5;
        game.physics.p2.gravity.y = 0;
        game.physics.p2.gravity.x = 0;

        // Create football field
        this.field = game.add.sprite(0, 0, 'field');
        this.field.scale.x = 0.508; this.field.scale.y = 0.46;

        // Prepare key events!
        this.upKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.downKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.rigthKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
        this.leftKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.A);

        this.players = {};
        
        this.createPorterias();

        this.createPlayer("localPlayer", "principalPlayer", LOCAL);

        if(twoPlayers)
        {
            // key events for second player
            this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
            this.rigthKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
            this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
            this.createPlayer("visitantPlayer", "secondPlayer", VISITANT);
            iaPlayers = 0;
        }

        this.createIAPlayers(iaPlayers, "visitantPlayer", "iaPlayer", VISITANT);
        this.reallocatePlayers();

        this.createBall("ball");
        this.ball.reset(GAMESIZE[0]/2, GAMESIZE[1]/2);

        this.visitantScore = 0;
        this.localScore = 0;
        this.labelScore = this.game.add.text(20, 20, this.localScore+"-"+this.visitantScore, { font: "30px Arial", fill: "#ffffff" });

        this.alertMessages = this.game.add.text(GAMESIZE[0]/2.7, GAMESIZE[1]/2, "", { font: "50px Arial", fill: "#ffffff" });  

        // Add the jump sound
        //this.jumpSound = this.game.add.audio('jump');

        // Overlap con P2JS
        game.physics.p2.setPostBroadphaseCallback(this.checkOverlap, this);

        // Adding audio!
        this.goalAudio = game.add.audio('goalAudio');
        this.collisionAudio = game.add.audio('collisionAudio');
        // Decode if audio is MP3
        game.sound.setDecodedCallback([ this.goalAudio, this.collisionAudio ], start, this);

    },

    update: function() {

        if(this.IAUpdateCounter >= IA_FRAMES_UPDATE && !twoPlayers)
        {
            this.IAUpdateCounter = 0;
            this.updateIAPlayers();
        }
        this.IAUpdateCounter++;

        if(this.NeuralNetSaveCounter >= NEURAL_DATA_FRAMES_SAVE)
        {
            this.NeuralNetSaveCounter = 0;
            this.saveNeuralNetworkData();
        }
        this.NeuralNetSaveCounter++;

        this.labelScore.text = this.localScore+"-"+this.visitantScore;

        this.localPorteria.body.setZeroVelocity();
        this.visitantPorteria.body.setZeroVelocity();

        this.addAcceleration();

    },
    endGame: function() {
        for(p in this.players)
        {
            this.players[p].kill();
        }
    },
    addAcceleration: function() {
        // http://jsfiddle.net/sh036s95/
        // http://www.html5gamedevs.com/topic/7474-set-constant-velocity-for-body-physicsp2js/
        var MAXVEL = 200;
        var acc = 7;
        
        var p = "principalPlayer";
        if(this.upKeySec.isDown && this.players[p].vy > -MAXVEL)
        {   this.players[p].vy += -acc;
            this.players[p].body.velocity.y = this.players[p].vy;
        }
        else if(this.downKeySec.isDown && this.players[p].vy < MAXVEL)
        {   this.players[p].vy += acc;
            this.players[p].body.velocity.y = this.players[p].vy;
        }
        else if(this.players[p].vy > 0)
        {   this.players[p].vy += -acc;
            this.players[p].body.velocity.y = this.players[p].vy;
        }
        else if(this.players[p].vy < 0)
        {   this.players[p].vy += acc;
            this.players[p].body.velocity.y = this.players[p].vy;
        }
        

        if(this.leftKeySec.isDown && this.players[p].vx > -MAXVEL)
        {   this.players[p].vx += -acc;
            this.players[p].body.velocity.x = this.players[p].vx;
        }
        else if(this.rigthKeySec.isDown && this.players[p].vx < MAXVEL)
        {   this.players[p].vx += acc;
            this.players[p].body.velocity.x = this.players[p].vx;
        }
        else if(this.players[p].vx > 0)
        {   this.players[p].vx += -acc;
            this.players[p].body.velocity.x = this.players[p].vx;
        }
        else if(this.players[p].vx < 0)
        {   this.players[p].vx += acc;
            this.players[p].body.velocity.x = this.players[p].vx;
        }

        if(twoPlayers)
        {
            p = "secondPlayer";
            if(this.upKey.isDown && this.players[p].vy > -MAXVEL)
            {   this.players[p].vy += -acc;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            else if(this.downKey.isDown && this.players[p].vy < MAXVEL)
            {   this.players[p].vy += acc;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            else if(this.players[p].vy > 0)
            {   this.players[p].vy += -acc;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            else if(this.players[p].vy < 0)
            {   this.players[p].vy += acc;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            

            if(this.leftKey.isDown && this.players[p].vx > -MAXVEL)
            {   this.players[p].vx += -acc;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if(this.rigthKey.isDown && this.players[p].vx < MAXVEL)
            {   this.players[p].vx += acc;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if(this.players[p].vx > 0)
            {   this.players[p].vx += -acc;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if(this.players[p].vx < 0)
            {   this.players[p].vx += acc;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
        }

        if(!twoPlayers)
        {
            for(p in this.players)
            {
                if(this.players[p].team == VISITANT)
                {
                    if(this.players[p].up && this.players[p].vy > -MAXVEL)
                    {   this.players[p].vy += -acc;
                        this.players[p].body.velocity.y = this.players[p].vy;
                    }
                    else if(this.players[p].down && this.players[p].vy < MAXVEL)
                    {   this.players[p].vy += acc;
                        this.players[p].body.velocity.y = this.players[p].vy;
                    }
                    else if(this.players[p].vy > 0)
                    {   this.players[p].vy += -acc;
                        this.players[p].body.velocity.y = this.players[p].vy;
                    }
                    else if(this.players[p].vy < 0)
                    {   this.players[p].vy += acc;
                        this.players[p].body.velocity.y = this.players[p].vy;
                    }
                    

                    if(this.players[p].left && this.players[p].vx > -MAXVEL)
                    {   this.players[p].vx += -acc;
                        this.players[p].body.velocity.x = this.players[p].vx;
                    }
                    else if(this.players[p].rigth && this.players[p].vx < MAXVEL)
                    {   this.players[p].vx += acc;
                        this.players[p].body.velocity.x = this.players[p].vx;
                    }
                    else if(this.players[p].vx > 0)
                    {   this.players[p].vx += -acc;
                        this.players[p].body.velocity.x = this.players[p].vx;
                    }
                    else if(this.players[p].vx < 0)
                    {   this.players[p].vx += acc;
                        this.players[p].body.velocity.x = this.players[p].vx;
                    }
                }
            }
        }
        
    },
    kickBall: function(ball, player) {
        this.ball.body.velocity = player.body.velocity;
        this.stopPlayer(player);
        
        setTimeout(this.stopBall, 500);
    },
    createCircle: function(posX, posY, radius, color)
    {
        var c = this.game.add.sprite(posX, posY)
        this.graphics = this.game.add.graphics(0, 0);
        this.graphics.beginFill(color);
        //this.graphics.lineStyle(5, color, 0.9);
        this.circle = this.graphics.drawCircle(0, 0, radius);
        this.graphics.endFill();
        c.addChild(this.circle);
        this.game.physics.arcade.enable(c);
        return c;
    },
    localGoal: function() {
        this.localScore += 1;
        this.ball.reset((GAMESIZE[0]/2)*1.2, GAMESIZE[1]/2);
        this.reallocatePlayers();
        this.goalAudio.play();
        this.checkIfSomeoneWins();
        return true;
    },
    visitantGoal: function() {
        this.visitantScore += 1;
        this.ball.reset((GAMESIZE[0]/2)*0.8, GAMESIZE[1]/2);
        this.reallocatePlayers();
        this.goalAudio.play();
        this.checkIfSomeoneWins();
        return true;
    },
    checkOverlap: function(body1, body2){
        // console.log(body1.name+":"+body2.name);
        if( ((body1.name == this.localPorteria.body.name) && (body2.name == this.ball.body.name)) || ((body1.name == this.ball.body.name) && (body2.name == this.localPorteria.body.name)) )
        {
            this.visitantGoal();
        }
        else if( ((body1.name == this.visitantPorteria.body.name) && (body2.name == this.ball.body.name)) || ((body1.name == this.ball.body.name) && (body2.name == this.visitantPorteria.body.name)) )
        {
            this.localGoal();
        }

        return true;
    },
    createPorterias: function()
    {
        // Porterias creation
        this.localPorteria = this.game.add.sprite(-10, GAMESIZE[1]/2, 'porteria');
        game.physics.p2.enable(this.localPorteria);
        this.localPorteria.body.immovable = true;
        this.localPorteria.body.collideWorldBounds = false;
        this.localPorteria.body.name = "localPorteria";

        this.visitantPorteria = this.game.add.sprite(GAMESIZE[0]+10, GAMESIZE[1]/2, 'porteria');
        game.physics.p2.enable(this.visitantPorteria);
        this.visitantPorteria.body.immovable = true;
        this.visitantPorteria.body.collideWorldBounds = false;
        this.visitantPorteria.body.name = "visitantPorteria";
    },
    createPlayer: function(sprite, name, team)
    {
        this.players[name] = game.add.sprite(200, 200, sprite);
        game.physics.p2.enable(this.players[name]);
        this.players[name].scale.x = 0.12; this.players[name].scale.y = 0.12;
        this.players[name].body.setCircle( 15 );
        this.players[name].body.collideWorldBounds = true;
        this.players[name].body.name = name;
        this.players[name].vx = 0;
        this.players[name].vy = 0;
        this.players[name].team = team;

        // movement
        // is the same control that the user, if up==1 -> increment aceleration in Y
        this.players[name].up = 0;
        this.players[name].down = 0;
        this.players[name].left = 0;
        this.players[name].rigth = 0;
    },
    createIAPlayers: function(num, sprite, name, team)
    {
        for(i=0;i<num;i++)
        {
            this.createPlayer(sprite, name+""+i, team);
        }
    },
    createBall: function(sprite)
    {
        this.ball = game.add.sprite(100, 100, sprite);
        game.physics.p2.enable(this.ball);
        this.ball.scale.x = 0.2; this.ball.scale.y = 0.2;
        this.ball.body.setCircle( 10 );
        //this.ball.body.mass = 1;
        this.ball.body.kinematic = false;
        this.ball.body.collideWorldBounds = true;
        this.ball.body.name = "ball";
    },
    reallocatePlayers: function()
    {   // Colocar los jugadores en "linea", no en el mismo sitio
        var numPlayers = 0;
        for(p in this.players)
        {
            numPlayers++;
        }
        var space = GAMESIZE[1] / numPlayers;
        var l = 1, v = 1;
        for(p in this.players)
        {
            if(this.players[p].team == LOCAL)
            {  
                this.players[p].reset((GAMESIZE[0]/4), space*l);
                l = (l+1) % numPlayers;
            }
            else
            {
                this.players[p].reset((GAMESIZE[0]/4)*3, space*v);
                v = (v+1) % numPlayers;
            }
        }
    },
    alertGoal: function()
    {
        this.alertMessages.text = "GOOOOOL!";
        setTimeout(function(){
            mainState.alertMessages.text = "";
        }, 1000);
    },
    checkIfSomeoneWins: function()
    {
        if(goalLimit <= this.localScore)
        {
            this.endGame();
            this.alertMessages.text = "LOCAL ha GANADO!";
            setTimeout(mostrarMenu, 2500);
        }
        else if(goalLimit <= this.visitantScore)
        {
            this.endGame();
            this.alertMessages.text = "VISITANTE ha GANADO!";
            setTimeout(mostrarMenu, 2500);
        }
        else
        {
            this.alertGoal();
        }
    },
    ballInCorner: function()
    {
        var b = this.ball.body;
        var minxy = 13;
        var maxy = GAMESIZE[2] - minxy, maxx = GAMESIZE[1] - minxy;

        if(b.x < minxy && b.y > maxy)
        {
            return true;
        }
        else if(b.x < minxy && b.y < minxy)
        {
            return true;
        }
        else if(b.x > maxx && b.y < minxy)
        {
            return true;
        }
        else if(b.x > maxx && b.y > maxy)
        {
            return true;
        }
        return false;
    },
    updateIAPlayers: function()
    {
        var MAX_X_IA = (GAMESIZE[0]/2)/2;
        var MAX_Y_IA = (GAMESIZE[1]/2);
        var MAX_ERROR = 5;
        var mind = 90000000000000000000;
        var nearestPlayer = 0;

        for(p in this.players)
        {   // All IA players will go to his "porteria" to defend
            // only the nearest player to the ball will go to get it
            if(this.players[p].team == VISITANT)
            {
                var player = this.players[p];
                if(player.body.x < (MAX_X_IA/*+MAX_ERROR*/))
                {   // Go to protect your zone
                    this.players[p].rigth = 1; 
                }
                else
                {
                    this.players[p].rigth = this.players[p].left = 0;
                }
                if(player.body.y < (MAX_Y_IA-MAX_ERROR))
                {   // Go to protect your zone (center)
                    this.players[p].up = 1;
                    this.players[p].down = 0;
                }
                else if(player.body.y > (MAX_Y_IA+MAX_ERROR))
                {   // Go to protect your zone (center)
                    this.players[p].down = 1;
                    this.players[p].up = 0;
                }
                else
                {
                    this.players[p].up = this.players[p].down = 0;
                }

                var d = distance(player.body.x, player.body.y, this.ball.body.x, this.ball.body.y);
                //console.log("D: " + d);
                if(mind > d)
                {
                    mind = d;
                    nearestPlayer = p;
                }
            }
        }

        this.players[nearestPlayer].up = 0;
        this.players[nearestPlayer].down = 0;
        this.players[nearestPlayer].left = 0;
        this.players[nearestPlayer].rigth = 0;
        if(neuralNet)
        {
            // Move nearest player using Neural Network
            var px = this.players[nearestPlayer].body.x;
            var py = this.players[nearestPlayer].body.y;
            var actData = { ballx: this.ball.body.x, bally: this.ball.body.y, playerx: px, playery:py };
            var action = neuralNet.run(actData);
            //console.log(action);

            var roundVar = 0.5;
            this.players[nearestPlayer].up = parseInt(action.up+roundVar);
            this.players[nearestPlayer].down = parseInt(action.down+roundVar);
            this.players[nearestPlayer].left = parseInt(action.left+roundVar);
            this.players[nearestPlayer].rigth = parseInt(action.rigth+roundVar);
            var sum = this.players[nearestPlayer].rigth + this.players[nearestPlayer].up + this.players[nearestPlayer].down + this.players[nearestPlayer].left;

            if(sum < 1)
            {
                this.players[nearestPlayer].up = 1;
            }
        }
        else
        {
            var inCorner = this.ballInCorner();
            if(inCorner)
            {
                this.players[nearestPlayer].rigth = 1;
            }
            else
            {
                if(this.players[nearestPlayer].body.x < this.ball.body.x)
                {
                    this.players[nearestPlayer].rigth = 1;
                }
                else
                {
                    this.players[nearestPlayer].left = 1;
                }
                if(this.players[nearestPlayer].body.y < this.ball.body.y && this.players[nearestPlayer].body.x > this.ball.body.x)
                {
                    this.players[nearestPlayer].down = 1;
                }
                else if(this.players[nearestPlayer].body.y > this.ball.body.y && this.players[nearestPlayer].body.x > this.ball.body.x)
                {
                    this.players[nearestPlayer].up = 1;
                }
            }
        }
    },
    saveNeuralNetworkData: function()
    {
        var player = this.players["principalPlayer"];
        var data = [];
        if(localStorage.neuralNetworkData)
        {   // if i have save previus game data on javascript localStorage,
            // i will restore it
            data = JSON.parse(localStorage.neuralNetworkData);
        }
        // i add new data
        // var up = this.upKeySec.isDown ? 1 : 0;
        var playerx = GAMESIZE[0] - player.body.x;
        var playery = GAMESIZE[1] - player.body.y;
        var actData = { input: { ballx: this.ball.body.x, bally: this.ball.body.y, playerx: playerx, playery:playery }, output: { up: this.upKeySec.isDown ? 1 : 0, down: this.downKeySec.isDown ? 1 : 0, rigth: this.leftKeySec.isDown ? 1 : 0, left:this.rigthKeySec.isDown ? 1 : 0 } };
        if(data.length > MAX_NEURAL_DATA)
        {   // if mora than max, delete first element (older)
            data.splice(0,1);
        }
        data.push(actData);
        // i save on localStorage
        localStorage.neuralNetworkData = JSON.stringify(data);
    }
};
// Add mainState to game states
game.state.add('main', mainState);

function initNeuralNetwork()
{
    if(localStorage.neuralNet)
    {
        var neuralNetJSON = JSON.parse(localStorage.neuralNet);
        neuralNet = new brain.NeuralNetwork();
        neuralNet.fromJSON(neuralNetJSON);
    }
}

function trainNeuralNetwork()
{
    console.log("Training..");
    var data = [];
    if(localStorage.neuralNetworkData)
    {   // if i have save previus game data on javascript localStorage,
        // i will restore it
        data = JSON.parse(localStorage.neuralNetworkData);
        neuralNet = new brain.NeuralNetwork();
        neuralNet.train(data);
        localStorage.neuralNet = JSON.stringify(neuralNet.toJSON());
    }
}
function clearNeuralNetwork()
{
    neuralNet = null;
}

/*

To train neural network
net.train(
[
    {input: { ballx: 44.6, bally: 2, playerx: 4.5, playery:100 }, output: { up: 1, down:0, rigth:1, left:0 }},
    {input: { ballx: 10, bally: 5, playerx: 46, playery:17 }, output: { up: 1, down:0, rigth:0, left:1 }}
])

To use trained neural network
net.run({ ballx: 44.6, bally: 2, playerx: 4.5, playery:100 })

*/

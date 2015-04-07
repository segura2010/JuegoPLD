
var GAMESIZE = [ 900, 550 ];
var LOCAL = "local";
var VISITANT = "visitant";
var iaPlayers = 0;
var twoPlayers = false;
var goalLimit = 0;

var game = new Phaser.Game(GAMESIZE[0], GAMESIZE[1], Phaser.AUTO, 'gameDiv');

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
        // Decode if audio are MP3
        game.sound.setDecodedCallback([ this.goalAudio, this.collisionAudio ], start, this);

    },

    update: function() {

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
        }
        else if(goalLimit <= this.visitantScore)
        {
            this.endGame();
            this.alertMessages.text = "VISITANTE ha GANADO!";
        }
        else
        {
            this.alertGoal();
        }
    }
};


function startOnePlayerGame()
{
    twoPlayers = false;
    iaPlayers = document.getElementById("iaNumberTxt").value;
    goalLimit = document.getElementById("goalLimitTxt").value;
    game.state.add('main', mainState);  
    game.state.start('main'); 
}

function startTwoPlayersGame()
{
    twoPlayers = true;
    goalLimit = document.getElementById("goalLimitTxt").value;
    game.state.add('main', mainState);  
    game.state.start('main'); 
}

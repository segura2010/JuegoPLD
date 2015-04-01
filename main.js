
var GAMESIZE = [ 900, 550 ];
var LOCAL = "local";
var VISITANT = "visitant";

var game = new Phaser.Game(GAMESIZE[0], GAMESIZE[1], Phaser.AUTO, 'gameDiv');

var mainState = {

    preload: function() { 
        game.stage.backgroundColor = '#04B404';

        // Load images
        game.load.image('principalPlayer', 'assets/granada.png');  
        game.load.image('otherPlayers', 'assets/pipe.png'); 
        game.load.image('porteria', 'assets/porteria.png');
        game.load.image('ball', 'assets/ball.png'); 
        game.load.image('field', 'assets/campo.jpeg'); 

        // Load sounds
        game.load.audio('goal', 'assets/jump.wav');
        game.load.audio('kick', 'assets/jump.wav'); 
    },

    create: function() { 
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.restitution = 0.5;
        game.physics.p2.gravity.y = 0;

        // Create football field
        this.field = game.add.sprite(0, 0, 'field');
        this.field.scale.x = 0.508; this.field.scale.y = 0.46;

        // Prepare key events!
        this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.rigthKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);

        this.players = {};
        
        this.createPorterias();

        this.createPlayer("principalPlayer", "principalPlayer", LOCAL);

        this.createBall("ball");

        this.visitantScore = 0;
        this.localScore = 0;
        this.labelScore = this.game.add.text(20, 20, this.localScore+"-"+this.visitantScore, { font: "30px Arial", fill: "#ffffff" });  

        // Add the jump sound
        //this.jumpSound = this.game.add.audio('jump');

        // Overlap con P2JS
        game.physics.p2.setPostBroadphaseCallback(this.checkOverlap, this); 

    },

    update: function() {

        this.labelScore.text = this.localScore+"-"+this.visitantScore;

        this.localPorteria.body.setZeroVelocity();
        this.visitantPorteria.body.setZeroVelocity();

        this.addAcceleration();

        /*
        if (this.principalPlayer.inWorld == false)
            this.restartGame();
        */
    

        // If player and ball overlap, is a kick!!
        //game.physics.p2.overlap(this.ball, this.visitantPorteria, this.localGoal, null, this); 
        //game.physics.p2.overlap(this.ball, this.localPorteria, this.visitantGoal, null, this); 

        /*
        game.physics.p2.collide(this.ball, this.principalPlayer);

        game.physics.p2.collide(this.upperLocalLimit, this.ball);
        game.physics.p2.collide(this.lowerLocalLimit, this.ball);

        game.physics.p2.collide(this.upperVisitantLimit, this.ball);
        game.physics.p2.collide(this.lowerVisitantLimit, this.ball);
        */

        /* Slowly rotate the bird downward, up to a certain point.
        if (this.bird.angle < 20)
            this.bird.angle += 1;  
            */ 
    },
    restartGame: function() {
        game.state.start('main');
    },
    addAcceleration: function() {
        // http://jsfiddle.net/sh036s95/
        // http://www.html5gamedevs.com/topic/7474-set-constant-velocity-for-body-physicsp2js/
        var MAXVEL = 270;
        /*
        this.players[p].vy = this.principalPlayer.body.velocity.y;
        this.players[p].vx = this.principalPlayer.body.velocity.x;
        */
        
        //var gameCopy = this;
        for(p in this.players)
        { 
            if(this.upKey.isDown && this.players[p].vy > -MAXVEL)
            {   this.players[p].vy += -10;
                this.players[p].body.velocity.y = 10;
            }
            else if(this.downKey.isDown && this.players[p].vy < MAXVEL)
            {   this.players[p].vy += 10;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            else if(this.players[p].vy > 0)
            {   this.players[p].vy += -10;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            else if(this.players[p].vy < 0)
            {   this.players[p].vy += 10;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            

            if(this.leftKey.isDown && this.players[p].vx > -MAXVEL)
            {   this.players[p].vx += -10;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if(this.rigthKey.isDown && this.players[p].vx < MAXVEL)
            {   this.players[p].vx += 10;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if(this.players[p].vx > 0)
            {   this.players[p].vx += -10;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if(this.players[p].vx < 0)
            {   this.players[p].vx += 10;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
        }
        
        
        //console.log(this.players[p].vx+":"+this.players[p].vy)
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
        

        /* Otra forma
        var hexGraphics = new Phaser.Graphics();
        hexGraphics.beginFill(color);
        hexGraphics.drawCircle(0.5, 0.5, radius);
        c = game.add.sprite(posX,posY,hexGraphics.generateTexture());
        this.game.physics.arcade.enable(c);
        */

        return c;
    },
    localGoal: function() {
        this.localScore += 1;
        this.ball.reset(GAMESIZE[0]/2, GAMESIZE[1]/2);
        this.reallocatePlayers();
        return true;
    },
    visitantGoal: function() {
        this.visitantScore += 1;
        this.ball.reset(GAMESIZE[0]/2, GAMESIZE[1]/2);
        this.reallocatePlayers();
        return true;
    },
    checkOverlap: function(body1, body2){
        // console.log(body1.name+":"+body2.name);
        if( ((body1.name == this.localPorteria.body.name) && (body2.name == this.ball.body.name)) || ((body1.name == this.ball.body.name) && (body2.name == this.localPorteria.body.name)) )
        {
            this.localGoal();
        }
        if( ((body1.name == this.visitantPorteria.body.name) && (body2.name == this.ball.body.name)) || ((body1.name == this.ball.body.name) && (body2.name == this.visitantPorteria.body.name)) )
        {
            this.visitantGoal();
        }

        return true;
    },
    createPorterias: function()
    {
        // Porterias creation
        this.localPorteria = this.game.add.sprite(0, GAMESIZE[1]/2, 'porteria');
        game.physics.p2.enable(this.localPorteria);
        this.localPorteria.body.immovable = true;
        this.localPorteria.body.collideWorldBounds = false;
        this.localPorteria.body.name = "localPorteria";
        //this.localPorteria.width = 70;
        //mainState.localPorteria.body.setRectangle(0,0,100,70)
        /*
        this.upperLocalLimit = this.createCircle(0, (GAMESIZE[1]/2)+(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.upperLocalLimit.body.immovable = true;
        this.lowerLocalLimit = this.createCircle(0, (GAMESIZE[1]/2)-(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.lowerLocalLimit.body.immovable = true;
        */

        this.visitantPorteria = this.game.add.sprite(GAMESIZE[0], GAMESIZE[1]/2, 'porteria');
        game.physics.p2.enable(this.visitantPorteria);
        this.visitantPorteria.body.immovable = true;
        this.visitantPorteria.body.collideWorldBounds = false;
        this.visitantPorteria.body.name = "visitantPorteria";
        //this.visitantPorteria.width = 70;
        //mainState.localPorteria.body.setRectangle(0,0,100,70)
        /*
        this.upperVisitantLimit = this.createCircle(GAMESIZE[0]-4, (GAMESIZE[1]/2)+(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.upperVisitantLimit.body.immovable = true;
        this.lowerVisitantLimit = this.createCircle(GAMESIZE[0]-4, (GAMESIZE[1]/2)-(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.lowerVisitantLimit.body.immovable = true;
        */
    },
    createPlayer: function(sprite, name, team)
    {
        this.players[name] = game.add.sprite(200, 200, sprite);
        game.physics.p2.enable(this.players[name]);
        this.players[name].scale.x = 0.2; this.players[name].scale.y = 0.2;
        this.players[name].body.setCircle( 28 /*this.principalPlayer.width * 0.95*/);
        //this.principalPlayer.body.debug = false;
        //this.principalPlayer.body.mass = 0.01;
        //this.principalPlayer.body.kinematic = true;
        this.players[name].body.collideWorldBounds = true;
        this.players[name].body.name = name;
        this.players[name].vx = 0;
        this.players[name].vy = 0;
        this.players[name].team = team;
    },
    createBall: function(sprite)
    {
        this.ball = game.add.sprite(100, 100, sprite);
        game.physics.p2.enable(this.ball);
        this.ball.scale.x = 0.35; this.ball.scale.y = 0.35;
        this.ball.body.setCircle( 18 /*this.ball.width * 0.95*/);
        this.ball.body.debug = false;
        //this.ball.body.mass = 1;
        this.ball.body.kinematic = false;
        this.ball.body.collideWorldBounds = true;
        this.ball.body.name = "ball";
    },
    reallocatePlayers: function()
    {
        for(p in this.players)
        {
            if(this.players[p].team == LOCAL)
            {
                this.players[p].reset(GAMESIZE[0]/3, GAMESIZE[1]/2);
            }
            else
            {
                this.players[p].reset(GAMESIZE[0]/3, GAMESIZE[1]/2);
            }
        }
    }
};


game.state.add('main', mainState);  
game.state.start('main'); 
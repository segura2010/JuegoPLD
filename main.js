
var GAMESIZE = [ 900, 550 ];

var game = new Phaser.Game(GAMESIZE[0], GAMESIZE[1], Phaser.AUTO, 'gameDiv');

var mainState = {

    preload: function() { 
        game.stage.backgroundColor = '#04B404';

        // Load images
        game.load.image('principalPlayer', 'assets/player.png');  
        game.load.image('otherPlayers', 'assets/pipe.png'); 
        game.load.image('porteria', 'assets/pipe.png');
        game.load.image('ball', 'assets/pipe.png'); 

        // Load sounds
        game.load.audio('goal', 'assets/jump.wav');
        game.load.audio('kick', 'assets/jump.wav'); 
    },

    create: function() { 
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.restitution = 0.5;

        this.principalPlayer = game.add.sprite(200, 200, "principalPlayer");
        game.physics.p2.enable(this.principalPlayer);
        this.principalPlayer.scale.x = 0.2; this.principalPlayer.scale.y = 0.2;
        this.principalPlayer.body.setCircle( 28 /*this.principalPlayer.width * 0.95*/);
        //this.principalPlayer.body.debug = false;
        //this.principalPlayer.body.mass = 0.01;
        //this.principalPlayer.body.kinematic = true;
        this.principalPlayer.body.collideWorldBounds = true;

        this.ball = game.add.sprite(100, 100, "ball");
        game.physics.p2.enable(this.ball);
        this.ball.scale.x = 0.2; this.ball.scale.y = 0.2;
        this.ball.body.setCircle( 28 /*this.ball.width * 0.95*/);
        this.ball.body.debug = false;
        this.ball.body.mass = 1;
        this.ball.body.kinematic = false;
        this.ball.body.collideWorldBounds = true;

        // Prepare key events!
        this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.rigthKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);

        // Principal Player velocity
        this.vx = 0;
        this.vy = 0;

        // Porterias creation
        this.localPorteria = this.game.add.sprite(-45, GAMESIZE[1]/2, 'porteria');
        this.localPorteria.height = 100;
        this.upperLocalLimit = this.createCircle(0, (GAMESIZE[1]/2)+(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.upperLocalLimit.body.immovable = true;
        this.lowerLocalLimit = this.createCircle(0, (GAMESIZE[1]/2)-(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.lowerLocalLimit.body.immovable = true;
        //game.physics.p2.enable(this.localPorteria);

        this.visitantPorteria = this.game.add.sprite(GAMESIZE[0]-5, GAMESIZE[1]/2, 'porteria');
        this.visitantPorteria.height = 100;
        this.upperVisitantLimit = this.createCircle(GAMESIZE[0]-4, (GAMESIZE[1]/2)+(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.upperVisitantLimit.body.immovable = true;
        this.lowerVisitantLimit = this.createCircle(GAMESIZE[0]-4, (GAMESIZE[1]/2)-(this.localPorteria.height/2)-5, 7, 0xFAFAFA);
        this.lowerVisitantLimit.body.immovable = true;
        //game.physics.p2.enable(this.visitantPorteria);
        

 
        // Prepare key events!
        this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.rigthKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        /*
        this.upKey.onDown.add(this.goUp, this);
        this.downKey.onDown.add(this.goDown, this);
        this.rigthKey.onDown.add(this.goRigth, this);
        this.leftKey.onDown.add(this.goLeft, this);
        */

        this.visitantScore = 0;
        this.localScore = 0;
        this.labelScore = this.game.add.text(20, 20, this.localScore+"-"+this.visitantScore, { font: "30px Arial", fill: "#ffffff" });  

        // Add the jump sound
        //this.jumpSound = this.game.add.audio('jump');

        // Overlap con P2JS
        //game.physics.p2.setPostBroadphaseCallback(checkOverlap, this); 
    },

    update: function() {
        this.labelScore.text = this.localScore+"-"+this.visitantScore;

        this.addAcceleration();

        
        if (this.principalPlayer.inWorld == false)
            this.restartGame();
    

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

    jump: function() {
        // If the bird is dead, he can't jump
        if (this.bird.alive == false)
            return; 

        this.bird.body.velocity.y = -350;

        // Jump animation
        game.add.tween(this.bird).to({angle: -20}, 100).start();

        // Play sound
        this.jumpSound.play();
    },

    hitPipe: function() {
        // If the bird has already hit a pipe, we have nothing to do
        if (this.bird.alive == false)
            return;
            
        // Set the alive property of the bird to false
        this.bird.alive = false;

        // Prevent new pipes from appearing
        this.game.time.events.remove(this.timer);
    
        // Go through all the pipes, and stop their movement
        this.pipes.forEachAlive(function(p){
            p.body.velocity.x = 0;
        }, this);
    },

    restartGame: function() {
        game.state.start('main');
    },

    addOnePipe: function(x, y) {
        var pipe = this.pipes.getFirstDead();

        pipe.reset(x, y);
        pipe.body.velocity.x = -200;  
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },

    addRowOfPipes: function() {
        var hole = Math.floor(Math.random()*5)+1;
        
        for (var i = 0; i < 8; i++)
            if (i != hole && i != hole +1) 
                this.addOnePipe(400, i*60+10);   
    
        this.score += 1;
        this.labelScore.text = this.score;  
    },


    goUp: function() {
        this.principalPlayer.body.velocity.y = -10;
    },
    goDown: function() {
        this.principalPlayer.body.velocity.y = 10;
    },
    goRigth: function() {
        this.principalPlayer.body.velocity.x = -10;
    },
    goLeft: function() {
        this.principalPlayer.body.velocity.x = 10;
    },
    stopPlayer: function(player)
    {   // Stops player
        player.body.velocity.y = 0;
        player.body.velocity.y = 0;
        player.body.velocity.x = 0;
        player.body.velocity.x = 0;
    },
    stopBall: function()
    {   // Stops player
        this.ball.body.velocity.y = 0;
        this.ball.body.velocity.y = 0;
        this.ball.body.velocity.x = 0;
        this.ball.body.velocity.x = 0;
    },
    same: function()
    {   // Stops player
        this.ball.body.velocity.y = 0;
        this.ball.body.velocity.y = 0;
        this.ball.body.velocity.x = 0;
        this.ball.body.velocity.x = 0;
    },
    addAcceleration: function() {
        // http://jsfiddle.net/sh036s95/
        var MAXVEL = 100; 
        /*
        this.vy = this.principalPlayer.body.velocity.y;
        this.vx = this.principalPlayer.body.velocity.x;
        */
        if(this.upKey.isDown && this.vy > -MAXVEL)
        {   this.vy += -10;
            this.principalPlayer.body.velocity.y = this.vy;
        }
        else if(this.downKey.isDown && this.vy < MAXVEL)
        {   this.vy += 10;
            this.principalPlayer.body.velocity.y = this.vy;
        }
        else if(this.vy > 0)
        {   this.vy += -10;
            this.principalPlayer.body.velocity.y = this.vy;
        }
        else if(this.vy < 0)
        {   this.vy += 10;
            this.principalPlayer.body.velocity.y = this.vy;
        }

        if(this.leftKey.isDown && this.vx > -MAXVEL)
        {   this.vx += -10;
            this.principalPlayer.body.velocity.x += this.vx;
        }
        else if(this.rigthKey.isDown && this.vx < MAXVEL)
        {   this.vx += 10;
            this.principalPlayer.body.velocity.x += this.vx;
        }
        else if(this.vx > 0)
        {   this.vx += -10;
            this.principalPlayer.body.velocity.x += this.vx;
        }
        else if(this.vx < 0)
        {   this.vx += 10;
            this.principalPlayer.body.velocity.x += this.vx;
        }
        console.log(this.vx+":"+this.vy)
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
    },
    visitantGoal: function() {
        this.visitantScore += 1;
        this.ball.reset(GAMESIZE[0]/2, GAMESIZE[1]/2);
    }
};

game.state.add('main', mainState);  
game.state.start('main'); 
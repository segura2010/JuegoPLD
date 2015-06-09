
var GAMESIZE = [ 900, 550 ];
var LOCAL = "local";
var VISITANT = "visitant";
var iaPlayers = 0;
var twoPlayers = false;
var goalLimit = 0;

var FRAMES_MULTI_UPDATE = 2;

var started = false;

// inicializo el objeto de PeerJS
var peer = null;
var PEERJS_API = "39sprc0gk506yldi";
var myPeerId = null;
var playerPeers = [];

var gameId = null;

// One player or two players game main state
var multiplayerState = {

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
        this.multiUpdateFramesCounter = 0;
        this.players = {};
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.restitution = 0.5;
        game.physics.p2.gravity.y = 0;
        game.physics.p2.gravity.x = 0;
        
        // Inicializo la conexion
        this.imServer = false;
        peer = new Peer({key: PEERJS_API});
        manejoPeerJS();
        
        this.connectToGame();

        // Create football field
        this.field = game.add.sprite(0, 0, 'field');
        this.field.scale.x = 0.508; this.field.scale.y = 0.46;

        // Prepare key events!
        this.upKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.downKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.rigthKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
        this.leftKeySec = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        
        this.createPorterias();

        this.reallocatePlayers();

        this.createBall("ball");
        this.ball.reset(GAMESIZE[0]/2, GAMESIZE[1]/2);

        this.visitantScore = 0;
        this.localScore = 0;
        this.labelScore = this.game.add.text(20, 20, this.localScore+"-"+this.visitantScore, { font: "30px Arial", fill: "#ffffff" });

        this.alertMessages = this.game.add.text(GAMESIZE[0]/5, GAMESIZE[1]/2, "", { font: "50px Arial", fill: "#ffffff" });  

        // Overlap con P2JS
        game.physics.p2.setPostBroadphaseCallback(this.checkOverlap, this);

        // Adding audio!
        this.goalAudio = game.add.audio('goalAudio');
        this.collisionAudio = game.add.audio('collisionAudio');
        // Decode if audio is MP3
        //game.sound.setDecodedCallback([ this.goalAudio, this.collisionAudio ], start, this);
        
        // Add virtual joystick
        this.joystick = this.game.plugins.add(Phaser.Plugin.TouchControl);
        this.joystick.inputEnable();

    },

    update: function() {

        this.labelScore.text = this.localScore+"-"+this.visitantScore;

        this.localPorteria.body.setZeroVelocity();
        this.visitantPorteria.body.setZeroVelocity();

        this.addAcceleration();
        this.sacarPelotaCorner();
        
        if(this.multiUpdateFramesCounter > FRAMES_MULTI_UPDATE)
        {
            if(this.imServer)
            {   // Si el jugador es el "servidor" (el que se encarga de conectarlos a todos, el creador de la partida)
                // me encargo de sincronizar todo
                this.syncPlayers();
            }
            else
            {
                this.syncMe();
            }
            this.multiUpdateFramesCounter = 0;
        }
        this.multiUpdateFramesCounter++;

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
        
        try{

            for(p in this.players)
            {
                if(p != "principalPlayer")
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

            var p = "principalPlayer";
            this.players[p].up = (this.upKeySec.isDown || this.joystick.cursors.up);
            this.players[p].down = (this.downKeySec.isDown || this.joystick.cursors.down);
            this.players[p].left = (this.leftKeySec.isDown || this.joystick.cursors.left);
            this.players[p].rigth = (this.rigthKeySec.isDown || this.joystick.cursors.right);
            if((this.upKeySec.isDown || this.joystick.cursors.up) && this.players[p].vy > -MAXVEL)
            {   this.players[p].vy += -acc;
                this.players[p].body.velocity.y = this.players[p].vy;
                this.players[p].up = 1;
            }
            else if((this.downKeySec.isDown || this.joystick.cursors.down) && this.players[p].vy < MAXVEL)
            {   this.players[p].vy += acc;
                this.players[p].body.velocity.y = this.players[p].vy;
                this.players[p].down = 1;
            }
            else if(this.players[p].vy > 0)
            {   this.players[p].vy += -acc;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            else if(this.players[p].vy < 0)
            {   this.players[p].vy += acc;
                this.players[p].body.velocity.y = this.players[p].vy;
            }
            

            if((this.leftKeySec.isDown || this.joystick.cursors.left) && this.players[p].vx > -MAXVEL)
            {   this.players[p].vx += -acc;
                this.players[p].body.velocity.x = this.players[p].vx;
            }
            else if((this.rigthKeySec.isDown || this.joystick.cursors.right) && this.players[p].vx < MAXVEL)
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
            
        }catch(e){
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
        try{
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
        }catch(e){}
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
            // this.endGame();
            this.alertMessages.text = "LOCAL ha GANADO!";
            setTimeout(function(){
                started = false;
            }, 2500);
        }
        else if(goalLimit <= this.visitantScore)
        {
            // this.endGame();
            this.alertMessages.text = "VISITANTE ha GANADO!";
            setTimeout(function(){
                started = false;
            }, 2500);
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
        var maxy = GAMESIZE[1] - minxy, maxx = GAMESIZE[0] - minxy;

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
    sacarPelotaCorner: function()
    {
        var b = this.ball.body;
        var minxy = 13;
        var maxy = GAMESIZE[1] - minxy, maxx = GAMESIZE[0] - minxy;
        var VEL = 50;

        if(b.x < minxy && b.y > maxy)
        {
            this.ball.body.velocity.y = -VEL;
            this.ball.body.velocity.x = VEL;
        }
        else if(b.x < minxy && b.y < minxy)
        {
            this.ball.body.velocity.y = VEL;
            this.ball.body.velocity.x = VEL;
        }
        else if(b.x > maxx && b.y < minxy)
        {
            this.ball.body.velocity.y = VEL;
            this.ball.body.velocity.x = -VEL;
        }
        else if(b.x > maxx && b.y > maxy)
        {
            this.ball.body.velocity.y = -VEL;
            this.ball.body.velocity.x = -VEL;
        }
    },
    syncPlayers: function()
    {   // Sincroniza la informacion de todos los jugadores
        try{
            var data = {
                players: {},
                ball: {
                    x: this.ball.body.x,
                    y: this.ball.body.y,
                    vx: this.ball.body.velocity.x,
                    vy: this.ball.body.velocity.y
                },
                score:{
                    local: this.localScore,
                    visitant: this.visitantScore
                }
            }
            for(p in this.players)
            {   // Recogemos los datos de los jugadores
                var player = this.players[p];
                var peerId = p;
                if(peerId == "principalPlayer")
                {
                    peerId = myPeerId;
                }
                data.players[peerId] = {
                    x: player.body.x,
                    y: player.body.y,
                    vx: player.body.velocity.x,
                    vy: player.body.velocity.y,
                    team: player.team,
                    up: player.up,
                    down: player.down,
                    rigth: player.rigth,
                    left: player.left
                }
            }
            // data.players = this.players;
            for(p in playerPeers)
            {   // Enviamos a cada jugador la informacion actualizada
                playerPeers[p].send(data);
            }
            //console.log("Actualizacion del servidor enviada..");
        }catch(e){}
    },
    syncMe: function()
    {   // Sincronizo con el jugador servidor mi informacion
        //var player = this.players["principalPlayer"];
        try{
            var data = {
                /* x: player.body.x,
                y: player.body.y,
                velx: player.body.velocity.x,
                vely: player.body.velocity.y, */
                up: multiplayerState.players["principalPlayer"].up,
                down: multiplayerState.players["principalPlayer"].down,
                rigth: multiplayerState.players["principalPlayer"].rigth,
                left: multiplayerState.players["principalPlayer"].left
            }
            // Envio mi informacion actualizada al servidor
            peer.myConnection.send(data);
        }catch(e){console.log("ERROR SYNCME");}
    },
    connectToGame: function()
    {   // Funcion que se conecta a un juego (un peer id)
        var id = gameId;
        if(!id)
            id = prompt("ID de la partida a conectarse (dejalo en blanco si eres el creador de la partida):", "");
        
        if(id != "")
        {   // Si me da un id, me intento conectar a el
            // sino, es el creador de la partida
            peer.myConnection = peer.connect(id);
            peer.myConnection.on('open', function(){
                var team = prompt("Conectado! \n Elige:\n 1. Visitante \n 2.Local", "");
                var sprite = "";
                if(team == "2")
                {
                    team = LOCAL;
                    sprite = "localPlayer";
                }
                else
                {
                    team = VISITANT;
                    sprite = "visitantPlayer";
                }
                multiplayerState.players["principalPlayer"].kill();
                multiplayerState.createPlayer(sprite, "principalPlayer", team);
                peer.myConnection.send({chooseTeam:team});

                // Como no soy el servidor, indico cuando envio informacion al servidor,
                // enviare informacion cuando genere un evento (al moverme, pulsar tecla)
                /* multiplayerState.upKeySec.processKeyDown = multiplayerState.syncMe;
                multiplayerState.downKeySec.processKeyDown = multiplayerState.syncMe;
                multiplayerState.leftKeySec.processKeyDown = multiplayerState.syncMe;
                multiplayerState.rigthKeySec.processKeyDown = multiplayerState.syncMe;
                multiplayerState.upKeySec.processKeyUp = multiplayerState.syncMe;
                multiplayerState.downKeySec.processKeyUp = multiplayerState.syncMe;
                multiplayerState.leftKeySec.processKeyUp = multiplayerState.syncMe;
                multiplayerState.rigthKeySec.processKeyUp = multiplayerState.syncMe;
                */
            });
            peer.myConnection.on('data', function(d){
                // Recibo los datos de los jugadores actualizados del "jugador servidor"
                //console.log("Actualizacion del servidor recibida..");
                if(d.disconnected)
                {
                    multiplayerState.players[d.disconnected].kill();
                }
                else if(d.goles)
                {
                    goalLimit = d.goles;
                }
                else if(d.startMatch)
                {
                    multiplayerState.alertMessages.text = "El partido empieza en 3 segundos!";
                    setTimeout(function(){
                        // Empezamos en 3 segundos
                        multiplayerState.alertMessages.text = "";
                    }, 2600);
                }
                else
                {
                    multiplayerState.ball.body.x = d.ball.x;
                    multiplayerState.ball.body.y = d.ball.y;
                    multiplayerState.ball.body.velocity.x = d.ball.vx;
                    multiplayerState.ball.body.velocity.y = d.ball.vy;
                    multiplayerState.localScore = d.score.local;
                    multiplayerState.visitantScore = d.score.visitant;
                    multiplayerState.updateSyncData(d.players);
                }
            });
            peer.myConnection.on('close', function(d){
                alert("Servidor desconectado!");
                mostrarMenu();
            });
        }
        else
        {   /* Partida creada por mi, soy el servidor
            var team = prompt("Partida Creada! \n Elige:\n 1. Visitante \n 2.Local", "");
            var sprite = "";
            if(team == "2")
            {
                team = LOCAL;
                sprite = "localPlayer";
            }
            else
            {
                team = VISITANT;
                sprite = "visitantPlayer";
            }
            this.createPlayer(sprite, "principalPlayer", team);*/
            this.createPlayer("localPlayer", "principalPlayer", LOCAL);
            this.imServer = true;
        }
    },
    updateSyncData: function(updatedPlayers)
    {   // En esta funcion actualizo los datos del jugador con los
        // datos recibidos del servidor
        for(p in updatedPlayers)
        {   
            if(p == myPeerId)
            {   // Son datos mios actualizados
                console.log("MIS DATOS!!");
                this.players["principalPlayer"].body.x = updatedPlayers[p].x;
                this.players["principalPlayer"].body.y = updatedPlayers[p].y;
                this.players["principalPlayer"].body.velocity.x = updatedPlayers[p].vx;
                this.players["principalPlayer"].body.velocity.y = updatedPlayers[p].vy;
                
                /* this.players["principalPlayer"].up = updatedPlayers[p].up;
                this.players["principalPlayer"].down = updatedPlayers[p].down;
                this.players["principalPlayer"].rigth = updatedPlayers[p].rigth;
                this.players["principalPlayer"].left = updatedPlayers[p].left; */
            }
            else if(!(p in this.players))
            {
                this.createPlayer(updatedPlayers[p].team+"Player", p, updatedPlayers[p].team);
            }
            
            if(p in this.players)
            {   // Son datos de los otros jugadores
                this.players[p].body.x = updatedPlayers[p].x;
                this.players[p].body.y = updatedPlayers[p].y;
                this.players[p].body.velocity.x = updatedPlayers[p].vx;
                this.players[p].body.velocity.y = updatedPlayers[p].vy;
                this.players[p].up = updatedPlayers[p].up;
                this.players[p].down = updatedPlayers[p].down;
                this.players[p].rigth = updatedPlayers[p].rigth;
                this.players[p].left = updatedPlayers[p].left;
            }
        }
    }
};
// Add mainState to game states
game.state.add('multiplayer', multiplayerState);

// Manejo de eventos de peerJS
function manejoPeerJS()
{
    peer.on('open', function(peerid) {
        myPeerId = peerid;
        if(multiplayerState.imServer)
        {
            document.getElementById("debug").innerHTML = "Tu Identificador de partida: <b>" + myPeerId + "</b>";
            document.getElementById("multiplayerStartBtn").style.display = "";
        }
        multiplayerState.createPlayer("localPlayer", "principalPlayer", LOCAL);
    });
    
    peer.on('connection', function(data) {
        // cuando un jugador se conecta a mi partida guardo sus datos
        //console.log("ALGUIEN CONECTO!");
        //console.log(data);
        playerPeers[data.peer] = data;
        playerPeers[data.peer].on('data', function(d){
            // cuando un jugador me envia un cambio (se pulsa un boton para moverse)
            // lo resgistro
            //console.log("ID actualizando: " + data.id);
            if(data.peer in multiplayerState.players)
            {
                //console.log("Actualizando jugador..")
                /*multiplayerState.players[data.peer].body.x = d.x;
                multiplayerState.players[data.peer].body.y = d.y;
                multiplayerState.players[data.peer].velocity.x = d.vx;
                multiplayerState.players[data.peer].velocity.y = d.vy;*/

                multiplayerState.players[data.peer].up = d.up;
                multiplayerState.players[data.peer].down = d.down;
                multiplayerState.players[data.peer].left = d.left;
                multiplayerState.players[data.peer].rigth = d.rigth;
            }
            else if(d.chooseTeam)
            {   // si lo que envia es el equipo en el que quiere estar (al principio de la conexion)
                // creo el jugador
                //console.log("Creando jugador..");
                var team = d.chooseTeam;
                if(team == LOCAL)
                {
                    sprite = "localPlayer";
                }
                else
                {
                    sprite = "visitantPlayer";
                }
                multiplayerState.createPlayer(sprite, data.peer, team);
                if(!started)
                {   // Cuando el partido esta empezado dejo que jueguen
                    multiplayerState.reallocatePlayers();
                }
                this.send({goles:limiteGoles});
            }
        });
        playerPeers[data.peer].on('close', function(d){
            var newPlayers = {};
            var peer = this.peer;
            multiplayerState.players[peer].kill();
            var data = {
                disconnected: peer
            };
            for(p in playerPeers)
            {   // Enviamos a cada jugador la informacion de que uno de ellos se desconecto
                // y actualizamos el array de jugadores
                if(p != peer)
                {
                    newPlayers[p] = multiplayerState.players[p];
                    playerPeers[p].send(data);
                }
            }
            newPlayers["principalPlayer"] = multiplayerState.players["principalPlayer"];
            multiplayerState.players = newPlayers;
        });
    });    
}

function startMultiPlayer()
{
    goalLimit = limiteGoles;
    game.state.start('multiplayer');
}

function startMatch()
{
    var data = {startMatch:1};
    for(p in playerPeers)
    {   // Enviamos a cada jugador la alerta de que va a empezar el partido!
        if(p != peer)
        {
            playerPeers[p].send(data);
        }
    }
    multiplayerState.alertMessages.text = "El partido empieza en 3 segundos!";
    setTimeout(function(){
        // Empezamos en 3 segundos
        started = true;
        multiplayerState.localScore = 0;
        multiplayerState.visitantScore = 0;
        multiplayerState.reallocatePlayers();
        multiplayerState.ball.reset(GAMESIZE[0]/2, GAMESIZE[1]/2);
        multiplayerState.alertMessages.text = "";
    }, 3000);
}



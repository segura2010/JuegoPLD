// Menu Game State

var jugadoresIA = 1;
var limiteGoles = 1;

var menuState = {
    preload: function() {
        //game.stage.backgroundColor = 'grey';
     
        // Load images
        game.load.image('visitantPlayer', 'assets/visitant.png'); 
        game.load.image('localPlayer', 'assets/local.png'); 
        game.load.image('porteria', 'assets/porteria.png');
        game.load.image('ball', 'assets/ball.png'); 
        game.load.image('field', 'assets/campo.jpeg'); 

        //Load images menu
        game.load.image('back_field', 'assets/fondo_menu.png');
        game.load.image('boton1Player', 'assets/1jugador.png');
        game.load.image('boton2Players', 'assets/2jugadores.png');
        game.load.image('mas', 'assets/mas.png');
        game.load.image('menos', 'assets/menos.png');

        // Load sounds
        game.load.audio('goalAudio', 'assets/goal.mp3');
        game.load.audio('collisionAudio', 'assets/collision.mp3'); 
    },

    create: function() { 

        this.jugadoresIAInfo = "Jugadores de IA";
        this.limiteGolesInfo = "Limite de Goles";

        //this.startIABtn = this.game.add.button(0, 0, "ball", startOnePlayerGame, this); 

        this.back_field = game.add.image(0, 0, 'back_field');
        this.back_field.scale.x = 1.4; this.back_field.scale.y = 1.28;

        this.startOnePlayerGame = this.game.add.button(350, 150, 'boton1Player', startOnePlayerGame);
        //this.startOnePlayerGame = 1; this.boton1Player.scale.y = 0.9;

        this.startTwoPlayersGame = game.add.button(350, 230, 'boton2Players', startTwoPlayersGame);
        //this.startTwoPlayersGame = 0.508; this.boton2Players.scale.y = 0.46;

        this.jugadoresIAInfoTexto = this.game.add.text(335, 310, this.jugadoresIAInfo, { font: "30px Arial", fill: "#ffffff" });
        this.jugadoresIATexto = this.game.add.text(442, 345, jugadoresIA, { font: "30px Arial", fill: "#ffffff" });
        this.jugadoresIAMas = this.game.add.button(490, 345, 'mas', anadirIA);
        this.jugadoresIAMas.scale.x = 0.12; this.jugadoresIAMas.scale.y = 0.12;
        this.jugadoresIAMenos = this.game.add.button(385, 345, 'menos', quitarIA);
        this.jugadoresIAMenos.scale.x = 0.12; this.jugadoresIAMenos.scale.y = 0.12;

        this.limiteGolesInfoTexto = this.game.add.text(340, 375, this.limiteGolesInfo, { font: "30px Arial", fill: "#ffffff" });
        this.limiteGolesTexto = this.game.add.text(442, 405, limiteGoles, { font: "30px Arial", fill: "#ffffff" });
        this.limiteGolesMas = this.game.add.button(490, 405, 'mas', anadirGoles);
        this.limiteGolesMas.scale.x = 0.12; this.limiteGolesMas.scale.y = 0.12;
        this.limiteGolesMenos = this.game.add.button(385, 405, 'menos', quitarGoles);
        this.limiteGolesMenos.scale.x = 0.12; this.limiteGolesMenos.scale.y = 0.12;
    },

    update: function() {
        this.jugadoresIATexto.text = jugadoresIA;
        this.limiteGolesTexto.text = limiteGoles;
    }
};
game.state.add('menu', menuState);

function anadirIA()
{
    if(jugadoresIA < 20)
    {
        jugadoresIA++;
    }
}

function quitarIA()
{
    if(jugadoresIA > 1)
    {
        jugadoresIA--;
    }
}

function anadirGoles()
{
    if(limiteGoles < 20)
    {
        limiteGoles++;
    }
}

function quitarGoles()
{
    if(limiteGoles > 1)
    {
        limiteGoles--;
    }
}

function startOnePlayerGame()
{
    twoPlayers = false;
    iaPlayers = jugadoresIA; //document.getElementById("iaNumberTxt").value;
    goalLimit = limiteGoles; //document.getElementById("goalLimitTxt").value; 
    game.state.start('main'); 
}

function startTwoPlayersGame()
{
    twoPlayers = true;
    goalLimit = limiteGoles; //document.getElementById("goalLimitTxt").value; 
    game.state.start('main');
}

function mostrarMenu()
{
    /* var params = parseUrl( document.URL.split('?')[1] );
    if(params.id)
    {
        gameId = params.id;
        startMultiPlayer();
    }*/
    game.state.start('menu'); 
}

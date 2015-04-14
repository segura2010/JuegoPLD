// Menu Game State
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

        // Load sounds
        game.load.audio('goalAudio', 'assets/goal.mp3');
        game.load.audio('collisionAudio', 'assets/collision.mp3'); 
    },

    create: function() { 
        //this.startIABtn = this.game.add.button(0, 0, "ball", startOnePlayerGame, this); 

        this.back_field = game.add.image(0, 0, 'back_field');
        this.back_field.scale.x = 1.4; this.back_field.scale.y = 1.28;

        this.startOnePlayerGame = this.game.add.button(350, 200, 'boton1Player');
        //this.startOnePlayerGame = 1; this.boton1Player.scale.y = 0.9;

        this.startTwoPlayersGame = game.add.button(350, 300, 'boton2Players');
        //this.startTwoPlayersGame = 0.508; this.boton2Players.scale.y = 0.46;
    },

    update: function() {
    }
};
game.state.add('menu', menuState);
game.state.start('menu');


function startOnePlayerGame()
{
    twoPlayers = false;
    iaPlayers = document.getElementById("iaNumberTxt").value;
    goalLimit = document.getElementById("goalLimitTxt").value; 
    game.state.start('main'); 
}

function startTwoPlayersGame()
{
    twoPlayers = true;
    goalLimit = document.getElementById("goalLimitTxt").value; 
    game.state.start('main');
}

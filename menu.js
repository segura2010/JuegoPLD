// Menu Game State
var menuState = {
    preload: function() {
        game.stage.backgroundColor = 'grey';

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
        this.startIABtn = this.game.add.button(0, 0, "ball", startOnePlayerGame, this); 
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
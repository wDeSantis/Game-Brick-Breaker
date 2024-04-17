// canvas et ses dimensions
let canvas = document.getElementById('canvas');
canvas.width = 1100;
canvas.height = 720;
let ctx = canvas.getContext('2d');


// déclaration des variables pour le paddle
var paddleWidth = 115;
var paddleHeight = 20;
var paddleX = (canvas.width-paddleWidth)/2;
var rightPressed = false;
var leftPressed = false;

// déclaration des variables pour la balle
var ballRadius = 14;
var x = canvas.width / 2; // centre au milieu la balle
var y = canvas.height - paddleHeight - (ballRadius*2); 
var dx = 4; // déplacement en x
var dy = -3.5; // déplacement en y
var gameOver = false;
let animationFrameId;

// variable pour le score
let score = 0;

// déclaration des variables pour les briquess
var brickRowCount = 3;
var brickColumnCount = 10;
var brickWidth = 103;
var brickHeight = 30;
var brickPadding = 3;
var brickOffsetLeft = 20;
var brickOffsetTop = 50;
var srcBrickWidth = 82;
var srcBrickHeight = 32;
var colorsPerRow = 10;
var bricks = [];
for(var c=0; c<brickColumnCount; c++){
    bricks[c] = [];
    for(var r=0; r<brickRowCount; r++){
        var colorIndex = r % colorsPerRow; // pour incrémenter la couleur de la brique(son index)
        bricks[c][r] = {x:0, y:0, color: colorIndex, status: 1};
    }
}
// variables de jeu
var gameStarted = false;
var spacePressed = false;
var isPaused = false;
var dKeyEnabled = false;
var aKeyEnabled = false;
var lives = 3;
var levelComplete = false;

// déclaration et initialisation des sons/musiques
soundIntro = document.getElementById('soundIntro');
soundIntro.setAttribute('src', 'sounds/gameIntro.mp3');
soundIngame = document.getElementById('soundIngame');
soundIngame.setAttribute('src', 'sounds/ingamemusic.mp3');
soundBrickHit = document.getElementById('soundBrickHit');
soundBrickHit.setAttribute('src', 'sounds/Brickhit.wav');
soundGameOver = document.getElementById('soundGameOver');
soundGameOver.setAttribute('src', 'sounds/gameOver.mp3');
soundVictory = document.getElementById('soundVictory');
soundVictory.setAttribute('src', "sounds/Victory.mp3");

/// déclaration et initialisation des images
let splashScreen = new Image();
splashScreen.src = "images/SPLASHSCREEN.png";
// bg level 1
let bgLevel1 = new Image();
bgLevel1.src = "images/BGlevel1.jpg";
// bg level 2
let bgLevel2 = new Image();
bgLevel2.src = 'images/BGlevel2.png';
// bg level 3
let bgLevel3 = new Image();
bgLevel3.src = "images/BGlevel3.jpg";
// bg level 4
let bgLevel4 = new Image();
bgLevel4.src = "images/BGlevel4.png";
// ball image
let ballImg = new Image();
ballImg.src = "images/ball3.png";
//paddle image
let paddImg = new Image();
paddImg.src = "images/paddle.png";
// images pour les briques
var bricksImg = new Image();
bricksImg.src = "images/sprite_briques.png";
// pour itérer l'image entre les niveaux
var currentBgIndex = 0;
var bgImages = [
    bgLevel1,
    bgLevel2,
    bgLevel3,
    bgLevel4
];
// fonction qui affiche le background
function drawBg(){
    ctx.drawImage(bgImages[currentBgIndex],0,0,canvas.width,canvas.height);
}
// fonction qui itère le background a chaque niveau
function changeBg(){
    currentBgIndex++;
    if(currentBgIndex >= bgImages.length){
        currentBgIndex = 0;
    }
}
//*************** Fonction pour jouer les sons**************************** */
function playBrickHitSound(){
    soundBrickHit.pause();
    soundBrickHit.load();
    soundBrickHit.volume = 0.5;
    soundBrickHit.play();
}

function playIntroSound(){
    soundIntro.pause();
    soundIntro.load();
    soundIntro.volume = 0.5;
    soundIntro.play();
    soundIngame.loop = true;
}

function playGameOverSound(){
    soundGameOver.pause();
    soundGameOver.load();
    soundGameOver.volume = 0.5;
    soundGameOver.play();
}

function playVictorySound(){
    soundVictory.pause();
    soundVictory.load();
    soundVictory.volume = 0.5;
    soundVictory.play();
}

function playIngameSound(){
    soundIngame.pause();
    soundIngame.load();
    soundIngame.volume = 0.5;
    soundIngame.play();
}

function stopIngameSound(){
    soundIngame.pause();
    soundIngame.currentTime = 0;
}

//****Fonction pour la barre de vie(dessiner) puis animer */
var lifebar = document.getElementById('lifebar');
var curFrame = 0;
var lifeImage = new Image();
lifeImage.src = "images/sprite_barre_de_vies.png";

function drawLives(){
    switch(lives){
        case 0:
            curFrame = -3;
            break;
        case 1:
            curFrame = -2;
            break;
        case 2:
            curFrame = -1;
            break;
        case 3:
            curFrame = 0;
            break;
        default:
            break;
    }
    lifebar.style.backgroundPositionX = (curFrame * 141).toString()+'px';
}
// fonction qui reset la life bar
function resetLifeBar() {
    curFrame = 0;
    lifebar.style.backgroundPositionX = (curFrame * 141).toString() + 'px';
}

// fonction qui fait glow la derniere vie
function animLastLive(){
        stopIngameSound();
        anime({
            targets: "#lifebar",
            opacity: [0.5, 1, 0.5, 1, 0.5, 1],
            duration: 1500,
            easing: 'easeInOutQuad',
            loop: true
        })
    
}

// fonction qui arrete la derniere vie(glow)
function stopLastLiveAnimation() {
    anime.remove('#lifebar');
    anime({
        targets: "#lifebar",
        opacity: 1
    });
}


// fonction qui anime la balle (le jeu)
function draw(){
    if(gameStarted){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawBg();
    drawBall();
    drawBricks();
    collisionDetection();
    drawPaddle();

    // Vérification des collisions 
    if(y + dy + (ballRadius/2) < 0){
        dy = -dy;
    } else if(y + dy > canvas.height-ballRadius && !gameOver){
        if(x >paddleX && x < paddleX + paddleWidth){
            dy = -dy;
        } else{
            stopIngameSound();
            gameOver = true;
            leftPressed = false; // pour ne plus pouvoir déplacer le paddle 
            rightPressed = false; // avant qu'il réapparaisse
            lives--;
            drawLives();
            if(lives == 1){
                animLastLive(); 
            }
            resetGame(); // on replace le paddle et la balle pour pouvoir repartir
            return; // arreter l'exécution de draw
        }   
    }
    // collision pour mur droit et gauche
    if(x + dx < ballRadius || x + dx > canvas.width-ballRadius){
        dx = -dx;
    }
    if(rightPressed && paddleX < canvas.width-paddleWidth - 3){
        paddleX += 7;
    }
    if(leftPressed  && paddleX - 3 > 0){
        paddleX -= 7;
    }
    x += dx;
    y += dy
}
    animationFrameId = requestAnimationFrame(draw);
}

// fonction qui commence la partie au début
function startGame(){
    playIntroSound();
    falseLoading();
}

// fonction qui permet de déplacer le paddle et la balle avant le lancement du jeu
function drawBeforeStart(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawBg();
    x = paddleX + paddleWidth / 2; // position en x centré sur le paddle 
    y = canvas.height - paddleHeight - (ballRadius*2);
    dx = 4;
    dy = -3.5;
    // si on appuit sur espace, on lance draw
    if(spacePressed){
        gameStarted = true;
        playIngameSound();
        draw();
        spacePressed = false;
        return;
    } else {
    drawBricks();
    drawBall();
    drawPaddle();
    if(rightPressed && paddleX < canvas.width-paddleWidth - 3){
        paddleX += 7;
    }
    if(leftPressed  && paddleX - 3> 0){
        paddleX -= 7;
    }
    }
    animationFrameId = requestAnimationFrame(drawBeforeStart);
}

//fonction qui dessine la balle
function drawBall(){
    ctx.beginPath();
    ctx.drawImage(ballImg, x - ballRadius, y)
    ctx.closePath();
}


// fonction qui dessine le splashscreen
function drawSplash(){
    ctx.beginPath();
    ctx.drawImage(splashScreen,0,0);
    ctx.closePath();
}
// fonction qui dessine le paddle
function drawPaddle(){
    ctx.beginPath();
    ctx.drawImage(paddImg, paddleX, canvas.height-paddleHeight);
    ctx.closePath();
}

// fonction qui dessine les  briques
function drawBricks(){
    for(var c=0; c<brickColumnCount; c++){
        for(var r=0; r<brickRowCount; r++){
            if(bricks[c][r].status == 1){
            var brickX = (c *(brickWidth+brickPadding))+brickOffsetLeft; // valeur de x pour chaque brique
            var brickY = (r * (brickHeight+brickPadding))+brickOffsetTop; // valeur de y pour chaque brique
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.drawImage(bricksImg, bricks[c][r].color * srcBrickWidth, 0, 82, 32, brickX, brickY, brickWidth, brickHeight);
            ctx.closePath();
            }
        }
    }
}

// fonction qui reset le nombre de briques
function resetBrickRow(){
    brickRowCount = 3;
}
// fonction qui ajoute une rangée de briques
function addBrickRow(){
    brickRowCount++;
}


// reinitialisation du paddle et de la balle apres avoir perdu une vie
function resetGame(){
    // si pu de vies(animation de défaite et on recommence)
    if(lives == 0){
        animDefeat();
        setTimeout(function(){
            resetRestartBtn();
        },4000);
        window.cancelAnimationFrame(draw);
        return;
    }
    spacePressed = false;
    gameOver = false;
     // Réinitialisation de la position de la balle après avoir perdu une vie
     x = canvas.width / 2;
     y = canvas.height - paddleHeight - (ballRadius * 2);
     paddleX = (canvas.width - paddleWidth)/2;
     drawBeforeStart();
}

// fonction qui reset les controles pertinants
function resetControls(){
    spacePressed = false;
    gameOver = false;
    resetBricks();
     // Réinitialisez la position de la balle après avoir perdu une vie
     x = canvas.width / 2;
     y = canvas.height - paddleHeight - (ballRadius * 2);
     paddleX = (canvas.width - paddleWidth)/2;
}

// fonction qui reload le jeu
function restart(){
    document.location.reload();
}

// fonction qui anime le splash screen et le fait apparaitre
function delayAnimationSplash(){
    // dessin du canvas avec le splash screen
    drawSplash();
    setTimeout(function(){ // 2 secondes d'intervalle avant de commencer les animations
    document.getElementById('container').style.visibility = 'visible';
    anime({
        targets: '#canvas',
        translateY: [75, -75, 75, 0],
        duration: 4000,
        easing: 'easeOutBounce',
        complete: function(){
            // animation terminé on fait remet le bouton activé et le fait afficher
            document.getElementById('btnStart').style.pointerEvents= 'auto';
            document.getElementById('btnStart').style.opacity = 1;
        }
    })
    anime({ // animation pour le bouton start
        targets: "#btnStart",
        translateX: [-10, 10, -10, 10, -10, 10, -5, 5, 0],
        duration: 1500,
        delay: 3000,
        loop: true,
        easing: "easeInOutQuad"
    })
},3000);
}

// fonction qui affiche le loading bar puis load le niveau
function falseLoading(){
    document.getElementById('btnStart').style.visibility = "hidden"; // on met le bouton start caché
    drawBg();
    loadingBar(); // appel de la fonction qui affiche le loadingbar
    // on affiche le score et barre de vie
    document.getElementById('right').style.visibility = 'visible';
    // appel de la fonction draw();
    setTimeout(function(){
        drawBeforeStart();
    }, 6000);
}

//***********************************animation du loading bar********************* */
// Déclaration d'une variable pour stocker l'objet anime de la barre de chargement
let graphique = null;
// Fonction qui initialise et démarre l'animation de la barre de chargement
function startLoadingAnimation() {
    graphique = anime({
        targets: ".segment",
        width: 125,
        duration: 200,
        delay: anime.stagger(700),
        endDelay: 500,
        easing: 'linear',
        loop: true
    });
}
// Fonction qui arrête et réinitialise l'animation de la barre de chargement
function stopLoadingAnimation() {
    if (graphique) {
        graphique.pause();
        graphique.seek(0);
    }
}

// fonction qui affiche la barre de chargement
function loadingBar(){
    document.getElementById('barre').style.visibility = 'visible';
    document.getElementById('chargement').style.visibility = 'visible';
    let pourcentage = document.getElementById('chargement');
    let barre = {
        pourcent: '0%'
    }
    stopLoadingAnimation();
    startLoadingAnimation();

    let affichage = anime({
        targets: barre,
        pourcent: "100%",
        duration: 5000,
        easing: 'linear',
        round: 1,
        update: function(){
            pourcentage.innerHTML = barre.pourcent;
        },
        complete: function(){
            stopLoadingAnimation();
            // caché le tout une fois terminé
            document.getElementById('barre').style.visibility = 'hidden';
            document.getElementById('chargement').style.visibility = 'hidden';
        }
    })
}

// animation de score a chaque 100 points
function drawSpecialScore(){
        anime({
            targets: "#scoreNombre",
            color: "#ff0000",
            scale: [1.5 , 1],
            duration: 1000,     
        })
 }


// fonction pour dessiner le score et l'animer
function drawScore(){
    anime({
        targets: "#scoreNombre",
        color: "#f5f5f5",
        scale: [1.5, 1],
        easing: 'easeInOutQuad',
        duration: 1500
    })
}



// fonction qui detecte les collisions avec les briques
function collisionDetection(){
    for(var c=0; c<brickColumnCount; c++){
        for(var r=0; r<brickRowCount; r++){
            var b = bricks[c][r];
            if(b.status == 1){ // si la brique est dessinée
                // si une brique est touché
                if(x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight){
                    playBrickHitSound();
                    dy = -dy;
                    b.status = 0; // on supprime la brique
                    score += 10;
                    document.getElementById('scoreNombre').innerHTML = score;
                    
                    // si score n'est pas un multiple de 100
                    if(score % 100 !== 0){ // animation
                        drawScore();
                    } else if (score % 100 ===0){ // si score est un multiple de 100
                        drawSpecialScore(); // animation special
                    }
                    
                
                    // si premier niveau complété
                    if(score == 300){
                        gameStarted = false;
                        startNextLevel();
                        return;  
                    }
                    // si deuxieme niveau complété
                    if(score == 701){
                        gameStarted = false;
                        startNextLevel();
                        return;
                    }
                    // si troisieme niveau complété
                    if(score == 1202){
                        gameStarted = false;
                        startNextLevel();
                        return;
                    }
                    // si dernier niveau complété
                    if(score == 1803){
                        gameStarted = false;
                        victoryAnim();
                        setTimeout(function(){
                        stopAnimations();
                        resetControls();
                        resetBrickRow();
                        document.getElementById('scoreNombre').innerHTML = 0;
                        lives = 3;
                        curFrame = 0;
                        stopLastLiveAnimation();
                        resetLifeBar();
                        score = 0;
                        changeBg();
                        drawBg();
                        falseLoading();
                        }, 5000);
                    }
                }
            }
        }
    }
}

// fonction pour partir le prochain niveau
function startNextLevel(){
    stopIngameSound();
    victoryAnim();
        setTimeout(function(){
            stopAnimations();
            resetControls();
            changeBg();
            drawBg();
            falseLoading();
            }, 5000);
            score+=1;
            addBrickRow();
}

// fonction pour l'animation lorsqu'on pert
function animDefeat(){
    stopIngameSound();
    playGameOverSound();
    document.getElementById('defeatText').innerHTML = "GAME OVER";
    document.getElementById('defeatText').style.visibility = "visible";
    anime({
        targets: '#defeatText',
        translateX: [-10, 10, -10, 10, -10, 10, -5, 5, 0],
        duration: 2000,
        easing: "easeInOutQuad",
        loop: true
    });
}

// fonction qui affiche la victoire
function victoryAnim(){
    stopIngameSound();
    playVictorySound();
    document.getElementById('victoryText').innerHTML = "VICTORY";
    document.getElementById('victoryText').style.visibility = "visible";
    anime({
       targets: '#victoryText',
       translateX: [-10, 10, -10, 10, -10, 10, -5, 5, 0],
       duration: 4000,
       easing: 'easeInOutQuad',
       complete: function(){
        document.getElementById('victoryText').style.visibility = "hidden";
       } 
    });
    
}
// fonction pour remettre disponible le bouton recommencer et 
function resetRestartBtn(){
    document.getElementById('btnRestart').style.pointerEvents= 'auto';
    document.getElementById('btnRestart').style.opacity = 1;
}


// Ajoutez cette fonction pour réinitialiser les briques
function resetBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var colorIndex = r % colorsPerRow;
            bricks[c][r] = { x: 0, y: 0, color: colorIndex, status: 1 };
        }
    }
}
// fonction qui arrete les animations
function stopAnimations(){
    cancelAnimationFrame(animationFrameId);
}


// gestion d'évenements pour le keydown9
window.addEventListener('keydown', keyDownHandler, false);
// gestion d'evenements pour le keyup
window.addEventListener('keyup', keyUpHandler, false);
// gestion d'evenements pour le mousemove
canvas.addEventListener('mousemove', mouseMoveHandler, false);
window.addEventListener('mouseout',function(){

});
// gestion d'evenements pour le keypress
window.addEventListener("keypress", keyPressHandler, false);
function keyDownHandler(e){
    if(e.keyCode === 68){ // a droite d
        rightPressed = true;
    }
    if(e.keyCode === 65){ // a gauche a
        leftPressed = true;
    }
}
function keyUpHandler(e){
    if(e.keyCode === 68){
        rightPressed = false;
    }
    if(e.keyCode === 65){
        leftPressed = false;
    }
}
function keyPressHandler(e){
    if(e.keyCode === 32){
        spacePressed = true;
    }
}
var frameWidth = 1;
function mouseMoveHandler(e) {
    var rect = canvas.getBoundingClientRect();
    var relativeX = e.clientX - rect.left;
    paddleX = Math.max(frameWidth, Math.min(canvas.width - paddleWidth - frameWidth, relativeX - paddleWidth / 2));
}


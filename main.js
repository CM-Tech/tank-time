var c = document.getElementById("c");
var ctx = c.getContext("2d");
var mouse={x:0,y:0,d:false};
var images = {};
var playing = false;
var username = "";
var bullets=[];
var players=[];
var obstacles=[];
var myTank={};
var playerRef;
var bulletsRef=firebase.database().ref('server/bullets');
var playersRef=firebase.database().ref('server/players');
var obstaclesRef=firebase.database().ref('server/obstacles');
var time = new Date().getTime();
var timeOffset = 0;
var worldWidth=5000;
var offsetRef = firebase.database().ref(".info/serverTimeOffset");

offsetRef.on("value", function(snap) {
    timeOffset = snap.val();
    time = new Date().getTime() + timeOffset;
});
bulletsRef.on('value', function(snapshot) {
    bullets=snapshot.val();
});
playersRef.on('value', function(snapshot) {
    players=snapshot.val();
});
obstaclesRef.on('value', function(snapshot) {
    obstacles=snapshot.val();
});
firebase.database().ref('server/width').on('value', function(snapshot) {
    worldWidth=snapshot.val();
});
function updateMouse(event,type){

  mouse.x=event.clientX;
    mouse.y=event.clientY;
  if(type===1){
    mouse.d=true;
  }
  if(type===-1){
    mouse.d=false;
  }
}
function loadImage(src, name) {
    var dirt_background = new Image();

    dirt_background.src = src;
    dirt_background.onload = function() {
        images[name] = this;
    };
}
function typeKey(event){
  if(event.which==13){
    joinGame();
  }
}
var gHost='https://raw.githubusercontent.com/CM-Tech/tank-time/gh-pages';
//loadImage('https://googledrive.com/host/0B-SZEiT_s4MARkhxZmJyb1ZCQlE/dirt.png', "dirt");
loadImage(gHost+'/Environment/dirt.png', "dirt");
loadImage(gHost+'/Environment/treeSmall.png', "smallTree");
loadImage(gHost+'/Tanks/tankBlue.png', "blueTank");
loadImage(gHost+'/Tanks/tankGreen.png', "greenTank");
loadImage(gHost+'/Tanks/tankRed.png', "redTank");

loadImage(gHost+'/Tanks/barrelBlue.png', "blueBarrel");
loadImage(gHost+'/Tanks/barrelGreen.png', "greenBarrel");
loadImage(gHost+'/Tanks/barrelRed.png', "redBarrel");

loadImage(gHost+'/Bullets/bulletBlue.png', "blueBullet");
loadImage(gHost+'/Bullets/bulletGreen.png', "greenBullet");
loadImage(gHost+'/Bullets/bulletRed.png', "redBullet");

window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();
//called to join the game
function joinGame(){
    username=document.getElementById("name").value;
    document.getElementById("input-overlay").classList.add("hide");
    myTank={name:username,x:worldWidth/2,y:worldWidth/2,joinTime:time,direction:0,barrelDirection:0,lastUpdate:time};
    playerRef=playersRef.push(myTank);
    playing = true;
}
//draws a barrel, rotation in degrees
function drawBarrel(x, y, rotation, color) {
    var gV = color + "Barrel";
    if (images[gV] != null) {
      //console.log(gV,rotation,rotation/360.0 * Math.PI * 2.0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
        ctx.translate(x,y);
        ctx.rotate((rotation/360.0+0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0- images[gV].width) / 2, (images[gV].width - images[gV].height*2) / 2);
ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
function drawBullet(x, y, rotation, color) {
    var gV = color + "Bullet";
    if (images[gV] != null) {
      //console.log(gV,rotation,rotation/360.0 * Math.PI * 2.0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
        ctx.translate(x,y);
        ctx.rotate((rotation/360.0+0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0- images[gV].width) / 2, (0- images[gV].height) / 2);
ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
//draws a barrel, rotation an barrelRotation in degrees
function drawTank(x, y, rotation,barrelRotation, color) {
    var gV = color + "Tank";
    if (images[gV] != null) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
        ctx.translate(x,y);
        ctx.rotate((rotation/360.0+0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0- images[gV].width) / 2, (0 - images[gV].height) / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawBarrel(x,y,barrelRotation%360,color);
}
function title(){
  if (images.dirt != null) {

      //ctx.translate(time* images.dirt.width, time* images.dirt.width);
      ctx.beginPath();
      var pattern = ctx.createPattern(images.dirt, "repeat");
      ctx.fillStyle = pattern;


      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fill();
      //ctx.translate(-time* images.dirt.width, -time* images.dirt.width);
  }
  ctx.beginPath();
  ctx.textAlign = "center";
  ctx.font = "50px Chewy";
  ctx.fillStyle = "white";
  ctx.translate((window.innerWidth) / 2, (window.innerHeight - 150 - Math.sin(time/1000 * Math.PI * 1.0) * 10.0) / 2);
  ctx.rotate((Math.sin(time/1000 * Math.PI * 2.0) / 20.0) * Math.sin(time/1000 * Math.PI * 0.1));
  ctx.fillText("Enter Name", 0, 0);
  ctx.fill();
  //ctx.rotate(-Math.sin(time*Math.PI*2.0)/10.0);
  //ctx.translate(-(window.innerWidth) / 2, -(window.innerHeight - 200) / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
//returns current rotated towards target or as close as it can limited by maxTurn
function rotateTowards(current, target, maxTurn){
    var delta=(((target-current)%360)+360)%360;
    if(delta<=180){
return current+Math.min(delta,maxTurn);
    }else{
        return current-Math.min(360-delta,maxTurn);
    }
}
function draw() {
  time = new Date().getTime() + timeOffset;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (!playing) {
        title();

    }else{
      gameLoop();
    }
}
function shootBullet(x,y,direction){
  var bullet={x:x,y:y,direction:direction,creation:time};
  bulletsRef.push(bullet);
}
function fireTank(){
  shootBullet(myTank.x,myTank.y,myTank.barrelDirection);
}
function gameLoop(){
  myTank.barrelDirection=Math.atan2(mouse.y-c.height/2,mouse.x-c.width/2)/Math.PI*180;
  if(mouse.d){
  myTank.direction=rotateTowards(myTank.direction,myTank.barrelDirection,1);
  myTank.x+=Math.cos(myTank.direction/180*Math.PI);
  myTank.y+=Math.sin(myTank.direction/180*Math.PI);

  }
  myTank.lastUpdate=time;
  playerRef.set(myTank);
  if (images.dirt != null) {

      ctx.translate(-myTank.x,-myTank.y);
      ctx.beginPath();
      var pattern = ctx.createPattern(images.dirt, "repeat");
      ctx.fillStyle = pattern;


      ctx.fillRect(myTank.x,myTank.y, window.innerWidth, window.innerHeight);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    //  console.log("dirt");
      //ctx.translate(-time* images.dirt.width, -time* images.dirt.width);
  }
  for(var i in players){
    var theTank=players[i];
    if(theTank!="M"){
      if(theTank.direction!==undefined){
      drawTank(c.width/2-myTank.x+theTank.x,c.height/2-myTank.y+theTank.y,theTank.direction,theTank.barrelDirection,"blue");
if(time-theTank.lastUpdate>1000){
firebase.database().ref('server/players/'+i).set(null);
}
}
}
    }

    for(var i in bullets){
      var theBullet=bullets[i];
      if(theBullet!="M"){
        if(theBullet.direction!==undefined){
          var cTime=time-theBullet.creation;
        drawBullet(c.width/2-myTank.x+theBullet.x+Math.cos(theBullet.direction/180*Math.PI)*cTime/2,c.height/2-myTank.y+theBullet.y+Math.sin(theBullet.direction/180*Math.PI)*cTime/2,theBullet.direction,"blue");
  if(time-theBullet.creation>3000){
  firebase.database().ref('server/bullets/'+i).set(null);
  }
  }
  }
      }

    var treeOutset=((Math.ceil(worldWidth/100)*100+100)-worldWidth)/2;
    for(var tX=-treeOutset;tX<=worldWidth+treeOutset;tX+=100){
      var im="smallTree";
      if (images[im] != null) {
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)+tX , (c.height/2-myTank.y - images[im].height/ 2)-treeOutset );
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)+tX , (c.height/2-myTank.y - images[im].height/ 2)+treeOutset+worldWidth );
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)+treeOutset+worldWidth , (c.height/2-myTank.y - images[im].height/ 2)+tX );
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)-treeOutset , (c.height/2-myTank.y - images[im].height/ 2)+tX );

      }
    }
    //drawTank(c.width/2,c.height/2,myTank.direction,myTank.barrelDirection,"blue");
}
function pressKey(event){
  console.log(event.which);
  if(event.which==32 && playing){
    fireTank();
  }
}
function resizeCanvas() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    draw();
}
window.setInterval(draw, 1);

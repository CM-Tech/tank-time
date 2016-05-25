var c = document.getElementById("c");
var ctx = c.getContext("2d");
var mouse = {
    x: 0,
    y: 0,
    d: false
};
var images = {};
var playing = false;
var username = "";
var bullets = [];
var players = [];
var tracks = [];
var obstacles = [];
var myTank = {};
var playerRef;
var bulletsRef = firebase.database().ref('server/bullets');
var playersRef = firebase.database().ref('server/players');
var obstaclesRef = firebase.database().ref('server/obstacles');
var tracksRef = firebase.database().ref('server/tracks');
var time = new Date().getTime();
var timeOffset = 0;
var lastTick=time;
var worldWidth = 5000;
var lastShoot = 0;
var treeCords = [];
var score = 0;
var offsetRef = firebase.database().ref(".info/serverTimeOffset");
var scoreListen;
var trackLength=16;
var lastTrack=trackLength;
offsetRef.on("value", function(snap) {
    timeOffset = snap.val();
    time = new Date().getTime() + timeOffset;
});
bulletsRef.on('value', function(snapshot) {
    bullets = snapshot.val();
});
playersRef.on('value', function(snapshot) {
    players = snapshot.val();
});
obstaclesRef.on('value', function(snapshot) {
    obstacles = snapshot.val();
});
tracksRef.on('value', function(snapshot) {
    tracks = snapshot.val();
});
firebase.database().ref('server/width').on('value', function(snapshot) {
    worldWidth = snapshot.val();
});
function updateMouse(event, type) {

    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (type === 1) {
        mouse.d = true;
    }
    if (type === -1) {
        mouse.d = false;
    }
}
function loadImage(src, name) {
    var dirt_background = new Image();

    dirt_background.src = src;
    dirt_background.onload = function() {
        images[name] = this;
    }
    ;
}
function typeKey(event) {
    if (event.which == 13) {
        joinGame();
    }
}
var gHost = 'https://raw.githubusercontent.com/CM-Tech/tank-time/gh-pages';
//loadImage('https://googledrive.com/host/0B-SZEiT_s4MARkhxZmJyb1ZCQlE/dirt.png', "dirt");
loadImage(gHost + '/Environment/dirt.png', "dirt");
loadImage(gHost + '/Environment/treeSmall.png', "smallTree");
loadImage(gHost + '/Tanks/tankBlue.png', "blueTank");
loadImage(gHost + '/Tanks/tankGreen.png', "greenTank");
loadImage(gHost + '/Tanks/tankRed.png', "redTank");

loadImage(gHost + '/Tanks/barrelBlue.png', "blueBarrel");
loadImage(gHost + '/Tanks/barrelGreen.png', "greenBarrel");
loadImage(gHost + '/Tanks/barrelRed.png', "redBarrel");

loadImage(gHost + '/Bullets/bulletBlueSilver.png', "blueBullet");
loadImage(gHost + '/Bullets/bulletGreenSilver.png', "greenBullet");
loadImage(gHost + '/Bullets/bulletRedSilver.png', "redBullet");

loadImage(gHost + '/Tanks/tracksSmall.png', "smallTracks");

window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();
noise.seed(3017);

function setUpTrees() {

    treeCords = [];
    var treeOutset = ((Math.ceil(worldWidth / 100) * 100 + 400) - worldWidth) / 2;
    for (var tY = -treeOutset; tY <= worldWidth + treeOutset; tY += 100) {

        for (var tX = -treeOutset; tX <= worldWidth + treeOutset; tX += 100) {
            if (Math.abs(tY - worldWidth / 2) > worldWidth / 2 || Math.abs(tX - worldWidth / 2) > worldWidth / 2) {

                var pos1 = {
                    x: tX,
                    y: tY
                };
                var noise1 = Math.random();
                //noise.perlin2(tX/100, tY/100);
                //console.log(noise1);
                pos1.x = pos1.x + Math.cos(noise1 * Math.PI * 2.0) * 30.0;
                pos1.y = pos1.y + Math.sin(noise1 * Math.PI * 2.0) * 30.0;
                treeCords.push(pos1);
            }
        }
    }


}

//called to join the game
function joinGame() {
    username = document.getElementById("name").value;
    document.getElementById("input-overlay").classList.add("hide");
    setUpTrees();
    myTank = {
        name: username,
        x: worldWidth * Math.random(),
        y: worldWidth * Math.random(),
        joinTime: time,
        direction: 0,
        barrelDirection: 0,
        lastUpdate: time,
        score: 0
    };
    playerRef = playersRef.push(myTank);
    scoreListen = playerRef.child("score").on('value', function(snapshot) {
        if (snapshot.val() !== null ) {
            score = snapshot.val();
        } else {
            myTank.score = score;
            playerRef.transaction(function(current_value) {
                return myTank;
            });
        }
    });
    playing = true;
}
//draws a barrel, rotation in degrees
function drawBarrel(x, y, rotation, color) {
    var gV = color + "Barrel";
    if (images[gV] != null ) {
        //console.log(gV,rotation,rotation/360.0 * Math.PI * 2.0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate((rotation / 360.0 + 0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0 - images[gV].width) / 2, (images[gV].width - images[gV].height * 2) / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
function drawBullet(x, y, rotation, color) {
    var gV = color + "Bullet";
    if (images[gV] != null ) {

        //console.log(gV,rotation,rotation/360.0 * Math.PI * 2.0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate((rotation / 360.0 + 0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0 - images[gV].width) / 2, (0 - images[gV].height) / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
function drawTrack(x, y, rotation, size) {
    var gV = size + "Tracks";
    if (images[gV] != null ) {

        //console.log(gV,rotation,rotation/360.0 * Math.PI * 2.0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate((rotation / 360.0 + 0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0 - images[gV].width) / 2, (0 - images[gV].height) / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
//draws a barrel, rotation an barrelRotation in degrees
function drawTank(x, y, rotation, barrelRotation, color) {
    var gV = color + "Tank";
    if (images[gV] != null ) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate((rotation / 360.0 + 0.25) * Math.PI * 2.0);
        ctx.drawImage(images[gV], (0 - images[gV].width) / 2, (0 - images[gV].height) / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawBarrel(x, y, barrelRotation % 360, color);
}
function title() {
    if (images.dirt != null ) {

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
    ctx.translate((window.innerWidth) / 2, (window.innerHeight - 150 - Math.sin(time / 1000 * Math.PI * 1.0) * 10.0) / 2);
    ctx.rotate((Math.sin(time / 1000 * Math.PI * 2.0) / 20.0) * Math.sin(time / 1000 * Math.PI * 0.1));
    ctx.fillText("Enter Name", 0, 0);
    ctx.fill();
    //ctx.rotate(-Math.sin(time*Math.PI*2.0)/10.0);
    //ctx.translate(-(window.innerWidth) / 2, -(window.innerHeight - 200) / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
//returns current rotated towards target or as close as it can limited by maxTurn
function rotateTowards(current, target, maxTurn) {
    var delta = (((target - current) % 360) + 360) % 360;
    if (delta <= 180) {
        return current + Math.min(delta, maxTurn);
    } else {
        return current - Math.min(360 - delta, maxTurn);
    }
}
function draw() {
    time = new Date().getTime() + timeOffset;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (!playing) {
        title();

    } else {
        gameLoop();
    }
}
function shootBullet(x, y, direction) {
    var bullet = {
        x: x,
        y: y,
        direction: direction,
        creation: time,
        owner: playerRef.key
    };
    bulletsRef.push(bullet);
}
function fireTank() {
    if (time - lastShoot > 500) {
        lastShoot = time;
        shootBullet(myTank.x + Math.cos(myTank.barrelDirection / 180 * Math.PI) * 50, myTank.y + Math.sin(myTank.barrelDirection / 180 * Math.PI) * 50, myTank.barrelDirection);
    }
}
function intersectRect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
    r2.x + r2.w < r1.x ||
    r2.y > r1.y + r1.h ||
    r2.y + r2.h < r1.y);
}
function gameLoop() {
    myTank.barrelDirection = Math.atan2(mouse.y - c.height / 2, mouse.x - c.width / 2) / Math.PI * 180;
    if (mouse.d) {
        myTank.direction = rotateTowards(myTank.direction, myTank.barrelDirection, 1);
        myTank.x += Math.cos(myTank.direction / 180 * Math.PI) * (time - lastTick) / 4;
        myTank.y += Math.sin(myTank.direction / 180 * Math.PI) * (time - lastTick) / 4;
lastTrack-=(time - lastTick)/4;
if(lastTrack<0){
  lastTrack=trackLength;
  tracksRef.push({creation:time,direction:myTank.direction,x:myTank.x,y:myTank.y});
}
    }
    lastTick=time;
    myTank.x = Math.max(Math.min(worldWidth, myTank.x), 0);
    myTank.y = Math.max(Math.min(worldWidth, myTank.y), 0);
    if(time-myTank.lastUpdate>10){
    myTank.lastUpdate = time;
}

    playerRef.child("x").set(myTank.x);
    playerRef.child("y").set(myTank.y);
    playerRef.child("direction").set(myTank.direction);
    playerRef.child("barrelDirection").set(myTank.barrelDirection);
    playerRef.child("lastUpdate").set(myTank.lastUpdate);
    if (images.dirt != null ) {

        ctx.translate(-myTank.x, -myTank.y);
        ctx.beginPath();
        var pattern = ctx.createPattern(images.dirt, "repeat");
        ctx.fillStyle = pattern;


        ctx.fillRect(myTank.x, myTank.y, window.innerWidth, window.innerHeight);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        //  console.log("dirt");
        //ctx.translate(-time* images.dirt.width, -time* images.dirt.width);
    }
    for (var i in tracks) {
        var theTrack = tracks[i];
        if (theTrack != "M") {
            if (theTrack.direction !== undefined) {
              var cTime = time - theTrack.creation;
              drawTrack(c.width / 2 - myTank.x + theTrack.x , c.height / 2 - myTank.y + theTrack.y , theTrack.direction, "small");
              if (time - theTrack.creation > 3000) {
                  firebase.database().ref('server/tracks/' + i).set(null );
              } else {

              }
            }
          }
        }
        var playerArray=[];
    for (var i in players) {
        var theTank = players[i];
        if (theTank != "M") {
            if (theTank.direction !== undefined) {
                
                drawTank(c.width / 2 - myTank.x + theTank.x, c.height / 2 - myTank.y + theTank.y, theTank.direction, theTank.barrelDirection, "blue");
                ctx.beginPath();
                ctx.textAlign = "center";
                ctx.font = "20px Chewy";
                ctx.fillStyle = "white";
                ctx.fillText(theTank.name, c.width / 2 - myTank.x + theTank.x, c.height / 2 - myTank.y + theTank.y+60);
                ctx.fill();
                if (time - theTank.lastUpdate > 10000) {
                    firebase.database().ref('server/players/' + i).set(null );
                    delete players[i];
                    
                }else{
                    playerArray.push(theTank);
                }
            }
        }
    }

playerArray.sort(function(a, b) {
  return b.score - a.score;
});
    for (var i in bullets) {
        var theBullet = bullets[i];
        if (theBullet != "M") {
            if (theBullet.direction !== undefined) {
                var cTime = time - theBullet.creation;
                drawBullet(c.width / 2 - myTank.x + theBullet.x + Math.cos(theBullet.direction / 180 * Math.PI) * cTime / 2, c.height / 2 - myTank.y + theBullet.y + Math.sin(theBullet.direction / 180 * Math.PI) * cTime / 2, theBullet.direction, "blue");
                if (time - theBullet.creation > 3000) {
                    firebase.database().ref('server/bullets/' + i).set(null );
                    delete bullets[i];

                } else {
                    var bulletRelPos = {
                        x: -myTank.x + theBullet.x + Math.cos(theBullet.direction / 180 * Math.PI) * cTime / 2,
                        y: -myTank.y + theBullet.y + Math.sin(theBullet.direction / 180 * Math.PI) * cTime / 2
                    }
                    if (Math.sqrt(bulletRelPos.x * bulletRelPos.x + bulletRelPos.y * bulletRelPos.y) < 200 && theBullet.owner!==playerRef.key) {
                        var bulletPolygon = [{
                            x: -26 / 2,
                            y: -12 / 2
                        }, {
                            x: 26 / 2,
                            y: -12 / 2
                        }, {
                            x: 26 / 2,
                            y: 12 / 2
                        }, {
                            x: -26 / 2,
                            y: 12 / 2
                        }];
                        var tankPolygon = [{
                            x: -70 / 2,
                            y: -75 / 2
                        }, {
                            x: 70 / 2,
                            y: -75 / 2
                        }, {
                            x: 70 / 2,
                            y: 75 / 2
                        }, {
                            x: -70 / 2,
                            y: 75 / 2
                        }];
                        for (var pI = 0; pI < tankPolygon.length; pI++) {
                            var vert = tankPolygon[pI];
                            var dist = Math.sqrt(vert.x * vert.x + vert.y * vert.y);
                            var dir = Math.atan2(vert.y, vert.x) + myTank.direction / 180 * Math.PI;
                            tankPolygon[pI].x = Math.cos(dir) * dist;
                            tankPolygon[pI].y = Math.sin(dir) * dist;
                        }
                        for (var pI = 0; pI < bulletPolygon.length; pI++) {
                            var vert = bulletPolygon[pI];
                            var dist = Math.sqrt(vert.x * vert.x + vert.y * vert.y);
                            var dir = Math.atan2(vert.y, vert.x) + theBullet.direction / 180 * Math.PI;
                            bulletPolygon[pI].x = Math.cos(dir) * dist + bulletRelPos.x;
                            bulletPolygon[pI].y = Math.sin(dir) * dist + bulletRelPos.y;
                        }
                        if (doPolygonsIntersect(tankPolygon, bulletPolygon)) {
                            playersRef.child(theBullet.owner).child("score").transaction(function(current_value) {
                                return (current_value || 0) + 1;
                            });


                            playerRef.child("score").off('value', scoreListen);
                            playerRef.set(null );
                            document.getElementById("input-overlay").classList.remove("hide");
                            playing = false;
                            firebase.database().ref('server/bullets/' + i).set(null );
                            delete bullets[i];
break;

                        }
                    }
                }

            }
        }
    }
    for (var i in bullets) {
        var theBullet = bullets[i];
        if (theBullet != "M" && theBullet !== undefined) {
            if (theBullet.direction !== undefined) {
    for (var i2 in bullets) {
        var theBullet2 = bullets[i2];
        if (theBullet2 != "M" && theBullet2!=theBullet && theBullet2 !== undefined) {
            if (theBullet2.direction !== undefined) {
                var cTime = time - theBullet.creation;
                var cTime2 = time - theBullet2.creation;

                    var bulletRelPos = {
                        x: -myTank.x + theBullet.x + Math.cos(theBullet.direction / 180 * Math.PI) * cTime / 2,
                        y: -myTank.y + theBullet.y + Math.sin(theBullet.direction / 180 * Math.PI) * cTime / 2
                    }
                    var bulletRelPos2 = {
                        x: -myTank.x + theBullet2.x + Math.cos(theBullet2.direction / 180 * Math.PI) * cTime2 / 2,
                        y: -myTank.y + theBullet2.y + Math.sin(theBullet2.direction / 180 * Math.PI) * cTime2 / 2
                    }
                    var bulletRelPos3 = {
                        x: bulletRelPos.x-bulletRelPos2.x,
                        y: bulletRelPos.y-bulletRelPos2.y
                    }
                    if (Math.sqrt(bulletRelPos3.x * bulletRelPos3.x + bulletRelPos3.y * bulletRelPos3.y) < 100) {
                        var bulletPolygon = [{
                            x: -26 / 2,
                            y: -12 / 2
                        }, {
                            x: 26 / 2,
                            y: -12 / 2
                        }, {
                            x: 26 / 2,
                            y: 12 / 2
                        }, {
                            x: -26 / 2,
                            y: 12 / 2
                        }];
                        var bulletPolygon2 = [{
                            x: -26 / 2,
                            y: -12 / 2
                        }, {
                            x: 26 / 2,
                            y: -12 / 2
                        }, {
                            x: 26 / 2,
                            y: 12 / 2
                        }, {
                            x: -26 / 2,
                            y: 12 / 2
                        }];
                        for (var pI = 0; pI < bulletPolygon2.length; pI++) {
                            var vert = bulletPolygon2[pI];
                            var dist = Math.sqrt(vert.x * vert.x + vert.y * vert.y);
                            var dir = Math.atan2(vert.y, vert.x) + theBullet2.direction / 180 * Math.PI;
                            bulletPolygon2[pI].x = Math.cos(dir) * dist + bulletRelPos2.x;
                            bulletPolygon2[pI].y = Math.sin(dir) * dist + bulletRelPos2.y;
                        }
                        for (var pI = 0; pI < bulletPolygon.length; pI++) {
                            var vert = bulletPolygon[pI];
                            var dist = Math.sqrt(vert.x * vert.x + vert.y * vert.y);
                            var dir = Math.atan2(vert.y, vert.x) + theBullet.direction / 180 * Math.PI;
                            bulletPolygon[pI].x = Math.cos(dir) * dist + bulletRelPos.x;
                            bulletPolygon[pI].y = Math.sin(dir) * dist + bulletRelPos.y;
                        }
                        if (doPolygonsIntersect(bulletPolygon, bulletPolygon2)) {
                        bulletsRef.child(i).set(null);
                        bulletsRef.child(i2).set(null);

                        }
                    }


            }
        }
    }
            }
        }
    }

    /*var treeOutset=((Math.ceil(worldWidth/100)*100+100)-worldWidth)/2;
    for(var tX=-treeOutset;tX<=worldWidth+treeOutset;tX+=100){
      var im="smallTree";
      if (images[im] != null) {
        var pos1={x:(0- images[im].width/ 2)+tX ,y: (0 - images[im].height/ 2)-treeOutset};
        var noise1=noise.perlin2(pos1.x/50, pos1.y/50);
        pos1.x+=Math.cos(noise1*Math.PI*2)*10;
        pos1.y+=Math.sin(noise1*Math.PI*2)*10;
          ctx.drawImage(images[im], pos1.x+c.width/2-myTank.x , pos1.y+c.height/2-myTank.y );
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)+tX , (c.height/2-myTank.y - images[im].height/ 2)+treeOutset+worldWidth );
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)+treeOutset+worldWidth , (c.height/2-myTank.y - images[im].height/ 2)+tX );
          ctx.drawImage(images[im], (c.width/2-myTank.x- images[im].width/ 2)-treeOutset , (c.height/2-myTank.y - images[im].height/ 2)+tX );

      }
    }*/

    var im = "smallTree";

    if (images[im] != null ) {
        var tree = images[im];
        for (var i = 0; i < treeCords.length; i++) {

            var pos1 = treeCords[i];
            ctx.drawImage(images[im], pos1.x + c.width / 2 - myTank.x - tree.width / 2, pos1.y + c.height / 2 - myTank.y - tree.height / 2);
        }
    }
    ctx.beginPath();
    ctx.textAlign = "left";
    ctx.font = "50px Chewy";
    ctx.fillStyle = "white";
    ctx.fillText("score: " + score, 50, c.height - 60);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.strokeRect(Math.floor(c.width-111),Math.floor(c.height - 111),102,102);
    ctx.stroke();
    for (var i in players) {
        var theTank = players[i];
        if (theTank != "M") {
            if (theTank.direction !== undefined) {
              ctx.beginPath();
              ctx.fillStyle = "white";
              if(i==playerRef.key){
                  ctx.fillStyle = "red";
              }
              ctx.fillRect(Math.floor(c.width-110)+theTank.x/worldWidth*100-2,Math.floor(c.height - 110)+theTank.y/worldWidth*100-2,4,4);
              ctx.fill();

            }
        }
    }
    ctx.beginPath();
    ctx.textAlign = "center";
    ctx.font = "20px Chewy";
    ctx.fillStyle = "white";
    ctx.fillText("Scoreboard", c.width-100, 20);
    ctx.fill();
    for (var i=0;i< Math.min(playerArray.length,10);i++) {
        var theTank = playerArray[i];
        if (theTank != "M") {
            if (theTank.direction !== undefined) {
              ctx.beginPath();
    ctx.textAlign = "left";
    ctx.font = "20px Chewy";
    ctx.fillStyle = "white";
    ctx.fillText(theTank.name, c.width-175, 40+i*30);
    ctx.fill();
    ctx.beginPath();
    ctx.textAlign = "right";
    ctx.font = "20px Chewy";
    ctx.fillStyle = "white";
    ctx.fillText(theTank.score, c.width-25, 40+i*30);
    ctx.fill();

            }
        }
    }
    //drawTank(c.width/2,c.height/2,myTank.direction,myTank.barrelDirection,"blue");
}
function isUndefined(v) {
    return !(v !== undefined);
}
/**
 * Helper function to determine whether there is an intersection between the two polygons described
 * by the lists of vertices. Uses the Separating Axis Theorem
 *
 * @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @return true if there is any intersection between the 2 polygons, false otherwise
 */
function doPolygonsIntersect(a, b) {
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        var polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            var i2 = (i1 + 1) % polygon.length;
            var p1 = polygon[i1];
            var p2 = polygon[i2];

            // find the line perpendicular to this edge
            var normal = {
                x: p2.y - p1.y,
                y: p1.x - p2.x
            };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if (isUndefined(minA) || projected < minA) {
                    minA = projected;
                }
                if (isUndefined(maxA) || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if (isUndefined(minB) || projected < minB) {
                    minB = projected;
                }
                if (isUndefined(maxB) || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                //CONSOLE("polygons don't intersect!");
                return false;
            }
        }
    }
    return true;
}
;
function pressKey(event) {
    console.log(event.which);
    if (event.which == 32 && playing) {
        fireTank();
    }
}
function resizeCanvas() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    draw();
}
window.setInterval(draw, 1);

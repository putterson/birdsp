$(document).ready(function() {
    var canvas = document.getElementById("canvas")//$("#canvas");
    var ctx = canvas.getContext("2d");
    var H;
    var W;
    var TX;
    var TY;


    //Game Constants
    var G = 9.81;
    var M = 1000000;
    var e = 0.1; // coefficient of restitution
    
    var R = 75;
    var outer = R*5;
    var orbSize = 25;
    var orbRadius = orbSize / 4; //This value is based off the image

    //Game score vars
    var score = 0;
    var bestscore = 0;

    var background = new Image();

    function resize() {
    W = $(window).width() - 4;
    H = $(window).height() - 4;

    $("#canvas").css("width", W);
    $("#canvas").css("height", H);
    var ratio = window.devicePixelRatio;
    W *= ratio;
    H *= ratio;
    $("#canvas").attr("width", W);
    $("#canvas").attr("height", H);

    TX = W / 2;
    TY = H / 2;    
    
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;


    // The rest of this is to save a background gradient as an image, cause drawing gradients is slower than an image
    ctx.save();
    ctx.translate(TX, TY);
    
    var grd=ctx.createRadialGradient(0,0,R,0,0,1.5*R);
    grd.addColorStop(0,'#2F387B');
    grd.addColorStop(1,'#000000');

    // Fill with gradient
    ctx.fillStyle=grd;
    ctx.fillRect(-TX,-TY,W,H);


    ctx.beginPath();
    ctx.arc(0,0,outer,0,2*Math.PI);
    ctx.strokeStyle = '#999999';
    ctx.stroke();
    
    
    ctx.restore();

    background = new Image();

    background.src = canvas.toDataURL("image/png");
    }
    resize();
    $(window).resize(resize);
    $(window).onresize = resize;


    //Load images
    var imgcount = 2;
    function checkImgs(){
    imgcount--;
    if(imgcount <= 0){
        run();
    }
    }
    
    var imgEarth = new Image();
    var imgSput = new Image();
    imgEarth.onload = checkImgs;
    imgSput.onload = checkImgs;
    imgEarth.src = "earth.png";
    imgSput.src = "sputnik.png";
    
    

    var deadOrbList = [];
    var orbiterList = [];
    var alive = 0;

    //
    // Vector operations
    //
    function Vector(x, y) {
    this.x = x;
    this.y = y;
    }

    Vector.prototype.add = function (v2) {
    var v = new Vector(this.x + v2.x,
               this.y + v2.y);
    return v;
    }

    Vector.prototype.sub = function(v2) {
    var v = new Vector(this.x - v2.x,
               this.y - v2.y);
    return v;
    }

    Vector.prototype.mult = function (v2) {
    var v = new Vector(this.x * v2.x,
               this.y * v2.y);
    return v;
    }

    Vector.prototype.scale = function (s) {
    var v = new Vector(this.x * s,
               this.y * s);
    return v;
    }

    Vector.prototype.normalize = function () {
    var m = mag(this);
    var v = new Vector(this.x / m,
               this.y / m);
    return v;
    }

    Vector.prototype.angle = function () {
        return Math.atan2(this.y,this.x);
    }

    Vector.prototype.rotate = function (a) {
    var v = new Vector(this.x*Math.cos(a) - this.y*Math.sin(a),
               this.x*Math.sin(a) + this.y*Math.cos(a));
    return v;
    }

    Vector.prototype.equal = function (v2) {
    return this.x == v2.x && this.y == v2.y && this.z == v2.z;
    }
        
    function mag(v){
        return Math.sqrt((v.x * v.x)+(v.y * v.y));
    }

    // New vector scaling
    function scale(v, s){
    alert("Deprecated scale!");
        return new Vector(v.x * s, v.y * s);
    }
   
    function normToOrigin(v){
        return v.scale(-1).normalize();
    }

    //normal between two positions
    function norm(pos1, pos2){
    return pos1.sub(pos2);
    }

    //
    // Orbiter stuff
    //
    
    function newOrb() {
        var orbiter = {
            pos : new Vector(0, -R),
            vel : new Vector(0,0),
        orient : new Vector(0,-1),
            t: 0,
            force: new Vector(0,0),
        started: false,
            dead: false,
        thrust: false
        };
        orbiterList.push(orbiter);
        return orbiter;
    }

    // Initial Orbiter
    var currOrb = newOrb();

    function destroyOrb(orb) {
        orb.dead = true;
    orb.vel = orb.vel.scale(0.05);
        if (orb == currOrb) {
            currOrb = newOrb();
        }
    }

    //
    // Physics / Math
    //
    //dist from origin (0,0)
    function dist(v) {
        return Math.sqrt((v.x * v.x)+(v.y * v.y));
    }

    //dist between two positions
    function dist2(v1, v2){
    var x = v1.x - v2.x;
    var y = v1.y - v2.y;
    return Math.sqrt((x * x) + (y * y));
    }


    function dot(v1, v2){
        return (v1.x * v2.y)+(v2.x * v1.y);
    }

    function rk4_finalstep(p1, v1, v2, v3, v4, dt){
    var v = new Vector(
        this.x = p1.x + (v1.x + 2*v2.x + 2*v3.x + v4.x)*(dt/6),
        this.y = p1.y + (v1.y + 2*v2.y + 2*v3.y + v4.y)*(dt/6)
    );
    return v;
    }

    function rk4(orb, dt) {
        // Returns final (position, velocity) array after time dt has passed.
        //        x: initial position
        //        v: initial velocity
        //        a: acceleration function a(x,v,dt) (must be callable)
        //        dt: timestep
        var p1 = orb.pos;
        var v1 = orb.vel;
        var force = orb.force;
        
        var a1 = getForce(p1, v1, orb).add(force);
            
        var p2 = p1.add(v1.scale(0.5).scale(dt));
        var v2 = v1.add(a1.scale(0.5).scale(dt));
        var a2 = getForce(p2, v2, orb).add(force);
        
        var p3 = p1.add(v2.scale(0.5).scale(dt));
        var v3 = v1.add(a2.scale(0.5).scale(dt));
        var a3 = getForce(p3, v3, orb).add(force);

        var p4 = p1.add(v3.scale(dt));
        var v4 = v1.add(a3.scale(dt));
        var a4 = getForce(p4, v4, orb).add(force);

        //var pf = p1.add(v1.add(v2.scale(2).add(v3.scale(2)).add(v4)).scale(dt/6));
        //var vf = v1.add(a1.add(a2.scale(2).add(a3.scale(2)).add(a4)).scale(dt/6));

        var pf = rk4_finalstep(p1, v1, v2, v3, v4, dt);
        var vf = rk4_finalstep(v1, a1, a2, a3, a4, dt);

        orb.pos = pf;
        orb.vel = vf;
    }

    function getForce(p, v, o){
    
    var d = dist(p);

    // The force on the orbiter is G*M/d^2
    var f = G*M/(d*d);
    var n = normToOrigin(p);
    var drag = v.scale(-0.1*Math.max(0,mag(v)-300)); // using magic velocity 300
    if(o.dead){
        drag = drag.add(v.scale(-0.02));
    }
    // Add a force in the normal dir with magnitude f
        return n.scale(f).add(drag);
    }
    
    
    function clearForce(orb){
    orb.force = new Vector(0,0);
    }
    
    function appForce(orb, dir, f) {
    return;
    }

    function appThrust(){
    var force = 1800;
    var coeff = R/dist(currOrb.pos);
    if(currOrb.thrust == true){
        currOrb.force = currOrb.orient.normalize().scale(force*coeff);
    }
    }

    //
    // Drawing
    //
    function center(f, o) {
    ctx.save();
    ctx.translate(TX, TY);

    f(o);

    ctx.restore();
    
    }

    
    function drawOrb(orb){
    var w = orbSize;

    var h_offset = w / 2.05;
    var w_offset = w / -25;

    
    
    var h = w * imgSput.height / imgSput.width;
    ctx.translate(orb.pos.x , orb.pos.y );
    ctx.rotate(orb.orient.angle() + Math.PI / 2);
    ctx.drawImage(imgSput, - w/2 + w_offset , -h/2 + h_offset, w, h);
    ctx.beginPath();
    ctx.arc(0, 0, orbRadius, 0, Math.PI*2);
    if(orb.dead){
        ctx.strokeStyle = "red";
        ctx.stroke();
    }else if(orb === currOrb){
        ctx.fillStyle = "green";
        ctx.fill();
    }
    }

    var upv = new Vector(0,-1);
    
    function draw(){
    //Draw background atmosphere gradient
    ctx.drawImage(background,0,0);

    center(function(){
        var size = 200;
        ctx.drawImage(imgEarth, -R, -R, 2*R, 2*R * imgEarth.height / imgEarth.width);        
    });

    ctx.font = "30px Fixedsys";
    ctx.fillStyle = "green";
    ctx.fillText("in contact: " + score,10,30);
    ctx.fillText("best: " + bestscore, 10, 60);
    
    orbiterList.forEach(function(o) {

        var A = Math.atan2(o.pos.y, o.pos.x) + Math.PI/2;
        var d = dist(o.pos);
        var cutoff = 2*R
        
           //set orientation of orbiter
        if (d < cutoff+R) {
            o.orient = upv.rotate((A + (Math.PI/2) * ((d-R)/cutoff))).normalize();
        } else if(Math.abs(mag(o.vel))>0){
            o.orient = upv.rotate((A + (Math.PI/2)));
        }
        center(drawOrb, o);
    });
}

    //
    // Event loop stuff
    //

    // oldT is needed to calculate what our timestep (dt) should be
    var oldT = Date.now();
    var dt = 0;
    var DT = 0.01;
    var invspeed = 1300;

    function step(){
    score = 0;
    orbiterList.forEach(function(o) {
        //collisions with outer and inner limits
        if(dist(o.pos) > outer && o.dead !== true){
        o.dead = true;
        o.vel = o.vel.scale(0.4);
        o.force = new Vector(0,0);
        if(currOrb === o){currOrb = newOrb();}
        }
        if( dist(o.pos) < R ){
        deadOrbList.push(o);
        if(currOrb === o){currOrb = newOrb();}
        }

        // inter-object collisions
        orbiterList.forEach(function(o2) {
        if(dist2(o.pos, o2.pos) <= 2*orbRadius && o !== o2){
            var n = norm(o.pos, o2.pos).normalize();
            var coll = dot(o.vel.sub(o2.vel), n);
            //if objects are moving toward each other
            if(coll < 0){
                var j = coll * (1+e) * (0.5);
                o.vel = o.vel.sub(n.scale(j));
                o2.vel = o2.vel.add(n.scale(j));

                if(!o.dead){
                    o.dead = true;
                    o.force = new Vector(0,0);
                }
                if(!o2.dead){
                    o2.dead = true;
                    o2.force = new Vector(0,0);
                }
                if(currOrb === o || currOrb === o2){
                    currOrb.started = true;
                    currOrb = newOrb();
                }
            }
        }
        });
        
        if(o.started){
        rk4(o, DT);
        }

        if(!o.dead){
        score++;
        }

    });

    if(currOrb.started){ currOrb.t += DT; }
    if(currOrb.t > 5){ currOrb = newOrb();}else{
        score--;
    }

    deadOrbList.forEach(function(o) {
        //score--;
            if (orbiterList.indexOf(o) !== -1) {
        orbiterList.splice(orbiterList.indexOf(o), 1);
        deadOrbList.splice(deadOrbList.indexOf(o), 1);
            }
    });

    bestscore = Math.max(score, bestscore);
    

    
    }

    $(document).mousedown(function(){
    currOrb.thrust = true;
    currOrb.started = true;
    });

    $(document).mouseup(function(){
    currOrb.thrust = false;
    currOrb.force = new Vector(0,0);
    });

    function run() {
    var now = Date.now();
    dt = (now - oldT) / invspeed;
    oldT = now;

    // This ensures that the simulation runs at the same speed, even if the drawing can't keep up
     while(dt > 0 && dt < 3) {

        dt -= DT;

        appThrust();

        step();

    }
    draw();

    requestAnimationFrame(run);
    }
});

$(document).ready(function() {
    var canvas = $("#canvas");
    var context = canvas.getContext('2d');
    var H;
    var W;

    function resize() {
    W = $(window).width();
    H = $(window).height();

    $("#canvas").css("width", W);
    $("#canvas").css("height", H);
    var ratio = window.devicePixelRatio;
    W *= ratio;
    H *= ratio;
    $("#canvas").attr("width", W);
    $("#canvas").attr("height", H);

    //ctx.imageSmoothingEnabled = false;
    //ctx.mozImageSmoothingEnabled = false;
    //ctx.webkitImageSmoothingEnabled = false;
    }
    resize();
    $(window).resize(resize);

    //Game Constants
    var G = 9.81;
    var M = 1000000;
    var R = 100;

    var deadOrbList = [];
    var orbiterList = [];
    var alive = 0;

    function vec(){
        var vec = {
            x : 0,
            y : 0
        }
        return vec;
    }

    function vec(v){
        var vec = {
            x : v.x,
            y : v.y
        }
        return vec;
    }
    
    function vec(xv, yv){
        var vec = {
            x : xv,
            y : yv
        }
        return vec
    }
    
    function mag(vec){
        return Math.sqrt((vec.x*vec.x)+(vec.y*vec.y));
    }

    function scale(vec, s){
        vec.x *= s;
        vec.y *= s;
    }

    function addto(vec, vec2){
        vec.x += vec2.x;
        vec.y += vec2.y;
    }

    function norm(vec){
        var m = mag(vec);
        vec.x /= m;
        vec.y /= m;
    }

    function normToOrigin(v){
        scale(v, -1);
    }

    function newOrb() {
        var orbiter = {
            pos : vec(0, -R*1.25),
            vel : vec(),
            t: 0
            force: vec(),
            dead: false
        };
        orbiterList.push(orbiter);
        return orbiter;
    }

    //Initial Orbiter
    var currOrb = newOrb();

    function destroyOrb(orb) {
    orb.dead = true;
    if (orb == currOrb) {
        currOrb = newOrb();
    }
    }

    //dist from origin (0,0)
    function dist(v) {
    return Math.sqrt((v.x*v.x)+(v.y*v.y));
    }

    //angle from position
    function angle(orb) {
    return Math.atan2(orb.y,orb.x);
    }

    function dot(v1, v2){
    return (v1.x*v2.y)+(v2.x*v1.y);
    }

    //apply gravity to orbiter
    function appGrav(orb) {
    var d = dist(orb.x, orb.y);

    // The force on the orbiter is G*M/d^2
    var f = G*M/(d*d);
    var n = 
    orb.fx = 
    }

    //

    // oldT is needed to calculate what our timestep (dt) should be
    var oldT = Date.now();
    var dt = 0;
    var invspeed = 1000;
    
    function run() {
    var now = Date.now();
    dt = (now - oldT) / invspeed;
    oldT = now;
    var DT = 0.02;
    
    orbiterList.forEach(function(o) {
        
    }
        
        
}

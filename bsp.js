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

	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
    }
    resize();
    $(window).resize(resize);

    
}

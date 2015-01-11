

var page_mouse_states =  new Object();
page_mouse_states.x = 0;
page_mouse_states.y = 0;

var mouse = new mousedata();
function mousedata() {
	this.state = "";
	this.canvas =null;
	this.context =null;
	this.left = false;
	this.middle = false;
	this.right = false;
	this.invert = false;
	this.pos = new vector();
	this.lastpos = new vector();
	this.finalpos = new vector();
	this.lastfinalpos = new vector();
	this.lastclick = new vector();	//last position when mouseup
	this.direction = 0;	//related to holding shift to draw straight- 1 = horizontal(x), 2=vertical(y)
	this.dragged = false;
	this.tool = 'pencil';
	this.toolsize = 2;
	
	this.color = 'rgba(0,255,0,1)';
	this.rgb = {r:0,g:0,b:0};
	this.hsl = {h:0,s:0,l:0};
	this.basergba = {r:0,g:0,b:0,a:0};	//the color chosen to emerge from transparent data when using brush tool (if not set to transparent)
	this.baseuprgba = {r:0,g:0,b:0,a:0};	//if basergba is set to transparent, this color will be used instead to emerge from it when brushing
	
	this.color2 = 'rgba(0,255,0,1)';
	this.rgb2 = {r:0,g:0,b:0};
	this.hsl2 = {h:0,s:0,l:0};
	this.basergba2 = {r:0,g:0,b:0,a:0};	//the color chosen to emerge from transparent data when using brush tool (if not set to transparent)
	this.baseuprgba2 = {r:0,g:0,b:0,a:0};	//if basergba is set to transparent, this color will be used instead to emerge from it when brushing
	
	this.currentColor = 0;
	
	this.colorbelow = {r:0,g:0,b:0};
	this.prevcolorbelow = {r:0,g:0,b:0};
	this.focus = false;		//if we've started to type into an input field, change this to true, while true, if mouse moves, refocus the canvas and return this to false.
}

var key = new keydata();
function keydata() {
	this.spacebar = false;
	this.ctrl = false;
	this.alt = false;
	this.shift = false;
	this.timer=false;
	this.pressedTime = 400; //one second
	this.held = false;
}

var tile = new tiledata();
tile.setupMap(5,5);
function tiledata() {
	this.dim = {w:4,h:4};
	this.x = 0;
	this.y = 0;
	this.set = {x:0,y:0};
	this.layer = (typeof(Storage) !== "undefined" && typeof(localStorage.map_layer) !== "undefined" ? parseInt(localStorage.map_layer) : 0 );
	this.layers = new Array(4);
	this.map;
	
	this.setupMap = function(x,y){
		this.dim.w = x;
		this.dim.h = y;
		this.map = new Array(this.layers.length);
		var i=4;
		while(i--){
			this.layers[i] = {visible:true};
			this.map[i] = new Array(this.dim.w);
			var j=this.dim.w;
			while(j--){
				this.map[i][j] = new Array(this.dim.h);
				var k=this.dim.h;
				while(k--){
					this.map[i][j][k] = {x:-1,y:-1};
				}
			}
		}
	}
	
}

function vector(v,v2) {
	this.x = (v ? v : 0.0);
	this.y = (v2 ? v2 : 0.0);
} 

function getMousePos(c, evt) {
	var rect = c.getBoundingClientRect();
	var loc = new vector(Math.floor(evt.clientX - rect.left) , Math.floor(evt.clientY - rect.top) );
	if(Math.abs(mouse.pos.x-loc.x)>=1){
		if(c==pcanvas){
			mouse.pos.x = Math.floor(loc.x );
			mouse.finalpos.x = Math.floor(mouse.pos.x  );
		}else if(c==canvas){
			mouse.pos.x = Math.floor(loc.x / tool.zoom) *tool.zoom;
			mouse.finalpos.x = Math.floor((mouse.pos.x - tool.offset.x)/tool.zoom);
		}else{
			mouse.pos.x = Math.floor(loc.x / tool.secondary_zoom) *tool.secondary_zoom;
			mouse.finalpos.x = Math.floor((mouse.pos.x - tool.secondary_offset.x)/tool.secondary_zoom);
		}
	}
	if(Math.abs(mouse.pos.y-loc.y)>=1){
		if(c==pcanvas){
			mouse.pos.y = Math.floor(loc.y );
			mouse.finalpos.y = Math.floor(mouse.pos.y  );
		}else if(c==canvas){
			mouse.pos.y = Math.floor(loc.y / tool.zoom) *tool.zoom;
			mouse.finalpos.y = Math.floor((mouse.pos.y - tool.offset.y)/tool.zoom);
		}else{
			mouse.pos.y = Math.floor(loc.y / tool.secondary_zoom) *tool.secondary_zoom;
			mouse.finalpos.y = Math.floor((mouse.pos.y - tool.secondary_offset.y)/tool.secondary_zoom);
		}
	}
	//if(Math.abs(mouse.pos.x-loc.x)>=1)mouse.pos.x = loc.x;
	//if(Math.abs(mouse.pos.y-loc.y)>=1)mouse.pos.y = loc.y;
			
}

function windowToCanvas(c, x, y) {
	var bbox = c.getBoundingClientRect();

	return { x: x - bbox.left * (c.width  / bbox.width),
		y: y - bbox.top  * (c.height / bbox.height)
	};
}

function getPosition(element) {
	var xPosition = 0;
	var yPosition = 0;
  
	while(element) {
		xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
		yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
		element = element.offsetParent;
	}
	return { x: xPosition, y: yPosition };
}



var slider_or_spinner = false;
var colorPickerMode = 'rgb';
 function refreshSwatch(input) {
 
	
	var redvalue = $("#redvalue").spinner("value"),
	greenvalue = $("#greenvalue").spinner("value"),
	bluevalue = $("#bluevalue").spinner("value");
	
	if(input==0){
		$( "#red" ).slider( "value", redvalue);
		$( "#green" ).slider( "value", greenvalue);
		$( "#blue" ).slider( "value", bluevalue);
	}
	
	var red = $( "#red" ).slider( "value"),
	green = $( "#green" ).slider( "value" ),
	blue = $( "#blue" ).slider( "value" );
	//hex = hexFromRGB( red, green, blue );
	
	if(input==1){
		$( "#redvalue" ).spinner( "value", red );
		$( "#greenvalue" ).spinner( "value", green );
		$( "#bluevalue" ).spinner( "value", blue );
	}	
	
	if(colorPickerMode=='rgb'){
		$("#red").css({
			'background': '-moz-linear-gradient(left, rgb(0,'+green+','+blue+') 0%, rgb(255,'+green+','+blue+') 100%)', /* FF3.6+ */
			'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,rgb(0,'+green+','+blue+')), color-stop(100%,rgb(255,'+green+','+blue+')))', /* Chrome,Safari4+ */
			'background': '-webkit-linear-gradient(left, rgb(0,'+green+','+blue+') 0%,rgb(255,'+green+','+blue+') 100%)', /* Chrome10+,Safari5.1+ */
			'background': '-o-linear-gradient(left, rgb(0,'+green+','+blue+') 0%,rgb(255,'+green+','+blue+') 100%)', /* Opera 11.10+ */
			'background': '-ms-linear-gradient(left, rgb(0,'+green+','+blue+') 0%,rgb(255,'+green+','+blue+') 100%)', /* IE10+ */
			'background': 'linear-gradient(to right, rgb(0,'+green+','+blue+') 0%,rgb(255,'+green+','+blue+') 100%)' /* W3C */
			//'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#000000\', endColorstr=\'#ffffff\',GradientType=1 )' /* IE6-9 */
		}).find('div').css({
			'background':'rgb('+red+','+green+','+blue+')'
		});
		$("#green").css({
			'background': '-moz-linear-gradient(left, rgb('+red+',0,'+blue+') 0%, rgb('+red+',255,'+blue+') 100%)', /* FF3.6+ */
			'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,rgb('+red+',0,'+blue+')), color-stop(100%,rgb('+red+',255,'+blue+')))', /* Chrome,Safari4+ */
			'background': '-webkit-linear-gradient(left, rgb('+red+',0,'+blue+') 0%,rgb('+red+',255,'+blue+') 100%)', /* Chrome10+,Safari5.1+ */
			'background': '-o-linear-gradient(left, rgb('+red+',0,'+blue+') 0%,rgb('+red+',255,'+blue+') 100%)', /* Opera 11.10+ */
			'background': '-ms-linear-gradient(left, rgb('+red+',0,'+blue+') 0%,rgb('+red+',255,'+blue+') 100%)', /* IE10+ */
			'background': 'linear-gradient(to right, rgb('+red+',0,'+blue+') 0%,rgb('+red+',255,'+blue+') 100%)' /* W3C */
			//'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#000000\', endColorstr=\'#ffffff\',GradientType=1 )' /* IE6-9 */
		}).find('div').css({
			'background':'rgb('+red+','+green+','+blue+')'
		});
		$("#blue").css({
			'background': '-moz-linear-gradient(left, rgb('+red+','+green+',0) 0%, rgb('+red+','+green+',255) 100%)', /* FF3.6+ */
			'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,rgb('+red+','+green+',0)), color-stop(100%,rgb('+red+','+green+',255)))', /* Chrome,Safari4+ */
			'background': '-webkit-linear-gradient(left, rgb('+red+','+green+',0) 0%,rgb('+red+','+green+',255) 100%)', /* Chrome10+,Safari5.1+ */
			'background': '-o-linear-gradient(left, rgb('+red+','+green+',0) 0%,rgb('+red+','+green+',255) 100%)', /* Opera 11.10+ */
			'background': '-ms-linear-gradient(left, rgb('+red+','+green+',0) 0%,rgb('+red+','+green+',255) 100%)', /* IE10+ */
			'background': 'linear-gradient(to right, rgb('+red+','+green+',0) 0%,rgb('+red+','+green+',255) 100%)' /* W3C */
			//'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#000000\', endColorstr=\'#ffffff\',GradientType=1 )' /* IE6-9 */
		}).find('div').css({
			'background':'rgb('+red+','+green+','+blue+')'
		});
	}else{
	$("#red").css({
			'background': '-moz-linear-gradient(left, hsl(0,100%,50%) 0%, hsl(60,100%,50%) 17%, hsl(120,100%,50%) 33%, hsl(180,100%,50%) 50%, hsl(240,100%,50%) 67%, hsl(300,100%,50%) 83%, hsl(0,100%,50%) 100%)', /* FF3.6+ */
			'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,hsl(0,100%,50%)), color-stop(17%,hsl(60,100%,50%)), color-stop(33%,hsl(120,100%,50%)), color-stop(50%,hsl(180,100%,50%)), color-stop(67%,hsl(240,100%,50%)), color-stop(83%,hsl(300,100%,50%)), color-stop(100%,hsl(0,100%,50%)))', /* Chrome,Safari4+ */
			'background': '-webkit-linear-gradient(left, hsl(0,100%,50%) 0%,hsl(60,100%,50%) 17%,hsl(120,100%,50%) 33%,hsl(180,100%,50%) 50%,hsl(240,100%,50%) 67%,hsl(300,100%,50%) 83%,hsl(0,100%,50%) 100%)', /* Chrome10+,Safari5.1+ */
			'background': '-o-linear-gradient(left, hsl(0,100%,50%) 0%,hsl(60,100%,50%) 17%,hsl(120,100%,50%) 33%,hsl(180,100%,50%) 50%,hsl(240,100%,50%) 67%,hsl(300,100%,50%) 83%,hsl(0,100%,50%) 100%)', /* Opera 11.10+ */
			'background': '-ms-linear-gradient(left, hsl(0,100%,50%) 0%,hsl(60,100%,50%) 17%,hsl(120,100%,50%) 33%,hsl(180,100%,50%) 50%,hsl(240,100%,50%) 67%,hsl(300,100%,50%) 83%,hsl(0,100%,50%) 100%)', /* IE10+ */
			'background': 'linear-gradient(to right, hsl(0,100%,50%) 0%,hsl(60,100%,50%) 17%,hsl(120,100%,50%) 33%,hsl(180,100%,50%) 50%,hsl(240,100%,50%) 67%,hsl(300,100%,50%) 83%,hsl(0,100%,50%) 100%)' /* W3C */
			//filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ff0000', endColorstr='#ff0000',GradientType=1 ); /* IE6-9 */
		}).find('div').css({
			'background':'hsl('+red+','+green+'%,'+blue+'%)'
		});
		$("#green").css({
			'background': '-moz-linear-gradient(left, hsl('+red+',0%,'+blue+'%) 0%, hsl('+red+',100%,'+blue+'%) 100%)', /* FF3.6+ */
			'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,hsl('+red+',0%,'+blue+'%)), color-stop(100%,hsl('+red+',100%,'+blue+'%)))', /* Chrome,Safari4+ */
			'background': '-webkit-linear-gradient(left, hsl('+red+',0%,'+blue+'%) 0%,hsl('+red+',100%,'+blue+'%) 100%)', /* Chrome10+,Safari5.1+ */
			'background': '-o-linear-gradient(left, hsl('+red+',0%,'+blue+'%) 0%,hsl('+red+',100%,'+blue+'%) 100%)', /* Opera 11.10+ */
			'background': '-ms-linear-gradient(left, hsl('+red+',0%,'+blue+'%) 0%,hsl('+red+',100%,'+blue+'%) 100%)', /* IE10+ */
			'background': 'linear-gradient(to right, hsl('+red+',0%,'+blue+'%) 0%,hsl('+red+',100%,'+blue+'%) 100%)' /* W3C */
			//'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#000000\', endColorstr=\'#ffffff\',GradientType=1 )' /* IE6-9 */
		}).find('div').css({
			'background':'hsl('+red+','+green+'%,'+blue+'%)'
		});
		$("#blue").css({
			'background': '-moz-linear-gradient(left, hsl('+red+','+green+'%,0%) 0%, hsl('+red+','+green+'%,100%) 100%)', /* FF3.6+ */
			'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,hsl('+red+','+green+'%,0%)), color-stop(100%,hsl('+red+','+green+'%,100%)))', /* Chrome,Safari4+ */
			'background': '-webkit-linear-gradient(left, hsl('+red+','+green+'%,0%) 0%,hsl('+red+','+green+'%,100%) 100%)', /* Chrome10+,Safari5.1+ */
			'background': '-o-linear-gradient(left, hsl('+red+','+green+'%,0%) 0%,hsl('+red+','+green+'%,100%) 100%)', /* Opera 11.10+ */
			'background': '-ms-linear-gradient(left, hsl('+red+','+green+'%,0%) 0%,hsl('+red+','+green+'%,100%) 100%)', /* IE10+ */
			'background': 'linear-gradient(to right, hsl('+red+','+green+'%,0%) 0%,hsl('+red+','+green+'%,100%) 100%)' /* W3C */
			//'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#000000\', endColorstr=\'#ffffff\',GradientType=1 )' /* IE6-9 */
		}).find('div').css({
			'background':'hsl('+red+','+green+'%,'+blue+'%)'
		});
	}
	
	var colorvalues;
	if(colorPickerMode=='hsl'){
		if(mouse.currentColor==0)mouse.hsl = {h:red,s:green,l:blue};
		else mouse.hsl2 = {h:red,s:green,l:blue};
		colorvalues = hslToRgb(red,green,blue);
		colorvalues = useSafeColors(colorvalues);	//make sure if the color is practically the same as one we've used already, to adjust it so it has same values
		red = Math.round(colorvalues[0]);
		green = Math.round(colorvalues[1]);
		blue = Math.round(colorvalues[2]);
	}
	
	if(mouse.currentColor==0){
		$( "#swatch" ).css( "background-color", "rgba("+red+","+green+","+blue+",1)" );
		mouse.color = "rgba("+red+","+green+","+blue+",1)";
		mouse.rgb = {r:red,g:green,b:blue};
		if(typeof(Storage) !== "undefined") localStorage.primaryColor = JSON.stringify(mouse.rgb);
	}else{
		$( "#swatch2" ).css( "background-color", "rgba("+red+","+green+","+blue+",1)" );
		mouse.color2 = "rgba("+red+","+green+","+blue+",1)";
		mouse.rgb2 = {r:red,g:green,b:blue};
		if(typeof(Storage) !== "undefined") localStorage.secondaryColor = JSON.stringify(mouse.rgb2);
	}
	
}

function convertSwatch(mode,colorvalues){
	slider_or_spinner=null;
	if(mode=="rgb"){
		if(mouse.currentColor==0){
			mouse.rgb.r = colorvalues[0],mouse.rgb.g = colorvalues[1],mouse.rgb.b = colorvalues[2];
			$( "#red" ).slider( "value", mouse.rgb.r );
			$( "#green" ).slider( "value", mouse.rgb.g );
			$( "#blue" ).slider( "value", mouse.rgb.b );
			$( "#redvalue" ).spinner( "value", mouse.rgb.r );
			$( "#greenvalue" ).spinner( "value", mouse.rgb.g );
			$( "#bluevalue" ).spinner( "value", mouse.rgb.b );
			
			$( "#swatch" ).css( "background-color", "rgba("+mouse.rgb.r+","+mouse.rgb.g+","+mouse.rgb.b+",1)" );
			//mouse.color = "rgba("+red+","+green+","+blue+",1)";
		}else{
			mouse.rgb2.r = colorvalues[0],mouse.rgb2.g = colorvalues[1],mouse.rgb2.b = colorvalues[2];
			$( "#red" ).slider( "value", mouse.rgb2.r );
			$( "#green" ).slider( "value", mouse.rgb2.g );
			$( "#blue" ).slider( "value", mouse.rgb2.b );
			$( "#redvalue" ).spinner( "value", mouse.rgb2.r );
			$( "#greenvalue" ).spinner( "value", mouse.rgb2.g );
			$( "#bluevalue" ).spinner( "value", mouse.rgb2.b );
			
			$( "#swatch2" ).css( "background-color", "rgba("+mouse.rgb2.r+","+mouse.rgb2.g+","+mouse.rgb2.b+",1)" );
		}
	}else{
		if(mouse.currentColor==0){
			mouse.hsl.h = colorvalues[0],mouse.hsl.s = colorvalues[1],mouse.hsl.l = colorvalues[2];
			$( "#red" ).slider( "value", mouse.hsl.h );
			$( "#green" ).slider( "value", mouse.hsl.s );
			$( "#blue" ).slider( "value", mouse.hsl.l );
			$( "#redvalue" ).spinner( "value", mouse.hsl.h );
			$( "#greenvalue" ).spinner( "value", mouse.hsl.s );
			$( "#bluevalue" ).spinner( "value", mouse.hsl.l );
			
			$( "#swatch" ).css( "background-color", "hsla("+mouse.hsl.h+","+mouse.hsl.s+"%,"+mouse.hsl.l+"%,1)" );
			//mouse.color = "rgba("+red+","+green+","+blue+",1)";
		}else{
			mouse.hsl2.h = colorvalues[0],mouse.hsl2.s = colorvalues[1],mouse.hsl2.l = colorvalues[2];
			$( "#red" ).slider( "value", mouse.hsl2.h );
			$( "#green" ).slider( "value", mouse.hsl2.s );
			$( "#blue" ).slider( "value", mouse.hsl2.l );
			$( "#redvalue" ).spinner( "value", mouse.hsl2.h );
			$( "#greenvalue" ).spinner( "value", mouse.hsl2.s );
			$( "#bluevalue" ).spinner( "value", mouse.hsl2.l );
			
			$( "#swatch2" ).css( "background-color", "hsla("+mouse.hsl2.h+","+mouse.hsl2.s+"%,"+mouse.hsl2.l+"%,1)" );
		}
	}
	
	slider_or_spinner=true;
	refreshSwatch(0);
}

function useSafeColors(colorvalues){
	var colorarray = [];
	project.contextlayer.forEach(function(entry){
		var imgData = entry.getImageData(0,0,project.width,project.height);
		for (var i=0;i<imgData.data.length;i+=4)
		{
			var r = Math.abs(imgData.data[i] - colorvalues[0]);
			var g = Math.abs(imgData.data[i+1] - colorvalues[1]);
			var b = Math.abs(imgData.data[i+2] - colorvalues[2]);
			
			if(r<3 && g<3 && b<3){
				colorvalues[0] = imgData.data[i];
				colorvalues[1] = imgData.data[i+1];
				colorvalues[2] = imgData.data[i+2];
				return colorvalues;
			}
			
		}
	});
	var imgData = palettecontext.getImageData(0,0,palettecanvas.width,palettecanvas.height);
	for (var i=0;i<imgData.data.length;i+=4)
	{
		var r = Math.abs(imgData.data[i] - colorvalues[0]);
		var g = Math.abs(imgData.data[i+1] - colorvalues[1]);
		var b = Math.abs(imgData.data[i+2] - colorvalues[2]);
		
		if(r<3 && g<3 && b<3){
			colorvalues[0] = imgData.data[i];
			colorvalues[1] = imgData.data[i+1];
			colorvalues[2] = imgData.data[i+2];
			return colorvalues;
		}
		
	}
	return colorvalues;
}

function loadIconsOnButtons(divName) {
    $("#" + divName + " input,#" + divName + "  button").each(function() {
      var iconUrl = $(this).attr('data-img');
      if (iconUrl) {
        $(this).button({
          text: false,
          icons: {
            primary: "ui-icon-blank"
          }
        });
        var imageElem, htmlType = $(this).prop('tagName');
        if (htmlType==='BUTTON') imageElem=$(this);
        if (htmlType==='INPUT') imageElem=$("#" + divName + " [for='" + $(this).attr('id') + "']");
        if (imageElem) imageElem.css('background-image', "url(" + iconUrl + ")").css('background-repeat', 'no-repeat');
      }
    });
}

function toggleFrameOrientation(){
	$('#frame_list li:not(:first)').each(function(){ 
		$(this).css('display', ($(this).css('display')=="inline-block" ? '' : 'inline-block' ) ); 
	});
	if( $('#frame_orientation_toggle').attr('value')==0){
		$("#frame_box").width(80).height(Math.min(4,project.frames)*60).css('overflow-x','hidden').css('overflow-y','auto');
		$("#frame_list").width(80);
		$("#frame_list").height(project.frames*60);
		$( "#frame_container span:last" ).width('').height('');
	}else{
		$("#frame_box").width(Math.min(4,project.frames)*60).height('').css('overflow-x','auto').css('overflow-y','hidden');
		$("#frame_list").height('');
		$("#frame_list").width(project.frames*60);
		$( "#frame_container span:last" ).width('').height('');
	}
	$('#frame_orientation_toggle').attr('value', ($('#frame_orientation_toggle').attr('value')==0?1:0) );
/*
	for(var i=0; i<project.frames; i++){
		//add new element to the frame list
		var l = $('#frame_list');
		l.find('li:first').clone(true).appendTo(l);
		var frame = l.find('li:last');
		frame.show()
		.append('<span style="position:absolute; top:0px;">'+i+'</span>');
		this.thumbnails[i] = document.createElement("canvas");
		this.thumbnails[i].width=frame.width();
		this.thumbnails[i].height=frame.height();
		this.thumbnailscontext[i] = this.thumbnails[i].getContext('2d');
		frame.append(this.thumbnails[i]);
		frame.attr('id',"frame_"+i )
		.attr('value',i )
		.siblings().removeClass('ui-state-active');
		l.find('li[id=frame_0]').toggleClass('ui-state-active');
	}*/
	
}

function prelockCleanup(){
	//this function ensures that things get sorted before connecting, like stopping any current drawing or selecting, etc.

	$("#canvas").trigger('mouseout');
	
	if(myHistory[0].selectionclipped == false){
		selectClearClip(myHistory[0].id);
		send_select_clear();
		//myHistory[0].selectionsetclip = false;
		myHistory[0].selectionpoints.push( {x:0,y:0} );
		myHistory[0].selectionclip.x = 0, myHistory[0].selectionclip.y = 0;
		myHistory[0].selectionclip.x2 = 0, myHistory[0].selectionclip.y2 = 0;
	}else{
		commitHistory(myHistory[0].id);
		selectPasteClip(myHistory[0].id);
		send_select_paste();
		selectClearClip(myHistory[0].id);
		send_select_clear();
		//myHistory[0].selectionsetclip = false;
		myHistory[0].selectionpoints.push( {x:0,y:0} );
		myHistory[0].selectionclip.x = 0, myHistory[0].selectionclip.y = 0;
		myHistory[0].selectionclip.x2 = 0, myHistory[0].selectionclip.y2 = 0;
	}
	
	$("#popup_title").html('User Connecting');
	$("#popup_content").html('<div id="MenuLock">\
		<div id="progressbar"></div>\
		<span id="connecting_info">Project locked while connections are established.</span>\
	</div>');
	$("#popup_container").show();
	$("#popup_title").show();
	$("#popup_submit").unbind( "click" );
	$("#popup_submit").click(function(){
		$("#popup_container").hide();	
		$("#popup_title").hide();				
	});
	$("#popup_cancel").unbind( "click" );
	$("#popup_cancel").click(function(){
		$("#popup_container").hide();	
		$("#popup_title").hide();				
	});
	$( "#progressbar" ).progressbar({
		value: false
	});
}

function removeFrame(f){
	if(project.frames>1){
		//remove historylist associated with frame
		historylist.forEach(function(entry){
			clearHistory(entry.id);
		});
		
		
		//remove frame
		$("#frame_null").siblings('[value='+f+']').remove();
		$("#frame_null").siblings().each(function(){
			if( $(this).attr('value')>f ){
				$(this).attr('id','frame_'+($(this).attr('value')-1) );
				$(this).attr('value',$(this).attr('value')-1);
			}
		});
		project.canvaslayer.splice(f,1);
		project.contextlayer.splice(f,1);
		project.visible.splice(f,1);
		project.thumbnails.splice(f,1);
		project.thumbnailscontext.splice(f,1);
		project.frames--;
		if(project.currentframe==project.frames)project.currentframe--;
		historylist.forEach(function(entry){
			if(entry.frame==project.frames)entry.frame = project.frames-1;
			if(entry.id!=myHistory[0].id)entry.layers.push(new historylayerdata("",entry.canvas,entry) );
		});
		myHistory[0].layers.push(new historylayerdata("New",myHistory[0].canvas,myHistory[0]) );
	}
}

function addFrame(f){
	project.canvaslayer.push( document.createElement('canvas') );
	project.canvaslayer[project.frames].width = project.width;
	project.canvaslayer[project.frames].height = project.height;
	project.contextlayer.push( project.canvaslayer[project.frames].getContext('2d') );			
	project.contextlayer[project.frames] = reload_canvas( project.canvaslayer[project.frames], project.contextlayer[project.frames] );

	project.visible.push(true);
	project.opacity.push(1);
	project.frames++;
	
	project.thumbnails = [project.frames];
	project.thumbnailscontext = [project.frames];
	
	var interval = new Array(project.frames);
	var linked = new Array(project.frames);
	$("#frame_null").siblings().each(function(){
		interval[$(this).attr('value')] = $(this).attr('data-interval') ;
		linked[$(this).attr('value')] = $(this).find('.frame_linker').attr('style') ;
	});	
	interval[project.frames-1]=300;
	
	var sortarray = $("#frame_list").sortable('toArray', {attribute: 'value'});
	sortarray.shift();
	sortarray = sortarray.map(function (x) { 
		return parseInt(x, 10); 
	});
	sortarray.splice( $("#frame_null").siblings().index( $("#frame_list li[value='"+f+"']") ) ,0,project.frames-1);	//record where the new frame will be sorted
			
	project.setupFramelist();
	
	sortarray.forEach(function(entry){
		$('#frame_'+entry).attr('data-interval',interval[entry]).find('span[id*="interval"]').html(interval[entry]*0.001);
		$('#frame_'+entry).find('.frame_linker').attr('style',linked[entry]);
		$("#frame_list").append( $('#frame_'+entry) );
	});
	
	$("#frame_null").siblings().removeClass('ui-state-active');
	$('#frame_list li[id=frame_'+project.currentframe+']').toggleClass('ui-state-active');
			
}

function checkJSON(j){
	if (j){
		try{
			a=JSON.parse( localStorage.getItem(j) );
			return a;
		}catch(e){
			return null;
		}
	}else return null
}

$.ui.plugin.add('resizable', 'alsoResizeReverse', {

  start: function () {
    var that = $(this).data('ui-resizable'),
    o = that.options,
    _store = function (exp) {
      $(exp).each(function() {
        var el = $(this);
        el.data('ui-resizable-alsoresize-reverse', {
          width: parseInt(el.width(), 10), height: parseInt(el.height(), 10),
          left: parseInt(el.css('left'), 10), top: parseInt(el.css('top'), 10)
        });
      });
    };

    if (typeof(o.alsoResizeReverse) === 'object' && !o.alsoResizeReverse.parentNode) {
      if (o.alsoResizeReverse.length) { o.alsoResize = o.alsoResizeReverse[0]; _store(o.alsoResizeReverse); }
      else { $.each(o.alsoResizeReverse, function(exp) { _store(exp); }); }
    }else{
      _store(o.alsoResizeReverse);
    }
  },

  resize: function (event, ui) {
    var that = $(this).data('ui-resizable'),
    o = that.options,
    os = that.originalSize,
    op = that.originalPosition,
    delta = {
      height: (that.size.height - os.height) || 0, width: (that.size.width - os.width) || 0,
      top: (that.position.top - op.top) || 0, left: (that.position.left - op.left) || 0
    },

    _alsoResizeReverse = function(exp, c) {
      $(exp).each(function() {
        var el = $(this), start = $(this).data('ui-resizable-alsoresize-reverse'), style = {},
        css = c && c.length ? c : el.parents(ui.originalElement[0]).length ? ['width', 'height'] : ['width', 'height', 'top', 'left'];

        $.each(css, function(i, prop) {
          var sum = (start[prop]||0) - (delta[prop]||0); // subtracting instead of adding
          if (sum && sum >= 0) {
            style[prop] = sum || null;
          }
        });

        el.css(style);
      });
    };

    if (typeof(o.alsoResizeReverse) === 'object' && !o.alsoResizeReverse.nodeType) {
      $.each(o.alsoResizeReverse, function(exp, c) { _alsoResizeReverse(exp, c); });
    }else{
      _alsoResizeReverse(o.alsoResizeReverse);
    }
  },

  stop: function(event, ui){
    $(this).removeData("resizable-alsoresize-reverse");
  }
});

function dropInsideContainer(container,dropped){
	dropped.detach().css({top: 0,left: 0}).appendTo(container);
	var resizer = container.find('.resizer');
	if(resizer.is('.ui-resizable'))resizer.hide();//resizable('destroy');
	dropped.height('100%').width('100%').css({'display':'block'}).find('.my-container').height('calc(100% - 48px)').css({'border':'none'}).children('div[id="frame_box"],div[id="history_box"]').css({"width": "100%","height": "100%"}).children('ul[id="frame_list"],ol[id="history_list"]').css("height", "0px");
	
}

function convertSpritesheet(s){
	var c = document.createElement('canvas');
	c.width = project.width;
	c.height = project.height;
	var ctx = c.getContext('2d');
	
	ctx.drawImage(project.canvaslayer[project.currentframe],0,0);
	
	reset_project( 1, Math.floor(project.width/s.columns), Math.floor(project.height/s.rows) );
	
	//project.contextlayer[project.currentframe].drawImage(c,0,0,project.width,project.height,0,0,project.width,project.height);
	var count = 0;
	for(var i=0; i<(s.columns*s.rows); i++){
		var x = (s.direction=='leftright'? count%s.columns : Math.floor(count/s.rows) )*project.width;
		var y = (s.direction=='leftright'? Math.floor(count/s.columns) : count%s.rows )*project.height;
		if(x<c.width && y<c.height){
			if(count>0){
				addFrame(project.currentframe);
				project.currentframe++;
			}
			$("#frame_null").siblings(':first').attr('data-interval',s.interval).find('span[id*="interval"]').html(s.interval*0.001);
			project.contextlayer[project.currentframe].drawImage(c,x,y,project.width,project.height,0,0,project.width,project.height);
		}
		count++;
		
	}
}

function approveContinue(){
	//helps keep peers in sync
	if(	myHistory[0].rotateWorkerRunning==false && 
		myHistory[0].rotation.state!=3 &&
		project.wait==false)
		return true;
	else 
		return false;
}

function openDisabled(title){
	$("#popup_title").html(title);
	$("#popup_content").html('<div id="file_spritesheet_dialog">\
			This action is disabled when connected to other artists.<br>\
			Disconnect from other artists before performing this action.\
		</div>');
	$("#popup_container").show();
	$("#popup_title").show();
	$("#popup_submit").unbind( "click" );
	$("#popup_submit").click(function(){
		//no action
		$("#popup_container").hide();	
		$("#popup_title").hide();				
	});
	$("#popup_cancel").unbind( "click" );
	$("#popup_cancel").click(function(){
		$("#popup_container").hide();	
		$("#popup_title").hide();				
	});
}
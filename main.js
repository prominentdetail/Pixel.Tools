// target frames per second
var FPS = 60;
var SECONDSBETWEENFRAMES = 1 / FPS;
var weblocation = '';


var canvas = null;
var context = null;

var minicanvas = null;
var minicontext = null;

var canvaslayer = null;
var contextlayer = null;

var pcanvas = null;
var pcontext = null;
var palettecanvas = null;
var palettecontext = null;

var project= new projectdata(1,260,180);
function projectdata(f,w,h){
	this.wait = false;	//used to make user wait until all other connected users are synced up.
	this.waiting = 0;	//the number of users left to be synced up
	this.lock = false;	//used to ensure accurate canvas is kept when new user is connecting to everyone
	this.invite = [];	//holds the peerlist sent by the invite, we'll check this list to see when to finish connection stuff

	this.undos = 25;	//limit for historylist states
	this.frames = f;
	this.width = w, this.height = h;

	this.clip = {x:0,y:0,w:0,h:0};

	this.currentframe = 0;

	this.canvaslayer = [];
	this.contextlayer = [f];
	this.visible = [f];		//whether layer is visible or not
	this.opacity = new Array(f);		//level of opacity
	this.showall = true;	//if should show all layers if they're visible, or to only show selected layer (showing only current layer useful for animation as hidden layers will not be played)

	//this.grid = {show:false,x:16,y:16};
	this.grid = (typeof(Storage) !== "undefined" && checkJSON('grid')!=null ? JSON.parse(localStorage.grid) : {show:false,x:16,y:16} );

	this.console = {scrolltop:0,scrollheight:0};

	this.recording = new recordingdata();
	this.playback = new playbackdata();
	this.recording.session[0].width = w;
	this.recording.session[0].height = h;
	this.playback.crop.w = w;
	this.playback.crop.h = h;

	this.init = function(){
		for(var i=0; i<this.frames; i++){
			this.canvaslayer.push( document.createElement('canvas') );
			this.canvaslayer[i].width = this.width;
			this.canvaslayer[i].height = this.height;
			this.contextlayer[i] = this.canvaslayer[i].getContext('2d');
			this.contextlayer[i] = reload_canvas( this.canvaslayer[i], this.contextlayer[i] );

			this.visible[i] = true;
			this.opacity[i] = 1;

			this.recording.session[0].canvasdata.push( this.canvaslayer[i].toDataURL() );
			this.recording.session[0].frameinterval.push( 300 );
			this.recording.session[0].framelinked.push( false );
			this.recording.session[0].framevisible.push( true );
			this.recording.session[0].frameopacity.push( 100 );

			//add new element to the frame list
			/*var l = $('#frame_list');
			l.find('li:first').clone(true).appendTo(l);
			l.find('li:last').show()
			.text(i)
			.attr('id',"frame_"+i )
			.attr('value',i )
			.siblings().removeClass('ui-state-active');
			l.find('li:last').toggleClass('ui-state-active');*/
		}
		if(this.grid.show==true){
		$( "#grid").attr('checked',true).next('label').addClass('ui-state-active').attr('aria-pressed',true);
		$( "#grid").button('refresh');
		}
		$( "#canvas_bg_color").css('background',tool.bg);
	}

	this.thumbnails = [this.frames];
	this.thumbnailscontext = [this.frames];
	this.setupFramelist = function(){
		$('#frame_list li:not(:first)').remove();//.find('li:not(first-child)').remove();
		//	var $noRemove = $('#frame_list').find('li:first');
		//$('#frame_list').html($noRemove);
		for(var i=0; i<this.frames; i++){
			//add new element to the frame list
			var l = $('#frame_list');
			l.find('li:first').clone(true).appendTo(l);
			var frame = l.find('li:last');
			frame.show().css({'padding-left':'16px'})
			.append('<span style="position:absolute; top:0px; right:0px;">'+i+'</span>')
			.append('<img src="img/eye-open.png" class="frame_visible" title="visible" style="position:absolute; top:0px; left:0px; border:0px;" onclick="this.src=(this.src.indexOf(\'open\')!=-1?\'img/eye-shut.png\':\'img/eye-open.png\'); this.title=(this.src.indexOf(\'open\')!=-1?\'visible\':\'hidden\'); project.visible[$(this).parent().attr(\'value\')]=(this.title.indexOf(\'visible\')!=-1?true:false); send_toggle_visible($(this).parent().attr(\'value\'),(this.title.indexOf(\'visible\')!=-1?true:false));">')
			.append('<div class="frame_linker" style="position:absolute; top:-10px; left:28px; width:16px; height:16px; background: url(\'img/icon-unlinked.png\');" onclick="$(this).css(\'background-image\',\'url(icon-\'+($(this).attr(\'style\').indexOf(\'unlinked\')===-1 ? \'img/un\' : \'img/\' )+\'linked.png)\'); send_toggle_linked($(this).parent().attr(\'value\'),($(this).attr(\'style\').indexOf(\'unlinked\')===-1 ? true : false ) ); return false;"></div>');
			this.thumbnails[i] = document.createElement("canvas");
			this.thumbnails[i].width=frame.width();
			this.thumbnails[i].height=frame.height();
			this.thumbnailscontext[i] = this.thumbnails[i].getContext('2d');
			frame.append(this.thumbnails[i]);
			frame.attr('id',"frame_"+i )
			.attr('value',i )
			.siblings().removeClass('ui-state-active');
			l.find('li[id=frame_0]').toggleClass('ui-state-active');

			frame.append('<span id="interval_'+i+'" class="frame_interval" value="'+i+'" style="position:absolute; bottom:0px; right:0px; white-space: nowrap; font-size:9px;">0.3</span>');
				var interval = $("#interval_"+i);
				interval.click( function(){ $('#interval_menu').show().position({
					my: 'left top',
					at: 'left bottom',
					of: this
					});
					$( document ).one( 'click', function() {
					 $('#interval_menu').hide();
					});
					document.getElementById("interval_menu").dataset.frame = $(this).attr('value');
					return false;
				});
			frame.insertAfter($('#frame_list').find('li:first'));
			frame = document.getElementById("frame_"+i);
			frame.dataset.interval = 300;

			$("#frame_"+i ).find('img').attr('src', (project.visible[i]==true? 'img/eye-open.png' : 'img/eye-shut.png') ).attr('title', (project.visible[i]==true? 'Visible' : 'Hidden') );
		}

		//toggleFrameOrientation();
	}

	this.init();
}

var myBrush;
var brushlayers = [];	//this will hold a list of objects that contain the peer id and a canvas they'll draw to for doing brush operations(so it doesn't conflict with the main user's brushlayer)
function brushlayerdata(id,frame){
	this.id = id;
	this.frame = frame;
	this.canvas = document.createElement('canvas');
	this.canvas.width=project.width;
	this.canvas.height=project.height;
	this.context = this.canvas.getContext('2d');
	this.previewcanvas = document.createElement('canvas');
	this.previewcanvas.width=project.width;
	this.previewcanvas.height=project.height;
	this.previewcontext = this.previewcanvas.getContext('2d');

}

var pencilsize = new Image();
pencilsize.src = 'img/pencilsize.png';

window.onload = init;

function reset_project(f,w,h){
	project.playback.stop();
	project = new projectdata(f,w,h);

	updatecanvas.width=project.width;
	updatecanvas.height=project.height;
	updatecontext = updatecanvas.getContext('2d');

	context = reload_canvas(canvas, context);
	palettecontext = reload_canvas(palettecanvas, palettecontext);
	toolcontext = reload_canvas(toolcanvas, toolcontext);

	project.setupFramelist();
	tool.offset = {x:(((canvas.width/tool.zoom)-w)*0.5)*tool.zoom,y:(((canvas.height/tool.zoom)-h)*0.5)*tool.zoom};

	temp2canvas = document.createElement("canvas");
	temp2canvas.width = project.width;
	temp2canvas.height = project.height;
	temp2context = temp2canvas.getContext('2d');
	temp2context = reload_canvas(temp2canvas, temp2context);

	//commitHistory(myHistory[0]);
	clearHistory(myHistory[0].id);
	historylist = [];
	historylist.push(new historydata(0,0));
	myHistory= $.grep(historylist, function(e){ return e.id == 0; });
	brushlayers = [];
	brushlayers.push(new brushlayerdata(0,0));
	myBrush= $.grep(brushlayers, function(e){ return e.id == 0; });

	animation = new animationdata();
}

var tempcanvas =null;	//used for resizing
var tempcontext =null;
var temp2canvas =null;	//used for historylist drawing
var temp2context =null;

function init()
{
	wacom = document.getElementById('wtPlugin');
	if(typeof wacom == 'undefined' || typeof wacom.penAPI  == 'undefined')$("#wacom_detect").show();
	$("#pencontrol_size, #pencontrol_opacity, #pencontrol_hardness, #pencontrol_levels").css('font-size','8px');
	$("#preset1").click();
	$("#connect_room").val(Math.floor(Math.random()*15));

	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');

	minicanvas = document.getElementById('minicanvas');
	minicontext = minicanvas.getContext('2d');

	//canvaslayer = document.createElement('canvas');		//this will be what we draw on. This canvaslayer will be drawn to the canvas
	//canvaslayer.width=128;
	//canvaslayer.height=128;
	//contextlayer = canvaslayer.getContext('2d');

	pcanvas = document.getElementById('palettecanvas');	//for use with palettecanvas
	//pcanvas.width=palettecanvas.width;
	//pcanvas.height=palettecanvas.height;
	pcontext = pcanvas.getContext('2d');

	palettecanvas = document.createElement('canvas');
	palettecanvas.width=pcanvas.width;
	palettecanvas.height=pcanvas.height;
	palettecontext = palettecanvas.getContext('2d');

	toolcanvas = document.getElementById('toolcanvas');		//this will show how the properties customize the brush
	toolcontext = toolcanvas.getContext('2d');

	/*brushcanvas = document.createElement('canvas');		//This will draw/calculate brush strokes/lines so that the lines don't clump up if using opacity.
	brushcanvas.width=canvaslayer.width;
	brushcanvas.height=canvaslayer.height;
	brushcontext = brushcanvas.getContext('2d');
	brushpreviewcanvas = document.createElement('canvas');		//This will hold the finished brush effect. when a pixel changes in the brushcanvas, it'll draw the calculated color onto this layer.
	brushpreviewcanvas.width=canvaslayer.width;
	brushpreviewcanvas.height=canvaslayer.height;
	brushpreviewcontext = brushpreviewcanvas.getContext('2d');*/

	updatecanvas = document.createElement('canvas');		//this will be used for updating historylist of peers
	updatecanvas.width=project.width;
	updatecanvas.height=project.height;
	updatecontext = updatecanvas.getContext('2d');


	//canvas.addEventListener("mousemove",mouse_move() );

	canvas_events();
	palettecanvas_events();
	minicanvas_events();

	context = reload_canvas(canvas, context);
	minicontext = reload_canvas(minicanvas, minicontext);
	//contextlayer = reload_canvas(canvaslayer, contextlayer);
	palettecontext = reload_canvas(palettecanvas, palettecontext);
	toolcontext = reload_canvas(toolcanvas, toolcontext);

	project.setupFramelist();
	historylist.push(new historydata(0,0));
	myHistory= $.grep(historylist, function(e){ return e.id == 0; });
	brushlayers.push(new brushlayerdata(0,0));
	myBrush= $.grep(brushlayers, function(e){ return e.id == 0; });

	$("#zoom_text").text((tool.zoom*100)+"%");
	$("#secondary_zoom_text").text((tool.zoom*100)+"%");
	toggleFrameOrientation();
	setAppSize();

	mouse.currentColor = 1;
	if(typeof(Storage) !== "undefined" && typeof(localStorage.secondaryColor) !== "undefined" )eyedropColor(JSON.parse(localStorage.secondaryColor));
	else eyedropColor({r:255,g:255,b:255});
	mouse.currentColor = 0;
	if(typeof(Storage) !== "undefined" && typeof(localStorage.primaryColor) !== "undefined" )eyedropColor(JSON.parse(localStorage.primaryColor));
	else eyedropColor({r:0,g:0,b:0});

	tempcanvas = document.createElement("canvas");
	tempcanvas.width = myHistory[0].resizecanvas.width;
	tempcanvas.height = myHistory[0].resizecanvas.height;
	tempcontext = tempcanvas.getContext('2d');
	temp2canvas = document.createElement("canvas");
	temp2canvas.width = project.width;
	temp2canvas.height = project.height;
	temp2context = temp2canvas.getContext('2d');
	temp2context = reload_canvas(temp2canvas, temp2context);

	//$("#app_container").hide();

	tool.offset = {x:(((canvas.width/tool.zoom)-project.width)*0.5)*tool.zoom,y:(((canvas.height/tool.zoom)-project.height)*0.5)*tool.zoom};

	setInterval(draw, SECONDSBETWEENFRAMES * 1000);
}

function setAppSize(){
	var loadwidth;
	if( $( "#chat_toggle span:first" ).hasClass('ui-icon-carat-1-n') ){
		$('#app_container').css('width','100%');
		//$('#lowerleft_anchor').css('left','260px');
		$('#canvas_container').css('left','56px');
		//$('#toolbar').css({'left':'0px','right':''});
		$("#console").css('height','26px');
		loadwidth = parseInt(window.getComputedStyle(document.getElementById('app_container')).getPropertyValue("width"))-192;
	}else{
		$('#app_container').css('width','calc(100% - 256px)');
		//$('#lowerleft_anchor').css('left','0px');
		$('#canvas_container').css('left','60px');
		//$('#toolbar').css({'right':'0px','left':''});
		$("#console").css('height','100%');
		loadwidth = parseInt(window.getComputedStyle(document.getElementById('app_container')).getPropertyValue("width"))-195;
	}

	var loadheight = parseInt(window.getComputedStyle(document.getElementById('app_container')).getPropertyValue("height"))-170;
	$('#canvas_container').css('width',loadwidth);
	$('#canvas_container').css('height',loadheight);
	$('#canvas').parent().width(loadwidth).height(loadheight);
	$('#canvas').width(loadwidth).height(loadheight);
	$( "#canvas_container").width('').height('');
	canvas.width = loadwidth;
	canvas.height = loadheight;
	context = reload_canvas(canvas,context);
	$( "#palette_bounds" ).width( $( "#canvas" ).width() - $( "#colorpicker_container" ).width() );
	$( "#palette_bounds" ).height( $( "#colorpicker_container" ).height() );
	var miniw = (typeof(Storage) !== "undefined" && typeof(localStorage.minicanvas_width) !== "undefined" ? localStorage.minicanvas_width : $('#minicanvas').attr('width') );
	var minih = (typeof(Storage) !== "undefined" && typeof(localStorage.minicanvas_height) !== "undefined" ? localStorage.minicanvas_height : $('#minicanvas').attr('height') );
	minicanvas.width = miniw;
	minicanvas.height = minih;
	minicontext = reload_canvas(minicanvas,minicontext);
	$('#minicanvas').width(miniw).height(minih);
	$('#minicanvas').parent().width(miniw).height(minih);
	tool.offset = {x:(((canvas.width/tool.zoom)-project.width)*0.5)*tool.zoom,y:(((canvas.height/tool.zoom)-project.height)*0.5)*tool.zoom};
	$( "#window_slider" ).outerHeight( $("#window_slider").parent().parent().height()*0.25 );
	$( "#window_slider2" ).outerHeight( $("#window_slider2").parent().parent().height()*0.75 );
	$( "#canvas_bg_color").css('background',tool.bg);
	$( "#minicanvas_bg_color").css('background',tool.bg);
	dropInsideContainer($("#window_slider"),$("#history_container"));
	dropInsideContainer($("#window_slider2"),$("#frame_container"));
	if(typeof(Storage) !== "undefined" && typeof(localStorage.scan_palette_dropdown) !== "undefined" ) $('#scan_palette_dropdown').prop('selectedIndex',localStorage.scan_palette_dropdown);


}

function draw(){
	minicontext.fillStyle = 'rgb(20,20,20)';
	minicontext.fillRect(0,0,minicanvas.width,minicanvas.height);
	minicontext.clearRect(tool.secondary_offset.x, tool.secondary_offset.y, (tool.secondary_view!=4?project.width*tool.secondary_zoom:tile.dim.w*project.grid.x*tool.secondary_zoom), (tool.secondary_view!=4?project.height*tool.secondary_zoom:tile.dim.h*project.grid.y*tool.secondary_zoom));

	context.fillStyle = 'rgb(20,20,20)';
	context.fillRect(0,0,canvas.width,canvas.height);
	context.clearRect(tool.offset.x, tool.offset.y, project.width*tool.zoom, project.height*tool.zoom);

	pcontext.clearRect(0,0,pcanvas.width,pcanvas.height);
	//context.save();
	//context.rect(0,0,50,50);
	//context.clip();
	//draw stuff that needs clipping
	//context.restore();
	if(mouse.pos.x!=mouse.lastpos.x || mouse.pos.y!=mouse.lastpos.y){


		//if left button is down and using pencil tool, draw pixels from old position to current position, and also send this instruction to peers.
		if(mouse.left){
			if(approveContinue() && key.spacebar==false && tool.preventdraw==false && project.lock==false && animation.state==false){
				var finalx = mouse.finalpos.x; //Math.floor((mouse.pos.x - tool.offset.x)/tool.zoom);
				var finaly = mouse.finalpos.y; //Math.floor((mouse.pos.y - tool.offset.y)/tool.zoom);
				var lastfinalx = mouse.lastfinalpos.x; //Math.floor((mouse.lastpos.x - tool.offset.x)/tool.zoom);
				var lastfinaly = mouse.lastfinalpos.y; //Math.floor((mouse.lastpos.y - tool.offset.y)/tool.zoom);
				var t = {size:tool.size,opacity:tool.opacity,hardness:tool.hardness,levels:tool.levels,pressure:tool.pressure,tilt:tool.tilt,pen:tool.pen,dither:tool.dither};
				if(mouse.canvas==palettecanvas){ finalx=mouse.pos.x; finaly=mouse.pos.y; lastfinalx=mouse.lastpos.x; lastfinaly=mouse.lastpos.y;}


				if( $('#canvas').css('cursor')=='crosshair'){

					if(key.shift==true && mouse.direction==0){
						if(Math.abs(mouse.finalpos.x - mouse.lastfinalpos.x) > Math.abs(mouse.finalpos.y - mouse.lastfinalpos.y) ){
							mouse.direction=1;
							mouse.finalpos.y=mouse.lastfinalpos.y;
							finaly=mouse.lastfinalpos.y;
							lastfinaly=mouse.lastfinalpos.y;
						}else if(Math.abs(mouse.finalpos.x - mouse.lastfinalpos.x) < Math.abs(mouse.finalpos.y - mouse.lastfinalpos.y) ){
							mouse.direction=2;
							mouse.finalpos.x=mouse.lastfinalpos.x;
							finalx=mouse.lastfinalpos.x;
							lastfinalx=mouse.lastfinalpos.x;
						}
					}else if(key.shift==true && mouse.direction==1){
						mouse.finalpos.y=mouse.lastfinalpos.y;
						finaly=mouse.lastfinalpos.y;
						lastfinaly=mouse.lastfinalpos.y;
					}else if(key.shift==true && mouse.direction==2){
						mouse.finalpos.x=mouse.lastfinalpos.x;
						finalx=mouse.lastfinalpos.x;
						lastfinalx=mouse.lastfinalpos.x;
					}else if(key.shift==false)mouse.direction=0;

					//used in relation to holding shift, draw straight line from last position
					if(mouse.tool=="eraser" || mouse.tool=="magiceraser" || mouse.tool=="pencil" || mouse.tool=="brush"){
						mouse.lastclick.x = mouse.finalpos.x;
						mouse.lastclick.y = mouse.finalpos.y;
					}

					if(mouse.tool=="eraser"){
						if(mouse.canvas==palettecanvas){
							if(tool.lockcolordex==false)erase_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
						}else if(mouse.canvas==canvas) erase_line(project.contextlayer[project.currentframe],lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,myHistory[0].id);
						if(mouse.context==context)send_eraser_line(lastfinalx,lastfinaly,finalx,finaly,mouse.color,t);
					}else if(mouse.tool=="magiceraser" && tool.brushing==true){
						var cGroup = (currentColorGroup==0?colorGroup:colorGroup2);
						var cGbase = (currentColorGroup==0?mouse.basergba:mouse.basergba2);
						var cGbaseup = (currentColorGroup==0?mouse.baseuprgba:mouse.baseuprgba2);
						if(mouse.canvas==palettecanvas){
							if(tool.lockcolordex==false)erase_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
						}else if(mouse.canvas==canvas){
							magiceraser_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t, cGbase, cGbaseup, myHistory[0].id);
							send_magiceraser_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t,cGbase,cGbaseup);
						}
					}else if(mouse.tool=="pencil"){
						var mouseColor = (mouse.currentColor==0?mouse.color:mouse.color2);
						if(mouse.canvas==palettecanvas){
							if(tool.lockcolordex==false)pixel_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouseColor,t,"palette");
						}else if(mouse.canvas==canvas) pixel_line(project.contextlayer[project.currentframe],lastfinalx,lastfinaly,finalx,finaly,mouseColor,t,myHistory[0].id);
						if(mouse.context==context)send_pixel_line(lastfinalx,lastfinaly,finalx,finaly,mouseColor,t);
					}else if(mouse.tool=="brush" && tool.brushing==true){
						var cGroup = (currentColorGroup==0?colorGroup:colorGroup2);
						var cGbase = (currentColorGroup==0?mouse.basergba:mouse.basergba2);
						var cGbaseup = (currentColorGroup==0?mouse.baseuprgba:mouse.baseuprgba2);
						if(mouse.canvas==palettecanvas){
							if(tool.lockcolordex==false)pixel_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
						}else if(mouse.canvas==canvas){
							brush_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t, cGbase, cGbaseup, myHistory[0].id);
							//var groups = JSON.stringify(colorGroup);
							send_brush_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t,cGbase,cGbaseup);
						}
					}else if(mouse.tool=='tile'){
						var w = (mouse.canvas==minicanvas ? tile.dim.w-1 : Math.floor(project.width/project.grid.x) );
						var h = (mouse.canvas==minicanvas ? tile.dim.h-1 : Math.floor(project.height/project.grid.y) );
						tile.x=Math.min(Math.max(Math.floor(finalx/project.grid.x),0),w);
						tile.y=Math.min(Math.max(Math.floor(finaly/project.grid.y),0),h);
						if(mouse.canvas==minicanvas)tile.map[tile.layer][tile.x][tile.y] = {x:tile.set.x, y:tile.set.y};
					}else if(mouse.tool=='erasetile'){
						var w = (mouse.canvas==minicanvas ? tile.dim.w-1 : Math.floor(project.width/project.grid.x) );
						var h = (mouse.canvas==minicanvas ? tile.dim.h-1 : Math.floor(project.height/project.grid.y) );
						tile.x=Math.min(Math.max(Math.floor(finalx/project.grid.x),0),w);
						tile.y=Math.min(Math.max(Math.floor(finaly/project.grid.y),0),h);
						if(mouse.canvas==minicanvas)tile.map[tile.layer][tile.x][tile.y] = {x:-1, y:-1};
					}

				}

				if(mouse.tool=="hand"){
					if(mouse.canvas == canvas){
						tool.offset.x +=  mouse.pos.x - mouse.lastpos.x;
						tool.offset.y +=  mouse.pos.y - mouse.lastpos.y;
						$("#canvas_bg").css('background-position',(tool.offset.x%16)+'px '+(tool.offset.y%16)+'px');
					}else if(mouse.canvas == minicanvas){
						tool.secondary_offset.x +=  mouse.pos.x - mouse.lastpos.x;
						tool.secondary_offset.y +=  mouse.pos.y - mouse.lastpos.y;
						$("#minicanvas_bg").css('background-position',(tool.secondary_offset.x%16)+'px '+(tool.secondary_offset.y%16)+'px');
					}
				}

				if(mouse.tool=="lasso" || mouse.tool=="marquee"){
					if(myHistory[0].selectionstate=="" && myHistory[0].selectionsetclip==false){
						if(mouse.tool=="lasso"){
							myHistory[0].selectionpoints.push( {x:finalx,y:finaly} );
							if(finalx < myHistory[0].selectionclip.x)myHistory[0].selectionclip.x = finalx;
							if(finaly < myHistory[0].selectionclip.y)myHistory[0].selectionclip.y = finaly;
							if(finalx > myHistory[0].selectionclip.x2)myHistory[0].selectionclip.x2 = finalx;
							if(finaly > myHistory[0].selectionclip.y2)myHistory[0].selectionclip.y2 = finaly;
						}else{
							if(myHistory[0].selectionpoints.length==4){
								myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-3] = {x:finalx,y:finaly};
								myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-4].x = finalx;
								myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-2].y = finaly;
								if(key.ctrl){	//snap to grid
									myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-3] = {x:Math.round(finalx/project.grid.x)*project.grid.x,y:Math.round(finaly/project.grid.y)*project.grid.y};
									myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-4] = {x:Math.round(myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-4].x/project.grid.x)*project.grid.x,y:Math.round(myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-4].y/project.grid.y)*project.grid.y};
									myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-2] = {x:Math.round(myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-2].x/project.grid.x)*project.grid.x,y:Math.round(myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-2].y/project.grid.y)*project.grid.y};
									myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-1] = {x:Math.round(myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-1].x/project.grid.x)*project.grid.x,y:Math.round(myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-1].y/project.grid.y)*project.grid.y};
									myHistory[0].selectionclip.x = myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-1].x;
									myHistory[0].selectionclip.y = myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-1].y;
									myHistory[0].selectionclip.x2 = myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-3].x;
									myHistory[0].selectionclip.y2 = myHistory[0].selectionpoints[myHistory[0].selectionpoints.length-3].y;
								}
							}
						}
					}else if(myHistory[0].selectionstate=="move"){
						myHistory[0].selectionoffset.x += finalx - lastfinalx;
						myHistory[0].selectionoffset.y += finaly - lastfinaly;
						myHistory[0].selectionclip.x += finalx - lastfinalx;
						myHistory[0].selectionclip.y += finaly - lastfinaly;
						myHistory[0].selectionclip.x2 += finalx - lastfinalx;
						myHistory[0].selectionclip.y2 += finaly - lastfinaly;
					}else if(myHistory[0].selectionstate=="resize" && myHistory[0].selectionhandle.state == 2){
						if(	myHistory[0].resize.oldx2 != myHistory[0].selectionclip.x2 ||
							myHistory[0].resize.oldy2 != myHistory[0].selectionclip.y2){
							myHistory[0].resize.oldx = myHistory[0].selectionclip.x;
							myHistory[0].resize.oldy = myHistory[0].selectionclip.y;
							myHistory[0].resize.oldx2 = myHistory[0].selectionclip.x2;
							myHistory[0].resize.oldy2 = myHistory[0].selectionclip.y2;
							myHistory[0].resize.oldoffsetx = myHistory[0].selectionoffset.x;
							myHistory[0].resize.oldoffsety = myHistory[0].selectionoffset.y;
						}
						if(!key.alt && myHistory[0].resize.alt && myHistory[0].rotation.degree!=0){
							myHistory[0].resize.alt=false;
							myHistory[0].selectionoffset.x = myHistory[0].resize.oldoffsetx;
							myHistory[0].selectionoffset.y = myHistory[0].resize.oldoffsety;
						}

						if(myHistory[0].rotation.degree!=0){
							if(myHistory[0].selectionhandle.x!=0)myHistory[0].resize.x += (myHistory[0].rotation.w-myHistory[0].rotation.lastw)*(myHistory[0].selectionhandle.y==-1 ? -1 : 1);
							if(myHistory[0].selectionhandle.y!=0)myHistory[0].resize.y += (myHistory[0].rotation.h-myHistory[0].rotation.lasth)*(myHistory[0].selectionhandle.y==-1 ? -1 : 1);
							myHistory[0].resize.x =0;
							myHistory[0].resize.y =0;
							//if(key.alt){
								if(key.alt)myHistory[0].resize.alt=true;
								//myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x - Math.floor(myHistory[0].resize.x*0.5);
								//myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y - Math.floor(myHistory[0].resize.y*0.5);
							//}else{
								var tempw = myHistory[0].selectionclip.ow;
								var temph = myHistory[0].selectionclip.oh;
								if(myHistory[0].selectionhandle.x==-1 && myHistory[0].selectionhandle.y==-1){
									//myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x - myHistory[0].resize.x;
									myHistory[0].rotation.w = calcDistance(myHistory[0].rotation.originalcorners[2],myHistory[0].rotation.originalcorners[3],myHistory[0].rotation.originalcorners[4],myHistory[0].rotation.originalcorners[5]) - myHistory[0].rotation.w;
									myHistory[0].rotation.h = calcDistance(myHistory[0].rotation.originalcorners[0],myHistory[0].rotation.originalcorners[1],myHistory[0].rotation.originalcorners[4],myHistory[0].rotation.originalcorners[5]) - myHistory[0].rotation.h;
									if(key.alt){
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.cos(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.sin(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
									}else{
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w))+(Math.cos(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w))+(Math.sin(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)));
									}
									//console.log(myHistory[0].selectionclip.ow+","+myHistory[0].selectionclip.oh);
								}else if(myHistory[0].selectionhandle.x==-1){
									//myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x - myHistory[0].resize.x;
									myHistory[0].rotation.w = calcDistance(myHistory[0].rotation.originalcorners[2],myHistory[0].rotation.originalcorners[3],myHistory[0].rotation.originalcorners[4],myHistory[0].rotation.originalcorners[5]) - myHistory[0].rotation.w;
									//myHistory[0].rotation.h = calcDistance(myHistory[0].rotation.originalcorners[0],myHistory[0].rotation.originalcorners[1],myHistory[0].rotation.originalcorners[4],myHistory[0].rotation.originalcorners[5]) - myHistory[0].rotation.h;
									if(key.alt){
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.cos(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.sin(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
									}else{
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)));
									}
									//myHistory[0].selectionoffset.x = myHistory[0].rotation.sx - Math.floor(Math.cos(myHistory[0].rotation.ex)*myHistory[0].rotation.x);
									//myHistory[0].selectionoffset.y = myHistory[0].rotation.sy - Math.floor(Math.sin(myHistory[0].rotation.ey)*myHistory[0].rotation.y);
								}else if(myHistory[0].selectionhandle.y==-1){
									//myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y - myHistory[0].resize.y;
									//myHistory[0].rotation.w = calcDistance(myHistory[0].rotation.originalcorners[2],myHistory[0].rotation.originalcorners[3],myHistory[0].rotation.originalcorners[4],myHistory[0].rotation.originalcorners[5]) - myHistory[0].rotation.w;
									myHistory[0].rotation.h = calcDistance(myHistory[0].rotation.originalcorners[0],myHistory[0].rotation.originalcorners[1],myHistory[0].rotation.originalcorners[4],myHistory[0].rotation.originalcorners[5]) - myHistory[0].rotation.h;
									if(key.alt){
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.cos(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.sin(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
									}else{
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)));
									}
									//myHistory[0].selectionoffset.x = myHistory[0].rotation.sx - Math.floor(Math.cos(myHistory[0].rotation.rx)*myHistory[0].rotation.x);
									//myHistory[0].selectionoffset.y = myHistory[0].rotation.sy - Math.floor(Math.sin(myHistory[0].rotation.ry)*myHistory[0].rotation.y);
								}else{
									if(key.alt){
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x + Math.floor((Math.cos(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.cos(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y + Math.floor((Math.sin(myHistory[0].rotation.radian)*(tempw-myHistory[0].rotation.w)*(myHistory[0].selectionhandle.x!=0?0.5:0))+(Math.sin(myHistory[0].rotation.radian+toRadians(90))*(temph-myHistory[0].rotation.h)*(myHistory[0].selectionhandle.y!=0?0.5:0)));
									}else{
										myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x;
										myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y;
									}
								}
							//}

							if(myHistory[0].rotation.w < 0)myHistory[0].rotation.flipv = myHistory[0].rotation.lastflipv*-1;
							else myHistory[0].rotation.flipv = myHistory[0].rotation.lastflipv;
							if(myHistory[0].rotation.h < 0)myHistory[0].rotation.fliph = myHistory[0].rotation.lastfliph*-1;
							else myHistory[0].rotation.fliph = myHistory[0].rotation.lastfliph;

							if(myHistory[0].selectionhandle.x!=0)myHistory[0].selectionclip.w = Math.abs(myHistory[0].rotation.w);//+(myHistory[0].rotation.w<0?myHistory[0].selectionclip.ow:0);
							if(myHistory[0].selectionhandle.y!=0)myHistory[0].selectionclip.h = Math.abs(myHistory[0].rotation.h);//+(myHistory[0].rotation.h<0?myHistory[0].selectionclip.oh:0);
								//console.log(myHistory[0].selectionclip.ow+","+myHistory[0].selectionclip.oh);

							if(key.shift){
								var oldh = myHistory[0].selectionclip.h;
								var ratio = (myHistory[0].selectionclip.oh)/(myHistory[0].selectionclip.ow);
								myHistory[0].selectionclip.h = (ratio * (myHistory[0].selectionclip.w));
								if(myHistory[0].selectionhandle.y==-1){
									oldh-=myHistory[0].selectionclip.h;
									myHistory[0].selectionoffset.x += (myHistory[0].rotation.h < 0?-1:1)*(Math.cos(myHistory[0].rotation.radian+toRadians(90))*(oldh));
									myHistory[0].selectionoffset.y += (myHistory[0].rotation.h < 0?-1:1)*(Math.sin(myHistory[0].rotation.radian+toRadians(90))*(oldh));
								}
							}
							if(key.alt){
								//myHistory[0].rotation.sx = Math.floor( ((myHistory[0].selectionclipcanvas.width)*0.5)-(Math.cos(myHistory[0].rotation.radian)*(myHistory[0].selectionclip.w*0.5)) - (Math.cos(myHistory[0].rotation.radian+toRadians(90))*(myHistory[0].selectionclip.h*0.5)) );
								//myHistory[0].rotation.sy = Math.floor( ((myHistory[0].selectionclipcanvas.height)*0.5)-(Math.sin(myHistory[0].rotation.radian)*(myHistory[0].selectionclip.w*0.5)) - (Math.sin(myHistory[0].rotation.radian+toRadians(90))*(myHistory[0].selectionclip.h*0.5)) );
							}
							myHistory[0].rotation.corners[0] = myHistory[0].rotation.sx + (myHistory[0].rotation.ex*myHistory[0].selectionclip.w);
							myHistory[0].rotation.corners[1] = myHistory[0].rotation.sy + (myHistory[0].rotation.ey*myHistory[0].selectionclip.w);
							myHistory[0].rotation.corners[2] = myHistory[0].rotation.sx + (myHistory[0].rotation.rx*myHistory[0].selectionclip.h);
							myHistory[0].rotation.corners[3] = myHistory[0].rotation.sy + (myHistory[0].rotation.ry*myHistory[0].selectionclip.h);
							myHistory[0].rotation.corners[4] = myHistory[0].rotation.sx + (myHistory[0].rotation.ex*myHistory[0].selectionclip.w)+(myHistory[0].rotation.rx*myHistory[0].selectionclip.h);
							myHistory[0].rotation.corners[5] = myHistory[0].rotation.sy + (myHistory[0].rotation.ey*myHistory[0].selectionclip.w)+(myHistory[0].rotation.ry*myHistory[0].selectionclip.h);

						}else{
							if(myHistory[0].selectionhandle.x!=0)myHistory[0].resize.x += (finalx - lastfinalx)*(myHistory[0].selectionhandle.x==-1 ? -1 : 1);
							if(myHistory[0].selectionhandle.y!=0)myHistory[0].resize.y += (finaly - lastfinaly)*(myHistory[0].selectionhandle.y==-1 ? -1 : 1);

							if(myHistory[0].selectionhandle.x==-1){
								myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x - myHistory[0].resize.x;
								//myHistory[0].resize.x += (finalx - lastfinalx)*(myHistory[0].selectionhandle.x==-1 ? -1 : 1);
							}
							if(myHistory[0].selectionhandle.y==-1){
								myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y - myHistory[0].resize.y;
								//myHistory[0].resize.y += (finaly - lastfinaly)*(myHistory[0].selectionhandle.y==-1 ? -1 : 1);
							}
							if(key.alt){
								myHistory[0].resize.alt=true;
								myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x - Math.floor(myHistory[0].resize.x*0.5);
								myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y - Math.floor(myHistory[0].resize.y*0.5);
							}
							if(!key.alt && myHistory[0].resize.alt){
								myHistory[0].resize.alt=false;
								myHistory[0].selectionoffset.x = myHistory[0].resize.oldoffsetx;
								myHistory[0].selectionoffset.y = myHistory[0].resize.oldoffsety;
							}
						}
						if(key.shift){
							var ratio = (myHistory[0].selectionclipcanvas.height)/(myHistory[0].selectionclipcanvas.width);
							myHistory[0].resize.y = (ratio * (myHistory[0].selectionclipcanvas.width+myHistory[0].resize.x))-myHistory[0].selectionclipcanvas.height;
						}
						if(myHistory[0].rotation.degree!=0)rotateClipFast(myHistory[0].id);
					}else if(myHistory[0].selectionstate=="rotate" && myHistory[0].rotation.state == 2){
						var x0 =(finalx*tool.zoom)+tool.offset.x;
						var y0 =(finaly*tool.zoom)+tool.offset.y;
						var angle = calcAngle(myHistory[0].rotation.x,myHistory[0].rotation.y,x0,y0);
						myHistory[0].rotation.degree = angle[0];
						myHistory[0].rotation.radian = angle[1];
						rotateClipFast(myHistory[0].id);
					}
				}else if(mouse.tool=="magicwand"){
					if(myHistory[0].selectionstate=="move"){
						myHistory[0].selectionoffset.x += finalx - lastfinalx;
						myHistory[0].selectionoffset.y += finaly - lastfinaly;
						myHistory[0].selectionclip.x += finalx - lastfinalx;
						myHistory[0].selectionclip.y += finaly - lastfinaly;
						myHistory[0].selectionclip.x2 += finalx - lastfinalx;
						myHistory[0].selectionclip.y2 += finaly - lastfinaly;
					}else if(myHistory[0].selectionstate=="resize" && myHistory[0].selectionhandle.state == 2){
						if(myHistory[0].selectionhandle.x!=0)myHistory[0].resize.x += (finalx - lastfinalx)*(myHistory[0].selectionhandle.x==-1 ? -1 : 1);
						if(myHistory[0].selectionhandle.y!=0)myHistory[0].resize.y += (finaly - lastfinaly)*(myHistory[0].selectionhandle.y==-1 ? -1 : 1);
						if(myHistory[0].selectionhandle.x==-1){
							myHistory[0].selectionoffset.x = myHistory[0].selectionclip.x - myHistory[0].resize.x;
							//myHistory[0].resize.x += (finalx - lastfinalx)*(myHistory[0].selectionhandle.x==-1 ? -1 : 1);
						}
						if(myHistory[0].selectionhandle.y==-1){
							myHistory[0].selectionoffset.y = myHistory[0].selectionclip.y - myHistory[0].resize.y;
							//myHistory[0].resize.y += (finaly - lastfinaly)*(myHistory[0].selectionhandle.y==-1 ? -1 : 1);
						}
						if(key.shift){
							var ratio = (myHistory[0].selectionclipcanvas.height)/(myHistory[0].selectionclipcanvas.width);
							myHistory[0].resize.y = (ratio * (myHistory[0].selectionclipcanvas.width+myHistory[0].resize.x))-myHistory[0].selectionclipcanvas.height;
						}
					}
				}
			}else{
				if(mouse.canvas == canvas){
					tool.offset.x +=  mouse.pos.x - mouse.lastpos.x;
					tool.offset.y +=  mouse.pos.y - mouse.lastpos.y;
					$("#canvas_bg").css('background-position',(tool.offset.x%16)+'px '+(tool.offset.y%16)+'px');
				}else if(mouse.canvas == minicanvas){
					tool.secondary_offset.x +=  mouse.pos.x - mouse.lastpos.x;
					tool.secondary_offset.y +=  mouse.pos.y - mouse.lastpos.y;
					$("#minicanvas_bg").css('background-position',(tool.secondary_offset.x%16)+'px '+(tool.secondary_offset.y%16)+'px');
				}
				/*project.clip.x = (tool.offset.x/tool.zoom >= 0 ? 0 : Math.min(Math.abs(tool.offset.x/tool.zoom),project.width) );
				project.clip.y = (tool.offset.y/tool.zoom >= 0 ? 0 : Math.min(Math.abs(tool.offset.y/tool.zoom),project.height) );
				project.clip.w = (tool.offset.x/tool.zoom >= 0 ? Math.max(canvas.width - tool.offset.x/tool.zoom,0) : Math.max(canvas.width + tool.offset.x/tool.zoom,0) );
				project.clip.h = (tool.offset.y/tool.zoom >= 0 ? Math.max(canvas.height - tool.offset.y/tool.zoom,0) : Math.max(canvas.height + tool.offset.y/tool.zoom,0) );
				*/
			}


		}else if(mouse.middle==true){
			if(mouse.canvas == canvas){
				tool.offset.x +=  mouse.pos.x - mouse.lastpos.x;
				tool.offset.y +=  mouse.pos.y - mouse.lastpos.y;
				$("#canvas_bg").css('background-position',(tool.offset.x%16)+'px '+(tool.offset.y%16)+'px');
			}else if(mouse.canvas == minicanvas){
				tool.secondary_offset.x +=  mouse.pos.x - mouse.lastpos.x;
				tool.secondary_offset.y +=  mouse.pos.y - mouse.lastpos.y;
				$("#minicanvas_bg").css('background-position',(tool.secondary_offset.x%16)+'px '+(tool.secondary_offset.y%16)+'px');
			}
		}

		mouse.lastpos.x = mouse.pos.x;
		mouse.lastpos.y = mouse.pos.y;
		mouse.lastfinalpos.x = mouse.finalpos.x;
		mouse.lastfinalpos.y = mouse.finalpos.y;
		//send_my_position();
	}

	if(animation.state==false){
		//context.drawImage(imageObj, 0,0,imageObj.width*2,imageObj.height*2);
		//contextlayer.fillStyle = "rgba(0,0,0,1)";
		//contextlayer.fillRect( mouse.pos.x, mouse.pos.y, 1, 1 );

		pcontext.drawImage(palettecanvas, 0,0,pcanvas.width,pcanvas.height);

		project.thumbnailscontext.forEach(function(entry){
			entry.clearRect(0,0,project.thumbnails[project.thumbnailscontext.indexOf(entry)].width,project.thumbnails[project.thumbnailscontext.indexOf(entry)].height);
			entry.drawImage(project.canvaslayer[project.thumbnailscontext.indexOf(entry)],0,0,project.width,project.height,0,0,project.thumbnails[project.thumbnailscontext.indexOf(entry)].width,project.thumbnails[project.thumbnailscontext.indexOf(entry)].height);
		});

		//first this is for primary viewport, afterwards, we'll do the secondary viewport.
		var start = project.frames-1 , end = -1;
		if(tool.view==2){	//linked
			var begin = $("#frame_null").siblings().index( $("#frame_null").siblings('[value="'+project.currentframe+'"]') );
			start = begin;
			end = begin;
			var above = $("#frame_null").siblings(':eq('+begin+')');
			var below = $("#frame_null").siblings(':eq('+begin+')');
			do{
				var l = above.find('.frame_linker').css('background-image');
				var link = -1;
				if(l)link = l.indexOf('-linked');
				if(link!=-1){
					if($("#frame_null").siblings().index(above)>0)
						above = above.prev();
					else
						link=-1;
				}
			}while(link!=-1);
			end = $("#frame_null").siblings().index(above)-1;
			do{
				var link =-1;
				if($("#frame_null").siblings().index(below)<project.frames-1){
					var l = below.next().find('.frame_linker').css('background-image');
					if(l)link = l.indexOf('-linked');
					if(link!=-1)
						below = below.next();
				}
			}while(link!=-1);
			start = $("#frame_null").siblings().index(below);
		}else if(tool.view==3){	//sheet
			var sheetcount = 0;
			tool.sheet.list = new Array(project.frames);
			for(var i=project.canvaslayer.length-1; i>-1; i--){
				var theframe = $("#frame_null").siblings(':eq('+i+')');
				var animframe = theframe.attr('value');

				if(animframe==project.currentframe){
					tool.sheet.current = sheetcount;
					tool.sheet.oy = -Math.floor(sheetcount/tool.sheet.x)*project.height;
					tool.sheet.ox = -(sheetcount-(Math.floor(sheetcount/tool.sheet.x)*tool.sheet.x))*project.width;
				}
				if(animframe!=-1)tool.sheet.list[animframe] = sheetcount;

				do{
					if( $("#frame_null").siblings().length==project.frames && $("#frame_null").siblings('[value="'+animframe+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
						animframe = $("#frame_null").siblings('[value="'+animframe+'"]').prev().attr('value');
						if(animframe==project.currentframe){
							tool.sheet.current = sheetcount;
							tool.sheet.oy = -Math.floor(sheetcount/tool.sheet.x)*project.height;
							tool.sheet.ox = -(sheetcount-(Math.floor(sheetcount/tool.sheet.x)*tool.sheet.x))*project.width;
						}
						tool.sheet.list[animframe] = sheetcount;
						i--;
					}else animframe = -1;
				}while(animframe!=-1);

				sheetcount++;	//track the number of spaces in the sheet, with linked frames accounted for
			}
		}

		for(var frame_i=start; frame_i>end; frame_i--){
			var framenum = $("#frame_null").siblings(':eq('+frame_i+')').attr('value');

			if(tool.view==1){//project.showall==false){
				framenum=project.currentframe;
				frame_i = 0;
			}

			if(project.visible[framenum]==true && framenum<project.canvaslayer.length && framenum>-1){
				temp2context.clearRect(0,0,project.width,project.height);

				if(project.visible[framenum]==true)temp2context.drawImage(project.canvaslayer[framenum],0,0);
				//context.drawImage(brushcanvas, 0,0);
				//context.drawImage(myBrush[0].previewcanvas, 0,0);
				//context.drawImage(historylist.canvas, 0,0);
				brushlayers.forEach(function(entry){
					if(entry.frame==project.currentframe)temp2context.drawImage(entry.previewcanvas,0,0);
				});

				historylist.forEach(function(entry){
					//if(entry.frame==project.currentframe)context.drawImage(entry.canvas,project.clip.x,project.clip.y,project.clip.w,project.clip.h,tool.offset.x+(project.clip.x*tool.zoom),tool.offset.y+(project.clip.y*tool.zoom),project.clip.w*tool.zoom,project.clip.h*tool.zoom);

					if(entry.frame==framenum){
						if(entry.draw==false || entry.erase==true)temp2context.globalCompositeOperation = 'destination-out';
						temp2context.drawImage(entry.canvas,0,0);
						if(entry.draw==false || entry.erase==true)temp2context.globalCompositeOperation = 'source-over';
					}
					/*
						updatecontext.clearRect(0,0,updatecanvas.width,updatecanvas.height);
						for(var i=0; i<entry.layers.length; i++){
							updatecontext.drawImage(entry.layers[i].maskcanvas, 0,0);
					}*/

					if(entry.selected!=-1 && entry.selected < entry.layers.length){
						for(var i=entry.layers.length-1; i>entry.selected; i--){
							if(entry.layers[i].frame==framenum){
								/*context.globalCompositeOperation = 'destination-out';
								context.drawImage(entry.layers[i].maskcanvas,project.clip.x,project.clip.y,project.clip.w,project.clip.h,tool.offset.x+(project.clip.x*tool.zoom),tool.offset.y+(project.clip.y*tool.zoom),project.clip.w*tool.zoom,project.clip.h*tool.zoom);
								context.globalCompositeOperation = 'source-over';
								context.drawImage(entry.layers[i].canvas,project.clip.x,project.clip.y,project.clip.w,project.clip.h,tool.offset.x+(project.clip.x*tool.zoom),tool.offset.y+(project.clip.y*tool.zoom),project.clip.w*tool.zoom,project.clip.h*tool.zoom);
								*/

								/*context.globalCompositeOperation = 'destination-out';
								context.drawImage(entry.layers[i].maskcanvas,0,0,project.width,project.height,tool.offset.x,tool.offset.y,project.width*tool.zoom,project.height*tool.zoom);
								context.globalCompositeOperation = 'source-over';
								context.drawImage(entry.layers[i].canvas,0,0,project.width,project.height,tool.offset.x,tool.offset.y,project.width*tool.zoom,project.height*tool.zoom);
								*/
								//apparently we can't drawimage in firefox with negative numbers or sizes bigger than the destination size.. or something, so we cut it to fit
								var clipx = Math.min(project.width, Math.max(0,entry.layers[i].clip.x));
								var clipy = Math.min(project.height, Math.max(0,entry.layers[i].clip.y));
								var clipw = entry.layers[i].clip.w + (entry.layers[i].clip.x-clipx)+1;
								var cliph = entry.layers[i].clip.h + (entry.layers[i].clip.y-clipy)+1;
								if(clipw+clipx > project.width) clipw = clipw - ((clipw+clipx)-project.width);
								if(cliph+clipy > project.height) cliph = cliph - ((cliph+clipy)-project.height);
								//myHistory[0].clip.x2 = Math.max(1,Math.min(project.width, finalx)), var clipw = Math.max(1,Math.min(project.height, finaly));
								//console.log(entry.layers[i].clip.x+","+entry.layers[i].clip.y+","+entry.layers[i].clip.w+","+entry.layers[i].clip.h);
								//console.log(clipx+","+clipy+","+clipw+","+cliph);
								if(cliph>0 && clipw>0){
									temp2context.globalCompositeOperation = 'destination-out';
									temp2context.drawImage(entry.layers[i].maskcanvas,clipx,clipy,clipw,cliph,clipx,clipy,clipw,cliph);
									temp2context.globalCompositeOperation = 'source-over';
									temp2context.drawImage(entry.layers[i].canvas,clipx,clipy,clipw,cliph,clipx,clipy,clipw,cliph);
								}
								/*context.globalCompositeOperation = 'destination-out';
								context.drawImage(entry.layers[i].maskcanvas,entry.layers[i].clip.x,entry.layers[i].clip.y,entry.layers[i].clip.w,entry.layers[i].clip.h,tool.offset.x+(entry.layers[i].clip.x*tool.zoom),tool.offset.y+(entry.layers[i].clip.y*tool.zoom),entry.layers[i].clip.w*tool.zoom,entry.layers[i].clip.h*tool.zoom);
								context.globalCompositeOperation = 'source-over';
								context.drawImage(entry.layers[i].canvas,entry.layers[i].clip.x,entry.layers[i].clip.y,entry.layers[i].clip.w,entry.layers[i].clip.h,tool.offset.x+(entry.layers[i].clip.x*tool.zoom),tool.offset.y+(entry.layers[i].clip.y*tool.zoom),entry.layers[i].clip.w*tool.zoom,entry.layers[i].clip.h*tool.zoom);
							*/
							}
						}
					}


				});

				if( project.playback.state==true && $('#record_button').is(':checked') && project.playback.action % $('#record_keyframe').val()==0 && $('#record_count').attr('data-capture')=='true' ){
					if(project.playback.gif==null){
						project.playback.gif = new GIF({
							workers: 5,
							quality: 1,
							background: $('#record_color').val(),	//'#000',
							transparent: $('#record_transparency').prop('checked') ? $('#record_color').val().replace('#', '0x' ) : null	//'0x000000'
						});
					}else{
						var tempgifcanvas = document.createElement('canvas');
						//tempgifcanvas.width=temp2canvas.width * $('#record_scale').val();
						//tempgifcanvas.height=temp2canvas.height * $('#record_scale').val();
						tempgifcanvas.width=project.playback.crop.w * $('#record_scale').val();
						tempgifcanvas.height=project.playback.crop.h * $('#record_scale').val();
						var tempgifcontext = tempgifcanvas.getContext('2d');
						tempgifcontext = reload_canvas(tempgifcanvas, tempgifcontext);
						tempgifcontext.fillStyle = $('#record_color').val();
						tempgifcontext.fillRect(0,0,tempgifcanvas.width,tempgifcanvas.height);
						//tempgifcontext.drawImage(temp2canvas,0,0,temp2canvas.width,temp2canvas.height,0,0,tempgifcanvas.width,tempgifcanvas.height);
						tempgifcontext.drawImage(temp2canvas,project.playback.crop.x,project.playback.crop.y,project.playback.crop.w,project.playback.crop.h,0,0,tempgifcanvas.width,tempgifcanvas.height);

						project.playback.gif.options.width = tempgifcanvas.width;
						project.playback.gif.options.height = tempgifcanvas.height;
						project.playback.gif.addFrame(tempgifcontext, {copy: true});
						project.playback.gif.frames[project.playback.gif.frames.length-1].delay = $('#record_speed').val();//project.playback.speed;
						//project.playback.gif.addFrame(temp2canvas, {delay: project.playback.speed } );
						$('#record_count').html( parseInt($('#record_count').html())+1 );
						$('#record_count').attr('data-capture','false');
					}
				}else if( project.playback.state==true && $('#record_button').is(':checked') && project.playback.action % $('#record_keyframe').val()!=0 && $('#record_count').attr('data-capture')=='false' ){
					$('#record_count').attr('data-capture','true');
				}

				context.globalAlpha=project.opacity[framenum];
				if(tool.view!=3)context.drawImage(temp2canvas,0,0,project.width,project.height,tool.offset.x,tool.offset.y,project.width*tool.zoom,project.height*tool.zoom);
				else{
					var sheetx = (tool.sheet.list[framenum]%tool.sheet.x);
					var sheety = Math.floor(tool.sheet.list[framenum]/tool.sheet.x);
					//console.log(tool.sheet.ox+','+tool.sheet.oy);
					context.drawImage(temp2canvas,0,0,project.width,project.height,tool.offset.x+(tool.sheet.ox+(sheetx*project.width))*tool.zoom,tool.offset.y+(tool.sheet.oy+(sheety*project.height))*tool.zoom,project.width*tool.zoom,project.height*tool.zoom);

					context.beginPath();
					context.rect(tool.offset.x-1,tool.offset.y-1,(project.width*tool.zoom)+1,(project.height*tool.zoom)+1);
					context.strokeStyle = 'white';
					//context.setLineDash([]);
					context.stroke();
				}
				context.globalAlpha=1;
				//context.drawImage(temp2canvas,0,0,project.width,project.height);

				//var tempcanvas = document.createElement("canvas");
				tempcanvas.width = myHistory[0].resizecanvas.width;
				tempcanvas.height = myHistory[0].resizecanvas.height;
				//var tempcontext = tempcanvas.getContext('2d');


				historylist.forEach(function(entry){
					//context.fillStyle="blue";
					//context.fillRect(tool.offset.x+(entry.selectionclip.x*tool.zoom),tool.offset.y+(entry.selectionclip.y*tool.zoom),(entry.selectionclip.x2-entry.selectionclip.x)*tool.zoom,(entry.selectionclip.y2-entry.selectionclip.y)*tool.zoom);
					//context.fillRect(tool.offset.x+(entry.selectionclip.x*tool.zoom),tool.offset.y+(entry.selectionclip.y*tool.zoom),entry.selectioncanvas.width,entry.selectioncanvas.height);
					if(entry.frame==framenum){

						//snap to grid
						if(key.ctrl && myHistory[0].selectionstate == "move" && myHistory[0].id == entry.id){
							entry.snap.x = 0; entry.snap.y = 0;
							var x = entry.selectionoffset.x - (Math.round(entry.selectionoffset.x / project.grid.x) * project.grid.x);
							var y = entry.selectionoffset.y - (Math.round(entry.selectionoffset.y / project.grid.y) * project.grid.y);
							var x2 = (entry.selectionoffset.x+entry.selectionclipcanvas.width) - (Math.round((entry.selectionoffset.x+entry.selectionclipcanvas.width) / project.grid.x) * project.grid.x);
							var y2 = (entry.selectionoffset.y+entry.selectionclipcanvas.height) - (Math.round((entry.selectionoffset.y+entry.selectionclipcanvas.height) / project.grid.y) * project.grid.y);
							entry.snap.x = -( Math.abs(x) < Math.abs(x2) ? x : x2 );
							entry.snap.y = -( Math.abs(y) < Math.abs(y2) ? y : y2 );
						}


						if(myHistory[0].id != entry.id || entry.rotation.degree==0){
							var scalex = (entry.selectionclipcanvas.width+entry.resize.x)/entry.selectionclipcanvas.width;
							var scaley = (entry.selectionclipcanvas.height+entry.resize.y)/entry.selectionclipcanvas.height;
							context.save();
							context.beginPath();
							context.setLineDash([3,2]);
							entry.trace.forEach(function(entrypoint){
								context.moveTo(tool.offset.x+(((entrypoint.x*scalex)+entry.snap.x+entry.selectionoffset.x)*tool.zoom),tool.offset.y+(((entrypoint.y*scaley)+entry.snap.y+entry.selectionoffset.y)*tool.zoom) );
								context.lineTo(tool.offset.x+(((entrypoint.x*scalex)+entrypoint.w+entry.snap.x+entry.selectionoffset.x)*tool.zoom),tool.offset.y+(((entrypoint.y*scaley)+entrypoint.h+entry.snap.y+entry.selectionoffset.y)*tool.zoom) );

							});
							context.lineWidth = 1;
							context.strokeStyle = 'white';
							context.stroke();
							context.restore();
						}
						//entry.checkercount--;
						//if(entry.checkercount==0){entry.checkercount=100;}
						//context.drawImage((entry.checkercount<50?entry.selectioncanvas:entry.selection2canvas),0,0,entry.selectioncanvas.width,entry.selectioncanvas.height,tool.offset.x+((entry.snap.x+entry.selectionoffset.x-1)*tool.zoom),tool.offset.y+((entry.snap.y+entry.selectionoffset.y-1)*tool.zoom),entry.selectioncanvas.width*tool.zoom,entry.selectioncanvas.height*tool.zoom);
						if(entry.selectionclipped==true){

							if(myHistory[0].id != entry.id)context.drawImage(entry.selectionclipcanvas,0,0,entry.selectionclipcanvas.width,entry.selectionclipcanvas.height,tool.offset.x+(entry.selectionoffset.x*tool.zoom),tool.offset.y+(entry.selectionoffset.y*tool.zoom),entry.selectionclipcanvas.width*tool.zoom,entry.selectionclipcanvas.height*tool.zoom);
							else{
								if(entry.selectionhandle.state == 2 && entry.rotation.degree==0){
									tempcontext.scale( (entry.selectionclipcanvas.width+entry.resize.x<0?-1:1),(entry.selectionclipcanvas.height+entry.resize.y<0?-1:1) );
									tempcontext.drawImage(entry.resizecanvas,(entry.selectionclipcanvas.width+entry.resize.x<0? -entry.resizecanvas.width:0), (entry.selectionclipcanvas.height+entry.resize.y<0?-entry.resizecanvas.height:0) );
									tempcontext.scale(1,1);
									context.drawImage(tempcanvas,0,0,entry.resizecanvas.width,entry.resizecanvas.height,tool.offset.x+((entry.selectionoffset.x+(entry.selectionclipcanvas.width+entry.resize.x<0?entry.selectionclipcanvas.width+entry.resize.x:0))*tool.zoom),tool.offset.y+((entry.selectionoffset.y+(entry.selectionclipcanvas.height+entry.resize.y<0?entry.selectionclipcanvas.height+entry.resize.y:0))*tool.zoom),Math.abs(entry.selectionclipcanvas.width+entry.resize.x)*tool.zoom,Math.abs(entry.selectionclipcanvas.height+entry.resize.y)*tool.zoom);
								}else context.drawImage(entry.selectionclipcanvas,0,0,entry.selectionclipcanvas.width,entry.selectionclipcanvas.height,tool.offset.x+((entry.snap.x+entry.selectionoffset.x)*tool.zoom),tool.offset.y+((entry.snap.y+entry.selectionoffset.y)*tool.zoom),(entry.selectionclipcanvas.width+(entry.rotation.degree==0?entry.resize.x:0))*tool.zoom,(entry.selectionclipcanvas.height+(entry.rotation.degree==0?entry.resize.y:0))*tool.zoom);

								if(entry.rotation.degree!=0){
									entry.rotation.lastw = entry.rotation.w;
									entry.rotation.lasth = entry.rotation.h;
									entry.rotation.dp = dotProduct((mouse.finalpos.x - (entry.selectionclip.x+entry.rotation.sx)),(mouse.finalpos.y - (entry.selectionclip.y+entry.rotation.sy)),entry.rotation.ex,entry.rotation.ey);
									var p = calcProjection(entry.rotation.dp,entry.rotation.ex,entry.rotation.ey,true);
									entry.rotation.w = calcDistance(0,0,p[0],p[1]) * (dotProduct(p[0],p[1],entry.rotation.ex,entry.rotation.ey )<0?-1:1);
									entry.rotation.dp = dotProduct((mouse.finalpos.x - (entry.selectionclip.x+entry.rotation.sx)),(mouse.finalpos.y - (entry.selectionclip.y+entry.rotation.sy)),entry.rotation.rx,entry.rotation.ry);
									p = calcProjection(entry.rotation.dp,entry.rotation.rx,entry.rotation.ry,true);
									entry.rotation.h = calcDistance(0,0,p[0],p[1]) * (dotProduct(p[0],p[1],entry.rotation.rx,entry.rotation.ry )<0?-1:1);

									/*context.fillStyle = "blue";
									context.font = "bold 16px Arial";
									context.textAlign="left";
									context.fillText(entry.rotation.w+","+entry.rotation.h, canvas.width*0.1, canvas.height*0.5);*/

								}

								//var handle = {x:0,y:0};
								//figure out which handle to show
								if( entry.selectionhandle.state != 2 && entry.rotation.degree==0){
									if( mouse.finalpos.x < myHistory[0].selectionoffset.x+((myHistory[0].clip.x2 - myHistory[0].clip.x) / 3) )myHistory[0].selectionhandle.x = -1;
									else if( mouse.finalpos.x > myHistory[0].selectionoffset.x+(((myHistory[0].clip.x2 - myHistory[0].clip.x) / 3)*2) )myHistory[0].selectionhandle.x = 1;
									else myHistory[0].selectionhandle.x = 0;
									if( mouse.finalpos.y < myHistory[0].selectionoffset.y+((myHistory[0].clip.y2 - myHistory[0].clip.y) / 3) )myHistory[0].selectionhandle.y = -1;
									else if( mouse.finalpos.y > myHistory[0].selectionoffset.y+(((myHistory[0].clip.y2 - myHistory[0].clip.y) / 3)*2) )myHistory[0].selectionhandle.y = 1;
									else myHistory[0].selectionhandle.y = 0;
								}else{
									//var tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[0])*tool.zoom)
									if( entry.selectionhandle.state != 2 ){
										if( entry.rotation.w < myHistory[0].selectionclip.w / 3 )myHistory[0].selectionhandle.x = -1;
										else if( entry.rotation.w > (myHistory[0].selectionclip.w / 3)*2 )myHistory[0].selectionhandle.x = 1;
										else myHistory[0].selectionhandle.x = 0;
										if( entry.rotation.h < myHistory[0].selectionclip.h / 3 )myHistory[0].selectionhandle.y = -1;
										else if( entry.rotation.h > (myHistory[0].selectionclip.h / 3)*2 )myHistory[0].selectionhandle.y = 1;
										else myHistory[0].selectionhandle.y = 0;
									}
									if( myHistory[0].selectionhandle.x == -1 &&
										myHistory[0].selectionhandle.y == -1){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.sx)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.sy)*tool.zoom)};
									}else if( myHistory[0].selectionhandle.x == 0 &&
										myHistory[0].selectionhandle.y == -1){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+(entry.rotation.sx+entry.rotation.corners[0])*0.5)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+(entry.rotation.sy+entry.rotation.corners[1])*0.5)*tool.zoom)};
									}else if(myHistory[0].selectionhandle.x == 1 &&
										myHistory[0].selectionhandle.y == -1){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[0])*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[1])*tool.zoom)};
									}else if( myHistory[0].selectionhandle.x == -1 &&
										myHistory[0].selectionhandle.y == 0){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+(entry.rotation.sx+entry.rotation.corners[2])*0.5)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+(entry.rotation.sy+entry.rotation.corners[3])*0.5)*tool.zoom)};
									}else if(myHistory[0].selectionhandle.x == -1 &&
										myHistory[0].selectionhandle.y == 1){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[2])*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[3])*tool.zoom)};
									}else if( myHistory[0].selectionhandle.x == 1 &&
										myHistory[0].selectionhandle.y == 0){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+(entry.rotation.corners[0]+entry.rotation.corners[4])*0.5)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+(entry.rotation.corners[1]+entry.rotation.corners[5])*0.5)*tool.zoom)};
									}else if(myHistory[0].selectionhandle.x == 1 &&
										myHistory[0].selectionhandle.y == 1){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[4])*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[5])*tool.zoom)};
									}else if( myHistory[0].selectionhandle.x == 0 &&
										myHistory[0].selectionhandle.y == 1){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+(entry.rotation.corners[2]+entry.rotation.corners[4])*0.5)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+(entry.rotation.corners[3]+entry.rotation.corners[5])*0.5)*tool.zoom)};
									}else if( myHistory[0].selectionhandle.x == 0 &&
										myHistory[0].selectionhandle.y == 0){
										//entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+(entry.rotation.sx+entry.rotation.corners[4])*0.5)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+(entry.rotation.sy+entry.rotation.corners[5])*0.5)*tool.zoom)};
									}
									handle.x += ((Math.cos(entry.rotation.radian)*myHistory[0].selectionhandle.x*4)+(Math.cos(toRadians(90)+entry.rotation.radian)*myHistory[0].selectionhandle.y*4))-4;
									handle.y += ((Math.sin(entry.rotation.radian)*myHistory[0].selectionhandle.x*4)+(Math.sin(toRadians(90)+entry.rotation.radian)*myHistory[0].selectionhandle.y*4))-4;
									/*entry.selectionhandle.state = 0;
									if(Math.abs(mouse.finalpos.x - (entry.selectionoffset.x+entry.rotation.sx))<6 && Math.abs(mouse.finalpos.y - (entry.selectionoffset.y+entry.rotation.sy))<6){
										myHistory[0].selectionhandle.x = -1;
										myHistory[0].selectionhandle.y = -1;
										entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.sx)*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.sy)*tool.zoom)};
									}else if(Math.abs(mouse.finalpos.x - (entry.selectionoffset.x+entry.rotation.corners[0]))<6 && Math.abs(mouse.finalpos.y - (entry.selectionoffset.y+entry.rotation.corners[1]))<6){
										myHistory[0].selectionhandle.x = 1;
										myHistory[0].selectionhandle.y = -1;
										entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[0])*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[1])*tool.zoom)};
									}else if(Math.abs(mouse.finalpos.x - (entry.selectionoffset.x+entry.rotation.corners[2]))<6 && Math.abs(mouse.finalpos.y - (entry.selectionoffset.y+entry.rotation.corners[3]))<6){
										myHistory[0].selectionhandle.x = -1;
										myHistory[0].selectionhandle.y = 1;
										entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[2])*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[3])*tool.zoom)};
									}else if(Math.abs(mouse.finalpos.x - (entry.selectionoffset.x+entry.rotation.corners[4]))<6 && Math.abs(mouse.finalpos.y - (entry.selectionoffset.y+entry.rotation.corners[5]))<6){
										myHistory[0].selectionhandle.x = 1;
										myHistory[0].selectionhandle.y = 1;
										entry.selectionhandle.state = 1;
										handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[4])*tool.zoom),y:tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[5])*tool.zoom)};
									}*/
								}
								if( entry.rotation.degree==0){
									handle = {x:tool.offset.x+((entry.selectionoffset.x+entry.selectionclipcanvas.width+entry.resize.x)*tool.zoom) - (myHistory[0].selectionhandle.x==-1 ? ((entry.selectionclipcanvas.width+entry.resize.x)*tool.zoom)+8 : (myHistory[0].selectionhandle.x==0 ? (((entry.selectionclipcanvas.width+entry.resize.x)*0.5)*tool.zoom)+4 : 0) ) ,
									y:tool.offset.y+((entry.selectionoffset.y+entry.selectionclipcanvas.height+entry.resize.y)*tool.zoom) - (myHistory[0].selectionhandle.y==-1 ? ((entry.selectionclipcanvas.height+entry.resize.y)*tool.zoom)+8 : (myHistory[0].selectionhandle.y==0 ? (((entry.selectionclipcanvas.height+entry.resize.y)*0.5)*tool.zoom)+4 : 0) )};
								}

								var rotatehandle = {x:tool.offset.x+((entry.selectionoffset.x+entry.selectionclipcanvas.width)*tool.zoom) - ((entry.selectionclipcanvas.width*0.5)*tool.zoom)+4 ,
								y:tool.offset.y+((entry.selectionoffset.y+entry.selectionclipcanvas.height)*tool.zoom) - ((entry.selectionclipcanvas.height*0.5)*tool.zoom)+4 };
								entry.rotation.x = rotatehandle.x;
								entry.rotation.y = rotatehandle.y;
								rotatehandle.x += Math.cos(entry.rotation.radian)*((entry.selectionclip.w*0.75)*tool.zoom);
								rotatehandle.y += Math.sin(entry.rotation.radian)*((entry.selectionclip.w*0.75)*tool.zoom);

								if( entry.selectionhandle.state == 0 &&
									mouse.pos.x >= handle.x &&
									mouse.pos.x <= handle.x+8 &&
									mouse.pos.y >= handle.y &&
									mouse.pos.y <= handle.y+8 )entry.selectionhandle.state = 1;
								else if( entry.selectionhandle.state == 1 &&
									!(mouse.pos.x >= handle.x &&
									mouse.pos.x <= handle.x+8 &&
									mouse.pos.y >= handle.y &&
									mouse.pos.y <= handle.y+8) )entry.selectionhandle.state = 0;

								context.beginPath();
								context.rect(handle.x,handle.y,8,8);
								//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.selectionclipcanvas.width)*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.selectionclipcanvas.height)*tool.zoom),8,8);
								context.strokeStyle = 'white';
								if(entry.selectionhandle.state == 1)context.strokeStyle = 'yellow';
								//context.setLineDash([]);
								context.stroke();

								if( entry.rotation.state == 0 &&
									mouse.pos.x >= rotatehandle.x-6 &&
									mouse.pos.x <= rotatehandle.x+6 &&
									mouse.pos.y >= rotatehandle.y-6 &&
									mouse.pos.y <= rotatehandle.y+6 )entry.rotation.state = 1;
								else if( entry.rotation.state == 1 &&
									!(mouse.pos.x >= rotatehandle.x-6 &&
									mouse.pos.x <= rotatehandle.x+6 &&
									mouse.pos.y >= rotatehandle.y-6 &&
									mouse.pos.y <= rotatehandle.y+6) )entry.rotation.state = 0;

								context.beginPath();
								context.arc(rotatehandle.x,rotatehandle.y,6,0,2*Math.PI);
								//context.rect(rotatehandle.x,rotatehandle.y,8,8);
								//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.selectionclipcanvas.width)*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.selectionclipcanvas.height)*tool.zoom),8,8);
								context.strokeStyle = 'white';
								if(entry.rotation.state == 1)context.strokeStyle = 'yellow';
								//context.setLineDash([]);
								context.stroke();

								if(entry.rotation.degree!=0){
									context.save();
									context.beginPath();
									context.setLineDash([3,2]);
									context.moveTo(tool.offset.x+((entry.selectionoffset.x+entry.rotation.sx)*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.sy)*tool.zoom) );
									context.lineTo(tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[0])*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[1])*tool.zoom) );
									context.lineTo(tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[4])*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[5])*tool.zoom) );
									context.lineTo(tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[2])*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[3])*tool.zoom) );
									context.closePath();
									//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[0])*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[1])*tool.zoom),8,8);
									//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[2])*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[3])*tool.zoom),8,8);
									//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.rotation.corners[4])*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.corners[5])*tool.zoom),8,8);
									//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.rotation.sx)*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.rotation.sy)*tool.zoom),8,8);
									//context.rect(tool.offset.x+((entry.selectionoffset.x+entry.selectionclipcanvas.width)*tool.zoom),tool.offset.y+((entry.selectionoffset.y+entry.selectionclipcanvas.height)*tool.zoom),8,8);
									context.strokeStyle = 'white';
									if(entry.rotation.state == 1)context.strokeStyle = 'yellow';
									context.stroke();
									context.restore();
								}

							}
						}
					}


					if(entry.frame==framenum && myHistory[0].selectionpoints.length>0 && myHistory[0].rotation.degree==0){
						context.save();
						context.beginPath();
						context.setLineDash([3,2]);
						context.moveTo(tool.offset.x+(myHistory[0].selectionpoints[0].x*tool.zoom),tool.offset.y+(myHistory[0].selectionpoints[0].y*tool.zoom));
						for(var i=1; i<myHistory[0].selectionpoints.length; i++){
							context.lineTo(tool.offset.x+(myHistory[0].selectionpoints[i].x*tool.zoom),tool.offset.y+(myHistory[0].selectionpoints[i].y*tool.zoom));

						}
						if(mouse.tool=="marquee")context.closePath();
						context.lineWidth = 1;
						context.strokeStyle = 'white';
						context.stroke();
						context.restore();
					}

				});

			}
		}

		start = project.frames-1 , end = -1;
		if(tool.secondary_view==2){	//linked
			var begin = $("#frame_null").siblings().index( $("#frame_null").siblings('[value="'+project.currentframe+'"]') );
			start = begin;
			end = begin;
			var above = $("#frame_null").siblings(':eq('+begin+')');
			var below = $("#frame_null").siblings(':eq('+begin+')');
			do{
				var l = above.find('.frame_linker').css('background-image');
				var link = -1;
				if(l)link = l.indexOf('-linked');
				if(link!=-1){
					if($("#frame_null").siblings().index(above)>0)
						above = above.prev();
					else
						link=-1;
				}
			}while(link!=-1);
			end = $("#frame_null").siblings().index(above)-1;
			do{
				var link =-1;
				if($("#frame_null").siblings().index(below)<project.frames-1){
					var l = below.next().find('.frame_linker').css('background-image');
					if(l)link = l.indexOf('-linked');
					if(link!=-1)
						below = below.next();
				}
			}while(link!=-1);
			start = $("#frame_null").siblings().index(below);
		}else if(tool.secondary_view==3){	//sheet
			var sheetcount = 0;
			tool.secondary_sheet.list = new Array(project.frames);
			for(var i=project.canvaslayer.length-1; i>-1; i--){
				var theframe = $("#frame_null").siblings(':eq('+i+')');
				var animframe = theframe.attr('value');

				if(animframe==project.currentframe){
					tool.secondary_sheet.current = sheetcount;
					tool.secondary_sheet.oy = -Math.floor(sheetcount/tool.secondary_sheet.x)*project.height;
					tool.secondary_sheet.ox = -(sheetcount-(Math.floor(sheetcount/tool.secondary_sheet.x)*tool.secondary_sheet.x))*project.width;
				}
				if(animframe!=-1)tool.secondary_sheet.list[animframe] = sheetcount;

				do{
					if( $("#frame_null").siblings().length==project.frames && $("#frame_null").siblings('[value="'+animframe+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
						animframe = $("#frame_null").siblings('[value="'+animframe+'"]').prev().attr('value');
						if(animframe==project.currentframe){
							tool.secondary_sheet.current = sheetcount;
							tool.secondary_sheet.oy = -Math.floor(sheetcount/tool.secondary_sheet.x)*project.height;
							tool.secondary_sheet.ox = -(sheetcount-(Math.floor(sheetcount/tool.secondary_sheet.x)*tool.secondary_sheet.x))*project.width;
						}
						tool.secondary_sheet.list[animframe] = sheetcount;
						i--;
					}else animframe = -1;
				}while(animframe!=-1);

				sheetcount++;	//track the number of spaces in the sheet, with linked frames accounted for
			}
		}

		for(var frame_i=start; frame_i>end; frame_i--){		//this is for the secondary viewport, and thus doesn't need to display any historylist
			var framenum = $("#frame_null").siblings(':eq('+frame_i+')').attr('value');

			if(tool.secondary_view==1){//project.showall==false){
				framenum=project.currentframe;
				frame_i = 0;
			}

			if(project.visible[framenum]==true && framenum<project.canvaslayer.length && framenum>-1){
				temp2context.clearRect(0,0,project.width,project.height);
				if(project.visible[framenum]==true){
					if(tool.secondary_view!=4)temp2context.drawImage(project.canvaslayer[framenum],0,0);
					else{
						var startx = Math.max(-Math.floor(tool.secondary_offset.x/(project.grid.x*tool.secondary_zoom))-1,0);
						var starty = Math.max(-Math.floor(tool.secondary_offset.y/(project.grid.y*tool.secondary_zoom))-1,0);
						var col = Math.min(Math.floor((minicanvas.width-tool.secondary_offset.x) / (project.grid.x*tool.secondary_zoom))+1,tile.dim.w);
						var row = Math.min(Math.floor((minicanvas.height-tool.secondary_offset.y) / (project.grid.y*tool.secondary_zoom))+1,tile.dim.h);
						for(var x=startx; x<col; x++){
							for(var y=starty; y<row; y++){
								for(var l=0; l<tile.layers.length; l++){
									if(tile.layers[l].visible==true && tile.map[l][x][y].x!=-1 && tile.map[l][x][y].y!=-1)
										minicontext.drawImage(project.canvaslayer[framenum],tile.map[l][x][y].x*project.grid.x,tile.map[l][x][y].y*project.grid.y,project.grid.x,project.grid.y,(tool.secondary_offset.x)+(x*project.grid.x*tool.secondary_zoom),(tool.secondary_offset.y)+(y*project.grid.y*tool.secondary_zoom),project.grid.x*tool.secondary_zoom,project.grid.y*tool.secondary_zoom);
								}
							}
						}
					}
				}
				brushlayers.forEach(function(entry){
					if(entry.frame==framenum){
						if(tool.secondary_view!=4)temp2context.drawImage(entry.previewcanvas,0,0);
						else{
							var startx = Math.max(-Math.floor(tool.secondary_offset.x/(project.grid.x*tool.secondary_zoom))-1,0);
							var starty = Math.max(-Math.floor(tool.secondary_offset.y/(project.grid.y*tool.secondary_zoom))-1,0);
							var col = Math.min(Math.floor((minicanvas.width-tool.secondary_offset.x) / (project.grid.x*tool.secondary_zoom))+1,tile.dim.w);
							var row = Math.min(Math.floor((minicanvas.height-tool.secondary_offset.y) / (project.grid.y*tool.secondary_zoom))+1,tile.dim.h);
							for(var x=startx; x<col; x++){
								for(var y=starty; y<row; y++){
									for(var l=0; l<tile.layers.length; l++){
										if(tile.layers[l].visible==true && tile.map[l][x][y].x!=-1 && tile.map[l][x][y].y!=-1)
											minicontext.drawImage(entry.previewcanvas,tile.map[l][x][y].x*project.grid.x,tile.map[l][x][y].y*project.grid.y,project.grid.x,project.grid.y,(tool.secondary_offset.x)+(x*project.grid.x*tool.secondary_zoom),(tool.secondary_offset.y)+(y*project.grid.y*tool.secondary_zoom),project.grid.x*tool.secondary_zoom,project.grid.y*tool.secondary_zoom);
									}
								}
							}
						}
					}
				});
				historylist.forEach(function(entry){
					if(entry.frame==framenum){
						if(entry.draw==false || entry.erase==true)temp2context.globalCompositeOperation = 'destination-out';
						if(tool.secondary_view!=4)temp2context.drawImage(entry.canvas,0,0);
						else{
							var startx = Math.max(-Math.floor(tool.secondary_offset.x/(project.grid.x*tool.secondary_zoom))-1,0);
							var starty = Math.max(-Math.floor(tool.secondary_offset.y/(project.grid.y*tool.secondary_zoom))-1,0);
							var col = Math.min(Math.floor((minicanvas.width-tool.secondary_offset.x) / (project.grid.x*tool.secondary_zoom))+1,tile.dim.w);
							var row = Math.min(Math.floor((minicanvas.height-tool.secondary_offset.y) / (project.grid.y*tool.secondary_zoom))+1,tile.dim.h);
							for(var x=startx; x<col; x++){
								for(var y=starty; y<row; y++){
									for(var l=0; l<tile.layers.length; l++){
										if(tile.layers[l].visible==true && tile.map[l][x][y].x!=-1 && tile.map[l][x][y].y!=-1)
											minicontext.drawImage(entry.canvas,tile.map[l][x][y].x*project.grid.x,tile.map[l][x][y].y*project.grid.y,project.grid.x,project.grid.y,(tool.secondary_offset.x)+(x*project.grid.x*tool.secondary_zoom),(tool.secondary_offset.y)+(y*project.grid.y*tool.secondary_zoom),project.grid.x*tool.secondary_zoom,project.grid.y*tool.secondary_zoom);
									}
								}
							}
						}
						if(entry.draw==false || entry.erase==true)temp2context.globalCompositeOperation = 'source-over';
					}
				});

				minicontext.globalAlpha=project.opacity[framenum];
				if(tool.secondary_view!=3)minicontext.drawImage(temp2canvas,0,0,project.width,project.height,tool.secondary_offset.x,tool.secondary_offset.y,project.width*tool.secondary_zoom,project.height*tool.secondary_zoom);
				else{
					var sheetx = (tool.secondary_sheet.list[framenum]%tool.secondary_sheet.x);
					var sheety = Math.floor(tool.secondary_sheet.list[framenum]/tool.secondary_sheet.x);
					minicontext.drawImage(temp2canvas,0,0,project.width,project.height,tool.secondary_offset.x+(tool.secondary_sheet.ox+(sheetx*project.width))*tool.secondary_zoom,tool.secondary_offset.y+(tool.secondary_sheet.oy+(sheety*project.height))*tool.secondary_zoom,project.width*tool.secondary_zoom,project.height*tool.secondary_zoom);

					minicontext.beginPath();
					minicontext.rect(tool.secondary_offset.x-1,tool.secondary_offset.y-1,(project.width*tool.secondary_zoom)+1,(project.height*tool.secondary_zoom)+1);
					minicontext.strokeStyle = 'white';
					//minicontext.setLineDash([]);
					minicontext.stroke();
				}
				minicontext.globalAlpha=1;

			}
		}

		var imgData ;
		if(mouse.canvas!=palettecanvas)imgData = context.getImageData(mouse.pos.x,mouse.pos.y,1,1);
		else imgData = pcontext.getImageData(mouse.pos.x,mouse.pos.y,1,1);
		if(
			mouse.colorbelow.r != imgData.data[0] ||
			mouse.colorbelow.g != imgData.data[1] ||
			mouse.colorbelow.b != imgData.data[2]
		){
			mouse.prevcolorbelow.r = mouse.colorbelow.r;
			mouse.prevcolorbelow.g = mouse.colorbelow.g;
			mouse.prevcolorbelow.b = mouse.colorbelow.b;
			mouse.colorbelow.r = imgData.data[0];
			mouse.colorbelow.g = imgData.data[1];
			mouse.colorbelow.b = imgData.data[2];
		}
		//draw the grid if enabled
		if(project.grid.show == true){
			//find how many lines to draw
			var col = Math.ceil(canvas.width / (project.grid.x*tool.zoom))+1;
			var row = Math.ceil(canvas.height / (project.grid.y*tool.zoom))+1;
			var startx = tool.offset.x % (project.grid.x*tool.zoom);
			var starty = tool.offset.y % (project.grid.y*tool.zoom);
			context.save();
			context.beginPath();
			context.setLineDash([1,3]);
			for(var x=0; x<col; x++){
				if(startx+(x*(project.grid.x*tool.zoom)) > tool.offset.x && startx+(x*(project.grid.x*tool.zoom)) < tool.offset.x+(project.width*tool.zoom) ){
					context.moveTo(startx+(x*(project.grid.x*tool.zoom))+0.5,Math.max(0,tool.offset.y)+0.5 );
					context.lineTo(startx+(x*(project.grid.x*tool.zoom))+0.5,Math.min(canvas.height,tool.offset.y+(project.height*tool.zoom) )+0.5 );
				}
			}
			for(var y=0; y<row; y++){
				if(starty+(y*(project.grid.y*tool.zoom)) > tool.offset.y && starty+(y*(project.grid.y*tool.zoom)) < tool.offset.y+(project.height*tool.zoom) ){
					context.moveTo(Math.max(0,tool.offset.x)+0.5, starty+(y*(project.grid.y*tool.zoom))+0.5 );
					context.lineTo(Math.min(canvas.width,tool.offset.x+(project.width*tool.zoom) )+0.5, starty+(y*(project.grid.y*tool.zoom))+0.5 );
				}
			}
			context.lineWidth = 1;
			context.strokeStyle = 'white';
			context.stroke();

			context.beginPath();
			//context.setLineDash([1,3]);
			for(var x=0; x<col; x++){
				if(startx+(x*(project.grid.x*tool.zoom)) > tool.offset.x && startx+(x*(project.grid.x*tool.zoom)) < tool.offset.x+(project.width*tool.zoom) ){
					context.moveTo(startx+(x*(project.grid.x*tool.zoom))+0.5,Math.max(0,tool.offset.y)+1.5 );
					context.lineTo(startx+(x*(project.grid.x*tool.zoom))+0.5,Math.min(canvas.height,tool.offset.y+(project.height*tool.zoom) )+1.5 );
				}
			}
			for(var y=0; y<row; y++){
				if(starty+(y*(project.grid.y*tool.zoom)) > tool.offset.y && starty+(y*(project.grid.y*tool.zoom)) < tool.offset.y+(project.height*tool.zoom) ){
					context.moveTo(Math.max(0,tool.offset.x)+0.5, starty+(y*(project.grid.y*tool.zoom))+1.5 );
					context.lineTo(Math.min(canvas.width,tool.offset.x+(project.width*tool.zoom) )+0.5, starty+(y*(project.grid.y*tool.zoom))+1.5 );
				}
			}
			context.lineWidth = 1;
			context.strokeStyle = 'black';
			context.stroke();
			context.restore();
		}

		if(tool.edge.length>0 && (mouse.tool=="eraser" || mouse.tool=="magiceraser" || mouse.tool=="pencil" || mouse.tool=="brush" || mouse.tool=="bucket") ){
			var tzoom = (mouse.context==palettecontext?1:(mouse.context==context?tool.zoom:tool.secondary_zoom));
			var toolx = Math.floor(mouse.pos.x / tzoom) *tzoom;
			var tooly = Math.floor(mouse.pos.y / tzoom) *tzoom;

			var ctx = (mouse.context==palettecontext?pcontext:(mouse.context==context?context:minicontext));
			var z = (mouse.context==palettecontext?1:(mouse.context==context?tool.zoom:tool.secondary_zoom));

			ctx.beginPath();
			tool.edge.forEach(function(entry){
				if(tool.edge.indexOf(entry)==0)
					ctx.moveTo((entry.x*z)+toolx+(tool.offset.x%z)-((toolcanvas.width*0.5)*z),(entry.y*z)+tooly+(tool.offset.y%z)-((toolcanvas.height*0.5)*z));
				else
					ctx.lineTo((entry.x*z)+toolx+(tool.offset.x%z)-((toolcanvas.width*0.5)*z),(entry.y*z)+tooly+(tool.offset.y%z)-((toolcanvas.height*0.5)*z));
			});
			ctx.lineTo((tool.edge[0].x*z)+toolx+(tool.offset.x%z)-((toolcanvas.width*0.5)*z),(tool.edge[0].y*z)+tooly+(tool.offset.y%z)-((toolcanvas.height*0.5)*z));

			//ctx.setLineDash([]);
			ctx.lineWidth = 1;
			//ctx.strokeStyle = 'rgb('+(255-mouse.colorbelow.r)+','+(255-mouse.colorbelow.g)+','+(255-mouse.colorbelow.b)+')';
			ctx.strokeStyle = 'rgb('+(((255-mouse.colorbelow.r)*(255-mouse.prevcolorbelow.r))/255)+','+(((255-mouse.colorbelow.g)*(255-mouse.prevcolorbelow.g))/255)+','+(((255-mouse.colorbelow.b)*(255-mouse.prevcolorbelow.b))/255)+')';
			ctx.stroke();
		}else if(mouse.tool=="tile" || mouse.tool=="erasetile"){
			var ctx = (mouse.context==palettecontext?pcontext:(mouse.context==context?context:minicontext));
			var z = (mouse.context==palettecontext?1:(mouse.context==context?tool.zoom:tool.secondary_zoom));

			if(!mouse.left){
				var w = (mouse.canvas==minicanvas ? tile.dim.w-1 : Math.floor(project.width/project.grid.x) );
				var h = (mouse.canvas==minicanvas ? tile.dim.h-1 : Math.floor(project.height/project.grid.y) );
				tile.x=Math.min(Math.max(Math.floor(mouse.finalpos.x/project.grid.x),0),w);
				tile.y=Math.min(Math.max(Math.floor(mouse.finalpos.y/project.grid.y),0),h);
			}
			if(mouse.left && $('#canvas').css('cursor')=='crosshair' && mouse.canvas==canvas){tile.set.x = tile.x; tile.set.y = tile.y;}
			var offset = (mouse.canvas==minicanvas?tool.secondary_offset:tool.offset);

			ctx.beginPath();
			ctx.rect(offset.x+(tile.x*project.grid.x*z),offset.y+(tile.y*project.grid.y*z),project.grid.x*z,project.grid.y*z);
			//ctx.setLineDash([]);
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgb('+(255-mouse.colorbelow.r)+','+(255-mouse.colorbelow.g)+','+(255-mouse.colorbelow.b)+')';
			ctx.stroke();

			ctx = context;
			ctx.beginPath();
			ctx.rect(tool.offset.x+(tile.set.x*project.grid.x*tool.zoom)-1,tool.offset.y+(tile.set.y*project.grid.y*tool.zoom)-1,(project.grid.x*tool.zoom)+2,(project.grid.y*tool.zoom)+2);
			//ctx.setLineDash([]);
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'rgb('+(255-mouse.colorbelow.r)+','+(255-mouse.colorbelow.g)+','+(255-mouse.colorbelow.b)+')';
			ctx.stroke();
		}

		if( project.playback.state==true){
			context.beginPath();
			context.rect(tool.offset.x+(project.playback.crop.x*tool.zoom),tool.offset.y+(project.playback.crop.y*tool.zoom),project.playback.crop.w*tool.zoom,project.playback.crop.h*tool.zoom);
			//context.setLineDash([]);
			context.lineWidth = 1;
			context.strokeStyle = 'rgb('+(255-mouse.colorbelow.r)+','+(255-mouse.colorbelow.g)+','+(255-mouse.colorbelow.b)+')';
			context.stroke();
		}
		//var toolx = Math.floor(mouse.pos.x / tool.zoom) *tool.zoom;
		//var tooly = Math.floor(mouse.pos.y / tool.zoom) *tool.zoom;
		//context.drawImage(toolcanvas,0,0,toolcanvas.width,toolcanvas.height,toolx+(tool.offset.x%tool.zoom)-((toolcanvas.width*0.5)*tool.zoom),tooly+(tool.offset.y%tool.zoom)-((toolcanvas.height*0.5)*tool.zoom),toolcanvas.width*tool.zoom,toolcanvas.height*tool.zoom);

	}else{
		//animation drawing stuff
		var animframe = animation.frame;
		do{
			if(project.visible[animframe]==true){
				context.globalAlpha=project.opacity[animframe];
				context.drawImage(project.canvaslayer[animframe],0,0,project.width,project.height,tool.offset.x,tool.offset.y,project.width*tool.zoom,project.height*tool.zoom);
				context.globalAlpha=1;

				minicontext.globalAlpha=project.opacity[animframe];
				minicontext.drawImage(project.canvaslayer[animframe],0,0,project.width,project.height,tool.secondary_offset.x,tool.secondary_offset.y,project.width*tool.secondary_zoom,project.height*tool.secondary_zoom);
				minicontext.globalAlpha=1;
			}
			if( $("#frame_null").siblings('[value="'+animframe+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
				animframe = $("#frame_null").siblings('[value="'+animframe+'"]').prev().attr('value');
			}else animframe = -1;
		}while(animframe!=-1);
	}

	if(project.lock==true && project.playback.state==false){
		if(project.playback.keyframe.length==0){
			context.fillStyle = "blue";
			context.font = "bold 16px Arial";
			context.textAlign="center";
			context.fillText("Canvas locked while new Painter connects to everyone!", canvas.width*0.5, canvas.height*0.5);
		}
	}
}

function send_my_position(){
	var msg = {type:'mouse_position',x:mouse.pos.x, y:mouse.pos.y};
    eachActiveConnection(function(c) {
        c.send(msg);

    });
}

function send_pixel(mx,my,rgba){
	var msg = {type:'draw_pixel', x:mx, y:my, color:rgba};
    eachActiveConnection(function(c) {
        c.send(msg);

    });
}

function send_eraser_line(sx,sy,ex,ey,color,t){
	var msg = {type:'eraser_line', frame:project.currentframe, sx:sx, sy:sy, ex:ex, ey:ey, color:color, t:t };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_magiceraser_line(sx,sy,ex,ey,groups,t,basergba,baseuprgba){
	var msg = {type:'draw_magiceraser_line', frame:project.currentframe,  sx:sx, sy:sy, ex:ex, ey:ey, groups:groups, t:t, basergba:basergba, baseuprgba:baseuprgba };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_pixel_line(sx,sy,ex,ey,color,t){
	var msg = {type:'draw_pixel_line', frame:project.currentframe, sx:sx, sy:sy, ex:ex, ey:ey, color:color, t:t };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_brush_line(sx,sy,ex,ey,groups,t,basergba,baseuprgba){
	var msg = {type:'draw_brush_line', frame:project.currentframe,  sx:sx, sy:sy, ex:ex, ey:ey, groups:groups, t:t, basergba:basergba, baseuprgba:baseuprgba };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_flood_fill(x,y,color,contiguous){
	var msg = {type:'draw_flood_fill', frame:project.currentframe, pos:{x:x,y:y}, color:color, contiguous:contiguous };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_magic_wand(x,y,type,clip,contiguous){
	var msg = {type:'select_magic_wand', frame:project.currentframe, pos:{x:x,y:y}, selecttype:type, clip:clip, contiguous:contiguous };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_select_lasso(type,points,clip){
	var msg = {type:'select_lasso', frame:project.currentframe, selecttype:type, points:points, clip:clip };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_select_move(offset){
	var msg = {type:'select_move', frame:project.currentframe, offset:offset, clip:myHistory[0].selectionclip };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_select_flip(flip){
	var msg = {type:'select_flip', frame:project.currentframe, flip:flip };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_select_rotate(rotate){
	var msg = {type:'select_rotate', frame:project.currentframe, rotate:rotate };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_copy_selection(){
	var msg = {type:'copy_selection', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true,{}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_paste_selection(){
	var msg = {type:'paste_selection', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true,{}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_select_clip(type){
	var msg = {type:'select_clip', frame:project.currentframe, selecttype:type };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_select_paste(){
	var msg = {type:'select_paste', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true,{}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_select_clear(){
	var msg = {type:'select_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true,{}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_clip_clear(){
	var msg = {type:'clip_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true,{}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_resize_clip(offset, clip, resize, handle){
	var msg = {type:'resize_clip', frame:project.currentframe, offset:offset, clip:clip, resize:resize, handle:handle };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true,{}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_refresh_clip(clip){
	var msg = {type:'refresh_clip', frame:project.currentframe, clip:clip };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_eraser_clear(){
	var msg = {type:'eraser_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_magiceraser_clear(){
	var msg = {type:'draw_magiceraser_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_pixel_clear(){
	var msg = {type:'draw_pixel_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_brush_clear(){
	var msg = {type:'draw_brush_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_bucket_clear(){
	var msg = {type:'draw_bucket_clear', frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_history_select(num){
	var msg = {type:'history_select',num:num };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function send_clearHistory(){
	var msg = {type:'history_clear' };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_remove_frame(){
	var msg = {type:'remove_frame',frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_add_frame(){
	var msg = {type:'add_frame',frame:project.currentframe };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_frame_order(order){
	var msg = {type:'order_frames',order:order };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_frame_interval(frame,interval){
	var msg = {type:'frame_interval',frame:frame, interval:interval };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_toggle_visible(frame,visible){
	var msg = {type:'toggle_visible',frame:frame, visible:visible };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_toggle_linked(frame,linked){
	var msg = {type:'toggle_linked',frame:frame, linked:linked };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_frame_opacity(frame,opacity){
	var msg = {type:'frame_opacity',frame:frame, opacity:opacity };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_resize_image(width,height){
	var msg = {type:'resize_image',width:width,height:height };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_resize_canvas(width,height,direction){
	var msg = {type:'resize_canvas',width:width,height:height,direction:direction };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_start_rotate(rotation, clip, center){
	var msg = {type:'start_rotation',rotation:rotation, clip:clip, center:center };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_save_resize(){
	var msg = {type:'save_resize' };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_add_resize_undo(){
	var msg = {type:'add_resize_undo' };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_undo_resize(){
	var msg = {type:'undo_resize' };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}
function send_clipart(clipart){
	var msg = {type:'load_clipart',clipart:clipart };
    eachActiveConnection(function(c) {
        c.send(msg);
    });
	//record this event in our session(for playback)
	msg.peer = 0;
	var msgcopy = jQuery.extend(true, {}, msg);
	project.recording.session[project.recording.session.length-1].actionlist.push( msgcopy );
}

function reload_canvas(c, ctx){

	ctx = c.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	return ctx;
}

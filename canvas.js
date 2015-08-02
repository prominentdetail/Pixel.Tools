
function canvas_events(){

	$('#canvas, #minicanvas').on('mousewheel',function(objEvent, intDelta){
		if (intDelta > 0){
			if(mouse.invert==false){
				if(mouse.canvas==minicanvas)zoomOutSecondary();
				else zoomOut();
			}else{
				if(mouse.canvas==minicanvas)zoomInSecondary();
				else zoomIn();
			}
		}
		else if (intDelta < 0){
			if(mouse.invert==false){
				if(mouse.canvas==minicanvas)zoomInSecondary();
				else zoomIn();
			}else{
				if(mouse.canvas==minicanvas)zoomOutSecondary();
				else zoomOut();
			}
			//tool.zoomstop=true;
		}
		objEvent.preventDefault();
	});

	$(window).bind('beforeunload', function(){
		return 'If you leave, your project will be closed and anything unsaved will be lost!';
	});

    var rx = /INPUT|SELECT|TEXTAREA/i;

	document.documentElement.addEventListener('keypress', function (e) {
		//prevent backspace key from going previous page
        if( e.which == 8 ){ // 8 == backspace
            if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                e.preventDefault();
            }
        }

		if(rx.test(e.target.tagName))mouse.focus=true;
	});

	document.documentElement.addEventListener('keydown', function (e) {


		if (!key.timer && key.held==0) key.timer = setTimeout(function() {
            key.held = 1;
        }, key.pressedTime);

		//prevent backspace key from going previous page
        if( e.which == 8 ){ // 8 == backspace
            if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                e.preventDefault();
            }
        }

		if ( $(document.activeElement).prop('type') == 'text' ){

		}else if(( e.keycode || e.which ) == 32) {
			if(mouse.left==false){
				key.spacebar = true;
				$('#canvas').css('cursor','url(img/cursor-'+(key.alt==true?'zoomout':(key.ctrl==true?'zoomin':'hand'))+'.png),crosshair');
				$('#minicanvas').css('cursor','url(img/cursor-'+(key.alt==true?'zoomout':(key.ctrl==true?'zoomin':'hand'))+'.png),crosshair');
				tool.preventdraw = true;
			}
			e.preventDefault();
		}

		var selectiontool = (mouse.tool=='lasso' || mouse.tool=='marquee' || mouse.tool=='magicwand' ? true : false);
		if( (e.ctrlKey || e.metaKey) && $(document.activeElement).prop('type') != 'text' ){
			key.ctrl=true;
			if(( ( e.keycode || e.which ) == 61 || ( e.keycode || e.which ) == 187 ) && tool.zoomstop==false){
				if(mouse.canvas==minicanvas)zoomInSecondary();
				else zoomIn();
				tool.zoomstop=true;
			}
			if(( ( e.keycode || e.which ) == 173 || ( e.keycode || e.which ) == 189 ) && tool.zoomstop==false){
				if(mouse.canvas==minicanvas)zoomOutSecondary();
				else zoomOut();
				tool.zoomstop=true;
			}
			if( ( e.keycode || e.which ) == 222){
				$("#grid").click();
				//if(project.grid.show==true)project.grid.show=false;
				//else project.grid.show = true;
			}
			//undo (ctrl+Z)
			if( mouse.left==false && project.playback.state==false && ( e.keycode || e.which ) == 90){
				if(myHistory[0].selected>0){
					var h = $('#history_list li[class*="ui-state-active"]');
					h.siblings().removeClass('ui-state-active');
					h.toggleClass('ui-state-active');
					h.prev().toggleClass('ui-state-active');
					myHistory[0].selected = h.prev().attr('value');
					send_history_select(myHistory[0].selected);
				}
			}
			//redo (ctrl+Y)
			if( mouse.left==false && project.playback.state==false && ( e.keycode || e.which ) == 89){
				if(myHistory[0].selected<myHistory[0].layers.length-1){
					var h = $('#history_list li[class*="ui-state-active"]');
					h.siblings().removeClass('ui-state-active');
					h.toggleClass('ui-state-active');
					h.next().toggleClass('ui-state-active');
					myHistory[0].selected = h.next().attr('value');
					send_history_select(myHistory[0].selected);
				}
			}

			if(approveContinue()){	//helps keep peers in sync
				//copy (ctrl+C)
				if( mouse.left==false && project.playback.state==false && ( e.keycode || e.which ) == 67){
					copySelection(myHistory[0].id);
					send_copy_selection();
				}
				//paste (ctrl+V)
				if( mouse.left==false && project.playback.state==false && ( e.keycode || e.which ) == 86){
					pasteSelection(myHistory[0].id);
					send_paste_selection();
				}

				//Deselect selection/clip
				if( mouse.left==false && project.playback.state==false && ( e.keycode || e.which ) == 68){
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
				}
			}

			if( ( e.keycode || e.which ) == 219){	//hardness down
				$('#tool_hardness').slider('value',tool.hardness-1);
			}
			if( ( e.keycode || e.which ) == 221){	//hardness up
				$('#tool_hardness').slider('value',tool.hardness+1);
			}
			if( ( e.keycode || e.which ) == 188){	//levels down
				$('#tool_levels').slider('value',tool.levels-1);
			}
			if( ( e.keycode || e.which ) == 190){	//levels up
				$('#tool_levels').slider('value',tool.levels+1);
			}
			$('#canvas').css('cursor', (key.spacebar==true?'url(img/cursor-zoomin.png),': (selectiontool==true && key.alt==false?'url(img/cursor-cut.png),':(selectiontool==true && key.alt==true ? 'url(img/cursor-copy.png),':'')))+'crosshair');
			$('#minicanvas').css('cursor', (key.spacebar==true?'url(img/cursor-zoomin.png),': (selectiontool==true && key.alt==false?'url(img/cursor-cut.png),':(selectiontool==true && key.alt==true ? 'url(img/cursor-copy.png),':'')))+'crosshair');
			e.preventDefault();
		}
		if(e.altKey && $(document.activeElement).prop('type') != 'text' ){
			key.alt=true;
			$('#canvas').css('cursor','url(img/cursor-'+(key.spacebar==true?'zoomout.png)': (selectiontool==true && key.ctrl==false && key.shift==false?'subtract.png) 7 7': (selectiontool==true && key.ctrl==false && key.shift==true?'intersect.png) 7 7': (selectiontool==true && key.ctrl==true?'copy.png)':'eyedropper.png) 0 15'))))+',crosshair');
			$('#minicanvas').css('cursor','url(img/cursor-'+(key.spacebar==true?'zoomout.png)': (selectiontool==true && key.ctrl==false && key.shift==false?'subtract.png) 7 7': (selectiontool==true && key.ctrl==false && key.shift==true?'intersect.png) 7 7': (selectiontool==true && key.ctrl==true?'copy.png)':'eyedropper.png) 0 15'))))+',crosshair');
			//$('#canvas').css('cursor','url(cursor-eyedropper.png) 0 15,crosshair');
			e.preventDefault();
		}
		if(e.shiftKey && $(document.activeElement).prop('type') != 'text' ){
			key.shift=true;
			if(selectiontool==true){
				$('#canvas').css('cursor','url(img/cursor-'+(key.alt==true?'intersect':'add')+'.png) 7 7,crosshair');
				$('#minicanvas').css('cursor','url(img/cursor-'+(key.alt==true?'intersect':'add')+'.png) 7 7,crosshair');
			}
			e.preventDefault();
		}

		//delete key (for deleting clipped image or clearing selected canvas)
		if(approveContinue()){
			if( $(document.activeElement).prop('type') != 'text' && mouse.left==false && project.playback.state==false && ( e.keycode || e.which ) == 46){
				if(myHistory[0].selectionclipped == false){

					commitHistory(myHistory[0].id);
					//if clearing section, keep backup of what was there so we can pass to historylist(so we can restore it).
					var backupcanvas = document.createElement("canvas");
					backupcanvas.width = project.width;
					backupcanvas.height = project.height;
					var backupcontext = backupcanvas.getContext("2d");
					backupcontext.drawImage(project.canvaslayer[project.currentframe],0,0);

					myHistory[0].selectionsetclip = true;
					selectClip(myHistory[0].id);
					var type = "cut";

					myHistory[0].context.drawImage(myHistory[0].selectionclipcanvas,myHistory[0].selectionoffset.x,myHistory[0].selectionoffset.y);

					claimHistory(myHistory[0].id,myHistory[0].canvas);
					myHistory[0].layers.push(new historylayerdata("Delete",myHistory[0].canvas,myHistory[0],true,backupcanvas) );
					project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
					project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
					project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';

					myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
					send_select_clip(type);

					selectClearClip(myHistory[0].id);
					send_select_clear();
					//make sure selection is not selecting anything
					myHistory[0].selectionsetclip = false;
					myHistory[0].selectionpoints.push( {x:0,y:0} );
					myHistory[0].selectionclip.x = 0, myHistory[0].selectionclip.y = 0;
					myHistory[0].selectionclip.x2 = 0, myHistory[0].selectionclip.y2 = 0;
				}else{
					myHistory[0].selectionclipcontext.clearRect(0, 0, myHistory[0].selectionclipcanvas.width, myHistory[0].selectionclipcanvas.height);
					myHistory[0].selectionclipped = false;
					send_clip_clear();
				}
				e.preventDefault();
			}
		}
		//hotkeys
		if( $(document.activeElement).prop('type') != 'text' && mouse.left ==false && mouse.right==false ){

			if(key.ctrl==false){
				if( ( e.keycode || e.which ) == 69){	//eraser
					//document.getElementById("eraser").click();
					if($( "#eraser" ).attr('value')==0 && mouse.tool!='eraser')document.getElementById("eraser").click();
					else if($( "#eraser" ).attr('value')==0 && key.held==1 && mouse.tool=='eraser'){
						document.getElementById("magiceraser").click();
					}
					else if($( "#eraser" ).attr('value')==1 && mouse.tool!='magiceraser')document.getElementById("magiceraser").click();
					else if($( "#eraser" ).attr('value')==1 && key.held==1 && mouse.tool=='magiceraser'){
						document.getElementById("eraser").click();
					}
				}
				if( ( e.keycode || e.which ) == 66){	//pencil/brush
					if($( "#pencil" ).attr('value')==0 && mouse.tool!='pencil')document.getElementById("pencil").click();
					else if($( "#pencil" ).attr('value')==0 && key.held==1 && mouse.tool=='pencil'){
						document.getElementById("brush").click();
					}
					else if($( "#pencil" ).attr('value')==1 && mouse.tool!='brush')document.getElementById("brush").click();
					else if($( "#pencil" ).attr('value')==1 && key.held==1 && mouse.tool=='brush'){
						document.getElementById("pencil").click();
					}

				}
				if( ( e.keycode || e.which ) == 71){	//bucket
					document.getElementById("bucket").click();
				}
				if( ( e.keycode || e.which ) == 77){	//marquee
					document.getElementById("marquee").click();
				}
				if( ( e.keycode || e.which ) == 76){	//lasso
					document.getElementById("lasso").click();
				}
				if( ( e.keycode || e.which ) == 87){	//magicwand
					document.getElementById("magicwand").click();
				}
				if( ( e.keycode || e.which ) == 73){	//eyedropper
					document.getElementById("eyedropper").click();
				}
				if( ( e.keycode || e.which ) == 72){	//hand
					document.getElementById("hand").click();
				}
				if( ( e.keycode || e.which ) == 90){	//zoom
					document.getElementById("zoom").click();
				}
				if( ( e.keycode || e.which ) == 84){	//tile
					$('#tile').click();
				}
				if( ( e.keycode || e.which ) == 82){	//erasetile
					$('#erasetile').click();
				}
				//if( ( e.keycode || e.which ) == 67){	//collision
				//	$('#collision').click();
				//}

				if( ( e.keycode || e.which ) == 219){	//size down
					$('#tool_size').slider('value',tool.size-0.5);
					//if(tool.size>0)tool.size-=0.5;
					//refreshTool(tool);
				}
				if( ( e.keycode || e.which ) == 221){	//size up
					$('#tool_size').slider('value',tool.size+0.5);
				}
				if( ( e.keycode || e.which ) == 188){	//opacity down
					$('#tool_opacity').slider('value',tool.opacity-1);
				}
				if( ( e.keycode || e.which ) == 190){	//opacity up
					$('#tool_opacity').slider('value',tool.opacity+1);
				}

				if( ( e.keycode || e.which ) == 67){	//colordex
					$('#colordex_radio').click();
				}

				if( ( e.keycode || e.which ) == 88){	//swap colors
					var rgb1 = {r:mouse.rgb.r,g:mouse.rgb.g,b:mouse.rgb.b}, rgb2 = {r:mouse.rgb2.r,g:mouse.rgb2.g,b:mouse.rgb2.b};
					//var group1 = colorGroup, group2 = colorGroup2;
					var swap = function (x){return x};
					colorGroup2 = swap(colorGroup, colorGroup=colorGroup2);
					mouse.basergba2 = swap(mouse.basergba, mouse.basergba=mouse.basergba2);
					mouse.baseuprgba2 = swap(mouse.baseuprgba, mouse.baseuprgba=mouse.baseuprgba2);
					//c = swap(a, a=b, b=c);
					var currentC = mouse.currentColor;
					//var currentCg = currentColorGroup;
					mouse.currentColor = 0;
					eyedropColor({r:rgb2.r,g:rgb2.g,b:rgb2.b});
					mouse.currentColor = 1;
					eyedropColor({r:rgb1.r,g:rgb1.g,b:rgb1.b});
					mouse.currentColor = currentC;
					if(mouse.currentColor==0)eyedropColor({r:rgb2.r,g:rgb2.g,b:rgb2.b});	//make sure we still have the correct color selected

					var groupIcons = {sx:$("#colordex_start").css('left'),sy:$("#colordex_start").css('top'),ex:$("#colordex_end").css('left'),ey:$("#colordex_end").css('top'),ux:$("#colordex_endup").css('left'),uy:$("#colordex_endup").css('top')};
					var groupIcons2 = {sx:$("#colordex2_start").css('left'),sy:$("#colordex2_start").css('top'),ex:$("#colordex2_end").css('left'),ey:$("#colordex2_end").css('top'),ux:$("#colordex2_endup").css('left'),uy:$("#colordex2_endup").css('top')};
					$("#colordex_start").css({'left':groupIcons2.sx,'top':groupIcons2.sy});
					$("#colordex2_start").css({'left':groupIcons.sx,'top':groupIcons.sy});
					$("#colordex_end").css({'left':groupIcons2.ex,'top':groupIcons2.ey});
					$("#colordex2_end").css({'left':groupIcons.ex,'top':groupIcons.ey});
					$("#colordex_endup").css({'left':groupIcons2.ux,'top':groupIcons2.uy});
					$("#colordex2_endup").css({'left':groupIcons.ux,'top':groupIcons.uy});
				}

				if( ( e.keycode || e.which ) == 86){	//secondary viewport
					$('#mini_container').toggle();
					if(typeof(Storage) !== 'undefined')localStorage.mini_container = $('#mini_container').css('display') ;
				}

				if(approveContinue()){	//helps keep peers in sync
					if( ( e.keycode || e.which ) == 37){	//left arrow key
						myHistory[0].selectionoffset.x--;
						myHistory[0].selectionclip.x--;
						myHistory[0].selectionclip.x2--;
					}
					if( ( e.keycode || e.which ) == 38){	//up arrow key
						myHistory[0].selectionoffset.y--;
						myHistory[0].selectionclip.y--;
						myHistory[0].selectionclip.y2--;
					}
					if( ( e.keycode || e.which ) == 39){	//right arrow key
						myHistory[0].selectionoffset.x++;
						myHistory[0].selectionclip.x++;
						myHistory[0].selectionclip.x2++;
					}
					if( ( e.keycode || e.which ) == 40){	//down arrow key
						myHistory[0].selectionoffset.y++;
						myHistory[0].selectionclip.y++;
						myHistory[0].selectionclip.y2++;
					}
				}
			}

			if( ( e.keycode || e.which ) == 49){	//1
				document.getElementById("preset1").click();
			}
			if( ( e.keycode || e.which ) == 50){	//2
				document.getElementById("preset2").click();
			}
			if( ( e.keycode || e.which ) == 51){	//3
				document.getElementById("preset3").click();
			}
			if( ( e.keycode || e.which ) == 52){	//4
				document.getElementById("preset4").click();
			}
			if( ( e.keycode || e.which ) == 53){	//5
				document.getElementById("preset5").click();
			}
			if( ( e.keycode || e.which ) == 54){	//6
				document.getElementById("preset6").click();
			}
			if( ( e.keycode || e.which ) == 55){	//7
				document.getElementById("preset7").click();
			}
			if( ( e.keycode || e.which ) == 56){	//8
				document.getElementById("preset8").click();
			}
			if( ( e.keycode || e.which ) == 57){	//9
				document.getElementById("preset9").click();
			}
			if( ( e.keycode || e.which ) == 48){	//0
				document.getElementById("preset0").click();
			}

			e.preventDefault();
		}

		if (key.timer && key.held==1){
			key.held = 2;
			clearTimeout(key.timer);
			key.timer=false;
		}

	}, false);

	document.documentElement.addEventListener('keyup', function (e) {
		clearTimeout(key.timer);
        key.timer=false;
		key.held=0;

		if ( $(document.activeElement).prop('type') == 'text' ){

		}else if(( e.keycode || e.which ) == 32) {
			key.spacebar = false;
			$('#canvas').css('cursor','crosshair');
			$('#minicanvas').css('cursor','crosshair');
			if(mouse.left==false)tool.preventdraw=false;
			//e.preventDefault();
		}

		var selectiontool = (mouse.tool=='lasso' || mouse.tool=='marquee' || mouse.tool=='magicwand' ? true : false);

		if(key.ctrl==true && (e.ctrlKey==false && e.metaKey==false) ){
			$('#canvas').css('cursor',(key.spacebar==true?'url(img/cursor-hand.png),crosshair':'crosshair') );
			$('#minicanvas').css('cursor',(key.spacebar==true?'url(img/cursor-hand.png),crosshair':'crosshair') );
		}
		key.ctrl=(e.ctrlKey || e.metaKey);
		if(key.alt==true && e.altKey==false){
			$('#canvas').css('cursor',(key.spacebar==true?'url(img/cursor-hand.png),crosshair': (selectiontool==true && key.ctrl==true?'url(img/cursor-cut.png),crosshair':(selectiontool==true && key.shift==true?'url(img/cursor-add.png) 7 7,crosshair':'crosshair')) ) );
			$('#minicanvas').css('cursor',(key.spacebar==true?'url(img/cursor-hand.png),crosshair': (selectiontool==true && key.ctrl==true?'url(img/cursor-cut.png),crosshair':(selectiontool==true && key.shift==true?'url(img/cursor-add.png) 7 7,crosshair':'crosshair')) ) );
		}
		key.alt=e.altKey;
		if(key.shift==true && e.shiftKey==false){
			$('#canvas').css('cursor',(selectiontool==true && key.alt==true?'url(img/cursor-subtract.png) 7 7,crosshair':'crosshair') );
			$('#minicanvas').css('cursor',(selectiontool==true && key.alt==true?'url(img/cursor-subtract.png) 7 7,crosshair':'crosshair') );
		}
		key.shift=e.shiftKey;

		if(( e.keycode || e.which ) == 61 || ( e.keycode || e.which ) == 173 ||
		( e.keycode || e.which ) == 187 || ( e.keycode || e.which ) == 189 ) {
			tool.zoomstop=false;
		}

		if(approveContinue()){	//helps keep peers in sync
			if( ( e.keycode || e.which ) == 37 || ( e.keycode || e.which ) == 38 ||
			( e.keycode || e.which ) == 39 || ( e.keycode || e.which ) == 40){	//arrow keys
				send_select_move(myHistory[0].selectionoffset);
			}
		}

	}, false);

	canvas.pointermove = function(e){
		//alert("ATTENTION pointer events are now available!");
	}

	canvas.onmousedown = function(e){
		var left, right, middle;
		left = 0;
		middle = 1;
		right = 2;

		canvas.focus();

		if(e.button === left ){
			mouse.left = true;

			if(key.spacebar==false && tool.preventdraw==false && project.lock==false && animation.state==false){
				var finalx = Math.floor((mouse.pos.x - tool.offset.x)/tool.zoom);
				var finaly = Math.floor((mouse.pos.y - tool.offset.y)/tool.zoom);
				var lastfinalx = Math.floor((mouse.lastpos.x - tool.offset.x)/tool.zoom);
				var lastfinaly = Math.floor((mouse.lastpos.y - tool.offset.y)/tool.zoom);
				if(key.shift==true){
					lastfinalx = mouse.lastclick.x;
					lastfinaly = mouse.lastclick.y;
					mouse.lastclick.x = finalx;
					mouse.lastclick.y = finaly;
				}else{
					mouse.lastclick.x = finalx;
					mouse.lastclick.y = finaly;
				}

				updatePen();
				var t = {size:tool.size,opacity:tool.opacity,hardness:tool.hardness,levels:tool.levels,pressure:tool.pressure,tilt:tool.tilt,pen:tool.pen,dither:tool.dither};

				if(myHistory[0].setclip==true && myHistory[0].selectionclipped==false){
					myHistory[0].clip.x = Math.min(project.width, Math.max(0,finalx)), myHistory[0].clip.y = Math.min(project.height, Math.max(0,finaly));
					myHistory[0].clip.x2 = Math.max(1,Math.min(project.width, finalx)), myHistory[0].clip.y2 = Math.max(1,Math.min(project.height, finaly));
					myHistory[0].setclip=false;
				}


				if( $('#canvas').css('cursor')=='crosshair'){

					if(mouse.tool=="eraser"){
						commitHistory(myHistory[0].id);
						erase_line(project.contextlayer[project.currentframe],lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,myHistory[0].id);
						if(mouse.context!=palettecontext)send_eraser_line(lastfinalx,lastfinaly,finalx,finaly,mouse.color,t);
					}

					if(mouse.tool=="magiceraser" && tool.brushing==false){
						commitHistory(myHistory[0].id);
						var cGroup = (currentColorGroup==0?colorGroup:colorGroup2);
						var cGbase = (currentColorGroup==0?mouse.basergba:mouse.basergba2);
						var cGbaseup = (currentColorGroup==0?mouse.baseuprgba:mouse.baseuprgba2);
						tool.brushing=true;
						magiceraser_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t, cGbase, cGbaseup, myHistory[0].id);
						send_magiceraser_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t,cGbase,cGbaseup);
					}

					if(mouse.tool=="pencil"){
						commitHistory(myHistory[0].id);
						var mouseColor = (mouse.currentColor==0?mouse.color:mouse.color2);
						pixel_line(project.contextlayer[project.currentframe],lastfinalx,lastfinaly,finalx,finaly,mouseColor,t,myHistory[0].id);
						send_pixel_line(lastfinalx,lastfinaly,finalx,finaly,mouseColor,t);
					}

					if(mouse.tool=="brush" && tool.brushing==false){
						commitHistory(myHistory[0].id);
						var cGroup = (currentColorGroup==0?colorGroup:colorGroup2);
						var cGbase = (currentColorGroup==0?mouse.basergba:mouse.basergba2);
						var cGbaseup = (currentColorGroup==0?mouse.baseuprgba:mouse.baseuprgba2);
						tool.brushing=true;
						brush_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t, cGbase, cGbaseup, myHistory[0].id);
						send_brush_line(lastfinalx,lastfinaly,finalx,finaly,cGroup,t,cGbase,cGbaseup);
					}

					if(mouse.tool=="bucket"){
						commitHistory(myHistory[0].id);
						var contiguous = ($("#contiguous").next('label').attr('aria-pressed')=='true'? true:false);
						floodFill(project.contextlayer[project.currentframe],{x:finalx,y:finaly},mouse.rgb,contiguous,myHistory[0].id);
						send_flood_fill(finalx,finaly,mouse.rgb,contiguous);
					}

				}

				if(mouse.tool=="eyedropper" || $('#canvas').css('cursor').indexOf('eyedropper')>=0 ){
					eyedropColor(mouse.colorbelow);
				}
				if(mouse.tool=="zoom"){
					zoomIn();
				}

				if(mouse.tool=="magicwand"){
					if(approveContinue()){	//helps keep peers in sync
						if(!key.ctrl){
							var pixel = myHistory[0].selectionmaskcontext.getImageData(finalx-(myHistory[0].selectionoffset.x),finaly-(myHistory[0].selectionoffset.y),1,1);
							if(key.alt || key.shift || pixel.data[3]==0){
								if(key.alt || key.shift){
									if(key.shift && !key.alt)myHistory[0].selectiontype = "add";
									else if(key.alt && !key.shift)myHistory[0].selectiontype = "subtract";
									else if(key.alt && key.shift)myHistory[0].selectiontype = "intersect";
									if(finalx < myHistory[0].selectionclip.x)myHistory[0].selectionclip.x = finalx;
									if(finaly < myHistory[0].selectionclip.y)myHistory[0].selectionclip.y = finaly;
									if(finalx > myHistory[0].selectionclip.x2)myHistory[0].selectionclip.x2 = finalx;
									if(finaly > myHistory[0].selectionclip.y2)myHistory[0].selectionclip.y2 = finaly;
								}else{
									if(myHistory[0].selectionhandle.state==0){
										myHistory[0].selectiontype = "new";
										if(myHistory[0].selectionclipped==true){
											commitHistory(myHistory[0].id);
											selectPasteClip(myHistory[0].id);
											send_select_paste();
											selectClearClip(myHistory[0].id);
											send_select_clear();
										}else{
											selectClearClip(myHistory[0].id);
											send_select_clear();
										}
										myHistory[0].selectionclip.x = finalx, myHistory[0].selectionclip.y = finaly;
										myHistory[0].selectionclip.x2 = finalx, myHistory[0].selectionclip.y2 = finaly;
									}else{
										myHistory[0].selectionhandle.state = 2;	//now we're resizing the selection
										myHistory[0].selectionstate = "resize";
									}
								}
								if(myHistory[0].selectionhandle.state==0){
									var copyclip = myHistory[0].selectionclip;
									var contiguous = ($("#contiguous").next('label').attr('aria-pressed')=='true'? true:false);
									magicWand((mouse.canvas==palettecanvas?palettecontext:project.contextlayer[project.currentframe]),{x:finalx,y:finaly},myHistory[0].selectiontype,contiguous,myHistory[0].id);
									if(mouse.context!=palettecontext)send_magic_wand(finalx,finaly,myHistory[0].selectiontype,copyclip,contiguous);
									//myHistory[0].selectionclipcontext.drawImage(myHistory[0].canvas,0,0);
									myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
									//console.log(myHistory[0].selectionclip.x+","+myHistory[0].selectionclip.y+","+myHistory[0].selectionclip.x2+","+myHistory[0].selectionclip.y2);
								}
							}else{
								//move selection(without the content moving)
								myHistory[0].selectionstate = "move";
							}


						}else{
							commitHistory(myHistory[0].id);
							myHistory[0].selectionstate = "move";

							//if clearing section, keep backup of what was there so we can pass to historylist(so we can restore it).
							var backupcanvas = document.createElement("canvas");
							backupcanvas.width = project.width;
							backupcanvas.height = project.height;
							var backupcontext = backupcanvas.getContext("2d");
							backupcontext.drawImage(project.canvaslayer[project.currentframe],0,0);

							myHistory[0].selectionsetclip = true;
							selectClip(myHistory[0].id);
							var type = "cut";
							if(!key.alt){
								myHistory[0].context.drawImage(myHistory[0].selectionclipcanvas,myHistory[0].selectionoffset.x,myHistory[0].selectionoffset.y);

								claimHistory(myHistory[0].id,myHistory[0].canvas);
								myHistory[0].layers.push(new historylayerdata("Clip",myHistory[0].canvas,myHistory[0],true,backupcanvas) );
								project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
								project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
								project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';
							}else{
								type = "copy";
								myHistory[0].context.drawImage(myHistory[0].selectionclipcanvas,myHistory[0].selectionoffset.x,myHistory[0].selectionoffset.y);

								claimHistory(myHistory[0].id,myHistory[0].canvas);
								myHistory[0].layers.push(new historylayerdata("Clip",myHistory[0].canvas,myHistory[0],true,backupcanvas) );
								project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
							}
							myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
							send_select_clip(type);

						}
					}
				}

				if(mouse.tool=="lasso" || mouse.tool=="marquee"){
					if(approveContinue()){	//helps keep peers in sync
						if(!key.ctrl){
							var pixel = myHistory[0].selectionmaskcontext.getImageData(finalx-(myHistory[0].selectionoffset.x),finaly-(myHistory[0].selectionoffset.y),1,1);
							if(key.alt || key.shift || pixel.data[3]==0){
								myHistory[0].selectionpoints = [];
								myHistory[0].clip.x = finalx, myHistory[0].clip.y = finaly;
								myHistory[0].clip.x2 = finalx, myHistory[0].clip.y2 = finaly;
								if(key.alt || key.shift){
									if(key.shift && !key.alt)myHistory[0].selectiontype = "add";
									else if(key.alt && !key.shift)myHistory[0].selectiontype = "subtract";
									else if(key.alt && key.shift)myHistory[0].selectiontype = "intersect";
									myHistory[0].selectionpoints.push( {x:finalx,y:finaly} );
									if(finalx < myHistory[0].selectionclip.x)myHistory[0].selectionclip.x = finalx;
									if(finaly < myHistory[0].selectionclip.y)myHistory[0].selectionclip.y = finaly;
									if(finalx > myHistory[0].selectionclip.x2)myHistory[0].selectionclip.x2 = finalx;
									if(finaly > myHistory[0].selectionclip.y2)myHistory[0].selectionclip.y2 = finaly;
								}else{
									if(myHistory[0].selectionhandle.state==0 && myHistory[0].rotation.state==0){
										myHistory[0].selectiontype = "new";
										if(myHistory[0].selectionclipped==true){
											commitHistory(myHistory[0].id);
											selectPasteClip(myHistory[0].id);
											send_select_paste();
											selectClearClip(myHistory[0].id);
											send_select_clear();
										}else{
											selectClearClip(myHistory[0].id);
											send_select_clear();
										}
										myHistory[0].rotation.degree = 0;
										myHistory[0].rotation.radian = 0;
										myHistory[0].rotation.flipv = 1;
										myHistory[0].rotation.fliph = 1;
										myHistory[0].rotation.lastflipv = 1;
										myHistory[0].rotation.lastfliph = 1;
										myHistory[0].selectionpoints.push( {x:finalx,y:finaly} );
										myHistory[0].selectionclip.x = finalx, myHistory[0].selectionclip.y = finaly;
										myHistory[0].selectionclip.x2 = finalx, myHistory[0].selectionclip.y2 = finaly;
									}else if(myHistory[0].selectionhandle.state==1 && myHistory[0].rotation.state==0){
										myHistory[0].selectionhandle.state = 2;	//now we're resizing the selection
										myHistory[0].selectionstate = "resize";
										myHistory[0].selectionclip.ow = myHistory[0].selectionclip.w;
										myHistory[0].selectionclip.oh = myHistory[0].selectionclip.h;
									}else if(myHistory[0].rotation.state==1){
										myHistory[0].rotation.state = 2;	//now we're rotating the selection
										myHistory[0].selectionstate = "rotate";
										if(typeof(myHistory[0].rotateWorker) !== "undefined") myHistory[0].rotateWorker.terminate();
										myHistory[0].rotateWorkerRunning = false;
									}
								}
								if(mouse.tool=="marquee"){
									myHistory[0].selectionpoints.push( {x:finalx,y:finaly} );
									myHistory[0].selectionpoints.push( {x:finalx,y:finaly} );
									myHistory[0].selectionpoints.push( {x:finalx,y:finaly} );
								}
							}else{
								//move selection(without the content moving)
								myHistory[0].selectionstate = "move";
							}
						}else{
							commitHistory(myHistory[0].id);
							myHistory[0].selectionstate = "move";

							//if(myHistory[0].selectionclipped==false){

								//if clearing section, keep backup of what was there so we can pass to historylist(so we can restore it).
								var backupcanvas = document.createElement("canvas");
								backupcanvas.width = project.width;
								backupcanvas.height = project.height;
								var backupcontext = backupcanvas.getContext("2d");
								backupcontext.drawImage(project.canvaslayer[project.currentframe],0,0);

								myHistory[0].selectionsetclip = true;
								selectClip(myHistory[0].id);
								var type = "cut";
								if(!key.alt){
									myHistory[0].context.drawImage(myHistory[0].selectionclipcanvas,myHistory[0].selectionoffset.x,myHistory[0].selectionoffset.y);

									claimHistory(myHistory[0].id,myHistory[0].canvas);
									myHistory[0].layers.push(new historylayerdata("Clip",myHistory[0].canvas,myHistory[0],true,backupcanvas) );
									project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
									project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
									project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';
								}else{
									type = "copy";
									myHistory[0].context.drawImage(myHistory[0].selectionclipcanvas,myHistory[0].selectionoffset.x,myHistory[0].selectionoffset.y);

									claimHistory(myHistory[0].id,myHistory[0].canvas);
									myHistory[0].layers.push(new historylayerdata("Clip",myHistory[0].canvas,myHistory[0],true,backupcanvas) );
									project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
								}
								myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
								send_select_clip(type);

							//}
						}
					}
				}
			}else{
				if($('#canvas').css('cursor').indexOf('img/cursor-zoomin.png')>=0 )zoomIn();
				else if($('#canvas').css('cursor').indexOf('img/cursor-zoomout.png')>=0 )zoomOut();
			}
		}
		else if(e.button === right){
			mouse.right = true;

			if(key.spacebar==false && tool.preventdraw==false){

				if(mouse.tool=="zoom"){
					zoomOut();
				}
			}
		}
		else if(e.button === middle){
			mouse.middle = true;

		}

		e.preventDefault();
	}

	canvas.onmouseup = function(e){
		var left, right, middle;
		left = 0;
		middle = 1;
		right = 2;

		getMousePos(canvas, e);
		resetPen();
		mouse.direction=0;

		//if(mouse.pos.x!=mouse.lastpos.x || mouse.pos.y!=mouse.lastpos.y)mouse.dragged = false;

		if(e.button === left){
			mouse.left = false;

			updatePen();
			myHistory[0].setclip=true;

			if(tool.preventdraw==false && project.lock==false && animation.state==false){
				if( $('#canvas').css('cursor')=='crosshair'){

					if(mouse.tool=="eraser"){
						myHistory[0].layers.push(new historylayerdata("Eraser",myHistory[0].canvas,myHistory[0]) );
						project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
						project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
						project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';
						myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
						send_eraser_clear();
					}else if(mouse.tool=="magiceraser" && tool.brushing==true){
						tool.brushing=false;
						myHistory[0].layers.push(new historylayerdata("Magic Eraser",myBrush[0].previewcanvas,myHistory[0]) );
						project.contextlayer[project.currentframe].drawImage(myBrush[0].previewcanvas,0,0);
						myBrush[0].context.clearRect(0, 0, myBrush[0].canvas.width, myBrush[0].canvas.height);
						myBrush[0].previewcontext.clearRect(0, 0, myBrush[0].previewcanvas.width, myBrush[0].previewcanvas.height);
						send_magiceraser_clear();
						project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
						project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
						project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';
						myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
						send_eraser_clear();
					}else if(mouse.tool=="pencil"){

						myHistory[0].layers.push(new historylayerdata("Pencil",myHistory[0].canvas,myHistory[0]) );
						project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
						myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
						send_pixel_clear();
						//contextlayer.fillStyle = "rgba(0,0,0,1)";
						//contextlayer.fillRect( mouse.pos.x, mouse.pos.y, 1, 1 );
						//send_pixel(mouse.pos.x,mouse.pos.y,'rgba(0,0,0,1)');
					}else if(mouse.tool=="brush" && tool.brushing==true){
						tool.brushing=false;
						myHistory[0].layers.push(new historylayerdata("Brush",myBrush[0].previewcanvas,myHistory[0]) );
						project.contextlayer[project.currentframe].drawImage(myBrush[0].previewcanvas,0,0);
						myBrush[0].context.clearRect(0, 0, myBrush[0].canvas.width, myBrush[0].canvas.height);
						myBrush[0].previewcontext.clearRect(0, 0, myBrush[0].previewcanvas.width, myBrush[0].previewcanvas.height);
						send_brush_clear();
					}else if(mouse.tool=="bucket"){
						//if(myHistory[0].clip.x!=myHistory[0].clip.x2 || myHistory[0].clip.y!=myHistory[0].clip.y2){
							myHistory[0].layers.push(new historylayerdata("Bucket",myHistory[0].canvas,myHistory[0]) );
							project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
							myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
							send_bucket_clear();
						//}
					}

				}

				if(approveContinue()){	//helps keep peers in sync
					if(mouse.tool=="lasso" || mouse.tool=="marquee"){
						myHistory[0].selectionsetclip = false;
						if(myHistory[0].selectionstate=="" && myHistory[0].selectionpoints.length>0){
							if(mouse.tool=="marquee"){
								myHistory[0].selectionpoints.forEach( function(entry){
									if(entry.x < myHistory[0].selectionclip.x)myHistory[0].selectionclip.x = entry.x;
									if(entry.y < myHistory[0].selectionclip.y)myHistory[0].selectionclip.y = entry.y;
									if(entry.x > myHistory[0].selectionclip.x2)myHistory[0].selectionclip.x2 = entry.x;
									if(entry.y > myHistory[0].selectionclip.y2)myHistory[0].selectionclip.y2 = entry.y;
								});
							}
							if(myHistory[0].selectionclip.x!=myHistory[0].selectionclip.x2 && myHistory[0].selectionclip.y!=myHistory[0].selectionclip.y2){

								type = myHistory[0].selectiontype;//(key.shift?"add":(key.alt?"subtract":"new"));
								if(type=="new"){
									//myHistory[0].selectionoffset = {x:0,y:0};
								}else{
								}
								myHistory[0].selectionpoints.forEach( function(entry){
									entry.x -= (myHistory[0].selectionclip.x);
									entry.y -= (myHistory[0].selectionclip.y);
								});
								selectLasso(myHistory[0].id, type );
								//myHistory[0].selectionstate = "selecting";
								send_select_lasso(type, myHistory[0].selectionpoints, myHistory[0].selectionclip);
								myHistory[0].selectionpoints = [];
							}
						}else if(myHistory[0].selectionstate=="move"){
							myHistory[0].selectionoffset.x += myHistory[0].snap.x;
							myHistory[0].selectionoffset.y += myHistory[0].snap.y;
							myHistory[0].selectionclip.x += myHistory[0].snap.x;
							myHistory[0].selectionclip.y += myHistory[0].snap.y;
							myHistory[0].selectionclip.x2 += myHistory[0].snap.x;
							myHistory[0].selectionclip.y2 += myHistory[0].snap.y;
							myHistory[0].snap.x =0;
							myHistory[0].snap.y =0;

							send_select_move(myHistory[0].selectionoffset);
							myHistory[0].selectionstate = "";
						}else if(myHistory[0].selectionstate=="resize"){
							send_resize_clip(myHistory[0].selectionoffset,myHistory[0].selectionclip,myHistory[0].resize,myHistory[0].selectionhandle);
							if(myHistory[0].rotation.degree==0)resizeClip(myHistory[0].id,(myHistory[0].resize.alt ? true : false) );
							send_refresh_clip(myHistory[0].selectionclip);
							if(myHistory[0].rotation.degree==0)selectClip(myHistory[0].id,true);
							myHistory[0].selectionhandle.state = 0;
							myHistory[0].selectionstate = "";
							if(myHistory[0].rotation.degree!=0){
								//rotateClipFast(myHistory[0].id);
								startRotate(myHistory[0].id,null,(myHistory[0].resize.alt ? true : false));
							}
						}else if(myHistory[0].selectionstate=="rotate"){
							myHistory[0].rotation.state = 0;
							myHistory[0].selectionstate = "";
							startRotate(myHistory[0].id,null,true);
							//rotateClip(myHistory[0].id);
						}
					}else if(mouse.tool=="magicwand"){
						myHistory[0].selectionsetclip = false;
						if(myHistory[0].selectionstate=="move"){
							myHistory[0].selectionoffset.x += myHistory[0].snap.x;
							myHistory[0].selectionoffset.y += myHistory[0].snap.y;
							myHistory[0].selectionclip.x += myHistory[0].snap.x;
							myHistory[0].selectionclip.y += myHistory[0].snap.y;
							myHistory[0].selectionclip.x2 += myHistory[0].snap.x;
							myHistory[0].selectionclip.y2 += myHistory[0].snap.y;
							myHistory[0].snap.x =0;
							myHistory[0].snap.y =0;

							send_select_move(myHistory[0].selectionoffset);
							myHistory[0].selectionstate = "";
						}else if(myHistory[0].selectionstate=="resize"){
							send_resize_clip(myHistory[0].selectionoffset,myHistory[0].selectionclip,myHistory[0].resize,myHistory[0].selectionhandle);
							send_refresh_clip(myHistory[0].selectionclip);
							resizeClip(myHistory[0].id);
							selectClip(myHistory[0].id,true);
							myHistory[0].selectionhandle.state = 0;
							myHistory[0].selectionstate = "";
						}
					}
				}
			}
		}
		else if(e.button === right){
			mouse.right = false;
		}
		else if(e.button === middle){
			mouse.middle = false;

		}

		if(key.spacebar==false)tool.preventdraw=false;
		mouse.dragged=false;
	}

	canvas.onmouseover = function (e) {
		mouse.canvas = canvas;
		mouse.context = context;
		var input = $(document.activeElement).is("input");
		if(input==false)canvas.focus();
	};

	canvas.onmouseout = function (e) {

		resetPen();
		myHistory[0].setclip=true;
		mouse.direction=0;

		if(tool.preventdraw==false && project.lock==false && animation.state==false){
			if( $('#canvas').css('cursor')=='crosshair'){

				if(mouse.tool=="eraser" && mouse.left==true){
					myHistory[0].layers.push(new historylayerdata("Eraser",myHistory[0].canvas,myHistory[0]) );
					project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
					project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
					project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';
					myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
					send_eraser_clear();
				}else if(mouse.tool=="magiceraser" && tool.brushing==true){
					tool.brushing=false;
					myHistory[0].layers.push(new historylayerdata("Magic Eraser",myBrush[0].previewcanvas,myHistory[0]) );
					project.contextlayer[project.currentframe].drawImage(myBrush[0].previewcanvas,0,0);
					myBrush[0].context.clearRect(0, 0, myBrush[0].canvas.width, myBrush[0].canvas.height);
					myBrush[0].previewcontext.clearRect(0, 0, myBrush[0].previewcanvas.width, myBrush[0].previewcanvas.height);
					send_magiceraser_clear();
					project.contextlayer[project.currentframe].globalCompositeOperation = 'destination-out';
					project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
					project.contextlayer[project.currentframe].globalCompositeOperation = 'source-over';
					myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
					send_eraser_clear();
				}else if(mouse.tool=="pencil" && mouse.left==true){

					myHistory[0].layers.push(new historylayerdata("Pencil",myHistory[0].canvas,myHistory[0]) );
					project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
					myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
					send_pixel_clear();
					//contextlayer.fillStyle = "rgba(0,0,0,1)";
					//contextlayer.fillRect( mouse.pos.x, mouse.pos.y, 1, 1 );
					//send_pixel(mouse.pos.x,mouse.pos.y,'rgba(0,0,0,1)');
				}else if(mouse.tool=="brush" && tool.brushing==true){
					tool.brushing=false;
					myHistory[0].layers.push(new historylayerdata("Brush",myBrush[0].previewcanvas,myHistory[0]) );
					project.contextlayer[project.currentframe].drawImage(myBrush[0].previewcanvas,0,0);
					myBrush[0].context.clearRect(0, 0, myBrush[0].canvas.width, myBrush[0].canvas.height);
					myBrush[0].previewcontext.clearRect(0, 0, myBrush[0].previewcanvas.width, myBrush[0].previewcanvas.height);
					send_brush_clear();
				}else if(mouse.tool=="bucket" && mouse.left==true){
					//if(myHistory[0].clip.x!=myHistory[0].clip.x2 || myHistory[0].clip.y!=myHistory[0].clip.y2){
						myHistory[0].layers.push(new historylayerdata("Bucket",myHistory[0].canvas,myHistory[0]) );
						project.contextlayer[project.currentframe].drawImage(myHistory[0].canvas,0,0);
						myHistory[0].context.clearRect(0, 0, myHistory[0].canvas.width, myHistory[0].canvas.height);
						send_bucket_clear();
					//}
				}

			}

			if(approveContinue()){	//helps keep peers in sync
				if((mouse.tool=="lasso" || mouse.tool=="marquee") && mouse.left==true){
					myHistory[0].selectionsetclip = false;
					if(myHistory[0].selectionstate=="" && myHistory[0].selectionpoints.length>0){
						if(mouse.tool=="marquee"){
							myHistory[0].selectionpoints.forEach( function(entry){
								if(entry.x < myHistory[0].selectionclip.x)myHistory[0].selectionclip.x = entry.x;
								if(entry.y < myHistory[0].selectionclip.y)myHistory[0].selectionclip.y = entry.y;
								if(entry.x > myHistory[0].selectionclip.x2)myHistory[0].selectionclip.x2 = entry.x;
								if(entry.y > myHistory[0].selectionclip.y2)myHistory[0].selectionclip.y2 = entry.y;
							});
						}
						if(myHistory[0].selectionclip.x!=myHistory[0].selectionclip.x2 && myHistory[0].selectionclip.y!=myHistory[0].selectionclip.y2){

							type = myHistory[0].selectiontype;//(key.shift?"add":(key.alt?"subtract":"new"));
							if(type=="new"){
								//myHistory[0].selectionoffset = {x:0,y:0};
							}else{
							}
							myHistory[0].selectionpoints.forEach( function(entry){
								entry.x -= (myHistory[0].selectionclip.x);
								entry.y -= (myHistory[0].selectionclip.y);
							});
							selectLasso(myHistory[0].id, type );
							//myHistory[0].selectionstate = "selecting";
							send_select_lasso(type, myHistory[0].selectionpoints, myHistory[0].selectionclip);
							myHistory[0].selectionpoints = [];
						}
					}else if(myHistory[0].selectionstate=="move"){
						myHistory[0].selectionoffset.x += myHistory[0].snap.x;
						myHistory[0].selectionoffset.y += myHistory[0].snap.y;
						myHistory[0].selectionclip.x += myHistory[0].snap.x;
						myHistory[0].selectionclip.y += myHistory[0].snap.y;
						myHistory[0].selectionclip.x2 += myHistory[0].snap.x;
						myHistory[0].selectionclip.y2 += myHistory[0].snap.y;
						myHistory[0].snap.x =0;
						myHistory[0].snap.y =0;

						send_select_move(myHistory[0].selectionoffset);
						myHistory[0].selectionstate = "";
					}else if(myHistory[0].selectionstate=="resize"){
						send_resize_clip(myHistory[0].selectionoffset,myHistory[0].selectionclip,myHistory[0].resize,myHistory[0].selectionhandle);
						if(myHistory[0].rotation.degree==0)resizeClip(myHistory[0].id,(myHistory[0].resize.alt ? true : false) );
						send_refresh_clip(myHistory[0].selectionclip);
						if(myHistory[0].rotation.degree==0)selectClip(myHistory[0].id,true);
						myHistory[0].selectionhandle.state = 0;
						myHistory[0].selectionstate = "";
						if(myHistory[0].rotation.degree!=0){
							//rotateClipFast(myHistory[0].id);
							startRotate(myHistory[0].id,null,(myHistory[0].resize.alt ? true : false));
						}
					}else if(myHistory[0].selectionstate=="rotate"){
						myHistory[0].rotation.state = 0;
						myHistory[0].selectionstate = "";
						startRotate(myHistory[0].id,null,true);
						//rotateClip(myHistory[0].id);
					}
				}else if(mouse.tool=="magicwand" && mouse.left==true){
					myHistory[0].selectionsetclip = false;
					if(myHistory[0].selectionstate=="move"){
						myHistory[0].selectionoffset.x += myHistory[0].snap.x;
						myHistory[0].selectionoffset.y += myHistory[0].snap.y;
						myHistory[0].selectionclip.x += myHistory[0].snap.x;
						myHistory[0].selectionclip.y += myHistory[0].snap.y;
						myHistory[0].selectionclip.x2 += myHistory[0].snap.x;
						myHistory[0].selectionclip.y2 += myHistory[0].snap.y;
						myHistory[0].snap.x =0;
						myHistory[0].snap.y =0;

						send_select_move(myHistory[0].selectionoffset);
						myHistory[0].selectionstate = "";
					}else if(myHistory[0].selectionstate=="resize"){
						send_resize_clip(myHistory[0].selectionoffset,myHistory[0].selectionclip,myHistory[0].resize,myHistory[0].selectionhandle);
						resizeClip(myHistory[0].id);
						send_refresh_clip(myHistory[0].selectionclip);
						selectClip(myHistory[0].id,true);
						myHistory[0].selectionhandle.state = 0;
						myHistory[0].selectionstate = "";
					}
				}
			}
		}

		mouse.left = false;
		mouse.right = false;
		mouse.middle = false;
		if(key.spacebar==false)tool.preventdraw=false;

	};

	canvas.onmousemove = function (e) {

		getMousePos(canvas, e);//windowToCanvas(canvas, e.clientX, e.clientY);


		if(mouse.left){
			updatePen();
			mouse.dragged = true;
		}
		//send_my_position();

		if(mouse.focus==true){
			mouse.focus = false;
			canvas.focus();
		}

		e.preventDefault();
	};

	canvas.onclick = function(e){


	};

	//ONCLICK DOESNT DETECT RIGHT CLICKS BECAUSE RIGHTCLICKS CALL THE ONCONTEXTMENU EVENT INSTEAD.. preventdefault stops the menu from showing
	canvas.oncontextmenu = function (e) {

		e.preventDefault();
	};
}

/*function floodFill(c, ctx, point, COLOR)	//vals is imgdata, point is start point, seedcolor is color we're grouping, color is new color?
{
	var imgData=ctx.getImageData(0, 0, c.width, c.height);
    //for (var i=0;i<imgData.data.length;i+=4)
    //{
    //    imgData.data[i]= rgb[0] | imgData.data[i];
   //     imgData.data[i+1]= rgb[1] | imgData.data[i+1];
    //    imgData.data[i+2]= rgb[2] | imgData.data[i+2];
    //}
    //ctx.putImageData(imgData,0,0);


    var h = c.height;
    var w = c.width;

    if (point.y < 0 || point.y > h - 1 || point.x < 0 || point.x > w - 1)
    	return;

	var SEED_COLOR = ctx.getImageData(point.x, point.y, 1, 1);

    var stack = new Array();
    stack.push(point);
    while (stack.length > 0)
    {
    	var p = stack.pop();
    	var x = p.x;
    	var y = p.y;
    	if (y < 0 || y > h - 1 || x < 0 || x > w - 1)
    		continue;
    	var val = [ imgData.data[((y*w)+x)*4],imgData.data[(((y*w)+x)*4)+1],imgData.data[(((y*w)+x)*4)+2],imgData.data[(((y*w)+x)*4)+3] ];	//rgba of x,y

    	if (val[0] == SEED_COLOR.data[0] &&
		val[1] == SEED_COLOR.data[1] &&
		val[2] == SEED_COLOR.data[2] &&
		val[3] == SEED_COLOR.data[3] )
    	{
    		imgData.data[(((y*w)+x)*4)] = COLOR.r;
    		imgData.data[(((y*w)+x)*4)+1] = COLOR.g;
    		imgData.data[(((y*w)+x)*4)+2] = COLOR.b;
    		imgData.data[(((y*w)+x)*4)+3] = 255;
    		stack.push( {x:(x + 1), y:y} );
    		stack.push( {x:(x - 1), y:y} );
    		stack.push( {x:x, y:(y + 1)} );
    		stack.push( {x:x, y:(y - 1)} );
    	}
    }

    ctx.putImageData(imgData,0,0);
	//ctx.drawImage(c,0,0);
}
*/

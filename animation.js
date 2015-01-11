

var animation = new animationdata();
function animationdata() {
	this.state = false;		//true; playing animation
	this.timer;		//used for timing when to call function to progress animation to next frame
	this.frame = 0;
	this.counter = 0;
	
	this.start = function(){
		this.frame = $("#frame_null").siblings(':eq('+animation.counter+')').attr('value');
		this.state = true;
		
		if(this.frame==null || this.frame<0 || this.frame>project.frames-1){
			this.state = false;
			document.getElementById("frame_play").click(); 
			return;
		}
		if(project.visible[this.frame]==false && linkVisible()==false)animationCycle();
		else
			this.timer = setTimeout(function() { animationCycle(); }, document.getElementById($("#frame_null").siblings(':eq('+animation.counter+')').attr('id')).dataset.interval );
	};
	
	this.stop = function(){
		this.state = false;
		clearTimeout(this.timer);
		this.counter = project.frames-1;
		this.frame = $("#frame_null").siblings(':eq('+animation.counter+')').attr('value');
	};
}

function linkVisible(){
	var animframe = animation.frame;
	do{
		if( $("#frame_null").siblings('[value="'+animframe+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
			animframe = $("#frame_null").siblings('[value="'+animframe+'"]').prev().attr('value');
			if(project.visible[animframe]==true)return true;
		}else animframe = -1;
	}while(animframe!=-1);

	return false;
}

function animationCycle() { 

	var animframe = animation.frame;
	var skip = 1;
	do{
		if( $("#frame_null").siblings('[value="'+animframe+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
			animframe = $("#frame_null").siblings('[value="'+animframe+'"]').prev().attr('value');
			skip++;
		}else animframe = -1;
	}while(animframe!=-1);
	
	animation.counter -= skip; 
	
	if(animation.counter<0)animation.counter=project.frames-1; 
	
	animation.start(); 
}


function recordingdata() {
	this.session = [ {width:1, height:1, frameorder:[], frameinterval:[], framevisible:[], frameopacity:[], framelinked:[], canvasdata:[], peerlist:[0], version:'1.0.1', actionlist:['start']} ];		//list of objects with arrays { starting canvases, peer array, actions }
}

function playbackdata() {
	this.state = false;		
	this.timer;		
	this.speed = 30;
	this.session= 0;
	this.action= 0;
	this.imagesloading=0;	//number of remaining images loading
	this.keyframe = [];	//where each session starts
	this.canvasdata = [];	//list of canvasdata(what the final result looks like)
	
	this.gif = null;	//used to record the playback to a gif if we want to
	this.crop = { x:0,y:0, w:1, h:1 };
	
	this.start = function(){
		this.state = true;
		
		if(this.action<0 || this.action>project.recording.session[this.session].actionlist.length-1){
			this.state = false;
			return;
		}
		
		this.timer = setTimeout(function() { playbackCycle(); }, this.speed );
	};
	
	this.stop = function(){
		this.state = false;
		clearTimeout(this.timer);
	};
}

function playbackCycle() { 
	playbackDraw();
	
	if($("#playback_slider a:first").hasClass('ui-state-active')==false)$("#playback_slider").slider('value',project.playback.keyframe[project.playback.session]+project.playback.action);
			
	project.playback.action++; 
	if(project.playback.action>project.recording.session[project.playback.session].actionlist.length-1){
		project.playback.session++;
		project.playback.action=0;
	}
	if(project.playback.session>project.recording.session.length-1){
		project.playback.session=0;
		project.playback.stop();
		return;
	}
		
	
	if(project.playback.imagesloading==0 && myHistory[0].rotation.playback!=true && resizeLayersPause!=true)	project.playback.start(); 
}

function resetSessionFrames(s){
	project.width = project.recording.session[s].width;
	project.height = project.recording.session[s].height;
	
	project.frames = project.recording.session[s].canvasdata.length;
	
	project.canvaslayer = [];
	project.contextlayer = new Array(project.frames);
	project.thumbnails = new Array(project.frames);
	project.thumbnailscontext = new Array(project.frames);
	project.visible = new Array(project.frames);
	project.opacity = new Array(project.frames);
	for(var i=0; i<project.frames; i++){
		project.canvaslayer.push( document.createElement('canvas') );
		project.canvaslayer[i].width = project.width;
		project.canvaslayer[i].height = project.height;
		project.contextlayer[i] = project.canvaslayer[i].getContext('2d');			
		project.contextlayer[i] = reload_canvas( project.canvaslayer[i], project.contextlayer[i] );
	
		project.visible[i] = project.recording.session[s].framevisible.length>i ? project.recording.session[s].framevisible[i] : true;
		$("#frame_"+i ).find('img').attr('src', (project.visible[i]==true? 'eye-open.png' : 'eye-shut.png') ).attr('title', (project.visible[i]==true? 'Visible' : 'Hidden') );
		project.opacity[i] = project.recording.session[s].frameopacity.length>i ? project.recording.session[s].frameopacity[i] : 1;
			
	}
	
	//project.visible = project.recording.session[s].framevisible;
	//project.opacity = project.recording.session[s].frameopacity;
	
	project.setupFramelist();
	
	for(var i=0; i<project.frames; i++){
		var theframe = $("#frame_"+i);
		theframe.attr('data-interval',project.recording.session[s].frameinterval[i]);
		theframe.find('.frame_interval').html(project.recording.session[s].frameinterval[i]*0.001);
		theframe.find('.frame_visible').attr('src','eye-'+(project.recording.session[s].framevisible[i]==false?'shut':'open')+'.png');
		theframe.find('.frame_linker').css('background-image','url(icon-'+(project.recording.session[s].framelinked[i]==false?'un':'')+'linked.png)');
	}
	
	project.recording.session[s].frameorder.forEach(function(entry){
		$("#frame_list").append( $('#frame_'+entry) );
	});
	
	//canvas size may change, so be sure to refresh these
	updatecanvas.width=project.width;
	updatecanvas.height=project.height;
	updatecontext = updatecanvas.getContext('2d');
	
	temp2canvas = document.createElement("canvas");
	temp2canvas.width = project.width;
	temp2canvas.height = project.height;
	temp2context = temp2canvas.getContext('2d');
	temp2context = reload_canvas(temp2canvas, temp2context);
}

function playbackDraw() { 
	var data = jQuery.extend(true, {}, project.recording.session[project.playback.session].actionlist[project.playback.action]);
	//var data = project.recording.session[project.playback.session].actionlist[project.playback.action];
	//if(project.playback.action==0)console.log(data);
	if(project.playback.action==0){
		project.playback.stop();	//stop the playback while images load
		/*if(project.frames!=project.recording.session[project.playback.session].canvasdata.length ||
			project.width!=project.recording.session[project.playback.session].width ||
			project.height!=project.recording.session[project.playback.session].height ){
			resetSessionFrames(project.playback.session);
		}*/
			resetSessionFrames(project.playback.session);
		project.playback.imagesloading = project.recording.session[project.playback.session].canvasdata.length;
		project.recording.session[project.playback.session].canvasdata.forEach(function(entry){
			var img = new Image()
			img.onload = function(){
				project.contextlayer[project.recording.session[project.playback.session].canvasdata.indexOf(entry)].clearRect(0,0, project.width, project.height);
				project.contextlayer[project.recording.session[project.playback.session].canvasdata.indexOf(entry)].drawImage(this,0,0);
				project.playback.imagesloading--;
				if(project.playback.imagesloading==0){
					project.recording.session[project.playback.session].frameorder.forEach(function(entry){
						$("#frame_list").append( $('#frame_'+entry) );
					});
					project.playback.stop();
					project.playback.start();
				}
			};
			img.src = entry;
		});
		clearHistory(myHistory[0].id);
		historylist=[];
		brushlayers=[];
		project.clip = {x:0,y:0,w:0,h:0};
		if(project.recording.session[project.playback.session].canvasdata.length==0){
			project.contextlayer.forEach(function(entry){
				entry.clearRect(0,0, project.width, project.height);
			});
			project.lock=true;
			project.playback.state = true;
		}
		project.recording.session[project.playback.session].frameorder.forEach(function(entry){
			$("#frame_list").append( $('#frame_'+entry) );
		});
		//make sure to add all the canvases for each peer in this session so that all the actions work smoothly
		addPeerCanvases();
	}else{
		if(data.type=="eraser_line"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			if(peerhistory[0].setclip==true){
				peerhistory[0].clip.x = data.ex, peerhistory[0].clip.y = data.ey;
				peerhistory[0].clip.x2 = data.ex, peerhistory[0].clip.y2 = data.ey;
			}
			peerhistory[0].setclip = false;
			commitHistory(data.peer);
			erase_line(project.contextlayer[data.frame], data.sx, data.sy, data.ex, data.ey, data.color, data.t, data.peer);
		}else if(data.type=="draw_magiceraser_line"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			//check if we should add new canvas layer
			var peerlayer = $.grep(brushlayers, function(e){ return e.id == data.peer; });
			if(peerlayer.length==0){
				brushlayers.push(new brushlayerdata(data.peer,data.frame) );
			}else{
				peerlayer[0].frame = data.frame;
			}
			if(peerhistory[0].setclip==true){
				peerhistory[0].clip.x = data.ex, peerhistory[0].clip.y = data.ey;
				peerhistory[0].clip.x2 = data.ex, peerhistory[0].clip.y2 = data.ey;
			}
			peerhistory[0].setclip = false;
			commitHistory(data.peer);
			if(project.recording.session[project.playback.session].version=='1.0.0')
				v1_0_0_magiceraser_line(data.sx, data.sy, data.ex, data.ey, data.groups, data.t, data.basergba, data.peer);
			else 
				magiceraser_line(data.sx, data.sy, data.ex, data.ey, data.groups, data.t, data.basergba, data.baseuprgba, data.peer);
		}else if(data.type=="draw_pixel_line"){
			//check if we should add new historylist for peer
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==0){
				historylist.push(new historydata(data.peer,data.frame) );
				peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
				peerhistory[0].frame = data.frame;
				//historylist[historylist.length-1].frame = data.frame;
			}else{
				peerhistory[0].frame = data.frame;
			}
			if(peerhistory[0].setclip==true){
				peerhistory[0].clip.x = data.ex, peerhistory[0].clip.y = data.ey;
				peerhistory[0].clip.x2 = data.ex, peerhistory[0].clip.y2 = data.ey;
			}
			peerhistory[0].setclip = false;
			commitHistory(data.peer);
			pixel_line(project.contextlayer[data.frame], data.sx, data.sy, data.ex, data.ey, data.color, data.t, data.peer);
		}else if(data.type=="draw_brush_line"){
			//check if we should add new historylist for peer
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==0){
				historylist.push(new historydata(data.peer,data.frame) );
				peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
				peerhistory[0].frame = data.frame;
			}else{
				peerhistory[0].frame = data.frame;
			}
			//check if we should add new canvas layer
			var peerlayer = $.grep(brushlayers, function(e){ return e.id == data.peer; });
			if(peerlayer.length==0){
				brushlayers.push(new brushlayerdata(data.peer,data.frame) );
			}else{
				peerlayer[0].frame = data.frame;
			}
			if(peerhistory[0].setclip==true){
				peerhistory[0].clip.x = data.ex, peerhistory[0].clip.y = data.ey;
				peerhistory[0].clip.x2 = data.ex, peerhistory[0].clip.y2 = data.ey;
			}
			peerhistory[0].setclip = false;
			commitHistory(data.peer);
			if(project.recording.session[project.playback.session].version=='1.0.0')
				v1_0_0_brush_line(data.sx, data.sy, data.ex, data.ey, data.groups, data.t, data.basergba, data.baseuprgba, data.peer);
			else 
				brush_line(data.sx, data.sy, data.ex, data.ey, data.groups, data.t, data.basergba, data.baseuprgba, data.peer);
		}else if(data.type=="draw_flood_fill"){
			//check if we should add new historylist for peer
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==0){
				historylist.push(new historydata(data.peer,data.frame) );
				peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
				peerhistory[0].frame = data.frame;
			}else{
				peerhistory[0].frame = data.frame;
			}
			if(peerhistory[0].setclip==true){
				peerhistory[0].clip.x = data.pos.x, peerhistory[0].clip.y = data.pos.y;
				peerhistory[0].clip.x2 = data.pos.x, peerhistory[0].clip.y2 = data.pos.y;
			}
			peerhistory[0].setclip = false;
			commitHistory(data.peer);
			floodFill(project.contextlayer[data.frame], data.pos, data.color, data.contiguous, data.peer);
		}else if(data.type=="draw_pixel_clear"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==1){
				peerhistory[0].setclip = true;
				//first save into historylist for this peer
				peerhistory[0].layers.push(new historylayerdata("",peerhistory[0].canvas,peerhistory[0]) );
				//then add to main canvas and clear from layer
				project.contextlayer[peerhistory[0].frame].drawImage(peerhistory[0].canvas,0,0);
				peerhistory[0].context.clearRect(0,0,peerhistory[0].canvas.width,peerhistory[0].canvas.height);
			}
		}else if(data.type=="draw_brush_clear"){
			var peerlayer = $.grep(brushlayers, function(e){ return e.id == data.peer; });
			if(peerlayer.length==1){
				var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
				peerhistory[0].setclip = true;
				//first save into historylist for this peer
				peerhistory[0].layers.push(new historylayerdata("",peerlayer[0].previewcanvas,peerhistory[0]) );
				//then add to main canvas and clear from layer
				project.contextlayer[peerlayer[0].frame].drawImage(peerlayer[0].previewcanvas,0,0);
				peerlayer[0].context.clearRect(0,0,peerlayer[0].canvas.width,peerlayer[0].canvas.height);
				peerlayer[0].previewcontext.clearRect(0,0,peerlayer[0].previewcanvas.width,peerlayer[0].previewcanvas.height);
			}
		}else if(data.type=="draw_bucket_clear"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==1){
				peerhistory[0].setclip = true;
				//first save into historylist for this peer
				peerhistory[0].layers.push(new historylayerdata("",peerhistory[0].canvas,peerhistory[0]) );
				//then add to main canvas and clear from layer
				project.contextlayer[peerhistory[0].frame].drawImage(peerhistory[0].canvas,0,0);
				peerhistory[0].context.clearRect(0,0,peerhistory[0].canvas.width,peerhistory[0].canvas.height);
			}
		}else if(data.type=="eraser_clear"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==1){
				peerhistory[0].setclip = true;
				//first save into historylist for this peer
				peerhistory[0].layers.push(new historylayerdata("",peerhistory[0].canvas,peerhistory[0]) );
				//then add to main canvas and clear from layer
				project.contextlayer[peerhistory[0].frame].globalCompositeOperation = 'destination-out';
				project.contextlayer[peerhistory[0].frame].drawImage(peerhistory[0].canvas,0,0);
				project.contextlayer[peerhistory[0].frame].globalCompositeOperation = 'source-over';
				peerhistory[0].context.clearRect(0,0,peerhistory[0].canvas.width,peerhistory[0].canvas.height);
			}
		}else if(data.type=="draw_magiceraser_clear"){
			var peerlayer = $.grep(brushlayers, function(e){ return e.id == data.peer; });
			if(peerlayer.length==1){
				var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
				peerhistory[0].setclip = true;
				//first save into historylist for this peer
				peerhistory[0].layers.push(new historylayerdata("",peerlayer[0].previewcanvas,peerhistory[0]) );
				//then add to main canvas and clear from layer
				project.contextlayer[peerlayer[0].frame].drawImage(peerlayer[0].previewcanvas,0,0);
				peerlayer[0].context.clearRect(0,0,peerlayer[0].canvas.width,peerlayer[0].canvas.height);
				peerlayer[0].previewcontext.clearRect(0,0,peerlayer[0].previewcanvas.width,peerlayer[0].previewcanvas.height);
				project.contextlayer[peerhistory[0].frame].globalCompositeOperation = 'destination-out';
				project.contextlayer[peerhistory[0].frame].drawImage(peerhistory[0].canvas,0,0);
				project.contextlayer[peerhistory[0].frame].globalCompositeOperation = 'source-over';
				peerhistory[0].context.clearRect(0,0,peerhistory[0].canvas.width,peerhistory[0].canvas.height);
			}
		}else if(data.type=="select_magic_wand"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			peerhistory[0].selectionclip = data.clip;
			//commitHistory(data.peer);
			magicWand(project.contextlayer[data.frame], data.pos, data.selecttype, data.contiguous, data.peer);
			peerhistory[0].context.clearRect(0, 0, peerhistory[0].canvas.width, peerhistory[0].canvas.height);
		}else if(data.type=="select_lasso"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			//commitHistory(data.peer);
			peerhistory[0].selectionpoints = data.points;
			peerhistory[0].selectionclip = data.clip;
			selectLasso(data.peer, data.selecttype);
		}else if(data.type=="select_move"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			//commitHistory(data.peer);
			peerhistory[0].selectionoffset = data.offset;
			peerhistory[0].selectionclip = data.clip;
		}else if(data.type=="select_flip"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			flipSelection(data.peer,data.flip);
		}else if(data.type=="select_rotate"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			rotateSelection(data.peer,data.rotate);
		}else if(data.type=="copy_selection"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			copySelection(data.peer);
		}else if(data.type=="paste_selection"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			pasteSelection(data.peer);
		}else if(data.type=="select_paste"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			commitHistory(data.peer);
			selectPasteClip(data.peer);
		}else if(data.type=="select_clear"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			//commitHistory(data.peer);
			peerhistory[0].selectionclip = {x:0,y:0,x2:0,y2:0,w:0,h:0};
			selectClearClip(data.peer);
		}else if(data.type=="clip_clear"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			//commitHistory(data.peer);
			peerhistory[0].selectionclipcontext.clearRect(0, 0, peerhistory[0].selectionclipcanvas.width, peerhistory[0].selectionclipcanvas.height);
			peerhistory[0].selectionclipped = false;
		}else if(data.type=="select_clip"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			commitHistory(data.peer);
			
			//if clearing section, keep backup of what was there so we can pass to historylist(so we can restore it).
			var backupcanvas = document.createElement("canvas");
			backupcanvas.width = project.width;
			backupcanvas.height = project.height;
			var backupcontext = backupcanvas.getContext("2d");
			backupcontext.drawImage(project.canvaslayer[data.frame],0,0);
						
			selectClip(data.peer);
			if(data.selecttype=="cut"){
				peerhistory[0].context.drawImage(peerhistory[0].selectionclipcanvas,peerhistory[0].selectionoffset.x,peerhistory[0].selectionoffset.y);
				
				claimHistory(data.peer,peerhistory[0].canvas);
				peerhistory[0].layers.push(new historylayerdata("",peerhistory[0].canvas,peerhistory[0],true,backupcanvas) );
				project.contextlayer[data.frame].globalCompositeOperation = 'destination-out';
				project.contextlayer[data.frame].drawImage(peerhistory[0].canvas,0,0);
				project.contextlayer[data.frame].globalCompositeOperation = 'source-over';
			}else{
				peerhistory[0].context.drawImage(peerhistory[0].selectionclipcanvas,peerhistory[0].selectionoffset.x,peerhistory[0].selectionoffset.y);
				
				claimHistory(data.peer,peerhistory[0].canvas);
				peerhistory[0].layers.push(new historylayerdata("",peerhistory[0].canvas,peerhistory[0],true,backupcanvas) );
				project.contextlayer[data.frame].drawImage(peerhistory[0].canvas,0,0);
			}
			peerhistory[0].context.clearRect(0, 0, peerhistory[0].canvas.width, peerhistory[0].canvas.height);
							
		}else if(data.type=="resize_clip"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			peerhistory[0].selectionoffset = data.offset;
			peerhistory[0].selectionclip = data.clip;
			peerhistory[0].resize = data.resize;
			peerhistory[0].selectionhandle = data.handle;
			resizeClip(data.peer,(peerhistory[0].resize.alt ? true : false) );
		}else if(data.type=="refresh_clip"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].frame = data.frame;
			peerhistory[0].selectionclip = data.clip;
			selectClip(data.peer,true);
		}else if(data.type=="history_select"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			if(peerhistory.length==1)
				peerhistory[0].selected = data.num;
		}else if(data.type=="history_clear"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			//peerhistory[0].selected = data.num;
			//console.log(peerhistory[0].selected);
			//console.log(peerhistory[0].layers.length);
			commitHistory(peerhistory[0].id);
			clearHistory(peerhistory[0].id);
			peerhistory[0].layers.push(new historylayerdata("New",peerhistory[0].canvas,peerhistory[0]) );
		}else if(data.type=="remove_frame"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			removeFrame(data.frame);
		}else if(data.type=="add_frame"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			addFrame(data.frame);
		}else if(data.type=="order_frames"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			data.order.forEach(function(entry){
				$("#frame_list").append( $('#frame_'+entry) );
			});
		}else if(data.type=="frame_interval"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			$('#frame_null').siblings('[value="'+data.frame+'"]').attr('data-interval',data.interval);
			$('#frame_null').siblings('[value="'+data.frame+'"]').find('.frame_interval').html(data.interval*0.001);
		}else if(data.type=="toggle_visible"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			project.visible[data.frame] = data.visible;
			$('#frame_null').siblings('[value="'+data.frame+'"]').find('.frame_visible').attr('src',(data.visible!=true?'eye-shut.png':'eye-open.png'));
		}else if(data.type=="toggle_linked"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			$('#frame_null').siblings('[value="'+data.frame+'"]').find('.frame_linker').css('background-image','url(icon-'+(data.linked==false?'un':'')+'linked.png)');
		}else if(data.type=="frame_opacity"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			project.opacity[data.frame] = data.opacity;
		}else if(data.type=="resize_image"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			resizeImage(data.width,data.height );
		}else if(data.type=="resize_canvas"){
			//var peerhistory = $.grep(historylist, function(e){ return e.id == c.peer; });
			resizeCanvas(data.width,data.height,data.direction );
		}else if(data.type=="start_rotation"){
		
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			peerhistory[0].rotation = data.rotation;
			peerhistory[0].selectionclip = data.clip;
			startRotate(peerhistory[0].id,null,data.center);
		}else if(data.type=="unlock_rotation"){
			myHistory[0].rotatedPeers++;
			//console.log(peerlist.length+","+myHistory[0].rotatedPeers);
			if(myHistory[0].rotatedPeers >= peerlist.length){
				myHistory[0].rotation.state = 0;
				myHistory[0].rotatedPeers = 0;
				send_select_move(myHistory[0].selectionoffset);
			}
		}else if(data.type=="save_resize"){
			resizeLayers = new resizeLayersData();
			resizeLayers.getOrder();
			project.canvaslayer.forEach(function(entry){
				resizeLayers.layer.push(entry.toDataURL() );
			});
		}else if(data.type=="add_resize_undo"){
			addResizeUndo();
		}else if(data.type=="undo_resize"){
			revertResize();
		}else if(data.type=="load_clipart"){
			var peerhistory = $.grep(historylist, function(e){ return e.id == data.peer; });
			
			var img = new Image()
			img.onload = function(){
				peerhistory[0].selectionclipcontext.clearRect(0,0, peerhistory[0].selectionclipcanvas.width, peerhistory[0].selectionclipcanvas.height);
				peerhistory[0].selectionclipcanvas.width = this.width;
				peerhistory[0].selectionclipcanvas.height = this.height;
				peerhistory[0].selectionclipcontext.drawImage(this,0,0);
				peerhistory[0].selectionmaskcanvas.width = this.width;
				peerhistory[0].selectionmaskcanvas.height = this.height;
				
				selectClip(peerhistory[0].id);
				peerhistory[0].selectionclip.x = peerhistory[0].selectionoffset.x;
				peerhistory[0].selectionclip.y = peerhistory[0].selectionoffset.y;
				peerhistory[0].selectionhandle.state = 0;
				peerhistory[0].selectionstate = "";
				
			};
			img.src = data.clipart;
			
		}else if(data.type=="unlock_waiting"){
			project.waiting++;
			if(project.waiting >= peerlist.length){
				project.wait = false;
				project.waiting = 0;
				send_select_move(myHistory[0].selectionoffset);
			}
		}
	}
}

function addPeerCanvases(){
	project.recording.session[project.playback.session].peerlist.forEach(function(entry){
		var peerhistory = $.grep(historylist, function(e){ return e.id == entry; });
		if(peerhistory.length==0){
			historylist.push(new historydata(entry,0) );
			//clearHistory(historylist[0].id);
			//console.log(historylist[0].id);
		}else{
			clearHistory(peerhistory[0].id);
			//console.log(peerhistory[0].selectionmaskcanvas.width);
		}
		var peerlayer = $.grep(brushlayers, function(e){ return e.id == entry; });
		if(peerlayer.length==0){
			brushlayers.push(new brushlayerdata(entry,0) );
		}
	});
}

function exportPlaybackGif(filename){
	if(project.playback.gif==null)return;
	
		
	project.playback.gif.on('finished', function(blob) {
		//window.open(URL.createObjectURL(blob));
		e = document.createEvent('MouseEvents'),
        a = document.createElement('a')
		
        a.download = filename+'.gif'
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['image/gif', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
		
		project.playback.gif._events={};
		//console.save(blob, filename+'.gif', 'image/gif');
	});
	
	project.playback.gif.on('progress', function(p) {
		$("#record_progressbar").progressbar('value',Math.floor(p*100) );
	});

	if(project.playback.gif.running==true)project.playback.gif.finishRendering();
	else project.playback.gif.render();
}

function newFromPlayback(){
	if(project.playback.action!=0 || project.playback.session!=0){
		project.playback.stop();
		project.recording.session[project.playback.session].actionlist.length = project.playback.action+1;
		project.recording.session.length = project.playback.session+1;
		
		historylist.forEach(function(entry){
			commitHistory(entry.id);
			clearHistory(entry.id);
		});
		historylist=[];
		brushlayers=[];
		historylist.push(new historydata(0,0));
		myHistory= $.grep(historylist, function(e){ return e.id == 0; });
		brushlayers.push(new brushlayerdata(0,0));
		myBrush= $.grep(brushlayers, function(e){ return e.id == 0; });
		
		var canvasdata = [];
		var intervaldata = new Array(project.frames);
		var linkeddata = new Array(project.frames);
		var frameorder = new Array(project.frames);
		project.canvaslayer.forEach(function(entry){
			canvasdata.push(entry.toDataURL() );
			intervaldata[project.canvaslayer.indexOf(entry)] = $("#frame_"+project.canvaslayer.indexOf(entry) ).attr('data-interval');
			linkeddata[project.canvaslayer.indexOf(entry)] = ( $("#frame_"+project.canvaslayer.indexOf(entry) ).find('.frame_linker').attr('style').indexOf('-linked')!==-1 ? true : false );
			frameorder[project.canvaslayer.indexOf(entry)] = $("#frame_null").siblings(':eq('+project.canvaslayer.indexOf(entry)+')').attr('value');
		});
	
		project.recording.session.push( {width:project.width, height:project.height, frameorder:frameorder, frameinterval:intervaldata, framevisible:project.visible, frameopacity:project.opacity, framelinked:linkeddata, canvasdata:canvasdata, peerlist:[0], version:'1.0.0', actionlist:['start']} );
		project.lock = false;
		$("#colorpicker_container").show();
		$("#playback_container").hide();
		$("#record_container").hide();
	}
}

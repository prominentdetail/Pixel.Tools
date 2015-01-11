
var myHistory;
var historylist = [];
function historydata(id, frame){
	this.id = id;
	this.frame = frame;
	this.selected = -1;
	this.layers = [];	//this will hold a list of objects that contain historylist so that user can undo their actions.
	this.clip = {x:-1,y:-1,w:0,h:0};
	this.setclip = true;
	
	this.draw = true	//false; subtract from image(eraser)
	this.erase = false	//true; subtract from image(eraser)
	this.canvas = document.createElement('canvas');		//the canvas we'll use if we're penciling or whatever(so we can record the entire stroke)
	this.canvas.width=project.width;
	this.canvas.height=project.height;
	this.context = this.canvas.getContext('2d');
	
	this.selectionstate = "";
	this.selectiontype = "";
	this.selectionhandle = {x:0,y:0,state:0};	//1 if mouse hovering over resize handle.. 2 onmousedown..
	this.rotation = {x:0,y:0,degree:0,radian:0,state:0,sx:0,sy:0,dp:0,ex:0,ey:0,rx:0,ry:0,corners:[],originalcorners:[],w:0,h:0,lastw:0,lasth:0,flipv:1,fliph:1,lastflipv:1,lastfliph:1};
	this.rotateWorker;
	this.rotateWorkerRunning = false;
	this.rotatedPeers = 0;		//record of peers that have completed the rotation, when this matches number of peers we're connected to, unlock editing.
	this.resize = {x:0,y:0,ox:0,oy:0,oldx:0,oldy:0,oldx2:0,oldy2:0,oldoffsetx:0,oldoffsety:0,alt:false};	//the old are previous selectioclip.x stuff
	this.snap = {x:0,y:0};
	this.selectionclipped = false;
	this.selectionoffset = {x:0,y:0};
	this.selectionclip = {x:-1,y:-1,x2:-1,y2:-1,w:0,h:0,ow:0,oh:0};
	this.selectionsetclip = false;
	this.selectioncanvas = document.createElement('canvas');		//the canvas we'll use for selecting parts of drawing
	this.selectioncanvas.width=project.width;
	this.selectioncanvas.height=project.height;
	this.selectioncontext = this.selectioncanvas.getContext('2d');
	this.selectionmaskcanvas = document.createElement('canvas');		//the canvas we'll use for selecting parts of drawing
	this.selectionmaskcanvas.width=project.width;
	this.selectionmaskcanvas.height=project.height;
	this.selectionmaskcontext = this.selectionmaskcanvas.getContext('2d');
	this.selectionclipcanvas = document.createElement('canvas');		//the canvas we'll use for selecting parts of drawing
	this.selectionclipcanvas.width=project.width;
	this.selectionclipcanvas.height=project.height;
	this.selectionclipcontext = this.selectionclipcanvas.getContext('2d');
	this.selectionpoints = [];
	this.resizecanvas = document.createElement('canvas');		//the canvas we'll use for selecting parts of drawing
	this.resizecanvas.width=project.width;
	this.resizecanvas.height=project.height;
	this.resizecontext = this.resizecanvas.getContext('2d');
	this.trace = [];
	
	this.copycanvas = document.createElement('canvas');		//If we copy, cut a selection- it'll get saved to this canvas for use when we paste
	this.copycanvas.width=project.width;
	this.copycanvas.height=project.height;
	this.copycontext = this.copycanvas.getContext('2d');
	
	this.init = function(){
		this.layers.push(new historylayerdata("New", this.canvas, this) );
		
	}
	
	this.init();
}

function historylayerdata(label, c, peerhistory, clear, backupcanvas){	//if clear is true, this means this layer is blank: ie- we've cleared a part of the canvas and shouldn't be recording anything. We still need to make a mask though for historylist purposes)
	this.label = label;
	this.frame = peerhistory.frame;		//the frame that this action corresponds to.
	this.canvas = document.createElement('canvas');
	this.canvas.width=project.width;
	this.canvas.height=project.height;
	this.context = this.canvas.getContext('2d');
	this.maskcanvas = document.createElement('canvas');
	this.maskcanvas.width=project.width;
	this.maskcanvas.height=project.height;
	this.maskcontext = this.maskcanvas.getContext('2d');
	
	this.clip = {x:-1,y:-1,w:0,h:0};
	
	this.init = function(){
	
		this.clip = {x:peerhistory.clip.x,y:peerhistory.clip.y,w:peerhistory.clip.x2-peerhistory.clip.x,h:peerhistory.clip.y2-peerhistory.clip.y};
		
		//first make mask of the action (to use for erasing)
		this.maskcontext.fillStyle="red";
		this.maskcontext.fillRect(0,0, this.canvas.width,this.canvas.height);
		this.maskcontext.globalCompositeOperation = 'destination-in';
		this.maskcontext.drawImage(c, 0,0);
		this.maskcontext.globalCompositeOperation = 'source-over';
		
		//make part that will record the historylist (grab what is under the stroke we're making)
		if(!clear || clear==false){
			this.context.drawImage(project.canvaslayer[this.frame], 0,0);
			this.context.globalCompositeOperation = 'destination-in';
			this.context.drawImage(c, 0,0);
			this.context.globalCompositeOperation = 'source-over';
		}else if(clear==true){
			//we'll draw whatever canvas is passed in (if we clip a section, we'll be able to undo it)
			this.context.drawImage(backupcanvas, 0,0);
			this.context.globalCompositeOperation = 'destination-in';
			this.context.drawImage(c, 0,0);
			this.context.globalCompositeOperation = 'source-over';
		}
		
		if(this.label!="" && peerhistory.id==0){
			//add new element to the historylist list
			var hl = $('#history_list');
			hl.find('li:first').clone(true).appendTo(hl);
			hl.find('li:last').show()
			.text(this.label)
			.attr('id',"history_"+peerhistory.layers.length )
			.attr('value',peerhistory.layers.length ).css({'font-size':'10px'})
			.siblings().removeClass('ui-state-active');
			hl.find('li:last').toggleClass('ui-state-active');
			
			var div = document.getElementById("history_box");
			div.scrollTop = div.scrollHeight;
		}
		peerhistory.selected = peerhistory.layers.length;
		
		//Okay, so when drawing the scene, cycle through historylist descending order by clearing the mask area and drawing the other (destination-out then source-over)
		//until selected historylist item is reached.
		
		//if we hit the undo limit, remove first historylist, and readjust values in the list
		if(peerhistory.layers.length == project.undos){
			peerhistory.layers.shift();
			if(peerhistory.id == myHistory[0].id){
				$('#history_list li:first').next().remove();
				$('#history_list li:not(:first)').each(function(){ 
					$(this).attr('id','history_'+($(this).attr('value')-1) );
					$(this).attr('value',$(this).attr('value')-1)
				});
			}
		}
	};
	
	this.claimLayer = function(claimcanvas){
		//this function is called by user/peer when they draw onto a historylist of another peer.
		//it will remove part of the mask that was drawn over, and the drawing, so that the peer can't undo that portion(because a new user has control by bringing that portion to the present time).
		//updatecontext.clearRect(0,0,updatecanvas.width,updatecanvas.height);
		//updatecontext.drawImage(this.maskcanvas, 0,0);
		//updatecontext.globalCompositeOperation = 'source-in';
		//updatecontext.drawImage(this.canvas, 0,0);
		//updatecontext.drawImage(claimcanvas, 0,0);
		//updatecontext.globalCompositeOperation = 'source-over';
		//this.context.drawImage(updatecanvas,0,0);
		this.maskcontext.globalCompositeOperation = 'destination-out';
		this.maskcontext.drawImage(claimcanvas,0,0);
		this.maskcontext.globalCompositeOperation = 'source-over';
		this.context.globalCompositeOperation = 'destination-out';
		this.context.drawImage(claimcanvas,0,0);
		this.context.globalCompositeOperation = 'source-over';
		
	}
	
	this.init();
}

function claimHistory(peerid,claimcanvas){
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	historylist.forEach(function(entry){
		if(entry.id!=peerid){
			updatecontext.clearRect(0,0,updatecanvas.width,updatecanvas.height);
			entry.layers.forEach(function(entrylayer){
				if(entrylayer.frame==peerhistory[0].frame)updatecontext.drawImage(entrylayer.maskcanvas, 0,0);
			});
			updatecontext.globalCompositeOperation = 'source-in';
			updatecontext.drawImage(claimcanvas, 0,0);
			updatecontext.globalCompositeOperation = 'source-over';
			entry.layers.forEach(function(entrylayer){
				//updatecontext.drawImage(entrylayer.maskcanvas, 0,0);
				if(entrylayer.frame==peerhistory[0].frame)entrylayer.claimLayer(claimcanvas);
			});
		}
	});
}

function commitHistory(peerid){	
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	//context.drawImage(entry.canvas, 0,0);
	
	if(peerhistory[0].selected!=-1 && peerhistory[0].selected < peerhistory[0].layers.length){
		for(var i=peerhistory[0].layers.length-1; i>peerhistory[0].selected; i--){
			project.contextlayer[peerhistory[0].layers[i].frame].globalCompositeOperation = 'destination-out';
			project.contextlayer[peerhistory[0].layers[i].frame].drawImage(peerhistory[0].layers[i].maskcanvas, 0,0);
			project.contextlayer[peerhistory[0].layers[i].frame].globalCompositeOperation = 'source-over';
			project.contextlayer[peerhistory[0].layers[i].frame].drawImage(peerhistory[0].layers[i].canvas, 0,0);
			if(peerid==myHistory[0].id){
				$("#history_list li[value="+i+"]").remove();
				//var element = document.getElementById("history_"+i);
				//if(element)element.parentNode.removeChild(element);
			}
			peerhistory[0].layers.pop();
		}
	}
	
}

function clearHistory(peerid){
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	peerhistory[0].selected = -1;
	if(peerid==myHistory[0].id){
		$("#history_null").siblings().remove();
		//var element = document.getElementById("history_"+i);
		//if(element)element.parentNode.removeChild(element);
	}
	for(var i=peerhistory[0].layers.length-1; i>peerhistory[0].selected; i--){
		peerhistory[0].layers.pop();
	}
					
}

function erase_line(thecontext,sx,sy,ex,ey,color,t,peerid){		//(start x, start y, end x, end y, color, tool)

	var peerhistory;
	if(peerid!="palette")peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(peerid!="palette"){
		peerhistory[0].draw=false;
		peerhistory[0].erase=true;
	}
	
	//stuff for if there is a selection, to only draw inside it
	var selection = false;
	var maskData;
	if(peerid!="palette"){
		if(peerhistory[0].selectionclip.x!=peerhistory[0].selectionclip.x2 && peerhistory[0].selectionclip.y!=peerhistory[0].selectionclip.y2){
			//console.log(peerhistory[0].selectionclip.x+","+peerhistory[0].selectionclip.x2+","+peerhistory[0].selectionclip.y+","+peerhistory[0].selectionclip.y2);
			selection = true;
			maskData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
		}
	}

	var rgb = color.replace(/[^\d,]/g, '').split(',');
	
	refreshTool(t);
	toolcontext = reload_canvas(toolcanvas, toolcontext);
	
	var c = document.createElement('canvas');
    c.width = toolcanvas.width;
    c.height = toolcanvas.height;
	var halfw = c.width*0.5, halfh = c.height*0.5;
    var ctx = c.getContext('2d');
    ctx.drawImage(toolcanvas, 0, 0);
    var imgData=ctx.getImageData(0, 0, c.width, c.height);
    for (var i=0;i<imgData.data.length;i+=4)
    {
		imgData.data[i]= rgb[0] | imgData.data[i];
        imgData.data[i+1]= rgb[1] | imgData.data[i+1];
        imgData.data[i+2]= rgb[2] | imgData.data[i+2];
        
        if(imgData.data[i+3]>0)imgData.data[i+3]= 255;
		
    }
    ctx.putImageData(imgData,0,0);


	//bresenham's line algorith via wiki
	var x0 = sx;
	var y0 = sy;
	var x1 = ex;
	var y1 = ey;
	var t1 = ex;
	var t2 = ey;
	//function line(x0, x1, y0, y1)
	var steep = 0;
	if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
	if (steep == 1){
		t1 = x0;
		t2 = x1;
		//swap(x0, y0)
		//swap(x1, y1)
		x0 = y0;
		x1 = y1;
		y0 = t1;
		y1 = t2;
	}
	if (x0 > x1){
		t1 = x0;
		t2 = y0;
		//swap(x0, x1)
		//swap(y0, y1)
		x0 = x1;
		y0 = y1;
		x1 = t1;
		y1 = t2;
	}
	var deltax = x1 - x0;
	var deltay = Math.abs(y1 - y0);
	var error = deltax / 2;
	var ystep;
	var y = y0;
	if (y0 < y1){
		ystep = 1;
	} else {
		ystep = -1;
	}
	
	var savederror = error;
	var savedy = y;
	
	y = savedy;
	error = savederror;
	
	for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
		if (steep == 1){
			
			/*			
		if(!peer){		
			//historylist.context.save();
			historylist.context.drawImage(c, (y)-(halfw), (x)-(halfh));
			//historylist.context.restore();
		}else{
			//thecontext.save();
			thecontext.drawImage(c, (y)-(halfw), (x)-(halfh));
			//thecontext.restore();
		}*/
		if(peerid=="palette"){
			thecontext.globalCompositeOperation = 'destination-out';
			thecontext.drawImage(c, (y)-(halfw), (x)-(halfh));
			thecontext.globalCompositeOperation = 'source-over';
		}else{ 
		
			if(selection==true){
				
				if(peerhistory[0].selectionclipped==false){
					for (var cy=0;cy<c.height;cy++){
						for (var cx=0;cx<c.width;cx++){
							if(imgData.data[(((cy*c.width)+cx)*4)+3]==255){
								if(
									(maskData.data[(((((x-halfh+cy)-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((y-halfw+cx)-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
									(y-halfw+cx)<peerhistory[0].selectionclip.x || (y-halfw+cx)>=peerhistory[0].selectionclip.x2 ||
									(x-halfh+cy)<peerhistory[0].selectionclip.y || (x-halfh+cy)>=peerhistory[0].selectionclip.y2)
								)
									continue;
								else{
									peerhistory[0].context.fillStyle = color;
									peerhistory[0].context.fillRect((y)-(halfw)+cx, (x)-(halfh)+cy, 1, 1);
								}
							}
						}
					}
				}
			}else
			peerhistory[0].context.drawImage(c, (y)-(halfw), (x)-(halfh));
					
			if(y-halfw < peerhistory[0].clip.x)peerhistory[0].clip.x = y-halfw;
			if(x-halfh < peerhistory[0].clip.y)peerhistory[0].clip.y = x-halfh;
			if(y-halfw+c.width > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = y-halfw+c.width;
			if(x-halfh+c.height > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = x-halfh+c.height;
		}
					
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (y * editarea.zoom)-(8*editarea.zoom), (x * editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
			*/
		} else {
			
		/*			
		if(!peerid){		
			//historylist.context.save();
			historylist.context.drawImage(c, (x)-(halfw), (y)-(halfh));
			//historylist.context.restore();
		}else{
			//thecontext.save();
			thecontext.drawImage(c, (x)-(halfw), (y)-(halfh));
			//thecontext.restore();
		}*/
		if(peerid=="palette"){
			thecontext.globalCompositeOperation = 'destination-out';
			thecontext.drawImage(c, (x)-(halfw), (y)-(halfh));
			thecontext.globalCompositeOperation = 'source-over';
		}else{
		
			if(selection==true){
				
				if(peerhistory[0].selectionclipped==false){
					for (var cy=0;cy<c.height;cy++){
						for (var cx=0;cx<c.width;cx++){
							if(imgData.data[(((cy*c.width)+cx)*4)+3]==255){
								if(
									(maskData.data[(((((y-halfh+cy)-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((x-halfw+cx)-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
									(x-halfw+cx)<peerhistory[0].selectionclip.x || (x-halfw+cx)>=peerhistory[0].selectionclip.x2 ||
									(y-halfh+cy)<peerhistory[0].selectionclip.y || (y-halfh+cy)>=peerhistory[0].selectionclip.y2)
								)
									continue;
								else{
									peerhistory[0].context.fillStyle = color;
									peerhistory[0].context.fillRect((x)-(halfw)+cx, (y)-(halfh)+cy, 1, 1);
								}
							}
						}
					}
				}
			}else
			peerhistory[0].context.drawImage(c, (x)-(halfw), (y)-(halfh));
		
			if(x-halfw < peerhistory[0].clip.x)peerhistory[0].clip.x = x-halfw;
			if(y-halfh < peerhistory[0].clip.y)peerhistory[0].clip.y = y-halfh;
			if(x-halfw+c.width > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = x-halfw+c.width;
			if(y-halfh+c.height > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = y-halfh+c.height;
		}
		
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (x*editarea.zoom)-(8*editarea.zoom), (y*editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
		*/	
		}
		var error = error - deltay;
		if (error < 0){
			y = y + ystep;
			error = error + deltax;
		}
	}
	
	/*
	if(!peer){		
		//historylist.context.save();
		historylist.context.drawImage(c, (ex)-(halfw), (ey)-(halfh));
		//historylist.context.restore();
	}else{
		//thecontext.save();
		thecontext.drawImage(c, (ex)-(halfw), (ey)-(halfh));
		//thecontext.restore();
	}*/
	if(peerid=="palette"){
		thecontext.globalCompositeOperation = 'destination-out';
		thecontext.drawImage(c, (ex)-(halfw), (ey)-(halfh));
		thecontext.globalCompositeOperation = 'source-over';
	}else{
	
		var check = false;
		if(selection==true){
				
			if(peerhistory[0].selectionclipped==false){
				for (var cy=0;cy<c.height;cy++){
					for (var cx=0;cx<c.width;cx++){
						if(imgData.data[(((cy*c.width)+cx)*4)+3]==255){
							if(
								(maskData.data[(((((ey-halfh+cy)-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((ex-halfw+cx)-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
								(ex-halfw+cx)<peerhistory[0].selectionclip.x || (ex-halfw+cx)>=peerhistory[0].selectionclip.x2 ||
								(ey-halfh+cy)<peerhistory[0].selectionclip.y || (ey-halfh+cy)>=peerhistory[0].selectionclip.y2)
							)
								check = true;
							else{
								peerhistory[0].context.fillStyle = color;
								peerhistory[0].context.fillRect((ex)-(halfw)+cx, (ey)-(halfh)+cy, 1, 1);
							}
						}
					}
				}
			}
		}else
			peerhistory[0].context.drawImage(c, (ex)-(halfw), (ey)-(halfh));
		
		if(ex-halfw < peerhistory[0].clip.x)peerhistory[0].clip.x = ex-halfw;
		if(ey-halfh < peerhistory[0].clip.y)peerhistory[0].clip.y = ey-halfh;
		if(ex-halfw+c.width > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = ex-halfw+c.width;
		if(ey-halfh+c.height > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = ey-halfh+c.height;
		
	}
	
	/*layer_array[current_layer].imagearea.context2De.save();
	layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, marker.epos.x-(8*editarea.zoom), marker.epos.y-(8*editarea.zoom),160,160);
	layer_array[current_layer].imagearea.context2De.restore();
		*/			
	
	//claim over peer historylist states
	if(peerid!="palette")claimHistory(peerhistory[0].id,peerhistory[0].canvas);

}

function pixel_line(thecontext,sx,sy,ex,ey,color,t,peerid){		//(start x, start y, end x, end y, color, tool)

	var peerhistory;
	if(peerid!="palette")peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(peerid!="palette"){
		peerhistory[0].draw=true;
		peerhistory[0].erase=false;
	}
	
	//stuff for if there is a selection, to only draw inside it
	var selection = false;
	var maskData;
	if(peerid!="palette"){
		if(peerhistory[0].selectionclip.x!=peerhistory[0].selectionclip.x2 && peerhistory[0].selectionclip.y!=peerhistory[0].selectionclip.y2){
			//console.log(peerhistory[0].selectionclip.x+","+peerhistory[0].selectionclip.x2+","+peerhistory[0].selectionclip.y+","+peerhistory[0].selectionclip.y2);
			selection = true;
			maskData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
		}
	}

	var rgb = color.replace(/[^\d,]/g, '').split(',');
	
	refreshTool(t);
	toolcontext = reload_canvas(toolcanvas, toolcontext);
	
	var dither = (typeof(t.dither)=='undefined' ? {x:0,y:0} : t.dither );
	
	var c = document.createElement('canvas');
    c.width = toolcanvas.width;
    c.height = toolcanvas.height;
	var halfw = c.width*0.5, halfh = c.height*0.5;
    var ctx = c.getContext('2d');
    ctx.drawImage(toolcanvas, 0, 0);
    var imgData=ctx.getImageData(0, 0, c.width, c.height);
	if(peerid=="palette"){
		for (var i=0;i<imgData.data.length;i+=4)
		{
			imgData.data[i]= rgb[0] | imgData.data[i];
			imgData.data[i+1]= rgb[1] | imgData.data[i+1];
			imgData.data[i+2]= rgb[2] | imgData.data[i+2];
			
			if(imgData.data[i+3]>0)imgData.data[i+3]= 255;
			
		}
		ctx.putImageData(imgData,0,0);
	}

	//bresenham's line algorith via wiki
	var x0 = sx;
	var y0 = sy;
	var x1 = ex;
	var y1 = ey;
	var t1 = ex;
	var t2 = ey;
	//function line(x0, x1, y0, y1)
	var steep = 0;
	if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
	if (steep == 1){
		t1 = x0;
		t2 = x1;
		//swap(x0, y0)
		//swap(x1, y1)
		x0 = y0;
		x1 = y1;
		y0 = t1;
		y1 = t2;
	}
	if (x0 > x1){
		t1 = x0;
		t2 = y0;
		//swap(x0, x1)
		//swap(y0, y1)
		x0 = x1;
		y0 = y1;
		x1 = t1;
		y1 = t2;
	}
	var deltax = x1 - x0;
	var deltay = Math.abs(y1 - y0);
	var error = deltax / 2;
	var ystep;
	var y = y0;
	if (y0 < y1){
		ystep = 1;
	} else {
		ystep = -1;
	}
	
	var savederror = error;
	var savedy = y;
	
	y = savedy;
	error = savederror;
	
	for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
		if (steep == 1){
			
			/*			
		if(!peer){		
			//historylist.context.save();
			historylist.context.drawImage(c, (y)-(halfw), (x)-(halfh));
			//historylist.context.restore();
		}else{
			//thecontext.save();
			thecontext.drawImage(c, (y)-(halfw), (x)-(halfh));
			//thecontext.restore();
		}*/
		if(peerid=="palette")thecontext.drawImage(c, (y)-(halfw), (x)-(halfh));
		else{ 
		
			for (var cy=0;cy<c.height;cy++){
				for (var cx=0;cx<c.width;cx++){
					if(imgData.data[(((cy*c.width)+cx)*4)+3]>0){
						if(selection==true){
				
							if(peerhistory[0].selectionclipped==false){
								if(
									(maskData.data[(((((x-halfh+cy)-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((y-halfw+cx)-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
									(y-halfw+cx)<peerhistory[0].selectionclip.x || (y-halfw+cx)>=peerhistory[0].selectionclip.x2 ||
									(x-halfh+cy)<peerhistory[0].selectionclip.y || (x-halfh+cy)>=peerhistory[0].selectionclip.y2)
								)
									continue;
								else{
									var check = checkDither( imgData.data[(((cy*c.width)+cx)*4)+3], (y)-(halfw)+cx, (x)-(halfh)+cy, dither );
									if(check==true){
										peerhistory[0].context.fillStyle = color;
										peerhistory[0].context.fillRect((y)-(halfw)+cx, (x)-(halfh)+cy, 1, 1);
									}
								}
							}
						}else{
							//peerhistory[0].context.drawImage(c, (y)-(halfw), (x)-(halfh));
							var check = checkDither( imgData.data[(((cy*c.width)+cx)*4)+3], (y)-(halfw)+cx, (x)-(halfh)+cy, dither );
							if(check==true){
								peerhistory[0].context.fillStyle = color;
								peerhistory[0].context.fillRect((y)-(halfw)+cx, (x)-(halfh)+cy, 1, 1);
							}
						}
					}
				}
			}
					
			if(y-halfw < peerhistory[0].clip.x)peerhistory[0].clip.x = y-halfw;
			if(x-halfh < peerhistory[0].clip.y)peerhistory[0].clip.y = x-halfh;
			if(y-halfw+c.width > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = y-halfw+c.width;
			if(x-halfh+c.height > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = x-halfh+c.height;
		}
					
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (y * editarea.zoom)-(8*editarea.zoom), (x * editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
			*/
		} else {
			
		/*			
		if(!peerid){		
			//historylist.context.save();
			historylist.context.drawImage(c, (x)-(halfw), (y)-(halfh));
			//historylist.context.restore();
		}else{
			//thecontext.save();
			thecontext.drawImage(c, (x)-(halfw), (y)-(halfh));
			//thecontext.restore();
		}*/
		if(peerid=="palette")thecontext.drawImage(c, (x)-(halfw), (y)-(halfh));
		else{
			for (var cy=0;cy<c.height;cy++){
				for (var cx=0;cx<c.width;cx++){
					if(imgData.data[(((cy*c.width)+cx)*4)+3]>0){
					
						if(selection==true){
							
							if(peerhistory[0].selectionclipped==false){
								if(
									(maskData.data[(((((y-halfh+cy)-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((x-halfw+cx)-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
									(x-halfw+cx)<peerhistory[0].selectionclip.x || (x-halfw+cx)>=peerhistory[0].selectionclip.x2 ||
									(y-halfh+cy)<peerhistory[0].selectionclip.y || (y-halfh+cy)>=peerhistory[0].selectionclip.y2)
								)
									continue;
								else{
									var check = checkDither( imgData.data[(((cy*c.width)+cx)*4)+3], (x)-(halfw)+cx, (y)-(halfh)+cy, dither );
									if(check==true){
										peerhistory[0].context.fillStyle = color;
										peerhistory[0].context.fillRect((x)-(halfw)+cx, (y)-(halfh)+cy, 1, 1);
									}
								}
							}
						}else{
							//peerhistory[0].context.drawImage(c, (x)-(halfw), (y)-(halfh));
							var check = checkDither( imgData.data[(((cy*c.width)+cx)*4)+3], (x)-(halfw)+cx, (y)-(halfh)+cy, dither );
							if(check==true){
								peerhistory[0].context.fillStyle = color;
								peerhistory[0].context.fillRect((x)-(halfw)+cx, (y)-(halfh)+cy, 1, 1);
							}
						}
					}
				}
			}
		
			if(x-halfw < peerhistory[0].clip.x)peerhistory[0].clip.x = x-halfw;
			if(y-halfh < peerhistory[0].clip.y)peerhistory[0].clip.y = y-halfh;
			if(x-halfw+c.width > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = x-halfw+c.width;
			if(y-halfh+c.height > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = y-halfh+c.height;
		}
		
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (x*editarea.zoom)-(8*editarea.zoom), (y*editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
		*/	
		}
		var error = error - deltay;
		if (error < 0){
			y = y + ystep;
			error = error + deltax;
		}
	}
	
	/*
	if(!peer){		
		//historylist.context.save();
		historylist.context.drawImage(c, (ex)-(halfw), (ey)-(halfh));
		//historylist.context.restore();
	}else{
		//thecontext.save();
		thecontext.drawImage(c, (ex)-(halfw), (ey)-(halfh));
		//thecontext.restore();
	}*/
	if(peerid=="palette")thecontext.drawImage(c, (ex)-(halfw), (ey)-(halfh));
	else{
	
		for (var cy=0;cy<c.height;cy++){
			for (var cx=0;cx<c.width;cx++){
				if(imgData.data[(((cy*c.width)+cx)*4)+3]>0){
					if(selection==true){
				
						if(peerhistory[0].selectionclipped==false){
							if(
								(maskData.data[(((((ey-halfh+cy)-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((ex-halfw+cx)-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
								(ex-halfw+cx)<peerhistory[0].selectionclip.x || (ex-halfw+cx)>=peerhistory[0].selectionclip.x2 ||
								(ey-halfh+cy)<peerhistory[0].selectionclip.y || (ey-halfh+cy)>=peerhistory[0].selectionclip.y2)
							)
								continue;
							else{
								var check = checkDither( imgData.data[(((cy*c.width)+cx)*4)+3], (ex)-(halfw)+cx, (ey)-(halfh)+cy, dither );
									if(check==true){
									peerhistory[0].context.fillStyle = color;
									peerhistory[0].context.fillRect((ex)-(halfw)+cx, (ey)-(halfh)+cy, 1, 1);
								}
							}
						}
					}else{
						//peerhistory[0].context.drawImage(c, (ex)-(halfw), (ey)-(halfh));
						var check = checkDither( imgData.data[(((cy*c.width)+cx)*4)+3], (ex)-(halfw)+cx, (ey)-(halfh)+cy, dither );
							if(check==true){
							peerhistory[0].context.fillStyle = color;
							peerhistory[0].context.fillRect((ex)-(halfw)+cx, (ey)-(halfh)+cy, 1, 1);
						}
					}
				}

			}
		}
		if(ex-halfw < peerhistory[0].clip.x)peerhistory[0].clip.x = ex-halfw;
		if(ey-halfh < peerhistory[0].clip.y)peerhistory[0].clip.y = ey-halfh;
		if(ex-halfw+c.width > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = ex-halfw+c.width;
		if(ey-halfh+c.height > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = ey-halfh+c.height;
		
	}
	
	/*layer_array[current_layer].imagearea.context2De.save();
	layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, marker.epos.x-(8*editarea.zoom), marker.epos.y-(8*editarea.zoom),160,160);
	layer_array[current_layer].imagearea.context2De.restore();
		*/			
	
	//claim over peer historylist states
	if(peerid!="palette")claimHistory(peerhistory[0].id,peerhistory[0].canvas);

}

function brush_line(sx,sy,ex,ey,groups,t,basergba,baseuprgba, peerid){		//(start x, start y, end x, end y, groupstuff, basecolor, id of peer or null for localuser)

	//var rgb = color.replace(/[^\d,]/g, '').split(',');
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(peerid!="palette"){
		peerhistory[0].draw=true;
		peerhistory[0].erase=false;
	}
	
	//stuff for if there is a selection, to only draw inside it
	var selection = false;
	var maskData;
	if(peerhistory[0].selectionclip.x!=peerhistory[0].selectionclip.x2 && peerhistory[0].selectionclip.y!=peerhistory[0].selectionclip.y2){
		//console.log(peerhistory[0].selectionclip.x+","+peerhistory[0].selectionclip.x2+","+peerhistory[0].selectionclip.y+","+peerhistory[0].selectionclip.y2);
		selection = true;
		maskData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	}
	
	refreshTool(t);
	toolcontext = reload_canvas(toolcanvas, toolcontext);
	
	var imgData=toolcontext.getImageData(0, 0, toolcanvas.width, toolcanvas.height);
	
	var toolwidth = Math.floor(toolcanvas.width*0.5);
	var toolheight = Math.floor(toolcanvas.height*0.5);
	
	//get the current data of all the strokes we can possibly overlap with this line
	//we will adjust this data as we travel the line, and then feed it back into the brushlayer
	var topleft = new vector( Math.min(sx,ex)-toolwidth, Math.min(sy,ey)-toolheight );
	var bottomright = new vector( Math.max(sx,ex)+toolwidth,Math.max(sy,ey)+toolheight );
	
	var brushwidth = Math.min(bottomright.x,project.width) - Math.max(topleft.x,0);
	var brushheight = Math.min(bottomright.y,project.height) - Math.max(topleft.y,0);
	var bctx;
	var previewbctx;
	var peerlayer = $.grep(brushlayers, function(e){ return e.id == peerid; });
	if(peerlayer.length==1){
		bctx = peerlayer[0].context;
		previewbctx = peerlayer[0].previewcontext;
	}else{
		bctx = brushcontext;
		previewbctx = brushpreviewcontext;
	}
	
	if(brushwidth<=0 || brushheight<=0)return;
	var imgLayerData=bctx.getImageData(Math.max(topleft.x,0),Math.max(topleft.y,0), brushwidth,brushheight );
	
	
	//grab untainted canvaslayer data so we can make an index adjustment layer based upon current stroke data
	var canvaslayerData=project.contextlayer[peerlayer[0].frame].getImageData(Math.max(topleft.x,0),Math.max(topleft.y,0), brushwidth,brushheight );
	
    /*for (var i=0;i<imgData.data.length;i+=4)
    {
        imgData.data[i]= rgb[0] | imgData.data[i];
        imgData.data[i+1]= rgb[1] | imgData.data[i+1];
        imgData.data[i+2]= rgb[2] | imgData.data[i+2];
    }
    ctx.putImageData(imgData,0,0);
	*/

	//bresenham's line algorith via wiki
	var x0 = sx;
	var y0 = sy;
	var x1 = ex;
	var y1 = ey;
	var t1 = ex;
	var t2 = ey;
	//function line(x0, x1, y0, y1)
	var steep = 0;
	if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
	if (steep == 1){
		t1 = x0;
		t2 = x1;
		//swap(x0, y0)
		//swap(x1, y1)
		x0 = y0;
		x1 = y1;
		y0 = t1;
		y1 = t2;
	}
	if (x0 > x1){
		t1 = x0;
		t2 = y0;
		//swap(x0, x1)
		//swap(y0, y1)
		x0 = x1;
		y0 = y1;
		x1 = t1;
		y1 = t2;
	}
	var deltax = x1 - x0;
	var deltay = Math.abs(y1 - y0);
	var error = deltax / 2;
	var ystep;
	var y = y0;
	if (y0 < y1){
		ystep = 1;
	} else {
		ystep = -1;
	}
	
	var savederror = error;
	var savedy = y;
	
	y = savedy;
	error = savederror;
	
	var w=toolcanvas.width;
	var h=toolcanvas.height;
	for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
		if (steep == 1){
			
		//get the current location of the brush and find where the top left coord is located in our stroke boundary image
		var checkstart = new vector( (y-topleft.x)-toolwidth, (x-topleft.y)-toolheight );
		var checkwidth = Math.abs(topleft.x-bottomright.x);
		var checkheight = Math.abs(topleft.y-bottomright.y);
		for(var ty=0; ty<h; ty++){
			for(var tx=0; tx<w; tx++){
				//cycle through the toolimage comparing each data with the data of any possible strokes we're going over. changing if tool data is higher.
				if((checkstart.x+tx)+topleft.x < 0 || (checkstart.x+tx)+topleft.x > project.width - 1 || (checkstart.y+ty)+topleft.y < 0 || (checkstart.y+ty)+topleft.y > project.height - 1 )
					continue;
					
				if(selection==true && (maskData.data[(((((x-toolheight)+ty-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((y-toolwidth)+tx-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
					(y-toolwidth)+tx<peerhistory[0].selectionclip.x || (y-toolwidth)+tx>=peerhistory[0].selectionclip.x2 ||
					(x-toolheight)+ty<peerhistory[0].selectionclip.y || (x-toolheight)+ty>=peerhistory[0].selectionclip.y2))
					continue;
				
				var loc = ((((checkstart.y+ty+(topleft.y<0?topleft.y:0) )*brushwidth)+(checkstart.x+tx)+(topleft.x<0?topleft.x:0) )*4);
				if( imgData.data[(((ty*w)+tx)*4)+3] > imgLayerData.data[loc+3] ){
					imgLayerData.data[loc+3] = imgData.data[(((ty*w)+tx)*4)+3];
					
					//make calculated index adjustment
					var rgba = { r:canvaslayerData.data[loc],g:canvaslayerData.data[loc+1],b:canvaslayerData.data[loc+2],a:canvaslayerData.data[loc+3] };
					rgba = adjustColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
					if(rgba.a>0){
						previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+','+rgba.a+')';
						previewbctx.fillRect( (y-toolwidth)+tx,(x-toolheight)+ty, 1,1);
					}
				}
			}
		}
						
		/*thecontext.save();
		thecontext.drawImage(c, 0, 0,16,16, (y)-(8), (x)-(8),16,16);
		thecontext.restore();*/
					
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (y * editarea.zoom)-(8*editarea.zoom), (x * editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
			*/
		} else {
			
		//get the current location of the brush and find where the top left coord is located in our stroke boundary image
		var checkstart = new vector( (x-topleft.x)-toolwidth, (y-topleft.y)-toolheight );
		var checkwidth = Math.abs(topleft.x-bottomright.x);
		var checkheight = Math.abs(topleft.y-bottomright.y);
		for(var ty=0; ty<h; ty++){
			for(var tx=0; tx<w; tx++){
				//cycle through the toolimage comparing each data with the data of any possible strokes we're going over. changing if tool data is higher.
				if((checkstart.x+tx)+topleft.x < 0 || (checkstart.x+tx)+topleft.x > project.width - 1 || (checkstart.y+ty)+topleft.y < 0 || (checkstart.y+ty)+topleft.y > project.height - 1 )
					continue;
					
				if(selection==true && (maskData.data[(((((y-toolheight)+ty-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((x-toolwidth)+tx-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
					(x-toolwidth)+tx<peerhistory[0].selectionclip.x || (x-toolwidth)+tx>=peerhistory[0].selectionclip.x2 ||
					(y-toolheight)+ty<peerhistory[0].selectionclip.y || (y-toolheight)+ty>=peerhistory[0].selectionclip.y2))
					continue;
				
				var loc = ((((checkstart.y+ty+(topleft.y<0?topleft.y:0) )*brushwidth)+(checkstart.x+tx)+(topleft.x<0?topleft.x:0) )*4);
				if( imgData.data[(((ty*w)+tx)*4)+3] > imgLayerData.data[loc+3] ){
					imgLayerData.data[loc+3] = imgData.data[(((ty*w)+tx)*4)+3];
				
					//make calculated index adjustment
					var rgba = { r:canvaslayerData.data[loc],g:canvaslayerData.data[loc+1],b:canvaslayerData.data[loc+2],a:canvaslayerData.data[loc+3] };
					rgba = adjustColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
					if(rgba.a>0){
						previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+','+rgba.a+')';
						previewbctx.fillRect( (x-toolwidth)+tx,(y-toolheight)+ty, 1,1);
					}
					
				}
			}
		}
					
		/*thecontext.save();
		thecontext.drawImage(c, 0, 0,16,16, (x)-(8), (y)-(8),16,16);
		thecontext.restore();*/
							
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (x*editarea.zoom)-(8*editarea.zoom), (y*editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
		*/	
		}
		var error = error - deltay;
		if (error < 0){
			y = y + ystep;
			error = error + deltax;
		}
	}
	
	//get the current location of the brush and find where the top left coord is located in our stroke boundary image
	var checkstart = new vector( (ex-topleft.x)-toolwidth, (ey-topleft.y)-toolheight );		//distance from top/left of boundingarea of stroke to the top/left of current stroke(this is never negative)
	var checkwidth = Math.abs(topleft.x-bottomright.x);
	var checkheight = Math.abs(topleft.y-bottomright.y);
	for(var ty=0; ty<h; ty++){
		for(var tx=0; tx<w; tx++){
			//cycle through the toolimage comparing each data with the data of any possible strokes we're going over. changing if tool data is higher.
			if( (checkstart.x+tx)+topleft.x < 0 || (checkstart.x+tx)+topleft.x > project.width - 1 || (checkstart.y+ty)+topleft.y < 0 || (checkstart.y+ty)+topleft.y > project.height - 1 )
				continue;
				
			if(selection==true && (maskData.data[(((((ey-toolheight)+ty-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((ex-toolwidth)+tx-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
				(ex-toolwidth)+tx<peerhistory[0].selectionclip.x || (ex-toolwidth)+tx>=peerhistory[0].selectionclip.x2 ||
				(ey-toolheight)+ty<peerhistory[0].selectionclip.y || (ey-toolheight)+ty>=peerhistory[0].selectionclip.y2))
				continue;
			
			var loc = ((((checkstart.y+ty+(topleft.y<0?topleft.y:0) )*brushwidth)+(checkstart.x+tx)+(topleft.x<0?topleft.x:0) )*4);
			if( imgData.data[(((ty*w)+tx)*4)+3] > imgLayerData.data[loc+3] ){
				imgLayerData.data[loc+3] = imgData.data[(((ty*w)+tx)*4)+3];
				
				//make calculated index adjustment
				var rgba = { r:canvaslayerData.data[loc],g:canvaslayerData.data[loc+1],b:canvaslayerData.data[loc+2],a:canvaslayerData.data[loc+3] };
				rgba = adjustColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
				if(rgba.a>0){
					previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+','+rgba.a+')';
					previewbctx.fillRect( (ex-toolwidth)+tx,(ey-toolheight)+ty, 1,1);
				}
				
			}
		}
	}
	
	/*thecontext.save();
	thecontext.drawImage(c, 0, 0,16,16, (ex)-(8), (ey)-(8),16,16);
	thecontext.restore();*/
					
	/*layer_array[current_layer].imagearea.context2De.save();
	layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, marker.epos.x-(8*editarea.zoom), marker.epos.y-(8*editarea.zoom),160,160);
	layer_array[current_layer].imagearea.context2De.restore();
		*/			
	
	if(peerhistory.length==1){
		if(topleft.x < peerhistory[0].clip.x)peerhistory[0].clip.x = topleft.x;
		if(topleft.y < peerhistory[0].clip.y)peerhistory[0].clip.y = topleft.y;
		if(topleft.x+brushwidth > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = topleft.x+brushwidth;
		if(topleft.y+brushheight > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = topleft.y+brushheight;
	}
	
    bctx.putImageData(imgLayerData,Math.max(topleft.x,0),Math.max(topleft.y,0),0,0,brushwidth,brushheight);

	//claim over peer historylist states
	if(peerid!=null)claimHistory(peerid,peerlayer[0].previewcanvas);
	
}

function magiceraser_line(sx,sy,ex,ey,groups,t,basergba,baseuprgba, peerid){		//(start x, start y, end x, end y, groupstuff, basecolor, id of peer or null for localuser)

	//var rgb = color.replace(/[^\d,]/g, '').split(',');
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(peerid!="palette"){
		peerhistory[0].draw=true;
		peerhistory[0].erase=true;
	}
	
	//stuff for if there is a selection, to only draw inside it
	var selection = false;
	var maskData;
	if(peerhistory[0].selectionclip.x!=peerhistory[0].selectionclip.x2 && peerhistory[0].selectionclip.y!=peerhistory[0].selectionclip.y2){
		//console.log(peerhistory[0].selectionclip.x+","+peerhistory[0].selectionclip.x2+","+peerhistory[0].selectionclip.y+","+peerhistory[0].selectionclip.y2);
		selection = true;
		maskData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	}
	
	refreshTool(t);
	toolcontext = reload_canvas(toolcanvas, toolcontext);
	
	var imgData=toolcontext.getImageData(0, 0, toolcanvas.width, toolcanvas.height);
	
	var toolwidth = Math.floor(toolcanvas.width*0.5);
	var toolheight = Math.floor(toolcanvas.height*0.5);
	
	//get the current data of all the strokes we can possibly overlap with this line
	//we will adjust this data as we travel the line, and then feed it back into the brushlayer
	var topleft = new vector( Math.min(sx,ex)-toolwidth, Math.min(sy,ey)-toolheight );
	var bottomright = new vector( Math.max(sx,ex)+toolwidth,Math.max(sy,ey)+toolheight );
	
	var brushwidth = Math.min(bottomright.x,project.width) - Math.max(topleft.x,0);
	var brushheight = Math.min(bottomright.y,project.height) - Math.max(topleft.y,0);
	var bctx;
	var previewbctx;
	var peerlayer = $.grep(brushlayers, function(e){ return e.id == peerid; });
	if(peerlayer.length==1){
		bctx = peerlayer[0].context;
		previewbctx = peerlayer[0].previewcontext;
	}else{
		bctx = brushcontext;
		previewbctx = brushpreviewcontext;
	}
	
	if(brushwidth<=0 || brushheight<=0)return;
	var imgLayerData=bctx.getImageData(Math.max(topleft.x,0),Math.max(topleft.y,0), brushwidth,brushheight );
	
	
	//grab untainted canvaslayer data so we can make an index adjustment layer based upon current stroke data
	var canvaslayerData=project.contextlayer[peerlayer[0].frame].getImageData(Math.max(topleft.x,0),Math.max(topleft.y,0), brushwidth,brushheight );
	
    /*for (var i=0;i<imgData.data.length;i+=4)
    {
        imgData.data[i]= rgb[0] | imgData.data[i];
        imgData.data[i+1]= rgb[1] | imgData.data[i+1];
        imgData.data[i+2]= rgb[2] | imgData.data[i+2];
    }
    ctx.putImageData(imgData,0,0);
	*/

	//bresenham's line algorith via wiki
	var x0 = sx;
	var y0 = sy;
	var x1 = ex;
	var y1 = ey;
	var t1 = ex;
	var t2 = ey;
	//function line(x0, x1, y0, y1)
	var steep = 0;
	if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
	if (steep == 1){
		t1 = x0;
		t2 = x1;
		//swap(x0, y0)
		//swap(x1, y1)
		x0 = y0;
		x1 = y1;
		y0 = t1;
		y1 = t2;
	}
	if (x0 > x1){
		t1 = x0;
		t2 = y0;
		//swap(x0, x1)
		//swap(y0, y1)
		x0 = x1;
		y0 = y1;
		x1 = t1;
		y1 = t2;
	}
	var deltax = x1 - x0;
	var deltay = Math.abs(y1 - y0);
	var error = deltax / 2;
	var ystep;
	var y = y0;
	if (y0 < y1){
		ystep = 1;
	} else {
		ystep = -1;
	}
	
	var savederror = error;
	var savedy = y;
	
	y = savedy;
	error = savederror;
	
	var w=toolcanvas.width;
	var h=toolcanvas.height;
	for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
		if (steep == 1){
			
		//get the current location of the brush and find where the top left coord is located in our stroke boundary image
		var checkstart = new vector( (y-topleft.x)-toolwidth, (x-topleft.y)-toolheight );
		var checkwidth = Math.abs(topleft.x-bottomright.x);
		var checkheight = Math.abs(topleft.y-bottomright.y);
		for(var ty=0; ty<h; ty++){
			for(var tx=0; tx<w; tx++){
				//cycle through the toolimage comparing each data with the data of any possible strokes we're going over. changing if tool data is higher.
				if((checkstart.x+tx)+topleft.x < 0 || (checkstart.x+tx)+topleft.x > project.width - 1 || (checkstart.y+ty)+topleft.y < 0 || (checkstart.y+ty)+topleft.y > project.height - 1 )
					continue;
					
				if(selection==true && (maskData.data[(((((x-toolheight)+ty-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((y-toolwidth)+tx-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
					(y-toolwidth)+tx<peerhistory[0].selectionclip.x || (y-toolwidth)+tx>=peerhistory[0].selectionclip.x2 ||
					(x-toolheight)+ty<peerhistory[0].selectionclip.y || (x-toolheight)+ty>=peerhistory[0].selectionclip.y2))
					continue;
				
				var loc = ((((checkstart.y+ty+(topleft.y<0?topleft.y:0) )*brushwidth)+(checkstart.x+tx)+(topleft.x<0?topleft.x:0) )*4);
				if( imgData.data[(((ty*w)+tx)*4)+3] > imgLayerData.data[loc+3] ){
					imgLayerData.data[loc+3] = imgData.data[(((ty*w)+tx)*4)+3];
					
					//make calculated index adjustment
					var rgba = { r:canvaslayerData.data[loc],g:canvaslayerData.data[loc+1],b:canvaslayerData.data[loc+2],a:canvaslayerData.data[loc+3] };
					rgba = reverseColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
					if(rgba!=null){
						if(rgba.a>0){
							previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+','+rgba.a+')';
							previewbctx.fillRect( (y-toolwidth)+tx,(x-toolheight)+ty, 1,1);
						}else{
							previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+',255)';	//make sure to add to the preview canvas, so it goes into historylist
							previewbctx.fillRect( (y-toolwidth)+tx,(x-toolheight)+ty, 1,1);
							//erase if alpha should be 0 (no color)
							peerhistory[0].context.fillStyle = 'rgba(0,0,0,255)';
							peerhistory[0].context.fillRect( (y-toolwidth)+tx,(x-toolheight)+ty, 1,1);
						}
					}
				}
			}
		}
						
		/*thecontext.save();
		thecontext.drawImage(c, 0, 0,16,16, (y)-(8), (x)-(8),16,16);
		thecontext.restore();*/
					
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (y * editarea.zoom)-(8*editarea.zoom), (x * editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
			*/
		} else {
			
		//get the current location of the brush and find where the top left coord is located in our stroke boundary image
		var checkstart = new vector( (x-topleft.x)-toolwidth, (y-topleft.y)-toolheight );
		var checkwidth = Math.abs(topleft.x-bottomright.x);
		var checkheight = Math.abs(topleft.y-bottomright.y);
		for(var ty=0; ty<h; ty++){
			for(var tx=0; tx<w; tx++){
				//cycle through the toolimage comparing each data with the data of any possible strokes we're going over. changing if tool data is higher.
				if((checkstart.x+tx)+topleft.x < 0 || (checkstart.x+tx)+topleft.x > project.width - 1 || (checkstart.y+ty)+topleft.y < 0 || (checkstart.y+ty)+topleft.y > project.height - 1 )
					continue;
					
				if(selection==true && (maskData.data[(((((y-toolheight)+ty-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((x-toolwidth)+tx-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
					(x-toolwidth)+tx<peerhistory[0].selectionclip.x || (x-toolwidth)+tx>=peerhistory[0].selectionclip.x2 ||
					(y-toolheight)+ty<peerhistory[0].selectionclip.y || (y-toolheight)+ty>=peerhistory[0].selectionclip.y2))
					continue;
				
				var loc = ((((checkstart.y+ty+(topleft.y<0?topleft.y:0) )*brushwidth)+(checkstart.x+tx)+(topleft.x<0?topleft.x:0) )*4);
				if( imgData.data[(((ty*w)+tx)*4)+3] > imgLayerData.data[loc+3] ){
					imgLayerData.data[loc+3] = imgData.data[(((ty*w)+tx)*4)+3];
				
					//make calculated index adjustment
					var rgba = { r:canvaslayerData.data[loc],g:canvaslayerData.data[loc+1],b:canvaslayerData.data[loc+2],a:canvaslayerData.data[loc+3] };
					rgba = reverseColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
					if(rgba!=null){
						if(rgba.a>0){
							previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+','+rgba.a+')';
							previewbctx.fillRect( (x-toolwidth)+tx,(y-toolheight)+ty, 1,1);
						}else{
							previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+',255)';	//make sure to add to the preview canvas, so it goes into historylist
							previewbctx.fillRect( (x-toolwidth)+tx,(y-toolheight)+ty, 1,1);
							//erase if alpha should be 0 (no color)
							peerhistory[0].context.fillStyle = 'rgba(0,0,0,255)';
							peerhistory[0].context.fillRect( (x-toolwidth)+tx,(y-toolheight)+ty, 1,1);
						}
					}
					
				}
			}
		}
					
		/*thecontext.save();
		thecontext.drawImage(c, 0, 0,16,16, (x)-(8), (y)-(8),16,16);
		thecontext.restore();*/
							
		/*layer_array[current_layer].imagearea.context2De.save();
		layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, (x*editarea.zoom)-(8*editarea.zoom), (y*editarea.zoom)-(8*editarea.zoom),160,160);
		layer_array[current_layer].imagearea.context2De.restore();
		*/	
		}
		var error = error - deltay;
		if (error < 0){
			y = y + ystep;
			error = error + deltax;
		}
	}
	
	//get the current location of the brush and find where the top left coord is located in our stroke boundary image
	var checkstart = new vector( (ex-topleft.x)-toolwidth, (ey-topleft.y)-toolheight );		//distance from top/left of boundingarea of stroke to the top/left of current stroke(this is never negative)
	var checkwidth = Math.abs(topleft.x-bottomright.x);
	var checkheight = Math.abs(topleft.y-bottomright.y);
	for(var ty=0; ty<h; ty++){
		for(var tx=0; tx<w; tx++){
			//cycle through the toolimage comparing each data with the data of any possible strokes we're going over. changing if tool data is higher.
			if( (checkstart.x+tx)+topleft.x < 0 || (checkstart.x+tx)+topleft.x > project.width - 1 || (checkstart.y+ty)+topleft.y < 0 || (checkstart.y+ty)+topleft.y > project.height - 1 )
				continue;
				
			if(selection==true && (maskData.data[(((((ey-toolheight)+ty-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+((ex-toolwidth)+tx-peerhistory[0].selectionoffset.x))*4)+3]==0 ||
				(ex-toolwidth)+tx<peerhistory[0].selectionclip.x || (ex-toolwidth)+tx>=peerhistory[0].selectionclip.x2 ||
				(ey-toolheight)+ty<peerhistory[0].selectionclip.y || (ey-toolheight)+ty>=peerhistory[0].selectionclip.y2))
				continue;
			
			var loc = ((((checkstart.y+ty+(topleft.y<0?topleft.y:0) )*brushwidth)+(checkstart.x+tx)+(topleft.x<0?topleft.x:0) )*4);
			if( imgData.data[(((ty*w)+tx)*4)+3] > imgLayerData.data[loc+3] ){
				imgLayerData.data[loc+3] = imgData.data[(((ty*w)+tx)*4)+3];
				
				//make calculated index adjustment
				var rgba = { r:canvaslayerData.data[loc],g:canvaslayerData.data[loc+1],b:canvaslayerData.data[loc+2],a:canvaslayerData.data[loc+3] };
				rgba = reverseColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
				if(rgba!=null){
					if(rgba.a>0){
						previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+','+rgba.a+')';
						previewbctx.fillRect( (ex-toolwidth)+tx,(ey-toolheight)+ty, 1,1);
					}else{
						previewbctx.fillStyle = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+',255)';	//make sure to add to the preview canvas, so it goes into historylist
						previewbctx.fillRect( (ex-toolwidth)+tx,(ey-toolheight)+ty, 1,1);
						//erase if alpha should be 0 (no color)
						peerhistory[0].context.fillStyle = 'rgba(0,0,0,255)';
						peerhistory[0].context.fillRect( (ex-toolwidth)+tx,(ey-toolheight)+ty, 1,1);
					}
				}
				
			}
		}
	}
	
	/*thecontext.save();
	thecontext.drawImage(c, 0, 0,16,16, (ex)-(8), (ey)-(8),16,16);
	thecontext.restore();*/
					
	/*layer_array[current_layer].imagearea.context2De.save();
	layer_array[current_layer].imagearea.context2De.drawImage(canvascursorsizebig, 0, 0,160,160, marker.epos.x-(8*editarea.zoom), marker.epos.y-(8*editarea.zoom),160,160);
	layer_array[current_layer].imagearea.context2De.restore();
		*/			
	
	if(peerhistory.length==1){
		if(topleft.x < peerhistory[0].clip.x)peerhistory[0].clip.x = topleft.x;
		if(topleft.y < peerhistory[0].clip.y)peerhistory[0].clip.y = topleft.y;
		if(topleft.x+brushwidth > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = topleft.x+brushwidth;
		if(topleft.y+brushheight > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = topleft.y+brushheight;
	}
	
    bctx.putImageData(imgLayerData,Math.max(topleft.x,0),Math.max(topleft.y,0),0,0,brushwidth,brushheight);

	//claim over peer historylist states
	if(peerid!=null)claimHistory(peerid,peerlayer[0].previewcanvas);
	
}

function selectLasso(peerid,type){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var selectionwidth = (peerhistory[0].selectionclip.x2 - peerhistory[0].selectionclip.x)+3;
	var selectionheight = (peerhistory[0].selectionclip.y2 - peerhistory[0].selectionclip.y)+3;
	
	var selectionmask = document.createElement("canvas");
	selectionmask.width = selectionwidth;
	selectionmask.height = selectionheight;
	var selectionmaskcontext = selectionmask.getContext('2d');
	
	if(peerhistory[0].selectionpoints.length>0 && type!='rotate'){
		/*selectionmaskcontext.beginPath();
		selectionmaskcontext.moveTo(peerhistory[0].selectionpoints[0].x+0.5,peerhistory[0].selectionpoints[0].y+0.5);
		for(var i=1; i<peerhistory[0].selectionpoints.length; i++){
			selectionmaskcontext.lineTo(peerhistory[0].selectionpoints[i].x+0.5,peerhistory[0].selectionpoints[i].y+0.5);
		}
		selectionmaskcontext.fillStyle = 'red';
		selectionmaskcontext.fill();
		*/
		selectionFillMask(peerid,selectionmaskcontext,selectionmask);
	}
	
	var imgData;
	/*
	var imgData=selectionmaskcontext.getImageData(0,0, selectionmask.width,selectionmask.height );
	for(var y=0; y<selectionmask.height; y++){
		for(var x=0; x<selectionmask.width; x++){

			if (imgData.data[(((y*selectionmask.width)+x)*4)+3]<128)
				imgData.data[(((y*selectionmask.width)+x)*4)+3] = 0;
				else
				imgData.data[(((y*selectionmask.width)+x)*4)+3] = 255;
			
		}
	}
	selectionmaskcontext.putImageData(imgData,0,0);
	*/
	
	/*for(var i=0; i<peerhistory[0].selectionpoints.length; i++){
		//bresenham's line algorith via wiki
		var end = (i==peerhistory[0].selectionpoints.length-1?0:i+1);
		var x0 = peerhistory[0].selectionpoints[i].x;
		var y0 = peerhistory[0].selectionpoints[i].y;
		var x1 = peerhistory[0].selectionpoints[end].x;
		var y1 = peerhistory[0].selectionpoints[end].y;
		var t1 = peerhistory[0].selectionpoints[end].x;
		var t2 = peerhistory[0].selectionpoints[end].y;
		//function line(x0, x1, y0, y1)
		var steep = 0;
		if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
		if (steep == 1){
			t1 = x0;
			t2 = x1;
			//swap(x0, y0)
			//swap(x1, y1)
			x0 = y0;
			x1 = y1;
			y0 = t1;
			y1 = t2;
		}
		if (x0 > x1){
			t1 = x0;
			t2 = y0;
			//swap(x0, x1)
			//swap(y0, y1)
			x0 = x1;
			y0 = y1;
			x1 = t1;
			y1 = t2;
		}
		var deltax = x1 - x0;
		var deltay = Math.abs(y1 - y0);
		var error = deltax / 2;
		var ystep;
		var y = y0;
		if (y0 < y1){
			ystep = 1;
		} else {
			ystep = -1;
		}
		
		var savederror = error;
		var savedy = y;
		
		y = savedy;
		error = savederror;
		
		for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
			if (steep == 1){
				
				selectionmaskcontext.fillRect(y,x,1,1);
				
			} else {
				
				selectionmaskcontext.fillRect(x,y,1,1);
			
			}
			var error = error - deltay;
			if (error < 0){
				y = y + ystep;
				error = error + deltax;
			}
		}
	
		selectionmaskcontext.fillRect(peerhistory[0].selectionpoints[end].x,peerhistory[0].selectionpoints[end].y,1,1);
	
	}*/
	
	if(type!="new"){
		var offsetx = peerhistory[0].selectionoffset.x-peerhistory[0].selectionclip.x;
		var offsety = peerhistory[0].selectionoffset.y-peerhistory[0].selectionclip.y;
		if(type=="subtract")selectionmaskcontext.globalCompositeOperation = 'source-out';
		else if(type=="intersect")selectionmaskcontext.globalCompositeOperation = 'source-in';
		selectionmaskcontext.drawImage(peerhistory[0].selectionmaskcanvas,offsetx,offsety, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
		if(type=="subtract")selectionmaskcontext.globalCompositeOperation = 'source-over';
	
		peerhistory[0].selectionclipcontext.globalCompositeOperation = 'destination-in';
		peerhistory[0].selectionclipcontext.drawImage(selectionmask,-offsetx,-offsety, selectionwidth, selectionheight);
		peerhistory[0].selectionclipcontext.globalCompositeOperation = 'source-over';
	
		//if there is a clipped part, make sure it realigns
		imgData = peerhistory[0].selectionclipcontext.getImageData(0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
		peerhistory[0].selectionclipcanvas.width = selectionwidth;
		peerhistory[0].selectionclipcanvas.height = selectionheight;
		peerhistory[0].selectionclipcontext.clearRect(0,0,selectionwidth,selectionheight);
		peerhistory[0].selectionclipcontext.putImageData(imgData,-(peerhistory[0].selectionclip.x-peerhistory[0].selectionoffset.x),-(peerhistory[0].selectionclip.y-peerhistory[0].selectionoffset.y));
	}
	
	peerhistory[0].selectionoffset.x = peerhistory[0].selectionclip.x;
	peerhistory[0].selectionoffset.y = peerhistory[0].selectionclip.y;
	peerhistory[0].selectionmaskcanvas.width = selectionwidth-3;
	peerhistory[0].selectionmaskcanvas.height = selectionheight-3;
	if(type=="new")peerhistory[0].selectionmaskcontext.clearRect(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	//if(type=="subtract")peerhistory[0].selectionmaskcontext.globalCompositeOperation = 'destination-out';
	peerhistory[0].selectionmaskcontext.drawImage(selectionmask,0,0, selectionwidth, selectionheight);
	//if(type=="subtract")peerhistory[0].selectionmaskcontext.globalCompositeOperation = 'source-over';
	peerhistory[0].selectioncanvas.width = selectionwidth;
	peerhistory[0].selectioncanvas.height = selectionheight;
	peerhistory[0].selectioncontext.clearRect(0, 0, peerhistory[0].selectioncanvas.width, peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 0,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 2,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,2, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'destination-out';
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,1);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'source-over';
	
	traceSelection(peerid);
	
}

function selectionFillMask(peerid,ctx,c){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	//  public-domain code by Darel Rex Finley, 2007	http://alienryderflex.com/polygon_fill/
	// rewritten from C to javascript by Alex Hanson-White 2014
	var  nodes, nodeX= new Array(peerhistory[0].selectionpoints.length), pixelX, pixelY, i, j, swap ;

	//  Loop through the rows of the image.
	for (pixelY=0; pixelY<c.height; pixelY++) {

		//  Build a list of nodes.
		nodes=0; j=peerhistory[0].selectionpoints.length-1;
		for (i=0; i<peerhistory[0].selectionpoints.length; i++) {
			if (peerhistory[0].selectionpoints[i].y < pixelY && peerhistory[0].selectionpoints[j].y >= pixelY
			||  peerhistory[0].selectionpoints[j].y < pixelY && peerhistory[0].selectionpoints[i].y >= pixelY) {
				nodeX[nodes]= Math.floor(peerhistory[0].selectionpoints[i].x+(pixelY-peerhistory[0].selectionpoints[i].y)/(peerhistory[0].selectionpoints[j].y-peerhistory[0].selectionpoints[i].y)
				*(peerhistory[0].selectionpoints[j].x-peerhistory[0].selectionpoints[i].x)); 
				nodes++;
				
			}
			j=i; 
		}

		//  Sort the nodes, via a simple “Bubble” sort.
		//nodeX.sort(function(a, b){return a-b});
		i=0;
		while (i<nodes-1) {
			if (nodeX[i]>nodeX[i+1]) {
				swap=nodeX[i]; nodeX[i]=nodeX[i+1]; nodeX[i+1]=swap; if (i) i--; 
			}else {
				i++; 
			}
		}

		ctx.fillStyle = 'red';
		//  Fill the pixels between node pairs.
		for (i=0; i<nodes; i+=2) {
			if   (nodeX[i]>=c.width) break;
			if   (nodeX[i+1]> 0 ) {
				if (nodeX[i]< 0 ) nodeX[i]=0 ;
				if (nodeX[i+1]> c.width) nodeX[i+1]=c.width;
				for (j=nodeX[i]; j<nodeX[i+1]; j++) ctx.fillRect(j,pixelY-1,1,1); 
			}
		}
	}

}

function selectClip(peerid,refresh){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(!refresh){
		peerhistory[0].selectionmaskcontext.globalCompositeOperation = 'destination-in';
		peerhistory[0].selectionmaskcontext.drawImage(project.canvaslayer[peerhistory[0].frame],-peerhistory[0].selectionoffset.x,-peerhistory[0].selectionoffset.y,project.width,project.height);
		peerhistory[0].selectionmaskcontext.globalCompositeOperation = 'source-over';
	}
	peerhistory[0].selectionmaskcontext.drawImage(peerhistory[0].selectionclipcanvas,0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
	
	var w = peerhistory[0].selectionmaskcanvas.width , h = peerhistory[0].selectionmaskcanvas.height;
	var imgData = peerhistory[0].selectionmaskcontext.getImageData(0,0,w,h);
	var first = false;
	var bounds = {x:0,y:0,x2:1,y2:1};
	
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			if( imgData.data[(((y*w)+x)*4)+3]==255){
				if(first==false){
					bounds = {x:x,y:y,x2:x,y2:y};
					first=true;
				}
				if(x < bounds.x)bounds.x = x;
				if(y < bounds.y)bounds.y = y;
				if(x+1 > bounds.x2)bounds.x2 = x+1;
				if(y+1 > bounds.y2)bounds.y2 = y+1;
				
				imgData.data[(((y*w)+x)*4)] = 255;
				imgData.data[(((y*w)+x)*4)+1] = 0;
				imgData.data[(((y*w)+x)*4)+2] = 0;
			}
		}
	}
	
	
	var clipw = bounds.x2-bounds.x, cliph = bounds.y2-bounds.y;
	peerhistory[0].selectionmaskcontext.putImageData(imgData,0,0);
	imgData = peerhistory[0].selectionmaskcontext.getImageData(bounds.x,bounds.y,bounds.x2,bounds.y2);
	peerhistory[0].selectionmaskcanvas.width = clipw;
	peerhistory[0].selectionmaskcanvas.height = cliph;
	peerhistory[0].selectionmaskcontext.putImageData(imgData,0,0);
	
	var clipImgData = peerhistory[0].selectionclipcontext.getImageData(bounds.x,bounds.y,bounds.x2,bounds.y2);
	peerhistory[0].selectionclipcanvas.width = clipw;
	peerhistory[0].selectionclipcanvas.height = cliph;
	peerhistory[0].selectionclipcontext.putImageData(imgData,0,0);
	
	peerhistory[0].selectionclip.x += bounds.x;
	peerhistory[0].selectionclip.y += bounds.y;
	if(peerhistory[0].rotation.degree==0){
		peerhistory[0].selectionclip.w = clipw;
		peerhistory[0].selectionclip.h = cliph;
	}
	peerhistory[0].selectionoffset.x += bounds.x;
	peerhistory[0].selectionoffset.y += bounds.y;
	peerhistory[0].clip.x = peerhistory[0].selectionoffset.x;
	peerhistory[0].clip.y = peerhistory[0].selectionoffset.y;
	peerhistory[0].clip.x2 = peerhistory[0].selectionoffset.x+clipw;
	peerhistory[0].clip.y2 = peerhistory[0].selectionoffset.y+cliph;
	
	peerhistory[0].selectionclipcontext.globalCompositeOperation = 'source-in';
	peerhistory[0].selectionclipcontext.drawImage(project.canvaslayer[peerhistory[0].frame],-peerhistory[0].selectionoffset.x,-peerhistory[0].selectionoffset.y,project.width,project.height);
	peerhistory[0].selectionclipcontext.globalCompositeOperation = 'source-over';
	
	var tempcanvas = document.createElement("canvas");
	tempcanvas.width = clipw;
	tempcanvas.height = cliph;
	var tempcontext = tempcanvas.getContext('2d');
	tempcontext.putImageData(clipImgData,0,0);
	peerhistory[0].selectionclipcontext.drawImage(tempcanvas,0,0);
	
	//copy to resize canvas for when resizing(so we always resize with original so no loss of quality
	if(!refresh){
		peerhistory[0].resizecanvas.width = clipw;
		peerhistory[0].resizecanvas.height = cliph;
		peerhistory[0].resizecontext.drawImage(peerhistory[0].selectionclipcanvas,0,0);
	}
	
	peerhistory[0].selectioncanvas.width = clipw+4;
	peerhistory[0].selectioncanvas.height = cliph+4;
	
	peerhistory[0].selectioncontext.clearRect(0, 0, peerhistory[0].selectioncanvas.width, peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 0,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 2,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,2, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'destination-out';
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,1);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'source-over';
	
	peerhistory[0].selectionclipped = true;
	
	if(refresh==true){
	//do stuff for flipping
	var tempcanvas2 = document.createElement("canvas");
	tempcanvas2.width = peerhistory[0].selectioncanvas.width;
	tempcanvas2.height = peerhistory[0].selectioncanvas.height;
	var tempcontext2 = tempcanvas2.getContext('2d');
	tempcontext2.scale( (peerhistory[0].resize.ox < 0? -1:1 ), (peerhistory[0].resize.oy < 0? -1:1 ) );
	//tempcontext2.drawImage(peerhistory[0].selectioncanvas,0,0, tempcanvas2.width*(peerhistory[0].resize.ox < 0? -1:1 ), tempcanvas2.height*(peerhistory[0].resize.oy < 0? -1:1 ) );
	tempcontext2.scale(1,1);
	peerhistory[0].selectioncontext.drawImage(tempcanvas2,0,0);
	
	tempcanvas2.width = peerhistory[0].selectionclipcanvas.width;
	tempcanvas2.height = peerhistory[0].selectionclipcanvas.height;
	tempcontext2 = tempcanvas2.getContext('2d');
	tempcontext2.clearRect(0, 0, tempcanvas2.width, tempcanvas2.height);
	tempcontext2.scale( (peerhistory[0].resize.ox < 0? -1:1 ), (peerhistory[0].resize.oy < 0? -1:1 ) );
	//tempcontext2.drawImage(peerhistory[0].selectionclipcanvas,0,0, tempcanvas2.width*(peerhistory[0].resize.ox < 0? -1:1 ), tempcanvas2.height*(peerhistory[0].resize.oy < 0? -1:1 ) );
	tempcontext2.scale(1,1);
	peerhistory[0].selectionclipcontext.drawImage(tempcanvas2,0,0);
	
	
	tempcanvas2.width = peerhistory[0].selectionmaskcanvas.width;
	tempcanvas2.height = peerhistory[0].selectionmaskcanvas.height;
	tempcontext2 = tempcanvas2.getContext('2d');
	tempcontext2.clearRect(0, 0, tempcanvas2.width, tempcanvas2.height);
	tempcontext2.scale( (peerhistory[0].resize.ox < 0? -1:1 ), (peerhistory[0].resize.oy < 0? -1:1 ) );
	//tempcontext2.drawImage(peerhistory[0].selectionmaskcanvas,0,0, tempcanvas2.width*(peerhistory[0].resize.ox < 0? -1:1 ), tempcanvas2.height*(peerhistory[0].resize.oy < 0? -1:1 ) );
	tempcontext2.scale(1,1);
	peerhistory[0].selectionmaskcontext.drawImage(tempcanvas2,0,0);
	
	tempcanvas2.width = peerhistory[0].resizecanvas.width;
	tempcanvas2.height = peerhistory[0].resizecanvas.height;
	tempcontext2 = tempcanvas2.getContext('2d');
	tempcontext2.clearRect(0, 0, tempcanvas2.width, tempcanvas2.height);
	tempcontext2.scale( (peerhistory[0].resize.ox < 0? -1:1 ), (peerhistory[0].resize.oy < 0? -1:1 ) );
	tempcontext2.drawImage(peerhistory[0].resizecanvas,tempcanvas2.width*(peerhistory[0].resize.ox < 0? -1:0 ), tempcanvas2.height*(peerhistory[0].resize.oy < 0? -1:0 ) );
	tempcontext2.scale(1,1);
	peerhistory[0].resizecontext.clearRect(0, 0, tempcanvas2.width, tempcanvas2.height);
	peerhistory[0].resizecontext.drawImage(tempcanvas2,0,0);
	}
	
	peerhistory[0].resize.x = 0;
	peerhistory[0].resize.y = 0;
	//claimHistory(peerhistory[0].id,peerhistory[0].canvas);
	
	traceSelection(peerid);
}

function selectPasteClip(peerid){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	peerhistory[0].clip.x = peerhistory[0].selectionoffset.x;
	peerhistory[0].clip.y = peerhistory[0].selectionoffset.y;
	peerhistory[0].clip.x2 = peerhistory[0].selectionoffset.x+peerhistory[0].selectionclipcanvas.width;
	peerhistory[0].clip.y2 = peerhistory[0].selectionoffset.y+peerhistory[0].selectionclipcanvas.height;
	peerhistory[0].context.drawImage(peerhistory[0].selectionclipcanvas,peerhistory[0].selectionoffset.x,peerhistory[0].selectionoffset.y);
	claimHistory(peerhistory[0].id,peerhistory[0].canvas);
	peerhistory[0].layers.push(new historylayerdata("Paste",peerhistory[0].canvas,peerhistory[0]) );
	project.contextlayer[peerhistory[0].frame].drawImage(peerhistory[0].canvas,0, 0);
	peerhistory[0].context.clearRect(0, 0, peerhistory[0].canvas.width, peerhistory[0].canvas.height);
	
}

function selectClearClip(peerid){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	peerhistory[0].selectionclipcontext.clearRect(0, 0, peerhistory[0].selectionclipcanvas.width, peerhistory[0].selectionclipcanvas.height);
	peerhistory[0].selectionmaskcontext.clearRect(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.clearRect(0, 0, peerhistory[0].selectioncanvas.width, peerhistory[0].selectioncanvas.height);
	//peerhistory[0].selection2context.clearRect(0, 0, peerhistory[0].selectioncanvas.width, peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectionclipped=false;
	peerhistory[0].rotation.degree=0;
	peerhistory[0].trace=[];
}


function resizeClip(peerid,center){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	//peerhistory[0].selectionoffset.x = peerhistory[0].selectionclip.x- peerhistory[0].resize.x;
	//peerhistory[0].selectionoffset.y = peerhistory[0].selectionclip.y- peerhistory[0].resize.y;
	var oldposx = peerhistory[0].resize.oldx;	//record these in case we are holding Alt, in which case we'll use these to center new position
	var oldposy = peerhistory[0].resize.oldy;
	var oldposx2 = peerhistory[0].resize.oldx2;
	var oldposy2 = peerhistory[0].resize.oldy2;
	
	var newwidth = peerhistory[0].selectionclipcanvas.width + peerhistory[0].resize.x;
	var newheight = peerhistory[0].selectionclipcanvas.height + peerhistory[0].resize.y; 
	peerhistory[0].resize.ox = newwidth;
	peerhistory[0].resize.oy = newheight;
	
	var resizecanvas = document.createElement("canvas");
	resizecanvas.width = Math.abs(newwidth);
	resizecanvas.height = Math.abs(newheight);
	var resizecontext = resizecanvas.getContext('2d');
	resizecontext = reload_canvas(resizecanvas, resizecontext);
	
	var resize2canvas = document.createElement("canvas");
	resize2canvas.width = peerhistory[0].resizecanvas.width;//Math.abs(newwidth);
	resize2canvas.height = peerhistory[0].resizecanvas.height;//Math.abs(newheight);
	var resize2context = resize2canvas.getContext('2d');
	resize2context = reload_canvas(resize2canvas, resize2context);
	
	//resizecontext.scale(newwidth/Math.abs(newwidth),newheight/Math.abs(newheight));
	//resizecontext.drawImage(peerhistory[0].resizecanvas,(newwidth<0?newwidth:0),(newheight<0?newheight:0),Math.abs(newwidth),Math.abs(newheight)); 
	
	//changed the above two lines to the following lines because the Scale method scales the selection differently in each browser so it gives inconsistent images
	resize2context.scale(newwidth/Math.abs(newwidth),newheight/Math.abs(newheight));
	resize2context.drawImage(peerhistory[0].resizecanvas,(newwidth<0?-resize2canvas.width:0),(newheight<0?-resize2canvas.height:0),resize2canvas.width,resize2canvas.height); 
	var imgData = resizeImageData(resize2canvas,resize2context,Math.abs(newwidth),Math.abs(newheight));
	
	resizecontext.putImageData(imgData,0,0); 
	//resizecontext.drawImage(resize2canvas,0,0,Math.abs(newwidth),Math.abs(newheight)); 
	//end of changes to the two lines
	
	peerhistory[0].selectionclipcanvas.width = Math.abs(newwidth); 
	peerhistory[0].selectionclipcanvas.height = Math.abs(newheight); 
	peerhistory[0].selectionclipcontext.drawImage(resizecanvas,0,0);

	//peerhistory[0].selectionclip.x += finalx - lastfinalx;
	//peerhistory[0].selectionclip.y += finaly - lastfinaly;
	if(peerhistory[0].selectionhandle.x==1)peerhistory[0].selectionclip.x2 = peerhistory[0].selectionclip.x + Math.abs(newwidth);
	if(peerhistory[0].selectionhandle.y==1)peerhistory[0].selectionclip.y2 = peerhistory[0].selectionclip.y + Math.abs(newheight);
	if(peerhistory[0].selectionhandle.x==-1)peerhistory[0].selectionclip.x = peerhistory[0].selectionclip.x - (peerhistory[0].resize.x);
	if(peerhistory[0].selectionhandle.y==-1)peerhistory[0].selectionclip.y = peerhistory[0].selectionclip.y - (peerhistory[0].resize.y);
	
	//peerhistory[0].resize.x = 0;
	//peerhistory[0].resize.y = 0;
	peerhistory[0].selectionmaskcanvas.width = Math.abs(newwidth);
	peerhistory[0].selectionmaskcanvas.height = Math.abs(newheight);
	if(newwidth<0){
	peerhistory[0].selectionoffset.x += newwidth;
	peerhistory[0].selectionclip.x += newwidth;
	//peerhistory[0].selectionclip.x2 = peerhistory[0].selectionclip.x + Math.abs(newwidth);
	}
	if(newheight<0){
	peerhistory[0].selectionoffset.y += newheight;
	peerhistory[0].selectionclip.y += newheight;
	//peerhistory[0].selectionclip.y2 = peerhistory[0].selectionclip.y + Math.abs(newheight);
	}
	
	if(center==true){
		peerhistory[0].selectionclip.x = (oldposx2)-Math.floor((oldposx2-oldposx)*0.5)-Math.floor(Math.abs(newwidth)*0.5);
		peerhistory[0].selectionclip.y = (oldposy2)-Math.floor((oldposy2-oldposy)*0.5)-Math.floor(Math.abs(newheight)*0.5);
		peerhistory[0].selectionclip.x2 = peerhistory[0].selectionclip.x + Math.abs(newwidth);
		peerhistory[0].selectionclip.y2 = peerhistory[0].selectionclip.y + Math.abs(newheight);
		peerhistory[0].selectionoffset.x = peerhistory[0].selectionclip.x;
		peerhistory[0].selectionoffset.y = peerhistory[0].selectionclip.y;
	}else{
		//peerhistory[0].selectionclip.x = (oldposx2)-Math.floor(Math.abs(newwidth)*0.5);
		//peerhistory[0].selectionclip.y = (oldposy2)-Math.floor(Math.abs(newheight)*0.5);
		peerhistory[0].selectionclip.x2 = peerhistory[0].selectionclip.x + Math.abs(newwidth);
		peerhistory[0].selectionclip.y2 = peerhistory[0].selectionclip.y + Math.abs(newheight);
		peerhistory[0].selectionoffset.x = Math.min(peerhistory[0].selectionclip.x,peerhistory[0].selectionclip.x2);
		peerhistory[0].selectionoffset.y = Math.min(peerhistory[0].selectionclip.y,peerhistory[0].selectionclip.y2);
	}
	//we flip, because using Scale as I have commented above has inconsistencies
	//peerhistory[0].selectioncanvas.width = Math.abs(newwidth);
	//peerhistory[0].selectioncanvas.height = Math.abs(newheight);
	//flipSelection(peerhistory[0].id,{x:(newwidth<0?1:0),y:(newheight<0?1:0)} );
				
}

function flipSelection(peerid,flip){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	//var imgData = peerhistory[0].selectioncontext.getImageData(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.clearRect(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.save();
	peerhistory[0].selectioncontext.translate(flip.x*(peerhistory[0].selectioncanvas.width-4), flip.y*(peerhistory[0].selectioncanvas.height-4));
	peerhistory[0].selectioncontext.scale( (flip.x==1?-1:1), (flip.y==1?-1:1) );
	//peerhistory[0].selectioncontext.drawImage(image, 0, 0);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 0, 0);
	peerhistory[0].selectioncontext.restore();
	peerhistory[0].selectionmaskcontext.clearRect(0,0,peerhistory[0].selectionmaskcanvas.width,peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectionmaskcontext.drawImage(peerhistory[0].selectioncanvas, 0, 0);
	
	peerhistory[0].selectioncontext.clearRect(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.save();
	peerhistory[0].selectioncontext.translate(flip.x*(peerhistory[0].selectioncanvas.width-4), flip.y*(peerhistory[0].selectioncanvas.height-4));
	peerhistory[0].selectioncontext.scale( (flip.x==1?-1:1), (flip.y==1?-1:1) );
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionclipcanvas, 0, 0);
	peerhistory[0].selectioncontext.restore();
	peerhistory[0].selectionclipcontext.clearRect(0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
	peerhistory[0].selectionclipcontext.drawImage(peerhistory[0].selectioncanvas, 0, 0);
	
	peerhistory[0].selectioncontext.clearRect(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.save();
	peerhistory[0].selectioncanvas.width = peerhistory[0].resizecanvas.width;
	peerhistory[0].selectioncanvas.height = peerhistory[0].resizecanvas.height;
	peerhistory[0].selectioncontext.translate(flip.x*(peerhistory[0].resizecanvas.width), flip.y*(peerhistory[0].resizecanvas.height));
	peerhistory[0].selectioncontext.scale( (flip.x==1?-1:1), (flip.y==1?-1:1) );
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].resizecanvas, 0, 0);
	peerhistory[0].resizecontext.clearRect(0,0,peerhistory[0].resizecanvas.width,peerhistory[0].resizecanvas.height);
	peerhistory[0].resizecontext.drawImage(peerhistory[0].selectioncanvas, 0, 0);
	peerhistory[0].selectioncontext.restore();
	peerhistory[0].selectioncanvas.width = peerhistory[0].selectionclipcanvas.width+4;
	peerhistory[0].selectioncanvas.height = peerhistory[0].selectionclipcanvas.height+4;
	
	peerhistory[0].selectioncontext.clearRect(0, 0, peerhistory[0].selectioncanvas.width, peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 0,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 2,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,2, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'destination-out';
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,1);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'source-over';
	
	traceSelection(peerid);
}

function rotateSelection(peerid,clockwise){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var angle = (clockwise==true?1.57079633:-1.57079633);	//radians(90 degrees)
	
	//var imgData = peerhistory[0].selectioncontext.getImageData(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.clearRect(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.save();
	peerhistory[0].selectioncanvas.width = peerhistory[0].selectionmaskcanvas.height;
	peerhistory[0].selectioncanvas.height = peerhistory[0].selectionmaskcanvas.width;
	peerhistory[0].selectioncontext.rotate( angle );
	peerhistory[0].selectioncontext.translate(clockwise==false?-(peerhistory[0].selectionmaskcanvas.width):0, clockwise==true?-(peerhistory[0].selectionmaskcanvas.height):0);
	//peerhistory[0].selectioncontext.drawImage(image, 0, 0);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 0, 0);
	peerhistory[0].selectioncontext.translate(clockwise==false?(peerhistory[0].selectionmaskcanvas.width):0, clockwise==true?(peerhistory[0].selectionmaskcanvas.height):0);
	peerhistory[0].selectioncontext.rotate( -angle );
	peerhistory[0].selectioncontext.restore();
	peerhistory[0].selectionmaskcontext.clearRect(0,0,peerhistory[0].selectionmaskcanvas.width,peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectionmaskcanvas.width = peerhistory[0].selectioncanvas.width;
	peerhistory[0].selectionmaskcanvas.height = peerhistory[0].selectioncanvas.height;
	peerhistory[0].selectionmaskcontext.drawImage(peerhistory[0].selectioncanvas, 0, 0);
	
	peerhistory[0].selectioncontext.clearRect(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.save();
	peerhistory[0].selectioncontext.rotate( angle );
	peerhistory[0].selectioncontext.translate(clockwise==false?-(peerhistory[0].selectionclipcanvas.width):0, clockwise==true?-(peerhistory[0].selectionclipcanvas.height):0);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionclipcanvas, 0, 0);
	peerhistory[0].selectioncontext.translate(clockwise==false?(peerhistory[0].selectionclipcanvas.width):0, clockwise==true?(peerhistory[0].selectionclipcanvas.height):0);
	peerhistory[0].selectioncontext.rotate( -angle );
	peerhistory[0].selectioncontext.restore();
	peerhistory[0].selectionclipcontext.clearRect(0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
	peerhistory[0].selectionclipcanvas.width = peerhistory[0].selectioncanvas.width;
	peerhistory[0].selectionclipcanvas.height = peerhistory[0].selectioncanvas.height;
	peerhistory[0].selectionclipcontext.drawImage(peerhistory[0].selectioncanvas, 0, 0);
	
	peerhistory[0].selectioncontext.clearRect(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.save();
	peerhistory[0].selectioncanvas.width = peerhistory[0].resizecanvas.height;
	peerhistory[0].selectioncanvas.height = peerhistory[0].resizecanvas.width;
	peerhistory[0].selectioncontext.rotate( angle );
	peerhistory[0].selectioncontext.translate(clockwise==false?-(peerhistory[0].resizecanvas.width):0, clockwise==true?-(peerhistory[0].resizecanvas.height):0);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].resizecanvas, 0, 0);
	peerhistory[0].selectioncontext.translate(clockwise==false?(peerhistory[0].resizecanvas.width):0, clockwise==true?(peerhistory[0].resizecanvas.height):0);
	peerhistory[0].selectioncontext.rotate( -angle );
	peerhistory[0].resizecontext.clearRect(0,0,peerhistory[0].resizecanvas.width,peerhistory[0].resizecanvas.height);
	peerhistory[0].resizecanvas.width = peerhistory[0].selectioncanvas.width;
	peerhistory[0].resizecanvas.height = peerhistory[0].selectioncanvas.height;
	peerhistory[0].resizecontext.drawImage(peerhistory[0].selectioncanvas, 0, 0);
	peerhistory[0].selectioncontext.restore();
	peerhistory[0].selectioncanvas.width = peerhistory[0].selectionmaskcanvas.width+4;
	peerhistory[0].selectioncanvas.height = peerhistory[0].selectionmaskcanvas.height+4;
	
	peerhistory[0].selectioncontext.clearRect(0, 0, peerhistory[0].selectioncanvas.width, peerhistory[0].selectioncanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 0,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 2,1, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,2, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'destination-out';
	peerhistory[0].selectioncontext.drawImage(peerhistory[0].selectionmaskcanvas, 1,1);
	peerhistory[0].selectioncontext.globalCompositeOperation = 'source-over';
	
	peerhistory[0].clip.x2 = peerhistory[0].clip.x + peerhistory[0].selectionmaskcanvas.width;
	peerhistory[0].clip.y2 = peerhistory[0].clip.y + peerhistory[0].selectionmaskcanvas.height;
	
	traceSelection(peerid);
}

/*function checkerSelection(peerid){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var imgData = peerhistory[0].selectioncontext.getImageData(0,0,peerhistory[0].selectioncanvas.width,peerhistory[0].selectioncanvas.height);
	peerhistory[0].selection2canvas.width = peerhistory[0].selectioncanvas.width;
	peerhistory[0].selection2canvas.height = peerhistory[0].selectioncanvas.height;
	peerhistory[0].selection2context.clearRect(0,0,peerhistory[0].selection2canvas.width,peerhistory[0].selection2canvas.height);
	
	var w=peerhistory[0].selectioncanvas.width, h=peerhistory[0].selectioncanvas.height;
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			if( imgData.data[(((y*w)+x)*4)+3]==255){
				if((x+y)%2==0){
					peerhistory[0].selectioncontext.clearRect(x,y,1,1);
					peerhistory[0].selectioncontext.fillStyle = "rgba(255,255,255,0.5)";
					peerhistory[0].selectioncontext.fillRect(x,y,1,1);
					peerhistory[0].selection2context.fillStyle = "rgba(0,0,0,0.5)";
					peerhistory[0].selection2context.fillRect(x,y,1,1);
				}else{
					peerhistory[0].selectioncontext.clearRect(x,y,1,1);
					peerhistory[0].selectioncontext.fillStyle = "rgba(0,0,0,0.5)";
					peerhistory[0].selectioncontext.fillRect(x,y,1,1);
					peerhistory[0].selection2context.fillStyle = "rgba(255,255,255,0.5)";
					peerhistory[0].selection2context.fillRect(x,y,1,1);
				}
			}
		}
	}
}*/

function traceSelection(peerid){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var imgData = peerhistory[0].selectionmaskcontext.getImageData(0,0,peerhistory[0].selectionmaskcanvas.width,peerhistory[0].selectionmaskcanvas.height);
	
	peerhistory[0].trace = [];
	var w=peerhistory[0].selectionmaskcanvas.width, h=peerhistory[0].selectionmaskcanvas.height;
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			if( imgData.data[(((y*w)+x)*4)+3]==255){
				//essentially record vectors for each edge found and adjust length to absorb any vectors that would be able to extend it.
				if( y==0 || imgData.data[((((y-1)*w)+x)*4)+3]==0){	//check top
					peerhistory[0].trace.push( {x:x, y:y, w:1, h:0} );
				}
				if( x==0 || imgData.data[(((y*w)+(x-1))*4)+3]==0){	//check left
					peerhistory[0].trace.push( {x:x, y:y+1, w:0, h:-1} );
				}
				if( y==h-1 || imgData.data[((((y+1)*w)+x)*4)+3]==0){	//check bottom
					peerhistory[0].trace.push( {x:x+1, y:y+1, w:-1, h:0} );
				}
				if( x==w-1 || imgData.data[(((y*w)+(x+1))*4)+3]==0){	//check right
					peerhistory[0].trace.push( {x:x+1, y:y, w:0, h:1} );
				}
			}
		}
	}
	//find edges that could be combined with other edges and combine them
	/*var v=0;
	while(v<peerhistory[0].trace.length-1){
		do{
			var found=false;	
			for(var i=peerhistory[0].trace.length-1; i>v; i--){
				if(i!=v){
					if( peerhistory[0].trace[v].x+peerhistory[0].trace[v].w == peerhistory[0].trace[i].x &&	//add to v
						peerhistory[0].trace[v].y == peerhistory[0].trace[i].y &&
						peerhistory[0].trace[v].h == peerhistory[0].trace[i].h){
							peerhistory[0].trace[v].w += peerhistory[0].trace[i].w;
							peerhistory[0].trace.splice(i,1);
							found=true;
					}else if( peerhistory[0].trace[i].x+peerhistory[0].trace[i].w == peerhistory[0].trace[v].x &&	//add together and reposition v
						peerhistory[0].trace[v].y == peerhistory[0].trace[i].y &&
						peerhistory[0].trace[v].h == peerhistory[0].trace[i].h){
							peerhistory[0].trace[v].w += peerhistory[0].trace[i].w;
							peerhistory[0].trace[v].x = peerhistory[0].trace[i].x;
							peerhistory[0].trace.splice(i,1);
							found=true;
					}else if( peerhistory[0].trace[v].y+peerhistory[0].trace[v].h == peerhistory[0].trace[i].y &&	//add to v
						peerhistory[0].trace[v].x == peerhistory[0].trace[i].x &&
						peerhistory[0].trace[v].w == peerhistory[0].trace[i].w){
							peerhistory[0].trace[v].h += peerhistory[0].trace[i].h;
							peerhistory[0].trace.splice(i,1);
							found=true;
					}else if( peerhistory[0].trace[i].y+peerhistory[0].trace[i].h == peerhistory[0].trace[v].y &&	//add together and reposition v
						peerhistory[0].trace[v].x == peerhistory[0].trace[i].x &&
						peerhistory[0].trace[v].w == peerhistory[0].trace[i].w){
							peerhistory[0].trace[v].h += peerhistory[0].trace[i].h;
							peerhistory[0].trace[v].y = peerhistory[0].trace[i].y;
							peerhistory[0].trace.splice(i,1);
							found=true;
					}
				}
			}
		}while(found==true);
		v++;
	}*/
}

function copySelection(peerid){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(peerhistory[0].selectionclipped==true){
		peerhistory[0].copycontext.clearRect(0,0,peerhistory[0].copycanvas.width,peerhistory[0].copycanvas.height);
		peerhistory[0].copycanvas.width = peerhistory[0].selectionclipcanvas.width;
		peerhistory[0].copycanvas.height = peerhistory[0].selectionclipcanvas.height;
		peerhistory[0].copycontext.drawImage(peerhistory[0].selectionclipcanvas,0,0);
	}else{
		//selectClip(peerhistory[0].id);
		peerhistory[0].copycontext.clearRect(0,0,peerhistory[0].copycanvas.width,peerhistory[0].copycanvas.height);
		peerhistory[0].copycanvas.width = peerhistory[0].selectionmaskcanvas.width;
		peerhistory[0].copycanvas.height = peerhistory[0].selectionmaskcanvas.height;
		//peerhistory[0].copycontext.drawImage(peerhistory[0].selectionclipcanvas,0,0);
		peerhistory[0].copycontext.drawImage(peerhistory[0].selectionmaskcanvas,0,0,peerhistory[0].selectionmaskcanvas.width,peerhistory[0].selectionmaskcanvas.height);
		peerhistory[0].copycontext.globalCompositeOperation = 'source-in';
		peerhistory[0].copycontext.drawImage(project.canvaslayer[peerhistory[0].frame],-peerhistory[0].selectionoffset.x,-peerhistory[0].selectionoffset.y,project.width,project.height);
		peerhistory[0].copycontext.globalCompositeOperation = 'source-over';
		
		
	}
}

function pasteSelection(peerid){

	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	if(peerhistory[0].selectionclipped==true){
		commitHistory(peerhistory[0].id);
		selectPasteClip(peerhistory[0].id);
		selectClearClip(peerhistory[0].id);
	}
	peerhistory[0].selectionclipped=true;
	
	peerhistory[0].selectionclipcontext.clearRect(0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
	peerhistory[0].selectionclipcanvas.width = peerhistory[0].copycanvas.width;
	peerhistory[0].selectionclipcanvas.height = peerhistory[0].copycanvas.height;
	peerhistory[0].selectionclipcontext.drawImage(peerhistory[0].copycanvas,0,0);
	peerhistory[0].selectionmaskcanvas.width = peerhistory[0].copycanvas.width;
	peerhistory[0].selectionmaskcanvas.height = peerhistory[0].copycanvas.height;
	

	selectClip(peerhistory[0].id);
	peerhistory[0].selectionclip.x = peerhistory[0].selectionoffset.x;
	peerhistory[0].selectionclip.y = peerhistory[0].selectionoffset.y;
	peerhistory[0].selectionhandle.state = 0;
	peerhistory[0].selectionstate = "";
	
}

function checkDither(opacity,x,y, dither){
/*
	check the opacity of the tool, and correlate the dither for it, return if we should draw for the given pixel location
	0
	1	x==odd, y==odd, (x+y)%4 != 0
	2	x+y = even, x==odd, y==odd
	3	x+y = even, x==odd, y==odd || (x%4==0 && y%4==0)
	4	x+y = even, x==odd, y==odd || (x%4==0 && y%4==0) || (x+y)%4 == 0
	5	x+y = even
	6	stage 5 with stage 1 shifted to the right 1 pixel
	7	stage 5 with stage 2 shifted to the right 1 pixel
	8	stage 5 with stage 3 shifted to the right 1 pixel
	9	stage 5 with stage 4 shifted to the right 1 pixel

*/
	x+=dither.x;
	y+=dither.y;
	var s = Math.round((opacity/255)*10);
	if(s==0)return false;
	else if(s==1 && x%2!=0 && y%2!=0 && (x+y)%4!=0 )return true;
	else if(s==2 && (x+y)%2==0 && x%2!=0 && y%2!=0)return true;
	else if(s==3 && ( ((x+y)%2==0 && x%2!=0 && y%2!=0) || (x%4==0 && y%4==0) ) )return true;
	else if(s==4 && ( ((x+y)%2==0 && x%2!=0 && y%2!=0) || (x%4==0 && y%4==0) || (x+y)%4==0 ) )return true;
	else if(s==5 && (x+y)%2==0 )return true;
	else if(s==6 && ((x+y)%2==0 || ((x-1)%2!=0 && y%2!=0 && ((x-1)+y)%4!=0)) )return true;
	else if(s==7 && ((x+y)%2==0 || (((x-1)+y)%2==0 && (x-1)%2!=0 && y%2!=0)))return true;
	else if(s==8 && ((x+y)%2==0 || ( (((x-1)+y)%2==0 && (x-1)%2!=0 && y%2!=0) || ((x-1)%4==0 && y%4==0) )) )return true;
	else if(s==9 && ((x+y)%2==0 || ( (((x-1)+y)%2==0 && (x-1)%2!=0 && y%2!=0) || ((x-1)%4==0 && y%4==0) || ((x-1)+y)%4==0 ))  )return true;
	else if(s==10)return true;
	else return false;
}

function resizeImageData(c,ctx,w,h){

	//var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var imgData = ctx.getImageData(0,0,c.width,c.height);
	//c.width = w;
	//c.height = h;
	//ctx = c.getContext('2d');
	//ctx = reload_canvas(c, ctx);
	
	var rcanvas = document.createElement("canvas");
	rcanvas.width = w;
	rcanvas.height = h;
	var rcontext = rcanvas.getContext('2d');
	rcontext = reload_canvas(rcanvas, rcontext);
	
	var width = c.width;
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var x2=Math.floor((x/w)*c.width), y2=Math.floor((y/h)*c.height);
			
			var r = imgData.data[(((y2*width)+x2)*4)];
			var g = imgData.data[(((y2*width)+x2)*4)+1];
			var b = imgData.data[(((y2*width)+x2)*4)+2];
			var a = imgData.data[(((y2*width)+x2)*4)+3];
			rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			rcontext.fillRect(x,y,1,1);
					
			
		}
	}
	return rcontext.getImageData(0,0,w,h);
}

function rotateClipFast(peerid){
	
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var imgData = flipImageData(peerhistory[0].resizecontext,peerhistory[0].rotation.flipv,peerhistory[0].rotation.fliph);
	//var imgData = peerhistory[0].resizecontext.getImageData(0,0,peerhistory[0].resizecanvas.width,peerhistory[0].resizecanvas.height);
	//c.width = w;
	//c.height = h;
	//ctx = c.getContext('2d');
	//ctx = reload_canvas(c, ctx);
	
	var rcanvas = document.createElement("canvas");
	rcanvas.width = Math.max(1,peerhistory[0].selectionclip.w);
	rcanvas.height = Math.max(1,peerhistory[0].selectionclip.h);
	var rcontext = rcanvas.getContext('2d');
	rcontext = reload_canvas(rcanvas, rcontext);
	
	
	var scalex = ((peerhistory[0].selectionclip.w)/peerhistory[0].resizecanvas.width );
	var scaley = ((peerhistory[0].selectionclip.h)/peerhistory[0].resizecanvas.height );
	
	px1 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py1 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px2 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(rcanvas.width)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py2 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(rcanvas.width)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px3 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas.height)));
	py3 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas.height)));
	px4 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(rcanvas.width)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas.height)));
	py4 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(rcanvas.width)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas.height)));
	minX=Math.min(px1,px2,px3,px4);
	maxX=Math.max(px1,px2,px3,px4);
	minY=Math.min(py1,py2,py3,py4);
	maxY=Math.max(py1,py2,py3,py4);
	maxX -= minX;
	maxY -= minY;
	
	rcanvas.width = Math.max(1,maxX);
	rcanvas.height = Math.max(1,maxY);
	var rcontext = rcanvas.getContext('2d');
	rcontext = reload_canvas(rcanvas, rcontext);
	
	if(peerhistory[0].rotation.state==2){
		var clipoffsetx = Math.floor(peerhistory[0].selectionclipcanvas.width - maxX)*0.5;
		var clipoffsety = Math.floor(peerhistory[0].selectionclipcanvas.height - maxY)*0.5;
		peerhistory[0].selectionoffset.x += clipoffsetx;
		peerhistory[0].selectionoffset.y += clipoffsety;
	}
		peerhistory[0].selectionclipcanvas.width = maxX;
		peerhistory[0].selectionclipcanvas.height = maxY;
		peerhistory[0].selectionclipcontext = peerhistory[0].selectionclipcanvas.getContext('2d');
		peerhistory[0].selectionclipcontext = reload_canvas(peerhistory[0].selectionclipcanvas, peerhistory[0].selectionclipcontext);
	
	var w = peerhistory[0].selectionclip.w;
	var h = peerhistory[0].selectionclip.h;
	var width = peerhistory[0].resizecanvas.width;
	var height = peerhistory[0].resizecanvas.height;
	
	var sx=0,sy=0;
	if(peerhistory[0].rotation.alt || peerhistory[0].rotation.state==2){
		sx = Math.floor( ((rcanvas.width)*0.5)-(Math.cos(peerhistory[0].rotation.radian)*(w*0.5)) - (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(h*0.5)) );
		sy = Math.floor( ((rcanvas.height)*0.5)-(Math.sin(peerhistory[0].rotation.radian)*(w*0.5)) - (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(h*0.5)) );
	}else{
		//sx = Math.floor( ((rcanvas.width)*0.5)-(Math.cos(peerhistory[0].rotation.radian)*(w*0.5)) - (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(h*0.5)) );
		//sy = Math.floor( ((rcanvas.height)*0.5)-(Math.sin(peerhistory[0].rotation.radian)*(w*0.5)) - (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(h*0.5)) );
		sx = peerhistory[0].rotation.sx;
		sy = peerhistory[0].rotation.sy;
	}
	if(peerhistory[0].selectionhandle.x==-1 && peerhistory[0].selectionhandle.y==-1){
		//hx = Math.floor(sx + Math.cos(peerhistory[0].rotation.radian)*(peerhistory[0].rotation.ow-peerhistory[0].rotation.w));
		//hy = Math.floor(sy + Math.sin(peerhistory[0].rotation.radian)*(peerhistory[0].rotation.ow-peerhistory[0].rotation.w));
	}
	if(peerhistory[0].selectionhandle.state == 2){// && !(peerhistory[0].selectionhandle.x==1 && peerhistory[0].selectionhandle.y==1)){
	if(peerhistory[0].rotation.w<0){
		//sx -= Math.floor( (Math.cos(peerhistory[0].rotation.radian)*w) );
		//sy -= Math.floor( (Math.sin(peerhistory[0].rotation.radian)*w) );
		peerhistory[0].selectionoffset.x -= Math.floor( (Math.cos(peerhistory[0].rotation.radian)*w) );
		peerhistory[0].selectionoffset.y -= Math.floor( (Math.sin(peerhistory[0].rotation.radian)*w) );
	
	}
	if(peerhistory[0].rotation.h<0){
		//sx -= Math.floor( (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*h) );
		//sy -= Math.floor( (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*h) );
		peerhistory[0].selectionoffset.x -= Math.floor( (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*h) );
		peerhistory[0].selectionoffset.y -= Math.floor( (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*h) );
	
	}
	}
	//peerhistory[0].rotation.sx = sx;
	//peerhistory[0].rotation.sy = sy;
	
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var x2=Math.floor((x/w)*width), y2=Math.floor((y/h)*height);
			//if(y2%2==0){
				//var neighbors = getNeighbors(x+4,y+4,imgData);
				var r = imgData.data[(((y2*width)+x2)*4)];
				var g = imgData.data[(((y2*width)+x2)*4)+1];
				var b = imgData.data[(((y2*width)+x2)*4)+2];
				var a = imgData.data[(((y2*width)+x2)*4)+3];
				
				px = Math.floor((Math.cos(peerhistory[0].rotation.radian)*x) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*y));
				py = Math.floor((Math.sin(peerhistory[0].rotation.radian)*x) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*y));
				
				rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				rcontext.fillRect(sx+px,sy+py,2,2);
			//}
			
		}
	}
	
	//this is to make sure that the handles and square align with the edges of the clipped image while rotating.
	if(peerhistory[0].rotation.state==2){
		peerhistory[0].rotation.sx = sx;
		peerhistory[0].rotation.sy = sy;
		
		//peerhistory[0].rotation.sx = e.data.sx;
		//peerhistory[0].rotation.sy = e.data.sy;
		peerhistory[0].rotation.ex = Math.cos(peerhistory[0].rotation.radian);
		peerhistory[0].rotation.ey = Math.sin(peerhistory[0].rotation.radian);
		var normals = calcNormals(peerhistory[0].rotation.ex,peerhistory[0].rotation.ey);
		peerhistory[0].rotation.rx = normals[0];
		peerhistory[0].rotation.ry = normals[1];
		peerhistory[0].rotation.corners = [
			peerhistory[0].rotation.sx + (peerhistory[0].rotation.ex*peerhistory[0].selectionclip.w),
			peerhistory[0].rotation.sy + (peerhistory[0].rotation.ey*peerhistory[0].selectionclip.w),
			peerhistory[0].rotation.sx + (peerhistory[0].rotation.rx*peerhistory[0].selectionclip.h),
			peerhistory[0].rotation.sy + (peerhistory[0].rotation.ry*peerhistory[0].selectionclip.h),
			peerhistory[0].rotation.sx + (peerhistory[0].rotation.ex*peerhistory[0].selectionclip.w)+(peerhistory[0].rotation.rx*peerhistory[0].selectionclip.h),
			peerhistory[0].rotation.sy + (peerhistory[0].rotation.ey*peerhistory[0].selectionclip.w)+(peerhistory[0].rotation.ry*peerhistory[0].selectionclip.h)
		];
	}
			
	/*for(var py=0; py<h; py++){
		if(py%2==0){
		sx = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*py));
		sy = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*py));
		ex = Math.floor((Math.cos(peerhistory[0].rotation.radian)*w) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*py));
		ey = Math.floor((Math.sin(peerhistory[0].rotation.radian)*w) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*py));
		
		//bresenham's line algorith via wiki
		var x0 = sx;
		var y0 = sy;
		var x1 = ex;
		var y1 = ey;
		var t1 = ex;
		var t2 = ey;
		var steep = 0;
		if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
		if (steep == 1){
			t1 = x0;
			t2 = x1;
			x0 = y0;
			x1 = y1;
			y0 = t1;
			y1 = t2;
		}
		if (x0 > x1){
			t1 = x0;
			t2 = y0;
			x0 = x1;
			y0 = y1;
			x1 = t1;
			y1 = t2;
		}
		var deltax = x1 - x0;
		var deltay = Math.abs(y1 - y0);
		var error = deltax / 2;
		var ystep;
		var y = y0;
		if (y0 < y1){
			ystep = 1;
		} else {
			ystep = -1;
		}
		
		var savederror = error;
		var savedy = y;
		
		y = savedy;
		error = savederror;
		
		for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
			if (steep == 1){
				var dist = calcDistance(y,x,sx,sy);
				var x2=Math.floor((dist/w)*width), y2=Math.floor((py/h)*height);
				var r = imgData.data[(((y2*width)+x2)*4)];
				var g = imgData.data[(((y2*width)+x2)*4)+1];
				var b = imgData.data[(((y2*width)+x2)*4)+2];
				var a = imgData.data[(((y2*width)+x2)*4)+3];
				rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				rcontext.fillRect(y,x,1,1);
			} else {
				var dist = calcDistance(x,y,sx,sy);
				var x2=Math.floor((dist/w)*width), y2=Math.floor((py/h)*height);
				var r = imgData.data[(((y2*width)+x2)*4)];
				var g = imgData.data[(((y2*width)+x2)*4)+1];
				var b = imgData.data[(((y2*width)+x2)*4)+2];
				var a = imgData.data[(((y2*width)+x2)*4)+3];
				rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				rcontext.fillRect(x,y,1,1);
			}
			var error = error - deltay;
			if (error < 0){
				y = y + ystep;
				error = error + deltax;
			}
		}
		var dist = calcDistance(ex,ey,sx,sy);
		var x2=Math.floor((dist/w)*width), y2=Math.floor((py/h)*height);
		var r = imgData.data[(((y2*width)+x2)*4)];
		var g = imgData.data[(((y2*width)+x2)*4)+1];
		var b = imgData.data[(((y2*width)+x2)*4)+2];
		var a = imgData.data[(((y2*width)+x2)*4)+3];
		rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
		rcontext.fillRect(ex,ey,1,1);
		}
	}		
	*/
	
	
	
	peerhistory[0].selectionclipcontext.clearRect(0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
	if(peerhistory[0].rotation.alt || peerhistory[0].rotation.state==2)peerhistory[0].selectionclipcontext.drawImage(rcanvas,Math.floor((peerhistory[0].selectionclipcanvas.width*0.5)-(rcanvas.width*0.5)),Math.floor((peerhistory[0].selectionclipcanvas.height*0.5)-(rcanvas.height*0.5)) );
	else peerhistory[0].selectionclipcontext.drawImage(rcanvas,0,0 );
	//console.log(scalex);
	//imgData = resizeImageData(rcanvas4,rcontext4,width,height);
	//peerhistory[0].selectionclipcontext.putImageData(imgData,0,0);
	//peerhistory[0].selectionclipcontext.drawImage(rcanvas4,0,0);
	
}

function rotateClip(peerid){
	
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	//var imgData = peerhistory[0].resizecontext.getImageData(0,0,peerhistory[0].resizecanvas.width,peerhistory[0].resizecanvas.height);
	//c.width = w;
	//c.height = h;
	//ctx = c.getContext('2d');
	//ctx = reload_canvas(c, ctx);
	
	var rcanvas = document.createElement("canvas");
	rcanvas.width = peerhistory[0].resizecanvas.width*2;
	rcanvas.height = peerhistory[0].resizecanvas.height*2;
	var rcontext = rcanvas.getContext('2d');
	//rcontext = reload_canvas(rcanvas, rcontext);
	
	var rcanvas4 = document.createElement("canvas");
	rcanvas4.width = peerhistory[0].resizecanvas.width*4;
	rcanvas4.height = peerhistory[0].resizecanvas.height*4;
	var rcontext4 = rcanvas4.getContext('2d');
	//rcontext4 = reload_canvas(rcanvas4, rcontext4);
	
	var rcanvas8 = document.createElement("canvas");
	rcanvas8.width = peerhistory[0].resizecanvas.width*8;
	rcanvas8.height = peerhistory[0].resizecanvas.height*8;
	var rcontext8 = rcanvas8.getContext('2d');
	//rcontext8 = reload_canvas(rcanvas8, rcontext8);
	
	var datacanvas1 = peerhistory[0].resizecontext.getImageData(0, 0, peerhistory[0].resizecanvas.width, peerhistory[0].resizecanvas.height);
	var datacanvas2 = rcontext.getImageData(0, 0, rcanvas.width, rcanvas.height);
	var datacanvas3 = rcontext4.getImageData(0, 0, rcanvas4.width, rcanvas4.height);
	var datacanvas4 = rcontext8.getImageData(0, 0, rcanvas8.width, rcanvas8.height);

	scale2x(datacanvas1, datacanvas2);
	rcontext.putImageData(datacanvas2, 0, 0);
	scale2x(datacanvas2, datacanvas3);
	rcontext4.putImageData(datacanvas3, 0, 0);
	scale2x(datacanvas3, datacanvas4);
	rcontext8.putImageData(datacanvas4, 0, 0);
	
	var imgData = rcontext8.getImageData(0,0,rcanvas8.width,rcanvas8.height);
	rcontext4.clearRect(0,0,rcanvas4.width,rcanvas4.height);
	
	var scalex = ((peerhistory[0].selectionclip.x2-peerhistory[0].selectionclip.x)/peerhistory[0].resizecanvas.width );
	var scaley = ((peerhistory[0].selectionclip.y2-peerhistory[0].selectionclip.y)/peerhistory[0].resizecanvas.height );
	
	px1 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py1 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px2 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(rcanvas8.width*scalex)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py2 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(rcanvas8.width*scalex)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px3 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas8.height*scaley)));
	py3 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas8.height*scaley)));
	px4 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(rcanvas8.width*scalex)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas8.height*scaley)));
	py4 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(rcanvas8.width*scalex)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(rcanvas8.height*scaley)));
	minX=Math.min(px1,px2,px3,px4);
	maxX=Math.max(px1,px2,px3,px4);
	minY=Math.min(py1,py2,py3,py4);
	maxY=Math.max(py1,py2,py3,py4);
	maxX -= minX;
	maxY -= minY;
	
	rcanvas4.width = maxX;
	rcanvas4.height = maxY;
	var rcontext4 = rcanvas4.getContext('2d');
	rcontext4 = reload_canvas(rcanvas4, rcontext4);
				
	var ox = peerhistory[0].selectionclip.x2-peerhistory[0].selectionclip.x;
	var oy = peerhistory[0].selectionclip.y2-peerhistory[0].selectionclip.y;
	px1 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py1 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px2 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(ox)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py2 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(ox)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px3 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	py3 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	px4 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(ox)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	py4 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(ox)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	minX=Math.min(px1,px2,px3,px4);
	maxX=Math.max(px1,px2,px3,px4);
	minY=Math.min(py1,py2,py3,py4);
	maxY=Math.max(py1,py2,py3,py4);
	maxX -= minX;
	maxY -= minY;
	
	var width = Math.floor(maxX);
	var height = Math.floor(maxY);
	var w0 = rcanvas8.width;
	var h0 = rcanvas8.height;
	var w = rcanvas8.width*scalex;
	var h = rcanvas8.height*scaley;
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var x2=Math.floor((x/w)*w0), y2=Math.floor((y/h)*h0);
			//if(y2%2==0){
				//var neighbors = getNeighbors(x+4,y+4,imgData);
				var r = imgData.data[(((y2*w0)+x2)*4)];
				var g = imgData.data[(((y2*w0)+x2)*4)+1];
				var b = imgData.data[(((y2*w0)+x2)*4)+2];
				var a = imgData.data[(((y2*w0)+x2)*4)+3];
				
				px = Math.floor((Math.cos(peerhistory[0].rotation.radian)*x) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*y));
				py = Math.floor((Math.sin(peerhistory[0].rotation.radian)*x) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*y));
				
				sx = Math.floor( ((rcanvas4.width)*0.5)-(Math.cos(peerhistory[0].rotation.radian)*(w*0.5)) - (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(h*0.5)) );
				sy = Math.floor( ((rcanvas4.height)*0.5)-(Math.sin(peerhistory[0].rotation.radian)*(w*0.5)) - (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(h*0.5)) );
				
				
				rcontext4.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				rcontext4.fillRect(sx+px,sy+py,2,2);
			//}
			
		}
	}
	
	/*for(var py=0; py<h; py++){
		if(py%2==0){
		sx = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*py));
		sy = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*py));
		ex = Math.floor((Math.cos(peerhistory[0].rotation.radian)*w) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*py));
		ey = Math.floor((Math.sin(peerhistory[0].rotation.radian)*w) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*py));
		
		//bresenham's line algorith via wiki
		var x0 = sx;
		var y0 = sy;
		var x1 = ex;
		var y1 = ey;
		var t1 = ex;
		var t2 = ey;
		var steep = 0;
		if(Math.abs(y1 - y0) > Math.abs(x1 - x0)) steep = 1;
		if (steep == 1){
			t1 = x0;
			t2 = x1;
			x0 = y0;
			x1 = y1;
			y0 = t1;
			y1 = t2;
		}
		if (x0 > x1){
			t1 = x0;
			t2 = y0;
			x0 = x1;
			y0 = y1;
			x1 = t1;
			y1 = t2;
		}
		var deltax = x1 - x0;
		var deltay = Math.abs(y1 - y0);
		var error = deltax / 2;
		var ystep;
		var y = y0;
		if (y0 < y1){
			ystep = 1;
		} else {
			ystep = -1;
		}
		
		var savederror = error;
		var savedy = y;
		
		y = savedy;
		error = savederror;
		
		for( var x = x0; x != x1; x = x - ((x-x1)/Math.abs(x-x1)) ){
			if (steep == 1){
				var dist = calcDistance(y,x,sx,sy);
				var x2=Math.floor((dist/w)*width), y2=Math.floor((py/h)*height);
				var r = imgData.data[(((y2*width)+x2)*4)];
				var g = imgData.data[(((y2*width)+x2)*4)+1];
				var b = imgData.data[(((y2*width)+x2)*4)+2];
				var a = imgData.data[(((y2*width)+x2)*4)+3];
				rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				rcontext.fillRect(y,x,1,1);
			} else {
				var dist = calcDistance(x,y,sx,sy);
				var x2=Math.floor((dist/w)*width), y2=Math.floor((py/h)*height);
				var r = imgData.data[(((y2*width)+x2)*4)];
				var g = imgData.data[(((y2*width)+x2)*4)+1];
				var b = imgData.data[(((y2*width)+x2)*4)+2];
				var a = imgData.data[(((y2*width)+x2)*4)+3];
				rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				rcontext.fillRect(x,y,1,1);
			}
			var error = error - deltay;
			if (error < 0){
				y = y + ystep;
				error = error + deltax;
			}
		}
		var dist = calcDistance(ex,ey,sx,sy);
		var x2=Math.floor((dist/w)*width), y2=Math.floor((py/h)*height);
		var r = imgData.data[(((y2*width)+x2)*4)];
		var g = imgData.data[(((y2*width)+x2)*4)+1];
		var b = imgData.data[(((y2*width)+x2)*4)+2];
		var a = imgData.data[(((y2*width)+x2)*4)+3];
		rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
		rcontext.fillRect(ex,ey,1,1);
		}
	}		
	*/
	
	
	
	//peerhistory[0].selectioncontext.drawImage(rcanvas,0,0);
	peerhistory[0].selectionclipcontext.clearRect(0,0,peerhistory[0].selectionclipcanvas.width,peerhistory[0].selectionclipcanvas.height);
	//console.log(scalex);
	imgData = resizeImageData(rcanvas4,rcontext4,width,height);
	peerhistory[0].selectionclipcontext.putImageData(imgData,0,0);
	//peerhistory[0].selectionclipcontext.drawImage(rcanvas4,0,0);
	var originalData = peerhistory[0].resizecontext.getImageData(0,0,peerhistory[0].resizecanvas.width,peerhistory[0].resizecanvas.height);
	var rw = peerhistory[0].resizecanvas.width;
	var rh = peerhistory[0].resizecanvas.height;
	for(var y=0; y<height; y++){
		for(var x=0; x<width; x++){
			var neighbors = getNeighbors(x,y,imgData);
			var same=0;
			for(var i=0; i<neighbors.length; i++){
				var found = 0;
				for(var j=0; j<neighbors.length; j++){
					if(neighbors[i].r==neighbors[j].r && neighbors[i].g==neighbors[j].g && neighbors[i].b==neighbors[j].b && neighbors[i].a==neighbors[j].a){
						found++;
					}
				}
				if(found>same)same=found;
			}
			
			var colorchoice = fixPixel(neighbors);
			
			if(colorchoice!=null && same>=4){
			//if(same>=3){
				var distancex = calcDistance(width*0.5,height*0.5,x,height*0.5);
				var distancey = calcDistance(width*0.5,height*0.5,width*0.5,y);
				var rotation = calcAngle(width*0.5,height*0.5,x,y);
				distancex = (distancex/(peerhistory[0].selectionclip.x2-peerhistory[0].selectionclip.x))*peerhistory[0].resizecanvas.width;
				distancey = (distancey/(peerhistory[0].selectionclip.y2-peerhistory[0].selectionclip.y))*peerhistory[0].resizecanvas.height;
				var distance = calcDistance(0,0,distancex,distancey);
				//console.log(distance+","+distancex+","+distancey);
				px = Math.floor((Math.cos((rotation[1])-peerhistory[0].rotation.radian)*distance) + (peerhistory[0].resizecanvas.width*0.5) );
				py = Math.floor((Math.sin((rotation[1])-peerhistory[0].rotation.radian)*distance) + (peerhistory[0].resizecanvas.height*0.5) );
				
				if(px>=0 && py>=0 && px<peerhistory[0].resizecanvas.width && py<peerhistory[0].resizecanvas.height){
					/*var r = originalData.data[(((py*rw)+px)*4)];
					var g = originalData.data[(((py*rw)+px)*4)+1];
					var b = originalData.data[(((py*rw)+px)*4)+2];
					var a = originalData.data[(((py*rw)+px)*4)+3];
					*/
					peerhistory[0].selectionclipcontext.fillStyle = "rgba("+colorchoice.r+","+colorchoice.g+","+colorchoice.b+","+colorchoice.a+")";
					//peerhistory[0].selectionclipcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
					peerhistory[0].selectionclipcontext.fillRect(x,y,1,1);
		
				}
				
			}
		}
	}
	
}

function startRotate(peerid,from,center){
	
	var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	
	peerhistory[0].rotation.lastflipv=peerhistory[0].rotation.flipv;
	peerhistory[0].rotation.lastfliph=peerhistory[0].rotation.fliph;
	var datacanvas1 = flipImageData(peerhistory[0].resizecontext,peerhistory[0].rotation.flipv,peerhistory[0].rotation.fliph);//peerhistory[0].resizecontext.getImageData(0, 0, peerhistory[0].resizecanvas.width, peerhistory[0].resizecanvas.height);
	var datacanvas2 = peerhistory[0].resizecontext.createImageData(peerhistory[0].resizecanvas.width*2, peerhistory[0].resizecanvas.height*2);
	var datacanvas3 = peerhistory[0].resizecontext.createImageData(peerhistory[0].resizecanvas.width*4, peerhistory[0].resizecanvas.height*4);
	var datacanvas4 = peerhistory[0].resizecontext.createImageData(peerhistory[0].resizecanvas.width*8, peerhistory[0].resizecanvas.height*8);
	
	var scalex = ((peerhistory[0].selectionclip.w)/peerhistory[0].resizecanvas.width );
	var scaley = ((peerhistory[0].selectionclip.h)/peerhistory[0].resizecanvas.height );
	
	px1 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py1 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px2 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(datacanvas4.width*scalex)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py2 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(datacanvas4.width*scalex)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px3 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(datacanvas4.height*scaley)));
	py3 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(datacanvas4.height*scaley)));
	px4 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(datacanvas4.width*scalex)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(datacanvas4.height*scaley)));
	py4 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(datacanvas4.width*scalex)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(datacanvas4.height*scaley)));
	minX=Math.min(px1,px2,px3,px4);
	maxX=Math.max(px1,px2,px3,px4);
	minY=Math.min(py1,py2,py3,py4);
	maxY=Math.max(py1,py2,py3,py4);
	maxX -= minX;
	maxY -= minY;
	
	var datacanvasA = peerhistory[0].resizecontext.createImageData(Math.max(1,maxX), Math.max(1,maxY));	
	
	var ox = peerhistory[0].selectionclip.w;
	var oy = peerhistory[0].selectionclip.h;
	px1 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py1 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px2 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(ox)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*0));
	py2 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(ox)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*0));
	px3 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*0) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	py3 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*0) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	px4 = Math.floor((Math.cos(peerhistory[0].rotation.radian)*(ox)) + (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	py4 = Math.floor((Math.sin(peerhistory[0].rotation.radian)*(ox)) + (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(oy)));
	minX=Math.min(px1,px2,px3,px4);
	maxX2=Math.max(px1,px2,px3,px4);
	minY=Math.min(py1,py2,py3,py4);
	maxY2=Math.max(py1,py2,py3,py4);
	maxX2 -= minX;
	maxY2 -= minY;

	var datacanvasB = peerhistory[0].resizecontext.createImageData(Math.max(1,maxX2), Math.max(1,maxY2));	
	
	//if(typeof(rotateWorker) == "undefined") {
	if(peerhistory[0].rotateWorkerRunning == false) {
		peerhistory[0].rotateWorker = new Worker( scale2x_workerblob );//'scale2x.js');
		peerhistory[0].rotateWorkerRunning = true;
		if(project.playback.state==true){
			myHistory[0].rotation.playback = true;
			project.playback.stop();
		}
			
		peerhistory[0].rotateWorker.addEventListener('message', function(e) {
			
			
			if(peerhistory[0].id == myHistory[0].id){
				send_start_rotate(myHistory[0].rotation, myHistory[0].selectionclip, center);
				if(peerlist.length>0)myHistory[0].rotation.state = 3;	//locked
				//else send_select_move(myHistory[0].selectionoffset);
				//if(peerlist.length==0){}
			}else if(typeof(from)!='undefined' && from!=null){	//send msg back to rotation starter(so they can calc when to unlock themselves)
				var conns = peer.connections[from];
				for (var i = 0, ii = conns.length; i < ii; i += 1) {
					var conn = conns[i];
				  
					if(connlist.indexOf(conn.id)!=-1 && conn.label=='draw'){
						var msg = {type:'unlock_rotation' };
						conn.send( msg );
					}
				}
			}
			
			if(peerhistory[0].resize.alt || center){
				peerhistory[0].rotation.sx = Math.floor( ((e.data.img.width)*0.5)-(Math.cos(peerhistory[0].rotation.radian)*(peerhistory[0].selectionclip.w*0.5)) - (Math.cos(peerhistory[0].rotation.radian+toRadians(90))*(peerhistory[0].selectionclip.h*0.5)) );
				peerhistory[0].rotation.sy = Math.floor( ((e.data.img.height)*0.5)-(Math.sin(peerhistory[0].rotation.radian)*(peerhistory[0].selectionclip.w*0.5)) - (Math.sin(peerhistory[0].rotation.radian+toRadians(90))*(peerhistory[0].selectionclip.h*0.5)) );
			}			
			//peerhistory[0].rotation.sx = e.data.sx;
			//peerhistory[0].rotation.sy = e.data.sy;
			peerhistory[0].rotation.ex = Math.cos(peerhistory[0].rotation.radian);
			peerhistory[0].rotation.ey = Math.sin(peerhistory[0].rotation.radian);
			var normals = calcNormals(peerhistory[0].rotation.ex,peerhistory[0].rotation.ey);
			peerhistory[0].rotation.rx = normals[0];
			peerhistory[0].rotation.ry = normals[1];
			peerhistory[0].rotation.corners = [
				peerhistory[0].rotation.sx + (peerhistory[0].rotation.ex*peerhistory[0].selectionclip.w),
				peerhistory[0].rotation.sy + (peerhistory[0].rotation.ey*peerhistory[0].selectionclip.w),
				peerhistory[0].rotation.sx + (peerhistory[0].rotation.rx*peerhistory[0].selectionclip.h),
				peerhistory[0].rotation.sy + (peerhistory[0].rotation.ry*peerhistory[0].selectionclip.h),
				peerhistory[0].rotation.sx + (peerhistory[0].rotation.ex*peerhistory[0].selectionclip.w)+(peerhistory[0].rotation.rx*peerhistory[0].selectionclip.h),
				peerhistory[0].rotation.sy + (peerhistory[0].rotation.ey*peerhistory[0].selectionclip.w)+(peerhistory[0].rotation.ry*peerhistory[0].selectionclip.h)
			];
			peerhistory[0].rotation.originalcorners = [
				peerhistory[0].rotation.sx + (peerhistory[0].rotation.ex*peerhistory[0].selectionclip.w),
				peerhistory[0].rotation.sy + (peerhistory[0].rotation.ey*peerhistory[0].selectionclip.w),
				peerhistory[0].rotation.sx + (peerhistory[0].rotation.rx*peerhistory[0].selectionclip.h),
				peerhistory[0].rotation.sy + (peerhistory[0].rotation.ry*peerhistory[0].selectionclip.h),
				peerhistory[0].rotation.sx + (peerhistory[0].rotation.ex*peerhistory[0].selectionclip.w)+(peerhistory[0].rotation.rx*peerhistory[0].selectionclip.h),
				peerhistory[0].rotation.sy + (peerhistory[0].rotation.ey*peerhistory[0].selectionclip.w)+(peerhistory[0].rotation.ry*peerhistory[0].selectionclip.h)
			];
			//if we're not centering the new result, we'll need to find the correct offset for the new result
			minX=Math.floor(Math.min(peerhistory[0].rotation.sx,peerhistory[0].rotation.corners[0],peerhistory[0].rotation.corners[2],peerhistory[0].rotation.corners[4]));
			maxX=Math.floor(Math.max(peerhistory[0].rotation.sx,peerhistory[0].rotation.corners[0],peerhistory[0].rotation.corners[2],peerhistory[0].rotation.corners[4]));
			minY=Math.floor(Math.min(peerhistory[0].rotation.sy,peerhistory[0].rotation.corners[1],peerhistory[0].rotation.corners[3],peerhistory[0].rotation.corners[5]));
			maxY=Math.floor(Math.max(peerhistory[0].rotation.sy,peerhistory[0].rotation.corners[1],peerhistory[0].rotation.corners[3],peerhistory[0].rotation.corners[5]));
			//minX -= peerhistory[0].rotation.sx;
			//minY -= peerhistory[0].rotation.sy;	
			
			peerhistory[0].selectionclipcanvas.width = e.data.img.width;
			peerhistory[0].selectionclipcanvas.height = e.data.img.height;
			peerhistory[0].selectionclipcontext = peerhistory[0].selectionclipcanvas.getContext('2d');
			//rcontext = reload_canvas(rcanvas, rcontext);
			peerhistory[0].selectionclipcontext.putImageData(e.data.img,0,0);
			
			var w = peerhistory[0].selectionclip.x2-peerhistory[0].selectionclip.x;
			var h = peerhistory[0].selectionclip.y2-peerhistory[0].selectionclip.y;
			if(peerhistory[0].resize.alt || center){
				peerhistory[0].selectionoffset.x = peerhistory[0].selectionclip.x + Math.floor((w*0.5)-(e.data.img.width*0.5));
				peerhistory[0].selectionoffset.y = peerhistory[0].selectionclip.y + Math.floor((h*0.5)-(e.data.img.height*0.5));
				peerhistory[0].selectionclip.x = peerhistory[0].selectionclip.x + Math.floor((w*0.5)-(e.data.img.width*0.5));
				peerhistory[0].selectionclip.y = peerhistory[0].selectionclip.y + Math.floor((h*0.5)-(e.data.img.height*0.5));
				peerhistory[0].selectionclip.x2 = peerhistory[0].selectionclip.x + e.data.img.width;
				peerhistory[0].selectionclip.y2 = peerhistory[0].selectionclip.y + e.data.img.height;
			}else{
				//console.log(myHistory[0].selectionoffset.x+","+myHistory[0].selectionoffset.y);
				var tempx = myHistory[0].selectionoffset.x - myHistory[0].selectionclip.x;	//selectionoffset/clip is from 0,0 of drawspace, so we subtract to get their real offset
				var tempy = myHistory[0].selectionoffset.y - myHistory[0].selectionclip.y;
				peerhistory[0].selectionoffset.x = peerhistory[0].selectionclip.x + minX + tempx;
				peerhistory[0].selectionoffset.y = peerhistory[0].selectionclip.y + minY + tempy;
				peerhistory[0].selectionclip.x = peerhistory[0].selectionclip.x + minX + tempx;
				peerhistory[0].selectionclip.y = peerhistory[0].selectionclip.y + minY + tempy;
				peerhistory[0].selectionclip.x2 = peerhistory[0].selectionclip.x + e.data.img.width;
				peerhistory[0].selectionclip.y2 = peerhistory[0].selectionclip.y + e.data.img.height;
				peerhistory[0].rotation.sx-=minX;
				peerhistory[0].rotation.sy-=minY;
				peerhistory[0].rotation.corners[0]-=minX;
				peerhistory[0].rotation.corners[1]-=minY;
				peerhistory[0].rotation.corners[2]-=minX;
				peerhistory[0].rotation.corners[3]-=minY;
				peerhistory[0].rotation.corners[4]-=minX;
				peerhistory[0].rotation.corners[5]-=minY;
				peerhistory[0].rotation.originalcorners[0]-=minX;
				peerhistory[0].rotation.originalcorners[1]-=minY;
				peerhistory[0].rotation.originalcorners[2]-=minX;
				peerhistory[0].rotation.originalcorners[3]-=minY;
				peerhistory[0].rotation.originalcorners[4]-=minX;
				peerhistory[0].rotation.originalcorners[5]-=minY;
				peerhistory[0].rotation.originalcorners[6]=peerhistory[0].rotation.sx;
				peerhistory[0].rotation.originalcorners[7]=peerhistory[0].rotation.sy;
			}
			peerhistory[0].selectionmaskcanvas.width = e.data.img.width;
			peerhistory[0].selectionmaskcanvas.height = e.data.img.height;
			peerhistory[0].selectionmaskcontext = peerhistory[0].selectionmaskcanvas.getContext('2d');
			peerhistory[0].selectionmaskcontext.clearRect(0,0,peerhistory[0].selectionmaskcanvas.width,peerhistory[0].selectionmaskcanvas.height);
			peerhistory[0].selectionmaskcontext.putImageData(e.data.img,0,0);
			selectLasso(peerhistory[0].id, 'rotate' );
			//selectClip(peerhistory[0].id,true);
			
			peerhistory[0].rotateWorkerRunning = false
			
			if(peerhistory[0].id == myHistory[0].id && peerlist.length==0)send_select_move(myHistory[0].selectionoffset);
			
			if(myHistory[0].rotation.playback==true){
				myHistory[0].rotation.playback = false;
				project.playback.start();
			}
			
		}, false);
		
        peerhistory[0].rotateWorker.postMessage({'datacanvas1': datacanvas1, 'datacanvas2': datacanvas2, 'datacanvas3': datacanvas3, 'datacanvas4': datacanvas4, 'datacanvasA': datacanvasA, 'datacanvasB': datacanvasB, 'maxX':maxX, 'maxY':maxY, 'maxX2':maxX2, 'maxY2':maxY2, 'selectionclip': peerhistory[0].selectionclip, 'rotation': peerhistory[0].rotation });

	}
}

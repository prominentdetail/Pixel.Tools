
function palettecanvas_events(){


	pcanvas.onmousedown = function(e){
		var left, right;
		left = 0;
		right = 2;
		if(e.button === left){
			mouse.left = true;
			
			if(key.spacebar==false && tool.preventdraw==false && project.lock==false && animation.state==false){
				var finalx = Math.floor(mouse.pos.x );
				var finaly = Math.floor(mouse.pos.y );
				var lastfinalx = Math.floor(mouse.lastpos.x );
				var lastfinaly = Math.floor(mouse.lastpos.y );
				if(key.shift==true){
					lastfinalx = mouse.lastclick.x;
					lastfinaly = mouse.lastclick.y;
					mouse.lastclick.x = finalx;
					mouse.lastclick.y = finaly;
					//console.log(lastfinalx+","+lastfinaly);
				}
					
				updatePen();
				var t = {size:tool.size,opacity:tool.opacity,hardness:tool.hardness,levels:tool.levels,pressure:tool.pressure,tilt:tool.tilt,pen:tool.pen};

				if( $('#canvas').css('cursor')=='crosshair' && key.ctrl==false && tool.lockcolordex==false ){

					if(mouse.tool=="eraser"){
						erase_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
					}
					
					if(mouse.tool=="magiceraser" && tool.brushing==false){
						tool.brushing=true;
						erase_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
					}
					
					if(mouse.tool=="pencil"){
						pixel_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
					}
					
					if(mouse.tool=="brush" && tool.brushing==false){
						tool.brushing=true;
						pixel_line(palettecontext,lastfinalx,lastfinaly,finalx,finaly,mouse.color,t,"palette");
					}
					
					/*if(mouse.tool=="bucket"){
						var contiguous = ($("#contiguous").next('label').attr('aria-pressed')=='true'? true:false);
						floodFill(palettecontext,{x:finalx,y:finaly},mouse.rgb,contiguous,myHistory[0].id);
					}*/
					
				}
				
				if(mouse.tool=="eyedropper" || $('#canvas').css('cursor').indexOf('eyedropper')>=0 ){
					/*var imgData = context.getImageData(mouse.pos.x,mouse.pos.y,1,1);
					mouse.rgb.r = imgData.data[0];
					mouse.rgb.g = imgData.data[1];
					mouse.rgb.b = imgData.data[2];*/
					if($( "#rgb_hsl_radio label[class*='ui-state-active']" ).attr('for')=='radio1'){
						//var colorvalues = rgbToHsl(mouse.rgb.r,mouse.rgb.g,mouse.rgb.b);
						var colorPickerMode = 'rgb';
						convertSwatch(colorPickerMode,[mouse.colorbelow.r,mouse.colorbelow.g,mouse.colorbelow.b]);
						mouse.color = 'rgba('+mouse.colorbelow.r+','+mouse.colorbelow.g+','+mouse.colorbelow.b+',1)';
					}else{
						var colorvalues = rgbToHsl(mouse.colorbelow.r,mouse.colorbelow.g,mouse.colorbelow.b);
						var colorPickerMode = 'hsl';
						convertSwatch(colorPickerMode,colorvalues);
						mouse.color = 'rgba('+mouse.colorbelow.r+','+mouse.colorbelow.g+','+mouse.colorbelow.b+',1)';
					}
					
					//if we're using brush at moment, change colorgroup
					if(mouse.tool=="brush" || mouse.tool=="magiceraser"){
						if(currentColorGroup==0){
							colorGroup.forEach(function(entry){
								if(entry.rgb.r==mouse.colorbelow.r &&
								entry.rgb.g==mouse.colorbelow.g &&
								entry.rgb.b==mouse.colorbelow.b){
									getColorGroup(palettecontext,palettecanvas,{x:entry.pos.x,y:entry.pos.y});
									return;
								}
							});
						}else{
							colorGroup2.forEach(function(entry){
								if(entry.rgb.r==mouse.colorbelow.r &&
								entry.rgb.g==mouse.colorbelow.g &&
								entry.rgb.b==mouse.colorbelow.b){
									getColorGroup(palettecontext,palettecanvas,{x:entry.pos.x,y:entry.pos.y});
									return;
								}
							});
						}
					}
				}
				
			}
			
		}
		else if(e.button === right){
			mouse.right = true;
			
			if(e.ctrlKey){
				if(currentColorGroup==0){
					mouse.basergba = eyedropRgba(mouse.context,mouse.pos.x,mouse.pos.y);
					tool.brushend = {x:mouse.pos.x,y:mouse.pos.y};
					$("#colordex_end").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
				}else{
					mouse.basergba2 = eyedropRgba(mouse.context,mouse.pos.x,mouse.pos.y);
					tool.brushend = {x:mouse.pos.x,y:mouse.pos.y};
					$("#colordex2_end").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
				}
				//$("#colordex_endup").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
			}
		}
		e.preventDefault();
	}
	
	pcanvas.onmouseup = function(e){
		var left, right;
		left = 0;
		right = 2;
		
		getMousePos(pcanvas, e);
		resetPen();
		mouse.direction=0;
		
		if(e.button === left){
			mouse.left = false;
			
			updatePen();
			
			if(tool.lockcolordex==false && tool.preventdraw==false && project.lock==false && animation.state==false){
				if( $('#canvas').css('cursor')=='crosshair'){
				
					if(mouse.tool=="eraser"){
					}else if(mouse.tool=="magiceraser" && tool.brushing==true){
						tool.brushing=false; 
					}else if(mouse.tool=="pencil"){
					}else if(mouse.tool=="brush" && tool.brushing==true){
						tool.brushing=false; 
					}else if(mouse.tool=="bucket"){
					}
				
				}
			}
			
		}
		else if(e.button === right){
			mouse.right = false;
			
			if(e.ctrlKey){
				if(currentColorGroup==0){
					mouse.baseuprgba = eyedropRgba(mouse.context,mouse.pos.x,mouse.pos.y);
					//tool.brushend = {x:mouse.pos.x,y:mouse.pos.y};
					tool.brushendup = {x:mouse.pos.x,y:mouse.pos.y};
					//$("#colordex_end").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
					$("#colordex_endup").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
				}else{
					mouse.baseuprgba2 = eyedropRgba(mouse.context,mouse.pos.x,mouse.pos.y);
					tool.brushendup = {x:mouse.pos.x,y:mouse.pos.y};
					$("#colordex2_endup").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
				}
			}
		}
	}

	pcanvas.onmouseover = function (e) {
		mouse.canvas = palettecanvas;
		mouse.context = palettecontext;
		pcanvas.focus();
	};
	
	pcanvas.onmouseout = function (e) {
	
		resetPen();
		mouse.direction=0;
			
		if(tool.lockcolordex==false && tool.preventdraw==false && project.lock==false && animation.state==false){
			if( $('#canvas').css('cursor')=='crosshair'){
			
				if(mouse.tool=="eraser"){
				}else if(mouse.tool=="magiceraser" && tool.brushing==true){
					tool.brushing=false; 
				}else if(mouse.tool=="pencil"){
				}else if(mouse.tool=="brush" && tool.brushing==true){
					tool.brushing=false; 
				}else if(mouse.tool=="bucket"){
				}
			
			}
		}
		
		mouse.left = false;
		mouse.right = false;
		if(key.spacebar==false)tool.preventdraw=false;
	};
	
	pcanvas.onmousemove = function (e) {
	   getMousePos(pcanvas, e);//windowToCanvas(canvas, e.clientX, e.clientY);
		
		if(mouse.left){
			updatePen();
			mouse.dragged = true;
		}
		//send_my_position();
		e.preventDefault();
	};

	pcanvas.onclick = function(e){
		getMousePos(pcanvas, e);
		//contextlayer.fillStyle = "rgba(0,0,0,1)";
		//contextlayer.fillRect( mouse.pos.x, mouse.pos.y, 1, 1 );
		//send_pixel(mouse.pos.x,mouse.pos.y,'rgba(0,0,0,1)');
		
		if(e.ctrlKey){
			tool.brushstart= {x:mouse.pos.x,y:mouse.pos.y};
			if(currentColorGroup==0)$("#colordex_start").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
			else $("#colordex2_start").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
			getColorGroup(mouse.context,mouse.canvas,{x:mouse.pos.x,y:mouse.pos.y});
			
			//if we're using brush at moment, change colorgroup
			if(mouse.tool=="brush" || mouse.tool=="magiceraser"){
				if(currentColorGroup==0){
					colorGroup.forEach(function(entry){
						if(entry.rgb.r==mouse.colorbelow.r &&
						entry.rgb.g==mouse.colorbelow.g &&
						entry.rgb.b==mouse.colorbelow.b){
							getColorGroup(palettecontext,palettecanvas,{x:entry.pos.x,y:entry.pos.y});
							return;
						}
					});
				}else{
					colorGroup2.forEach(function(entry){
						if(entry.rgb.r==mouse.colorbelow.r &&
						entry.rgb.g==mouse.colorbelow.g &&
						entry.rgb.b==mouse.colorbelow.b){
							getColorGroup(palettecontext,palettecanvas,{x:entry.pos.x,y:entry.pos.y});
							return;
						}
					});
				}
			}
					
			/*saveData = mouse.context.getImageData(0, 0, mouse.canvas.width, mouse.canvas.height);
			colorGroup = [];
			colorGroup.push( new groupdata(mouse.canvas,mouse.context,{x:mouse.pos.x,y:mouse.pos.y},mouse.rgb,null,null) );
			
			while(colorGroupWait.length>0){
				var newcolorGroup = colorGroupWait.pop();
				colorGroup.push(new groupdata(newcolorGroup.c, newcolorGroup.ctx, newcolorGroup.point, newcolorGroup.color, newcolorGroup.image, newcolorGroup.parent) );
			}
			//shave off the pixeldata so sending is quicker
			var newcolorGroup = [];
			colorGroup.forEach(function(group) {
				var newgroup = {};
				for (var prop in group) {
					if(prop!="init" && prop!="pixel" && prop!="checkWaitinglist")newgroup[prop] = group[prop];
				}
				newcolorGroup.push(newgroup);
				//delete group.pixel;
				//delete group.init;
			});
			colorGroup = newcolorGroup;
			
			mouse.context.putImageData(saveData,0,0);*/
		}
	};
	
	//ONCLICK DOESNT DETECT RIGHT CLICKS BECAUSE RIGHTCLICKS CALL THE ONCONTEXTMENU EVENT INSTEAD.. preventdefault stops the menu from showing
	pcanvas.oncontextmenu = function (e) {
		getMousePos(pcanvas, e);
		//groupPalette(mouse.canvas,mouse.context,{x:mouse.pos.x,y:mouse.pos.y},mouse.rgb);
		
		//alert(colorGroup.length);
		//alert(colorGroup[colorGroup.length-1].parent+","+colorGroup[colorGroup.length-1].depth);
		if(e.ctrlKey){
			if(currentColorGroup==0){
				mouse.baseuprgba = eyedropRgba(mouse.context,mouse.pos.x,mouse.pos.y);
				//tool.brushend = {x:mouse.pos.x,y:mouse.pos.y};
				tool.brushendup = {x:mouse.pos.x,y:mouse.pos.y};
				//$("#colordex_end").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
				$("#colordex_endup").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
			}else{
				mouse.baseuprgba2 = eyedropRgba(mouse.context,mouse.pos.x,mouse.pos.y);
				tool.brushendup = {x:mouse.pos.x,y:mouse.pos.y};
				$("#colordex2_endup").css({'top':mouse.pos.y-8,'left':mouse.pos.x-8});
			}
			
		}
		e.preventDefault();
	};
	
}

function getColorGroup(ctx,c,point){
	saveData = ctx.getImageData(0, 0, c.width, c.height);
	if(currentColorGroup==0){
		colorGroup = [];
		colorGroup.push( new groupdata(c,ctx,{x:point.x,y:point.y},mouse.rgb,null,null) );
	}else{
		colorGroup2 = [];
		colorGroup2.push( new groupdata(c,ctx,{x:point.x,y:point.y},mouse.rgb,null,null) );
	}
	
	while(colorGroupWait.length>0){
		var newcolorGroup = colorGroupWait.pop();
		if(currentColorGroup==0)colorGroup.push(new groupdata(newcolorGroup.c, newcolorGroup.ctx, newcolorGroup.point, newcolorGroup.color, newcolorGroup.image, newcolorGroup.parent) );
		else colorGroup2.push(new groupdata(newcolorGroup.c, newcolorGroup.ctx, newcolorGroup.point, newcolorGroup.color, newcolorGroup.image, newcolorGroup.parent) );
	}
	//add a blank color at the end 
	//colorGroup.push(new groupdata(newcolorGroup.c, newcolorGroup.ctx, newcolorGroup.point, newcolorGroup.color, newcolorGroup.image, newcolorGroup.parent) );
	
	//shave off the pixeldata so sending is quicker
	var newcolorGroup = [];
	if(currentColorGroup==0){
		colorGroup.forEach(function(group) {
			var newgroup = {};
			for (var prop in group) {
				if(prop!="init" && prop!="pixel" && prop!="checkWaitinglist")newgroup[prop] = group[prop];
			}
			newcolorGroup.push(newgroup);
			//delete group.pixel;
			//delete group.init;
		});
		colorGroup = newcolorGroup;
	}else{
		colorGroup2.forEach(function(group) {
			var newgroup = {};
			for (var prop in group) {
				if(prop!="init" && prop!="pixel" && prop!="checkWaitinglist")newgroup[prop] = group[prop];
			}
			newcolorGroup.push(newgroup);
			//delete group.pixel;
			//delete group.init;
		});
		colorGroup2 = newcolorGroup;
	}
	
	ctx.putImageData(saveData,0,0);
}

//var colorGroup = new groupdata();
var currentColorGroup = 0;
var colorGroup = [];
var colorGroup2 = [];
var colorGroupWait = [];
//colorGroup.push(new groupdata(2,2,2,2) );
function groupdata(c, ctx, point, COLOR, imgData, parent) {
	this.state = "";
	this.parent = parent;
	this.refnum;
	this.rgb = {r:0,g:0,b:0,a:0};
	this.pos = point;
	//this.average = new vector();	//center of blob roughly speaking..
	this.depth = 0;		//steps from parent
	this.children = new Array();	//all 
	
	this.pixel = new Array(c.width);
	
	this.init =  function()	//vals is imgdata, point is start point, seedcolor is color we're grouping, color is new color? 
	{
		this.refnum = (currentColorGroup==0?colorGroup.length:colorGroup2.length);
		if(this.parent != null)this.depth = (currentColorGroup==0?colorGroup[this.parent].depth + 1:colorGroup2[this.parent].depth + 1);
		
		//alert(this.refnum);
		var waitinglist = new Array();
		
		for (var i = 0; i < c.width; i++) {
			this.pixel[i] = new Array(c.height);
		}
	
		if(imgData==null)imgData=ctx.getImageData(0, 0, c.width, c.height);
		else{
			ctx.clearRect(0,0,c.width,c.height);
			ctx.putImageData(imgData,0,0);
		}
		var h = c.height;
		var w = c.width;

		if (point.y < 0 || point.y > h - 1 || point.x < 0 || point.x > w - 1)
			return;

		var SEED_COLOR = ctx.getImageData(point.x, point.y, 1, 1);
		this.rgb.r = SEED_COLOR.data[0];
		this.rgb.g = SEED_COLOR.data[1];
		this.rgb.b = SEED_COLOR.data[2];
		this.rgb.a = SEED_COLOR.data[3];
		//console.log(this.rgb.a);
		
		var stack = new Array();
		stack.push(point);
		while (stack.length > 0)
		{
			var p = stack.pop();
			var x = p.x;
			var y = p.y;
			if ( y < 0 || y > h - 1 || x < 0 || x > w - 1 || ( this.pixel[x][y]==1 ) )
				continue;
			var val = [ imgData.data[((y*w)+x)*4],imgData.data[(((y*w)+x)*4)+1],imgData.data[(((y*w)+x)*4)+2],imgData.data[(((y*w)+x)*4)+3] ];	//rgba of x,y
			
			if (val[0] == SEED_COLOR.data[0] && 
			val[1] == SEED_COLOR.data[1] && 
			val[2] == SEED_COLOR.data[2] && 
			val[3] > 0 )
			{
				imgData.data[(((y*w)+x)*4)] = COLOR.r;
				imgData.data[(((y*w)+x)*4)+1] = COLOR.g;
				imgData.data[(((y*w)+x)*4)+2] = COLOR.b;
				imgData.data[(((y*w)+x)*4)+3] = 0;		//make this blob untraceable to following groups
				stack.push( {x:(x + 1), y:y} );
				stack.push( {x:(x - 1), y:y} );
				stack.push( {x:x, y:(y + 1)} );
				stack.push( {x:x, y:(y - 1)} );
				/*if(	x<w-1 &&
					imgData.data[(((y*w)+x+1)*4)+3] >0 ){
				
					stack.push( {x:(x + 1), y:y} );
				}
				if( x>0 &&
					imgData.data[(((y*w)+x-1)*4)+3] >0 ){
				
					stack.push( {x:(x - 1), y:y} );
				}
				if( y<h-1 &&
					imgData.data[((((y+1)*w)+x)*4)+3] >0 ){
				
					stack.push( {x:x, y:(y + 1)} );
				}
				if( y>0 &&
					imgData.data[((((y-1)*w)+x)*4)+3] >0 ){
				
					stack.push( {x:x, y:(y - 1)} );
				}*/
			}else if( (val[0] != SEED_COLOR.data[0] ||
			val[1] != SEED_COLOR.data[1] || 
			val[2] != SEED_COLOR.data[2]) && 
			val[3] > 0 ){
				//found new color blob, so we'll add this to children if a nearby pixel hasn't been traced
				var found = false;
				outloop:
				for(var x1=x-1; x1<x+1; x1++){
					for(var y1=y-1; y1<y+1; y1++){
						if(this.pixel[Math.max(0,Math.min(x1,w))][Math.max(0,Math.min(y1,w))]==1 ){found=true; break outloop;}
					}
				}
				if(found==false){
					this.pixel[x][y]=1;
					waitinglist.push( {x:x,y:y,parent:this.refnum} );
				}
			}
		}
		
		ctx.putImageData(imgData,0,0);
		while (waitinglist.length > 0)
		{
			var newgroup = waitinglist.pop();
			//cycle through all and do a quick floodfill check to see if any other groups' point is found; if so, then remove this group from list because it is a duplicate.
			var foundDuplicates = false
			do{
				foundDuplicates = false;
				//newgroup = waitinglist.pop();
				if(waitinglist.length>0){
				
					//we have to copy the imagedata so that it doesn't change the original
					var newimage = ctx.createImageData(c.width, c.height);
					newimage.data.set(imgData.data);
					
					if(this.checkWaitinglist(waitinglist, c, ctx, {x:newgroup.x,y:newgroup.y}, newimage)==true){
						foundDuplicates = true;
						newgroup = waitinglist.pop();
					}
				}
			}while(foundDuplicates==true);
			
			//we have to copy the imagedata so that it doesn't change the original
			//var dataCopy = new Uint8ClampedArray(imageData.data);
			//imageData.data.set(dataCopy);
			var newimage2 = ctx.createImageData(c.width, c.height);
			newimage2.data.set(imgData.data);
			
			
			colorGroupWait.push( {c:c, ctx:ctx, point:{x:newgroup.x,y:newgroup.y}, color:COLOR, image:newimage2, parent:newgroup.parent} );
			//colorGroup.push(new groupdata(c, ctx, {x:newgroup.x,y:newgroup.y}, COLOR, newimage2, newgroup.parent) );
		}
		
		//ctx.putImageData(imgData,0,0);
		//ctx.drawImage(c,0,0);
	}
	
	this.checkWaitinglist =  function(waitinglist, c2, ctx2, point2, imgData2 )	//vals is imgdata, point is start point, seedcolor is color we're grouping, color is new color? 
	{
		
		var h = c2.height;
		var w = c2.width;

		if (point2.y < 0 || point2.y > h - 1 || point2.x < 0 || point2.x > w - 1)
			return;

		var c3 = document.createElement('canvas');
		var ctx3 = c.getContext('2d');
		c3.width = w;
		c3.height = h;
		ctx3.putImageData(imgData2, 0, 0);
	
		var SEED_COLOR = ctx3.getImageData(point2.x, point2.y, 1, 1);
		
		if(SEED_COLOR.data[3]==0)return;
		
		var stack = new Array();
		stack.push(point2);
		while (stack.length > 0)
		{
			var p = stack.pop();
			var x = p.x;
			var y = p.y;
			if (y < 0 || y > h - 1 || x < 0 || x > w - 1)
				continue;
			
			for(var i=0; i<waitinglist.length; i++){
				if(waitinglist[i].x==x && waitinglist[i].y==y) return true;
			}
				
			var val = [ imgData2.data[((y*w)+x)*4],imgData2.data[(((y*w)+x)*4)+1],imgData2.data[(((y*w)+x)*4)+2],imgData2.data[(((y*w)+x)*4)+3] ];	//rgba of x,y
			
			if (val[0] == SEED_COLOR.data[0] && 
			val[1] == SEED_COLOR.data[1] && 
			val[2] == SEED_COLOR.data[2] && 
			val[3] > 0 )
			{
				//imgData2.data[(((y*w)+x)*4)] = COLOR.r;
				//imgData2.data[(((y*w)+x)*4)+1] = COLOR.g;
				//imgData2.data[(((y*w)+x)*4)+2] = COLOR.b;
				imgData2.data[(((y*w)+x)*4)+3] = 0;		//make this blob untraceable to following groups
				stack.push( {x:(x + 1), y:y} );
				stack.push( {x:(x - 1), y:y} );
				stack.push( {x:x, y:(y + 1)} );
				stack.push( {x:x, y:(y - 1)} );
				/*if(	x<w-1 &&
					imgData2.data[(((y*w)+x+1)*4)+3] >0 ){
				
					stack.push( {x:(x + 1), y:y} );
				}
				if( x>0 &&
					imgData2.data[(((y*w)+x-1)*4)+3] >0 ){
				
					stack.push( {x:(x - 1), y:y} );
				}
				if( y<h-1 &&
					imgData2.data[((((y+1)*w)+x)*4)+3] >0 ){
				
					stack.push( {x:x, y:(y + 1)} );
				}
				if( y>0 &&
					imgData2.data[((((y-1)*w)+x)*4)+3] >0 ){
				
					stack.push( {x:x, y:(y - 1)} );
				}*/
			}
		}
		return false;
	}
	
	this.init();
}

function adjustColor( alpha , rgba, g, basergba, baseuprgba ){
	var found=null;
	
	//if(rgba.a==0 && basergba.a==255)rgba = basergba;
	//else 
	if(rgba.a==0 && basergba.a==0 && baseuprgba.a==255)rgba = baseuprgba;
	if(rgba.a==0 && basergba.a==255 && baseuprgba.a==0)rgba = basergba;
	
	g.forEach(function(group) {
		if(group.rgb.r==rgba.r && group.rgb.g==rgba.g && group.rgb.b==rgba.b){
			if(found==null)found = group;
			else if(group.depth < found.depth)found = group;
		}
	});
	if(found!=null){
		var shift = Math.round((alpha/255)*found.depth);
		while(shift--){
			if(found.parent!=null)found = g[found.parent];
		}
		rgba = { r:found.rgb.r, g:found.rgb.g, b:found.rgb.b, a:255 };
	}
	return rgba;
}

function reverseColor( alpha , rgba, g, basergba, baseuprgba ){
	var found=null;
	
	var base=basergba, baseup=baseuprgba;
	
	if(basergba.a==0 && baseuprgba.a==255)opaque=false;
	if(basergba.a==255 && baseuprgba.a==0){opaque=false; base=baseuprgba; baseup=basergba;}
	if(basergba.a == 255 && baseuprgba.a==255)opaque = true;
	
	if(basergba.a==0 && baseuprgba.a==0)return { r:0, g:0, b:0, a:0 };
	
	//if the pixel is clear, return since we can't erase anything.
	if(rgba.a==0)return rgba;
	//if(rgba.a==0 && basergba.a==255)rgba = basergba;
	
	
	//cycle through the colorgroup from the main parent color
	g.forEach(function(group) {
		//if this color in the group matches the color of the pixel, then make this color in the group our found color.
		//if we find a color that is closer to the main parent color that matches the pixel color, then reassign our found color to that group color.
		if(group.rgb.r==rgba.r && group.rgb.g==rgba.g && group.rgb.b==rgba.b){
			if(found==null)found = group;
			else if(group.depth < found.depth)found = group;
		}
	});
	
	//if we couldn't find our color in the group, then we shouldn't be modifying the pixel
	if(found==null)return null;	
	
	//we have our found color which represents the closest color to the parent color in our group that matches the pixel color.
	//find the deepest color in the group or basecolor, whichever comes first. we'll use this to when finding percentage to shift
	var end=false;
	var last = null;
	
	//first try to find basecolor that is in our group.. if no basecolor in group, then we'll need to step through it to get the last color.
	//cycle through the colorgroup from the main parent color
	g.forEach(function(group) {
		//if this color in the group matches the color of our basecolor(the color before clear), then make this color in the group our last color.
		//if we find a color that is closer to the main parent color that matches the basecolor, then reassign our last color to that group color.
		if( (group.rgb.r==base.r && group.rgb.g==base.g && group.rgb.b==base.b) ||
			(group.rgb.r==baseup.r && group.rgb.g==baseup.g && group.rgb.b==baseup.b) ){
			if(last==null)last = group;
			else if(group.depth < last.depth)last = group;
		}
	});
	
	//if our last color is found, mark end as true, else set our last color to the found color in the group(the color that matches the pixel.
	if(last!=null)end=true;
	else last = found;
	//if last color wasn't found in the initial cycle, then we'll need to move through the group by finding the child of our last color, 
	//assigning our last color to that child, and continuing until no more childs are found.
	while(end==false){
		var prev = $.grep(g, function(e){ return e.parent == g.indexOf(last); });
		if(prev.length>0){
			last = prev[0];
		}else end = true;
	}
	//we now have our last color; it is either the basecolor, or the last child of the found color.
	//if it is the last child, we don't know which branch of children.
	
	//if our found color's depth is larger than our basecolor's depth, then it is outside the scope of our chosen selection of colors,
	//it probably shouldn't be adjusted if that's the case. Or perhaps it could be adjusted to the basecolor.
	if(found.depth > last.depth)return { r:baseup.r, g:baseup.g, b:baseup.b, a:(opaque==false?0:baseup.a) };	
	//if our found color equals our last, then we probably shouldn't change it since the last is meant to be the eraser limit 
	//only do this if basecolor is opaque- meaning we aren't erasing all the way to clear)
	if(opaque==true && found.rgb.r==base.r && found.rgb.g==base.g && found.rgb.b==base.b && found.rgb.a==base.a &&
		found.rgb.r==last.rgb.r && found.rgb.g==last.rgb.g && found.rgb.b==last.rgb.b && found.rgb.a==last.rgb.a )
		return null;	
	
	
	//so we now have the found(first color; also the color being adjusted on the canvas), and the last(end color before stepping to transparent)
	
	if(found!=null && last!=null){
		//if(last.parent==null)return { r:basergba.r, g:basergba.g, b:basergba.b, a:basergba.a };	//this line is incase user colorpicks the basecolor with brush/magiceraser(therefor there is no list of colors to transition to)
		
		var transdepth = 0;
	/*	if( opaque==false ){
			transdepth = last.depth+1;
				//return { r:rgba.r, g:rgba.g, b:rgba.b, a:0 };
				g.push( {parent:last.refnum, depth:last.depth+1, rgb:{r:basergba.r,g:basergba.g,b:basergba.b} } );
				last = g[g.length-1];
		}*/
			
		var shift = (last.depth-found.depth)-(Math.round((alpha/255)*((last.depth+1)-found.depth)));
		//if shift==-1 it means it wants to clear all the way to the fullest, so based upon whether the basecolor is opaque or not, determine if to clear or clear to basecolor
		//if(shift == -1)return (basergba.a==0?{ r:0, g:0, b:0, a:0 }:{ r:basergba.r, g:basergba.g, b:basergba.b, a:basergba.a });
		if(shift == -1)return (opaque==false?{ r:0, g:0, b:0, a:0 }:{ r:base.r, g:base.g, b:base.b, a:base.a });
		else{
			while(shift--){
				if(last.parent!=found.parent){
					if(last.parent==null)return { r:last.rgb.r, g:last.rgb.g, b:last.rgb.b, a:255 };	//this line is incase user colorpicks the basecolor with brush/magiceraser(therefor there is no list of colors to transition to)
					//if(last.parent==null)return { r:rgba.r, g:rgba.g, b:rgba.b, a:rgba.a };	//this line is incase user colorpicks the basecolor with brush/magiceraser(therefor there is no list of colors to transition to)
					last = g[last.parent];
				}
			}
			rgba = { r:last.rgb.r, g:last.rgb.g, b:last.rgb.b, a:255 };
			if( opaque==false &&
			transdepth == last.depth &&
			rgba.r == baseup.r &&
			rgba.g == baseup.g &&
			rgba.b == baseup.b){
				//return { r:rgba.r, g:rgba.g, b:rgba.b, a:0 };
				//g.push( {parent:last.refnum, depth:last.depth+1, rgb:{r:basergba.r,g:basergba.g,b:basergba.b} } );
				rgba.a=0;
			}
		}
	}
	return rgba;
}


function eyedropRgba(ctx,x,y){
	var imgData=ctx.getImageData(x, y, 1, 1);
	return	{r:imgData.data[0],g:imgData.data[1],b:imgData.data[2],a:imgData.data[3]};
}


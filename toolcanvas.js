

var wacom = document.getElementById('wtPlugin');	//the wacom tablet web plugin
	
var tool = new propertiesdata();
function propertiesdata() {
	this.state = "";
	this.size = 10;
	this.opacity = 100;
	this.hardness = 100;
	this.levels = 1;
	
	this.dither = {x:0,y:0};
	
	this.pressure = 1;
	this.tilt = {x:0,y:0,amount:0};
	this.pen = {s:"none",o:"none",h:"none",l:"none"};
	
	this.brushing = false;	//if true, we're actively drawing with the brush tool (need to know so we can clear the brushcanvas on mouseup)
	this.zoom = 2;
	this.offset = {x:0,y:0};
	this.secondary_zoom = 2;
	this.secondary_offset = {x:0,y:0};
	this.spacebar = false;
	this.preventdraw = false;
	this.zoomstop = false;
	
	this.brushstart = {x:0,y:0};
	this.brushend = {x:0,y:0};
	this.brushendup = {x:0,y:0};
	
	this.edge = [];	//list of points representing the edge of the tool cursor thing
	
	this.lockcolordex = false;
	this.bg = (typeof(Storage) !== "undefined" && typeof(localStorage.bg) !== "undefined" ? localStorage.bg : '#111111' );
	this.view = (typeof(Storage) !== "undefined" && typeof(localStorage.view) !== "undefined" ? localStorage.view : 0 );
	this.sheet = {x:1, y:1, current:0, ox:0, oy:0, list:[] };
	this.secondary_view = (typeof(Storage) !== "undefined" && typeof(localStorage.secondary_view) !== "undefined" ? localStorage.secondary_view : 0 );
	this.secondary_sheet = {x:1, y:1, current:0, ox:0, oy:0, list:[] };
	
	this.current_preset = 1;
	this.preset = (typeof(Storage) !== "undefined" && checkJSON('brushpreset')!=null ? JSON.parse(localStorage.brushpreset) : [
	{size:10,opacity:255,hardness:20,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:0.5,opacity:255,hardness:20,levels:1,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:5,opacity:255,hardness:20,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:20,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:1,levels:4,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:1,levels:6,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:10,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:20,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:20,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}},
	{size:10,opacity:255,hardness:20,levels:10,pen:{s:'none',o:'none',h:'none',l:'none'}}
	]);	//array of brush presets 
	
	this.colorscan;
}

function updatePen(){
	if(typeof wacom == 'undefined'){}
	else{
		if(wacom.penAPI){
			var refresh = false;
			if(wacom.penAPI.pressure > 0 && wacom.penAPI.pressure != tool.pressure && wacom.penAPI.pointerType==1){
				tool.pressure = wacom.penAPI.pressure; 
				refresh = true;
			}
			
			if(wacom.penAPI.tiltX != tool.tilt.x && wacom.penAPI.tiltY != tool.tilt.y && wacom.penAPI.pointerType==1){
				tool.tilt.x = wacom.penAPI.tiltX; 
				tool.tilt.y = wacom.penAPI.tiltY;
				tool.tilt.amount = Math.sqrt( (tool.tilt.x * tool.tilt.x) + (tool.tilt.y * tool.tilt.y) );
				refresh = true;
				//console.log(tool.tilt.x+","+tool.tilt.y+","+tool.tilt.amount);
			}
			
			if(refresh) refreshTool(tool);
		}
	}
}

function resetPen(){
	var refresh = false;
	
	if(tool.pressure < 1){
		tool.pressure = 1;
		refresh = true;
	}	
	if(tool.tilt.amount > 0 ){
		tool.tilt.amount = 0;
		refresh = true;
	}	

	if(refresh) refreshTool(tool);
}


function refreshTool(t){
	//toolcontext.clearRect(0, 0, toolcanvas.width, toolcanvas.height);
	
	var save = {s:t.size,o:t.opacity,h:t.hardness,l:t.levels};
	t.size = (Math.round((t.size*( t.pen.s=="pressure"?t.pressure:1))* 2) / 2).toFixed(1);//(t.pen.s=="tilt"?t.tilt.amount:1) ) ) * 2) / 2).toFixed(1);	//make sure it rounds to nearest 0.5;
	t.opacity = (t.opacity*( t.pen.o=="pressure"?t.pressure:1));//(t.pen.o=="tilt"?t.tilt.amount:1) ) );	
	t.hardness = (t.hardness*( t.pen.h=="pressure"?t.pressure:1));//(t.pen.h=="tilt"?t.tilt.amount:1) ) );	
	t.levels = (t.levels*( t.pen.l=="pressure"?t.pressure:1));//(t.pen.l=="tilt"?t.tilt.amount:1) ) );	
	//console.log(saveSize+","+t.pressure+","+t.size);
	if(t.size==0)t.size=0.5;
	
	if(typeof toolcontext === 'undefined'){
	}else{
		var odd = ( (t.size*2) % 2 == 1 ? 1 : 0 );
		toolcanvas.width = (t.size*2)+4+odd;	//if odd number, add 1 to the width/height so that the brushline function deals with stuff accurately
		toolcanvas.height = (t.size*2)+4+odd;
		toolcontext = reload_canvas(toolcanvas, toolcontext);
		
		$("#toolcanvas").css({
			'margin-left':-t.size,
			'margin-top':-t.size
		});
		
		
		var centerX = (toolcanvas.width / 2)+0.5-(t.size==0.5?0.5:0);
		var centerY = (toolcanvas.height / 2)+0.5-(t.size==0.5?0.5:0);

		var color = 'rgba(0,0,0,'+(t.opacity/255)+')';
		var hardness = t.size*(t.hardness/20);
		/*var grd=toolcontext.createRadialGradient(centerX,centerY,hardness,centerX,centerY,t.size);
		grd.addColorStop(0,color );
		grd.addColorStop(1,'rgba(0,0,0,0)');
		
		toolcontext.beginPath();
		toolcontext.arc(centerX+(t.size==0.5 ? 0.5 : 0), centerY+(t.size==0.5 ? 0.5 : 0), t.size, 0, 2 * Math.PI, false);
		toolcontext.fillStyle = (hardness<t.size ? grd : color );
		toolcontext.fill();
		toolcontext.closePath();
		*/
		var radius = t.size * t.size;
		var hardradius = hardness * hardness;
		var imgData=toolcontext.getImageData(0, 0, toolcanvas.width, toolcanvas.height);
		for(var y=0; y<toolcanvas.height; y++){
			for(var x=0; x<toolcanvas.width; x++){
				var dx = x - centerX;
				var dy = y - centerY;
				var distance = dx * dx + dy * dy;

				var alpha = (distance-hardradius)/(radius-hardradius);
				if (distance <= radius && distance > hardradius){
					imgData.data[(((y*toolcanvas.width)+x)*4)+3] = t.opacity-((Math.round(alpha*t.levels) / t.levels ) *t.opacity);
				}
				if(distance<=hardradius){
					imgData.data[(((y*toolcanvas.width)+x)*4)+3] = t.opacity;
				}
				//if(x==centerX && y==centerY){
				//	imgData.data[(((y*toolcanvas.width)+x)*4)+3] = t.opacity;
				//}
			}
		}
		//for (var i=0;i<imgData.data.length;i+=4)
		//{
			/*imgData.data[i]= rgb[0] | imgData.data[i];
			imgData.data[i+1]= rgb[1] | imgData.data[i+1];
			imgData.data[i+2]= rgb[2] | imgData.data[i+2];*/
			//imgData.data[i+3]= ((Math.round( (imgData.data[i+3]/t.opacity) * t.levels ) / t.levels)*t.opacity);// | imgData.data[i+3];
		//}
		toolcontext.clearRect(0, 0, toolcanvas.width, toolcanvas.height);
		toolcontext.putImageData(imgData,0,0);
	
		//trace the edge of the tool and get the points so we can draw an outline representing where out tool is located on the canvas
		traceToolEdge(imgData);
	}
	
	
	t.size = save.s;
	t.opacity = save.o;
	t.hardness = save.h;
	t.levels = save.l;
	
}

function traceToolEdge(imgData){
	tool.edge = [];
	var sx,sy;
	//find starting point
	for(var y=0; y<toolcanvas.height; y++){
		for(var x=0; x<toolcanvas.width; x++){
			if(imgData.data[((((y+1)*toolcanvas.width)+x+1)*4)+3] > 0){
				sx=x , sy=y;
				x=toolcanvas.width, y=toolcanvas.height;	//breaks both loops
			}
		}
	}
	if(sx!=null && sy!=null){
		while($.grep(tool.edge, function (e) { return e.x == sx+1 && e.y == sy+1;}).length==0){
			tool.edge.push({x:sx+1,y:sy+1} );
			//check which way to go
			if( imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
				imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
				imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
				imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sx+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sx+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sy+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sy+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sx+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sy-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sy-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sx-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sx-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sy-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sx-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sy+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sx+=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) sy-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] == 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] == 0 ) sx-=1;
			else if(imgData.data[((((sy)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy)*toolcanvas.width)+sx+1)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx)*4)+3] > 0 &&
					imgData.data[((((sy+1)*toolcanvas.width)+sx+1)*4)+3] > 0 ) return;
		}
	}
}

//this is a working floodfill
function floodFill(ctx, point, COLOR, contiguous, peerid)	//vals is imgdata, point is start point, seedcolor is color we're grouping, color is new color? 
{

	var peerhistory;
	if(peerid!="palette")peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var selection = false;
	var maskData;
	if(peerhistory[0].selectionclip.x!=peerhistory[0].selectionclip.x2 && peerhistory[0].selectionclip.y!=peerhistory[0].selectionclip.y2){
		//console.log(peerhistory[0].selectionclip.x+","+peerhistory[0].selectionclip.x2+","+peerhistory[0].selectionclip.y+","+peerhistory[0].selectionclip.y2);
		selection = true;
		if(peerhistory[0].selectionclipped==false)maskData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
		else maskData=peerhistory[0].selectionclipcontext.getImageData(0, 0, peerhistory[0].selectionclipcanvas.width, peerhistory[0].selectionclipcanvas.height);
		
	}
		
	var imgData=ctx.getImageData(0, 0, project.width, project.height);
	var imgData2=ctx.createImageData(project.width, project.height);
	
    /*for (var i=0;i<imgData.data.length;i+=4)
    {
        imgData.data[i]= rgb[0] | imgData.data[i];
        imgData.data[i+1]= rgb[1] | imgData.data[i+1];
        imgData.data[i+2]= rgb[2] | imgData.data[i+2];
    }
    ctx.putImageData(imgData,0,0);*/
		
    var h = project.height;
    var w = project.width;

    if (point.y < 0 || point.y > h - 1 || point.x < 0 || point.x > w - 1)
    	return;

	var SEED_COLOR = ctx.getImageData(point.x, point.y, 1, 1);
		
	if(COLOR.r == SEED_COLOR.data[0] && 
		COLOR.g == SEED_COLOR.data[1] && 
		COLOR.b == SEED_COLOR.data[2] &&
		SEED_COLOR.data[3]==255 ) return;
		
	peerhistory[0].context.fillStyle="rgb("+COLOR.r+","+COLOR.g+","+COLOR.b+")";
	peerhistory[0].selectionclipcontext.fillStyle="rgb("+COLOR.r+","+COLOR.g+","+COLOR.b+")";
	
	if(contiguous==false ){
		for(var y=0; y<h; y++){
			for(var x=0; x<w; x++){
				if( imgData.data[(((y*w)+x)*4)] == SEED_COLOR.data[0] &&
					imgData.data[(((y*w)+x)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[(((y*w)+x)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[(((y*w)+x)*4)+3] == SEED_COLOR.data[3] ){
					
					if(selection==true){
						if( y < peerhistory[0].selectionclip.y || x < peerhistory[0].selectionclip.x ||
							y >= peerhistory[0].selectionclip.y2 || x >= peerhistory[0].selectionclip.x2)
							continue;
					}
					
					if(selection==true){
						if(peerhistory[0].selectionclipped==false && maskData.data[((((y-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+(x-peerhistory[0].selectionoffset.x))*4)+3]==0){
							//console.log(maskData.data[(((y*w)+x)*4)+3]); 
							continue;
						}else if(peerhistory[0].selectionclipped==true && maskData.data[((((y-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionclipcanvas.width)+(x-peerhistory[0].selectionoffset.x))*4)+3]==0){
							//console.log(maskData.data[(((y*w)+x)*4)+3]); 
							continue;
						}
					}
			
					imgData.data[(((y*w)+x)*4)] = COLOR.r;
					imgData.data[(((y*w)+x)*4)+1] = COLOR.g;
					imgData.data[(((y*w)+x)*4)+2] = COLOR.b;
					imgData.data[(((y*w)+x)*4)+3] = 255;
					
					imgData2.data[(((y*w)+x)*4)] = COLOR.r;
					imgData2.data[(((y*w)+x)*4)+1] = COLOR.g;
					imgData2.data[(((y*w)+x)*4)+2] = COLOR.b;
					imgData2.data[(((y*w)+x)*4)+3] = 255;
				
					//if(peerhistory[0].selectionclipped==false){
						//peerhistory[0].context.fillStyle="rgb("+COLOR.r+","+COLOR.g+","+COLOR.b+")";
						//peerhistory[0].context.fillRect(x,y,1,1);
					//}else if(selection==true && peerhistory[0].selectionclipped==true){
						//peerhistory[0].selectionclipcontext.fillStyle="rgb("+COLOR.r+","+COLOR.g+","+COLOR.b+")";
						//peerhistory[0].selectionclipcontext.fillRect(x-peerhistory[0].selectionoffset.x,y-peerhistory[0].selectionoffset.y,1,1);
					//}
					
					if(peerid!="palette"){
						if(x < peerhistory[0].clip.x)peerhistory[0].clip.x = x;
						if(y < peerhistory[0].clip.y)peerhistory[0].clip.y = y;
						if(x > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = x;
						if(y > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = y;
					}
				}
			}
		}
	}else{
		
		var stack = new Array();
		stack.push(point);
		//var p;
		while (stack.length > 0)
		{
			var p = stack.pop();
			var x = p.x;
			var y = p.y;
			if (y < 0 || y > h - 1 || x < 0 || x > w - 1)
				continue;
				
			if(selection==true){
				if( y < peerhistory[0].selectionclip.y || x < peerhistory[0].selectionclip.x ||
					y >= peerhistory[0].selectionclip.y2 || x >= peerhistory[0].selectionclip.x2)
					continue;
			}
			
			var val = [ imgData.data[((y*w)+x)*4],imgData.data[(((y*w)+x)*4)+1],imgData.data[(((y*w)+x)*4)+2],imgData.data[(((y*w)+x)*4)+3] ];	//rgba of x,y
			
			if(peerid!="palette"){
				if(x < peerhistory[0].clip.x)peerhistory[0].clip.x = x;
				if(y < peerhistory[0].clip.y)peerhistory[0].clip.y = y;
				if(x > peerhistory[0].clip.x2)peerhistory[0].clip.x2 = x;
				if(y > peerhistory[0].clip.y2)peerhistory[0].clip.y2 = y;
			}
				
			if (val[0] == SEED_COLOR.data[0] && 
			val[1] == SEED_COLOR.data[1] && 
			val[2] == SEED_COLOR.data[2] && 
			val[3] == SEED_COLOR.data[3] )
			{
				
				if(selection==true){
					if(peerhistory[0].selectionclipped==false && maskData.data[((((y-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+(x-peerhistory[0].selectionoffset.x))*4)+3]==0){
						//console.log(maskData.data[(((y*w)+x)*4)+3]); 
						continue;
					}else if(peerhistory[0].selectionclipped==true && maskData.data[((((y-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionclipcanvas.width)+(x-peerhistory[0].selectionoffset.x))*4)+3]==0){
						//console.log(maskData.data[(((y*w)+x)*4)+3]); 
						continue;
					}
				}
				
				imgData.data[(((y*w)+x)*4)] = COLOR.r;
				imgData.data[(((y*w)+x)*4)+1] = COLOR.g;
				imgData.data[(((y*w)+x)*4)+2] = COLOR.b;
				imgData.data[(((y*w)+x)*4)+3] = 255;
				
				imgData2.data[(((y*w)+x)*4)] = COLOR.r;
				imgData2.data[(((y*w)+x)*4)+1] = COLOR.g;
				imgData2.data[(((y*w)+x)*4)+2] = COLOR.b;
				imgData2.data[(((y*w)+x)*4)+3] = 255;
				
				//if(peerhistory[0].selectionclipped==false){
					//peerhistory[0].context.fillRect(x,y,1,1);
				//}else if(selection==true && peerhistory[0].selectionclipped==true){
					//peerhistory[0].selectionclipcontext.fillStyle="rgb("+COLOR.r+","+COLOR.g+","+COLOR.b+")";
					//peerhistory[0].selectionclipcontext.fillRect(x-peerhistory[0].selectionoffset.x,y-peerhistory[0].selectionoffset.y,1,1);
				//}
				
				if(	x<w-1 &&
					imgData.data[(((y*w)+x+1)*4)] == SEED_COLOR.data[0] &&
					imgData.data[(((y*w)+x+1)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[(((y*w)+x+1)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[(((y*w)+x+1)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:(x + 1), y:y} );
				}
				if( x>0 &&
					imgData.data[(((y*w)+x-1)*4)] == SEED_COLOR.data[0] &&
					imgData.data[(((y*w)+x-1)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[(((y*w)+x-1)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[(((y*w)+x-1)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:(x - 1), y:y} );
				}
				if( y<h-1 &&
					imgData.data[((((y+1)*w)+x)*4)] == SEED_COLOR.data[0] &&
					imgData.data[((((y+1)*w)+x)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[((((y+1)*w)+x)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[((((y+1)*w)+x)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:x, y:(y + 1)} );
				}
				if( y>0 &&
					imgData.data[((((y-1)*w)+x)*4)] == SEED_COLOR.data[0] &&
					imgData.data[((((y-1)*w)+x)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[((((y-1)*w)+x)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[((((y-1)*w)+x)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:x, y:(y - 1)} );
				}
			}
		}
	}
	if(peerhistory[0].selectionclipped==false){
		peerhistory[0].context.putImageData(imgData2,0,0);
	}
	
    if(peerid!="palette"){}//peerhistory[0].context.putImageData(imgData,0,0);
	else palettecontext.putImageData(imgData2,0,0);
	//ctx.drawImage(c,0,0);
	
	//claim over peer historylist states
	if(peerid!="palette")claimHistory(peerhistory[0].id,peerhistory[0].canvas);
	
}

function magicWand(ctx, point, type, contiguous, peerid)	//vals is imgdata, point is start point, seedcolor is color we're grouping, color is new color? 
{

	var peerhistory;
	if(peerid!="palette")peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var selection = false;
	var maskData;
	if(peerid!="palette" && peerhistory[0].selectionclip.x!=peerhistory[0].selectionclip.x2 && peerhistory[0].selectionclip.y!=peerhistory[0].selectionclip.y2){
		//console.log(peerhistory[0].selectionclip.x+","+peerhistory[0].selectionclip.x2+","+peerhistory[0].selectionclip.y+","+peerhistory[0].selectionclip.y2);
		selection = true;
		if(peerhistory[0].selectionclipped==false)maskData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, peerhistory[0].selectionmaskcanvas.width, peerhistory[0].selectionmaskcanvas.height);
		else maskData=peerhistory[0].selectionclipcontext.getImageData(0, 0, peerhistory[0].selectionclipcanvas.width, peerhistory[0].selectionclipcanvas.height);
		
	}
		
	var imgData=ctx.getImageData(0, 0, project.width, project.height);
	var imgData2=ctx.createImageData(project.width, project.height);
	
    /*for (var i=0;i<imgData.data.length;i+=4)
    {
        imgData.data[i]= rgb[0] | imgData.data[i];
        imgData.data[i+1]= rgb[1] | imgData.data[i+1];
        imgData.data[i+2]= rgb[2] | imgData.data[i+2];
    }
    ctx.putImageData(imgData,0,0);*/
		
    var h = project.height;
    var w = project.width;

	
    if (point.y < 0 || point.y > h - 1 || point.x < 0 || point.x > w - 1)
    	return;

	var SEED_COLOR = ctx.getImageData(point.x, point.y, 1, 1);
		
	if(contiguous==false ){
		for(var y=0; y<h; y++){
			for(var x=0; x<w; x++){
				if( imgData.data[(((y*w)+x)*4)] == SEED_COLOR.data[0] &&
					imgData.data[(((y*w)+x)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[(((y*w)+x)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[(((y*w)+x)*4)+3] == SEED_COLOR.data[3] ){
					
					imgData2.data[(((y*w)+x)*4)] = 255;
					imgData2.data[(((y*w)+x)*4)+1] = 0;
					imgData2.data[(((y*w)+x)*4)+2] = 0;
					imgData2.data[(((y*w)+x)*4)+3] = 255;
					//peerhistory[0].context.fillStyle="rgb(255,0,0)";
					//peerhistory[0].context.fillRect(x,y,1,1);
					
					if(peerid!="palette"){
						if(x < peerhistory[0].selectionclip.x)peerhistory[0].selectionclip.x = x;
						if(y < peerhistory[0].selectionclip.y)peerhistory[0].selectionclip.y = y;
						if(x > peerhistory[0].selectionclip.x2)peerhistory[0].selectionclip.x2 = x;
						if(y > peerhistory[0].selectionclip.y2)peerhistory[0].selectionclip.y2 = y;
					}
				}
			}
		}
	}else{
		
		var stack = new Array();
		stack.push(point);
		while (stack.length > 0)
		{
			var p = stack.pop();
			var x = p.x;
			var y = p.y;
			if (y < 0 || y > h - 1 || x < 0 || x > w - 1)
				continue;
			/*	
			if(selection==true){
				if( y < peerhistory[0].selectionclip.y || x < peerhistory[0].selectionclip.x ||
					y >= peerhistory[0].selectionclip.y2 || x >= peerhistory[0].selectionclip.x2)
					continue;
			}
			*/
			var val = [ imgData.data[((y*w)+x)*4],imgData.data[(((y*w)+x)*4)+1],imgData.data[(((y*w)+x)*4)+2],imgData.data[(((y*w)+x)*4)+3] ];	//rgba of x,y
			
			if(val[3] == 254)continue;
			
			if(peerid!="palette"){
				if(x < peerhistory[0].selectionclip.x)peerhistory[0].selectionclip.x = x;
				if(y < peerhistory[0].selectionclip.y)peerhistory[0].selectionclip.y = y;
				if(x > peerhistory[0].selectionclip.x2)peerhistory[0].selectionclip.x2 = x;
				if(y > peerhistory[0].selectionclip.y2)peerhistory[0].selectionclip.y2 = y;
			}
				
			if (val[0] == SEED_COLOR.data[0] && 
			val[1] == SEED_COLOR.data[1] && 
			val[2] == SEED_COLOR.data[2] && 
			val[3] == SEED_COLOR.data[3] )
			{
				/*
				if(selection==true){
					if(peerhistory[0].selectionclipped==false && maskData.data[((((y-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionmaskcanvas.width)+(x-peerhistory[0].selectionoffset.x))*4)+3]==0){
						//console.log(maskData.data[(((y*w)+x)*4)+3]); 
						continue;
					}else if(peerhistory[0].selectionclipped==true && maskData.data[((((y-peerhistory[0].selectionoffset.y)*peerhistory[0].selectionclipcanvas.width)+(x-peerhistory[0].selectionoffset.x))*4)+3]==0){
						//console.log(maskData.data[(((y*w)+x)*4)+3]); 
						continue;
					}
				}
				*/
				//imgData.data[(((y*w)+x)*4)] = COLOR.r;
				//imgData.data[(((y*w)+x)*4)+1] = COLOR.g;
				//imgData.data[(((y*w)+x)*4)+2] = COLOR.b;
				imgData.data[(((y*w)+x)*4)+3] = 254;
				//if(peerhistory[0].selectionclipped==false){
					
					imgData2.data[(((y*w)+x)*4)] = 255;
					imgData2.data[(((y*w)+x)*4)+1] = 0;
					imgData2.data[(((y*w)+x)*4)+2] = 0;
					imgData2.data[(((y*w)+x)*4)+3] = 255;
					//peerhistory[0].context.fillStyle="rgb(255,0,0)";
					//peerhistory[0].context.fillRect(x,y,1,1);
				
				/*}else if(selection==true && peerhistory[0].selectionclipped==true){
					peerhistory[0].selectionclipcontext.fillStyle="rgb("+COLOR.r+","+COLOR.g+","+COLOR.b+")";
					peerhistory[0].selectionclipcontext.fillRect(x-peerhistory[0].selectionoffset.x,y-peerhistory[0].selectionoffset.y,1,1);
				}*/
				if(	x<w-1 &&
					imgData.data[(((y*w)+x+1)*4)] == SEED_COLOR.data[0] &&
					imgData.data[(((y*w)+x+1)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[(((y*w)+x+1)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[(((y*w)+x+1)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:(x + 1), y:y} );
				}
				if( x>0 &&
					imgData.data[(((y*w)+x-1)*4)] == SEED_COLOR.data[0] &&
					imgData.data[(((y*w)+x-1)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[(((y*w)+x-1)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[(((y*w)+x-1)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:(x - 1), y:y} );
				}
				if( y<h-1 &&
					imgData.data[((((y+1)*w)+x)*4)] == SEED_COLOR.data[0] &&
					imgData.data[((((y+1)*w)+x)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[((((y+1)*w)+x)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[((((y+1)*w)+x)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:x, y:(y + 1)} );
				}
				if( y>0 &&
					imgData.data[((((y-1)*w)+x)*4)] == SEED_COLOR.data[0] &&
					imgData.data[((((y-1)*w)+x)*4)+1] == SEED_COLOR.data[1] &&
					imgData.data[((((y-1)*w)+x)*4)+2] == SEED_COLOR.data[2] &&
					imgData.data[((((y-1)*w)+x)*4)+3] == SEED_COLOR.data[3] ){
				
					stack.push( {x:x, y:(y - 1)} );
				}
			}
		}
	}
	peerhistory[0].context.putImageData(imgData2,0,0);
	
    if(peerid!="palette"){}//peerhistory[0].context.putImageData(imgData,0,0);
	//else palettecontext.putImageData(imgData,0,0);
	//ctx.drawImage(c,0,0);
	
	//claim over peer historylist states
	//if(peerid!="palette")claimHistory(peerhistory[0].id,peerhistory[0].canvas);
	
	if(peerid!="palette"){
		var selectionwidth = (peerhistory[0].selectionclip.x2 - peerhistory[0].selectionclip.x)+4;
		var selectionheight = (peerhistory[0].selectionclip.y2 - peerhistory[0].selectionclip.y)+4;
		
		var selectionmask = document.createElement("canvas");
		selectionmask.width = selectionwidth;
		selectionmask.height = selectionheight;
		var selectionmaskcontext = selectionmask.getContext('2d');
		
		selectionmaskcontext.drawImage(peerhistory[0].canvas, -peerhistory[0].selectionclip.x,-peerhistory[0].selectionclip.y,peerhistory[0].canvas.width, peerhistory[0].canvas.height);
		
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
		
		if(type=="subtract" || type=="intersect"){
			var found=false;
			imgData=peerhistory[0].selectionmaskcontext.getImageData(0, 0, selectionwidth, selectionheight);
			for (var i=0;i<imgData.data.length;i+=4)
			{
				if(imgData.data[i+3]==255)found=true;
			}
			if(found==false){
				myHistory[0].selectionclip.x = 0, myHistory[0].selectionclip.y = 0;
				myHistory[0].selectionclip.x2 = 0, myHistory[0].selectionclip.y2 = 0;
			}
		}
		
		traceSelection(peerid);
	}
	
}

function zoomIn(){
	var posx = canvas.width*0.5;
	var posy = canvas.height*0.5;
	var percentx = Math.floor((posx - tool.offset.x)/tool.zoom) / project.width;
	var percenty = Math.floor((posy - tool.offset.y)/tool.zoom) / project.height;
	tool.zoom++;
	var finalx = -(percentx*(project.width*tool.zoom)) + posx;
	var finaly = -(percenty*(project.height*tool.zoom)) + posy;
	//console.log(posx);
	//console.log(percentx);
	//console.log(finalx);
	tool.offset.x = Math.round(finalx) ;
	tool.offset.y = Math.round(finaly) ;
		tool.offset.x -= tool.offset.x%tool.zoom ;
		tool.offset.y -= tool.offset.y%tool.zoom ;
	//tool.offset.x -= Math.round(((canvas.width*0.50)/tool.zoom)-(tool.offset.x/tool.zoom));
	//tool.offset.y -= Math.round(((canvas.height*0.50)/tool.zoom)-(tool.offset.y/tool.zoom));
	$("#zoom_text").text((tool.zoom*100)+"%");
}
function zoomOut(){
	if(tool.zoom>1){
		var posx = canvas.width*0.5;
		var posy = canvas.height*0.5;
		var percentx = Math.floor((posx - tool.offset.x)/tool.zoom) / project.width;
		var percenty = Math.floor((posy - tool.offset.y)/tool.zoom) / project.height;
		tool.zoom--;
		var finalx = -(percentx*(project.width*tool.zoom)) + posx;
		var finaly = -(percenty*(project.height*tool.zoom)) + posy;
		tool.offset.x = Math.round(finalx) ;
		tool.offset.y = Math.round(finaly) ;
		tool.offset.x -= tool.offset.x%tool.zoom ;
		tool.offset.y -= tool.offset.y%tool.zoom ;

		$("#zoom_text").text((tool.zoom*100)+"%");
	}
}
function zoomSet(amount){
	var posx = canvas.width*0.5;
	var posy = canvas.height*0.5;
	var percentx = Math.floor((posx - tool.offset.x)/tool.zoom) / project.width;
	var percenty = Math.floor((posy - tool.offset.y)/tool.zoom) / project.height;
	tool.zoom = amount;
	var finalx = -(percentx*(project.width*tool.zoom)) + posx;
	var finaly = -(percenty*(project.height*tool.zoom)) + posy;
	//console.log(posx);
	//console.log(percentx);
	//console.log(finalx);
	tool.offset.x = Math.round(finalx) ;
	tool.offset.y = Math.round(finaly) ;
		tool.offset.x -= tool.offset.x%tool.zoom ;
		tool.offset.y -= tool.offset.y%tool.zoom ;
	//tool.offset.x -= Math.round(((canvas.width*0.50)/tool.zoom)-(tool.offset.x/tool.zoom));
	//tool.offset.y -= Math.round(((canvas.height*0.50)/tool.zoom)-(tool.offset.y/tool.zoom));
	$("#zoom_text").text((tool.zoom*100)+"%");
}
function zoomInSecondary(){
	var posx = minicanvas.width*0.5;
	var posy = minicanvas.height*0.5;
	var percentx = Math.floor((posx - tool.secondary_offset.x)/tool.secondary_zoom) / project.width;
	var percenty = Math.floor((posy - tool.secondary_offset.y)/tool.secondary_zoom) / project.height;
	tool.secondary_zoom++;
	var finalx = -(percentx*(project.width*tool.secondary_zoom)) + posx;
	var finaly = -(percenty*(project.height*tool.secondary_zoom)) + posy;
	tool.secondary_offset.x = Math.round(finalx) ;
	tool.secondary_offset.y = Math.round(finaly) ;
	tool.secondary_offset.x -= tool.secondary_offset.x%tool.secondary_zoom ;
	tool.secondary_offset.y -= tool.secondary_offset.y%tool.secondary_zoom ;
	$("#secondary_zoom_text").text((tool.secondary_zoom*100)+"%");
}
function zoomOutSecondary(){
	if(tool.secondary_zoom>1){
		var posx = minicanvas.width*0.5;
		var posy = minicanvas.height*0.5;
		var percentx = Math.floor((posx - tool.secondary_offset.x)/tool.secondary_zoom) / project.width;
		var percenty = Math.floor((posy - tool.secondary_offset.y)/tool.secondary_zoom) / project.height;
		tool.secondary_zoom--;
		var finalx = -(percentx*(project.width*tool.secondary_zoom)) + posx;
		var finaly = -(percenty*(project.height*tool.secondary_zoom)) + posy;
		tool.secondary_offset.x = Math.round(finalx) ;
		tool.secondary_offset.y = Math.round(finaly) ;
		tool.secondary_offset.x -= tool.secondary_offset.x%tool.secondary_zoom ;
		tool.secondary_offset.y -= tool.secondary_offset.y%tool.secondary_zoom ;

		$("#secondary_zoom_text").text((tool.secondary_zoom*100)+"%");
	}
}
function zoomSetSecondary(amount){
	var posx = minicanvas.width*0.5;
	var posy = minicanvas.height*0.5;
	var percentx = Math.floor((posx - tool.secondary_offset.x)/tool.secondary_zoom) / project.width;
	var percenty = Math.floor((posy - tool.secondary_offset.y)/tool.secondary_zoom) / project.height;
	tool.secondary_zoom = amount;
	var finalx = -(percentx*(project.width*tool.secondary_zoom)) + posx;
	var finaly = -(percenty*(project.height*tool.secondary_zoom)) + posy;
	//console.log(posx);
	//console.log(percentx);
	//console.log(finalx);
	tool.secondary_offset.x = Math.round(finalx) ;
	tool.secondary_offset.y = Math.round(finaly) ;
		tool.secondary_offset.x -= tool.secondary_offset.x%tool.secondary_zoom ;
		tool.secondary_offset.y -= tool.secondary_offset.y%tool.secondary_zoom ;
	//tool.offset.x -= Math.round(((canvas.width*0.50)/tool.zoom)-(tool.offset.x/tool.zoom));
	//tool.offset.y -= Math.round(((canvas.height*0.50)/tool.zoom)-(tool.offset.y/tool.zoom));
	$("#secondary_zoom_text").text((tool.secondary_zoom*100)+"%");
}

function resizeImage(width,height){
	var c = document.createElement('canvas');
	c.width=project.width;
	c.height=project.height;
	var ctx = c.getContext('2d');
	
	
	commitHistory(myHistory[0].id);
	clearHistory(myHistory[0].id);
	
	project.canvaslayer.forEach(function(entry){
		var imgData = resizeImageData(entry,project.contextlayer[project.canvaslayer.indexOf(entry)],width,height);
		
		entry.width = width;
		entry.height = height;
		project.contextlayer[project.canvaslayer.indexOf(entry)] = entry.getContext('2d');
		project.contextlayer[project.canvaslayer.indexOf(entry)] = reload_canvas(entry, project.contextlayer[project.canvaslayer.indexOf(entry)]);
		project.contextlayer[project.canvaslayer.indexOf(entry)].putImageData(imgData,0,0); 
	});
	
	resetCanvases(width,height);
	
	myHistory[0].frame = project.currentframe;
	myHistory[0].layers.push(new historylayerdata("New",myHistory[0].canvas,myHistory[0]) );
}

function resetCanvases(width,height){

	project.width = width;
	project.height = height;
	
	updatecanvas.width=width;
	updatecanvas.height=height;
	updatecontext = updatecanvas.getContext('2d');
	
	temp2canvas = document.createElement("canvas");
	temp2canvas.width = project.width;
	temp2canvas.height = project.height;
	temp2context = temp2canvas.getContext('2d');
	temp2context = reload_canvas(temp2canvas, temp2context);
	
	
	historylist = [];
	historylist.push(new historydata(0,0));
	myHistory= $.grep(historylist, function(e){ return e.id == 0; });
	
	brushlayers = [];
	brushlayers.push(new brushlayerdata(0,0));
	myBrush= $.grep(brushlayers, function(e){ return e.id == 0; });
	
	tool.offset = {x:(((canvas.width/tool.zoom)-width)*0.5)*tool.zoom,y:(((canvas.height/tool.zoom)-height)*0.5)*tool.zoom};
	
	//add the canvases for connected peers if we've resized image during a connected session
	addPeerCanvases();
		
}

var resizeLayers = new resizeLayersData();
var resizeLayersPause = false;
function resizeLayersData(){
	this.layer = new Array();
	this.visible = new Array();
	this.opacity = new Array();
	this.delay = new Array();
	this.link = new Array();
	this.order = new Array();
	
	this.getOrder = function(){
		this.order = $( "#frame_list" ).sortable('toArray', {attribute: 'value'});
		this.order.shift();
		this.order = this.order.map(function (x) { 
			return parseInt(x, 10); 
		});
		
		this.visible = project.visible.slice(0);
		this.opacity = project.opacity.slice(0);
		
		for(var i=0; i<project.frames; i++){
			this.delay.push( $('#frame_null').siblings('[value="'+i+'"]').attr('data-interval') );
			this.link.push( $('#frame_null').siblings('[value="'+i+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ? 'linked':'unlinked' );
		}
		
	};
	
}

function addResizeUndo(){
	$("#historyresize_null").siblings().remove();
	//add new element to the historylist list
	var hl = $('#historyresize_list');
	hl.find('li:first').clone(true).appendTo(hl);
	hl.find('li:last').show()
	.text('Undo Resize')
	.css({'font-size':'10px'})
	.siblings().removeClass('ui-state-active');
	//hl.find('li:last').toggleClass('ui-state-active');
}
function revertResize(){
	if(resizeLayers.layer.length>0){
	
		commitHistory(myHistory[0].id);
		clearHistory(myHistory[0].id);
		
		if(project.playback.state==true){
			project.playback.stop();	//wait until all layers are loaded below before continuing.
			resizeLayersPause = true;
		}
		var count = 0;
		
		while(resizeLayers.layer.length>project.canvaslayer.length){	//if the previous state had more frames
			addFrame(0);
		}
		resizeLayers.layer.forEach(function(entry){
			var l = resizeLayers.layer.length-1;
			var img = new Image()
			img.onload = function(){
				var i = resizeLayers.layer.indexOf(entry);
				if(i!=-1){
					project.canvaslayer[i].width = this.width;
					project.canvaslayer[i].height = this.height;
					project.contextlayer[i] = project.canvaslayer[i].getContext('2d');
					project.contextlayer[i] = reload_canvas(project.canvaslayer[i], project.contextlayer[i]);
					project.contextlayer[i].clearRect(0,0, this.width, this.height);
					project.contextlayer[i].drawImage(this,0,0); 
					
					if(i==l){
						resetCanvases(this.width,this.height);
						
						myHistory[0].frame = project.currentframe;
						myHistory[0].layers.push(new historylayerdata("New",myHistory[0].canvas,myHistory[0]) );
						
						$("#historyresize_null").siblings().remove();
						
						if(project.canvaslayer.length-1 > i){
							for(var j=project.canvaslayer.length-1; j>i ; j--){
								removeFrame(j);
								/*project.canvaslayer[i].width = this.width;
								project.canvaslayer[i].height = this.height;
								project.contextlayer[i] = project.canvaslayer[i].getContext('2d');
								project.contextlayer[i] = reload_canvas(project.canvaslayer[i], project.contextlayer[i]);*/
							}
						}
					}
					count++;				
					if(count-1 == resizeLayers.layer.length-1){
						resizeLayers.order.forEach(function(o){
							$("#frame_list").append( $('#frame_'+o) );
						});
						for(var f=0; f<project.frames; f++){
							var theframe = $('#frame_null').siblings('[value="'+f+'"]');
							theframe.find('.frame_visible').attr('src',(resizeLayers.visible[f]!=true?'eye-shut.png':'eye-open.png'));
							theframe.attr('data-interval',resizeLayers.delay[f]);
							theframe.find('.frame_interval').html(resizeLayers.delay[f]*0.001);
							theframe.find('.frame_linker').css('background-image','url(icon-'+resizeLayers.link[f]+'.png)');
							project.visible[f] = resizeLayers.visible[f];
							project.opacity[f] = resizeLayers.opacity[f];
						}
						if(resizeLayersPause == true){
							resizeLayersPause=false;
							project.playback.start();
						}
					}
				}
			};
			img.src = entry;
		});
		
	}
	
}
	
function resizeCanvas(width,height,direction){
	var c = document.createElement('canvas');
	c.width=project.width;
	c.height=project.height;
	var ctx = c.getContext('2d');
	
	
	commitHistory(myHistory[0].id);
	clearHistory(myHistory[0].id);
	
		
	var x = (direction.x==1 ? 0: width-project.width);
	var y = (direction.y==1 ? 0: height-project.height);
	if(direction.x==0)x = Math.floor(x*0.5);
	if(direction.y==0)y = Math.floor(y*0.5);
	
	project.canvaslayer.forEach(function(entry){
		ctx.clearRect(0,0,project.width,project.height);
		ctx.drawImage(entry,0,0);
		
		entry.width = width;
		entry.height = height;
		project.contextlayer[project.canvaslayer.indexOf(entry)] = entry.getContext('2d');
		project.contextlayer[project.canvaslayer.indexOf(entry)] = reload_canvas(entry, project.contextlayer[project.canvaslayer.indexOf(entry)]);
		project.contextlayer[project.canvaslayer.indexOf(entry)].drawImage(c,x,y); 
	});
	
	resetCanvases(width,height);
	
	myHistory[0].frame = project.currentframe;
	myHistory[0].layers.push(new historylayerdata("New",myHistory[0].canvas,myHistory[0]) );
	
	/*
	myHistory[0].frame = project.currentframe;
	myHistory[0].layers.push(new historylayerdata("Resize Old",myHistory[0].canvas,myHistory[0]) );
	myHistory[0].layers[myHistory[0].layers.length-1].resizelayers = resizelayers.slice(0);
	myHistory[0].layers[myHistory[0].layers.length-1].clip.x = direction.x;
	myHistory[0].layers[myHistory[0].layers.length-1].clip.y = direction.y;
	myHistory[0].layers[myHistory[0].layers.length-1].clip.w = width;
	myHistory[0].layers[myHistory[0].layers.length-1].clip.h = height;
	
	myHistory[0].frame = project.currentframe;
	myHistory[0].layers.push(new historylayerdata("Resize New",myHistory[0].canvas,myHistory[0]) );
	myHistory[0].layers[myHistory[0].layers.length-1].clip.x = direction.x;
	myHistory[0].layers[myHistory[0].layers.length-1].clip.y = direction.y;
	myHistory[0].layers[myHistory[0].layers.length-1].clip.w = width;
	myHistory[0].layers[myHistory[0].layers.length-1].clip.h = height;*/
}

function resizeMap(width,height,direction){
	var tempmap = new tiledata();
	tempmap.setupMap(width,height);
	
	var x = (direction.x==1 ? 0: width-tile.dim.w);
	var y = (direction.y==1 ? 0: height-tile.dim.h);
	if(direction.x==0)x = Math.floor(x*0.5);
	if(direction.y==0)y = Math.floor(y*0.5);
	
	for(var row=0; row<tile.dim.h; row++){
		for(var col=0; col<tile.dim.w; col++){
			var newx = col+x, newy = row+y;
			if(newx >=0 && newx < width && newy >=0 && newy < height){
				for(var l=0; l<tempmap.layers.length; l++){
					tempmap.map[l][newx][newy].x = tile.map[l][col][row].x;
					tempmap.map[l][newx][newy].y = tile.map[l][col][row].y;
					tempmap.layers[l].visible = tile.layers[l].visible;
				}
			}
		}
	}
	tile = tempmap;
}

function calcAngle(x,y,x2,y2){
	//var v1 = {x: x, y: y}, v2 = {x: x2, y: y2},
   // angleRad = Math.acos( (v1.x * v2.x + v1.y * v2.y) / ( Math.sqrt(v1.x*v1.x + v1.y*v1.y) * Math.sqrt(v2.x*v2.x + v2.y*v2.y) ) ),
   // angleDeg = angleRad * 180 / Math.PI;
	
	var p1 = {
	x: x,
	y: y
	};
	 
	var p2 = {
	x: x2,
	y: y2
	};
	 
	// angle in radians
	var angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
	 
	// angle in degrees
	var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
	return [angleDeg,angleRadians];
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function calcDistance(x,y,x2,y2){
	return Math.sqrt(Math.pow(x-x2,2)+Math.pow(y-y2,2));
}

function normalize(x,y){
	var len_v = Math.sqrt(x*x + y*y);
	x /= len_v;
	y /= len_v;
	return [x,y];
}
function dotProduct(x,y,x2,y2){
	return (x*x2)+(y*y2);
}

function calcProjection(dp,x,y,unit){
	//takes the vector that gave the dot product and projects onto vector of x,y (one of the two vectors from the dotproduct)
	var px,py;
	if(unit){
		px = dp * x;
		py = dp * y;
	}else{
		px = ( dp / (x*x + y*y) ) * x;
		py = ( dp / (x*x + y*y) ) * y;
	}
	return [px,py];	//this is the new vector
}
function calcNormals(x,y){
	//90 degrees to the right and left of a vector = the normal
	rx = -y;
	ry = x;
	lx = y;
	ly = -x;
	return [rx,ry,lx,ly];
}

function flipImageData(ctx,flipv,fliph){
	var imgData = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
	var imgData2 = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);	
	
	var w = imgData.width, h = imgData.height;
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var x2=x,y2=y;
			if(flipv==-1)x2 = (w - x)-1;
			if(fliph==-1)y2 = (h - y)-1;
			
			imgData2.data[(((y2*imgData2.width)+x2)*4)] = imgData.data[(((y*w)+x)*4)];
			imgData2.data[(((y2*imgData2.width)+x2)*4)+1] = imgData.data[(((y*w)+x)*4)+1];
			imgData2.data[(((y2*imgData2.width)+x2)*4)+2] = imgData.data[(((y*w)+x)*4)+2];
			imgData2.data[(((y2*imgData2.width)+x2)*4)+3] = imgData.data[(((y*w)+x)*4)+3];
				
		}
	}
	return imgData2;
}

function eyedropColor(c){
	if($( "#rgb_hsl_radio label[class*='ui-state-active']" ).attr('for')=='radio1'){
		//var colorvalues = rgbToHsl(mouse.rgb.r,mouse.rgb.g,mouse.rgb.b);
		var colorPickerMode = 'rgb';
		convertSwatch(colorPickerMode,[c.r,c.g,c.b]);
		if(mouse.currentColor==0)mouse.color = 'rgba('+c.r+','+c.g+','+c.b+',1)';
		else mouse.color2 = 'rgba('+c.r+','+c.g+','+c.b+',1)';
	}else{
		var colorvalues = rgbToHsl(c.r,c.g,c.b);
		var colorPickerMode = 'hsl';
		convertSwatch(colorPickerMode,colorvalues);
		if(mouse.currentColor==0)mouse.color = 'rgba('+c.r+','+c.g+','+c.b+',1)';
		else mouse.color2 = 'rgba('+c.r+','+c.g+','+c.b+',1)';
	}

	//if we're using brush at moment, change colorgroup
	if(mouse.tool=="brush" || mouse.tool=="magiceraser"){
		if(currentColorGroup==0){
			colorGroup.forEach(function(entry){
				if(entry.rgb.r==c.r &&
				entry.rgb.g==c.g &&
				entry.rgb.b==c.b){
					getColorGroup(palettecontext,palettecanvas,{x:entry.pos.x,y:entry.pos.y});
					return;
				}
			});
		}else{
			colorGroup2.forEach(function(entry){
				if(entry.rgb.r==c.r &&
				entry.rgb.g==c.g &&
				entry.rgb.b==c.b){
					getColorGroup(palettecontext,palettecanvas,{x:entry.pos.x,y:entry.pos.y});
					return;
				}
			});
		}
	}
}
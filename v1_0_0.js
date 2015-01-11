function v1_0_0_brush_line(sx,sy,ex,ey,groups,t,basergba,baseuprgba, peerid){		//(start x, start y, end x, end y, groupstuff, basecolor, id of peer or null for localuser)

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
					rgba = v1_0_0_adjustColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
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
					rgba = v1_0_0_adjustColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
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
				rgba = v1_0_0_adjustColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba, baseuprgba );
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

function v1_0_0_magiceraser_line(sx,sy,ex,ey,groups,t,basergba, peerid){		//(start x, start y, end x, end y, groupstuff, basecolor, id of peer or null for localuser)

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
					rgba = v1_0_0_reverseColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba );
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
					rgba = v1_0_0_reverseColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba );
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
				rgba = v1_0_0_reverseColor( imgData.data[(((ty*w)+tx)*4)+3], rgba, groups, basergba );
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

function v1_0_0_adjustColor( alpha , rgba, g, basergba, baseuprgba ){
	var found=null;
	
	if(rgba.a==0 && basergba.a==255)rgba = basergba;
	else if(rgba.a==0 && baseuprgba.a==255)rgba = baseuprgba;
	
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

function v1_0_0_reverseColor( alpha , rgba, g, basergba ){
	var found=null;
	
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
		if(group.rgb.r==basergba.r && group.rgb.g==basergba.g && group.rgb.b==basergba.b){
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
	if(found.depth > last.depth)return { r:basergba.r, g:basergba.g, b:basergba.b, a:basergba.a };	
	//if our found color equals our last, then we probably shouldn't change it since the last is meant to be the eraser limit 
	//only do this if basecolor is opaque- meaning we aren't erasing all the way to clear)
	if(found.rgb.r==basergba.r && found.rgb.g==basergba.g && found.rgb.b==basergba.b && found.rgb.a==basergba.a &&
		found.rgb.r==last.rgb.r && found.rgb.g==last.rgb.g && found.rgb.b==last.rgb.b && found.rgb.a==last.rgb.a )
		return null;	
	
	
	//so we now have the found(first color; also the color being adjusted on the canvas), and the last(end color before stepping to transparent)
	
	if(found!=null && last!=null){
		//if(last.parent==null)return { r:basergba.r, g:basergba.g, b:basergba.b, a:basergba.a };	//this line is incase user colorpicks the basecolor with brush/magiceraser(therefor there is no list of colors to transition to)
		
		var shift = (last.depth-found.depth)-(Math.round((alpha/255)*((last.depth+1)-found.depth)));
		//if shift==-1 it means it wants to clear all the way to the fullest, so based upon whether the basecolor is opaque or not, determine if to clear or clear to basecolor
		if(shift == -1)return (basergba.a==0?{ r:0, g:0, b:0, a:0 }:{ r:basergba.r, g:basergba.g, b:basergba.b, a:basergba.a });
		else{
			while(shift--){
				if(last.parent!=found.parent){
					if(last.parent==null)return { r:last.rgb.r, g:last.rgb.g, b:last.rgb.b, a:255 };	//this line is incase user colorpicks the basecolor with brush/magiceraser(therefor there is no list of colors to transition to)
					//if(last.parent==null)return { r:rgba.r, g:rgba.g, b:rgba.b, a:rgba.a };	//this line is incase user colorpicks the basecolor with brush/magiceraser(therefor there is no list of colors to transition to)
					last = g[last.parent];
				}
			}
			rgba = { r:last.rgb.r, g:last.rgb.g, b:last.rgb.b, a:255 };
		}
	}
	return rgba;
}
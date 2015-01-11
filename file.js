
function importFile(evt) {
	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {

		// Only process image files.
		if (!f.type.match('image.*')) {
			continue;
		}

		var reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = (function(theFile) {
			$("#form_import")[0].reset();
			return function(e) {
				if (theFile.type.match('image/gif')) {
					loadGifFrames(e);
				} else {
					// Render thumbnail.
					var img = new Image();
					img.src =  e.target.result;
					img.onload = function(){
						reset_project(1,this.width,this.height);
						project.contextlayer[0].drawImage(this,0,0,this.width,this.height);
						
						project.recording.session[0].canvasdata.push(project.canvaslayer[0].toDataURL() );
				
					};
					
				}
				$("#colorpicker_container").show();
				$("#playback_container").hide();
				$("#record_container").hide();
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
}

function importClipart(evt) {
	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {

		// Only process image files.
		if (!f.type.match('image.*')) {
			continue;
		}

		var reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = (function(theFile) {
			$("#form_clipart")[0].reset();
			return function(e) {
				//if (theFile.type.match('image/gif')) {
					//loadGifFrames(e);
				//} else {
					// Render thumbnail.
					var img = new Image();
					img.src =  e.target.result;
					img.onload = function(){
						document.getElementById("marquee").click();
						
						myHistory[0].selectionclipcontext.clearRect(0,0,myHistory[0].selectionclipcanvas.width,myHistory[0].selectionclipcanvas.height);
						myHistory[0].selectionclipcanvas.width = this.width;
						myHistory[0].selectionclipcanvas.height = this.height;
						myHistory[0].selectionclipcontext.drawImage(this,0,0);
						myHistory[0].selectionmaskcanvas.width = this.width;
						myHistory[0].selectionmaskcanvas.height = this.height;
						

						selectClip(myHistory[0].id);
						myHistory[0].selectionclip.x = myHistory[0].selectionoffset.x;
						myHistory[0].selectionclip.y = myHistory[0].selectionoffset.y;
						myHistory[0].selectionhandle.state = 0;
						myHistory[0].selectionstate = "";
						
						if(peerlist.length>0){
							project.wait = true;	//locked
							project.waiting = 0;	//peerlist.length;
						}
						send_clipart(myHistory[0].selectionclipcanvas.toDataURL() );
				
					};
					
				//}
				
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
}

var supData;
function loadGifFrames(e){
	$("#popup_title").html('Loading Gif');
	$("#popup_content").html('<div id="gifFrames">\
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
		var theimg = document.getElementById("gifFrames").appendChild(img);
		//var element = document.getElementById("gifFrames").children[0];
		supData.load(function(theimg){});
		$("#popup_container").hide();	
		$("#popup_title").hide();				
	});
	

	var img = new Image();
	img.onload = function(){
		var theimg = document.getElementById("gifFrames").appendChild(img);
		//getAttribute('rel:animated_src');
		supData = new SuperGif({ gif: this } );
		var w=theimg.width, h=theimg.height;
		supData.load(function(theimg){
			//gif is loaded, now create new project with the frames.
			var theframes = supData.get_frames();		//I added a get to the libgif.js line 828, so that I can retrieve the canvasdata easily
			reset_project(theframes.length,theimg.width,theimg.height);
			project.contextlayer.forEach(function(entry){
				entry.putImageData(theframes[project.contextlayer.indexOf(entry)].data,0,0);
				project.recording.session[0].canvasdata.push(project.canvaslayer[project.contextlayer.indexOf(entry)].toDataURL() );
			});
			
			//close the dialog after loading
			$("#popup_container").hide();	
			$("#popup_title").hide();	
		});
	}
	img.src =  e.target.result;
	
}

function loadFile(evt) {
    var files = evt.target.files;
    f = files[0];
	
	if (f.type.match('image.*')){importFile(evt); return;}
	
    var reader = new FileReader();

    reader.onload = (function (theFile) {
		$("#form_open")[0].reset();
        return function (e) { 
			$('#filename').val(theFile.name.replace(/\.[^/.]+$/, ""));
            JsonObj = e.target.result
            //console.log(JsonObj);
            var parsedJSON = JSON.parse(JsonObj);
            reset_project(parsedJSON['f'],parsedJSON['w'],parsedJSON['h']);
			
			//project.visible = parsedJSON['framevisible'];
			//project.opacity = parsedJSON['frameopacity'];
			
			project.recording = parsedJSON['recording'];
			project.recording.session.push( {width:parsedJSON['w'], height:parsedJSON['h'], frameorder:parsedJSON['frameorder'], frameinterval:parsedJSON['frameinterval'], framevisible:parsedJSON['framevisible'], frameopacity:parsedJSON['frameopacity'], framelinked:parsedJSON['framelinked'], canvasdata:parsedJSON['canvasdata'], peerlist:[0], version:'1.0.0', actionlist:['start']} );
			
			
			parsedJSON['canvasdata'].forEach(function(entry){
				var img = new Image()
				img.onload = function(){
					project.contextlayer[parsedJSON['canvasdata'].indexOf(entry)].clearRect(0,0, project.width, project.height);
					project.contextlayer[parsedJSON['canvasdata'].indexOf(entry)].drawImage(this,0,0);
				};
				img.src = entry;
			});
			var count=0;
			parsedJSON['frameinterval'].forEach(function(entry){
				document.getElementById("frame_"+count ).dataset.interval = entry;
				document.getElementById("interval_"+count ).innerHTML = entry/1000;
				count++;
			});
			count=0;
			parsedJSON['framelinked'].forEach(function(entry){
				$("#frame_"+count).find('.frame_linker').css('background-image','url(icon-'+(entry==false?'un':'')+'linked.png)');
				count++;
			});
			count=0;
			parsedJSON['framevisible'].forEach(function(entry){
				project.visible[count] = entry;
				count++;
			});
			count=0;
			parsedJSON['frameopacity'].forEach(function(entry){
				project.opacity[count] = entry;
				count++;
			});
			count=0;
			project.visible.forEach(function(entry){
				$("#frame_"+count ).find('img').attr('src', (entry==true? 'eye-open.png' : 'eye-shut.png') ).attr('title', (entry==true? 'Visible' : 'Hidden') );
				count++;
			});
			parsedJSON['frameorder'].forEach(function(entry){
				$("#frame_null").siblings(':eq('+parsedJSON['frameorder'].indexOf(entry)+')').before($("#frame_"+entry));
			
			});

			$("#colorpicker_container").show();
			$("#playback_container").hide();
			$("#record_container").hide();
			
        };
    })(f);

    reader.readAsText(f, 'UTF-8');
}


function playbackFile(evt) {
    var files = evt.target.files;
    f = files[0];
    var reader = new FileReader();

    reader.onload = (function (theFile) {
		$("#form_playback")[0].reset();
        return function (e) { 
            JsonObj = e.target.result
            //console.log(JsonObj);
            var parsedJSON = JSON.parse(JsonObj);
			
			$("#history_null").siblings().remove();
			
            reset_project(parsedJSON['f'],parsedJSON['w'],parsedJSON['h']);
			
			
			project.recording = parsedJSON['recording'];
			project.playback.canvasdata = parsedJSON['canvasdata'];
			//project.recording.session.push( {canvasdata:parsedJSON['canvasdata'], peerlist:[0], version:'1.0.0', actionlist:['start']} );
			
			
			parsedJSON['frameinterval'].forEach(function(entry){
				document.getElementById("frame_"+parsedJSON['frameinterval'].indexOf(entry) ).dataset.interval = entry;
				document.getElementById("interval_"+parsedJSON['frameinterval'].indexOf(entry) ).innerHTML = entry/1000;
			
			});
			parsedJSON['framelinked'].forEach(function(entry){
				$("#frame_"+parsedJSON['framelinked'].indexOf(entry) ).find('.frame_linker').css('background-image','url(icon-'+(entry==false?'un':'')+'linked.png)');
			});
			parsedJSON['frameorder'].forEach(function(entry){
				$("#frame_null").siblings(':eq('+parsedJSON['frameorder'].indexOf(entry)+')').before($("#frame_"+entry));
			
			});
			
			
			$("#playback_container").show();
			$("#record_container").show();
			$("#colorpicker_container").hide();
			var max = 0;
			project.recording.session.forEach( function(entry){
				project.playback.keyframe.push(max);
				max += entry.actionlist.length;
			});
			$( "#playback_speed" ).spinner('value',project.playback.speed);
			$("#playback_slider").show().slider('value',0).slider('option',{
				min: 0, 
				max: max,
				slide: function(event, ui) {
					//if(!project.playback.keyframe[ui.value])
					//	return false;
				},
				stop: function(event, ui) {
					var d=null;
					var num=0;
					project.playback.keyframe.forEach( function(entry){
						if(d==null || Math.abs(ui.value-entry)<ui.value-d ){
							d=entry;
							num = project.playback.keyframe.indexOf(entry);
						}
					});
					$(this).slider('value',d);
					project.playback.stop();
					project.lock=true;
					project.playback.state = true;
					project.playback.session = num;
					project.playback.action=0;
					project.playback.start();
				}
			}).each(function() {
				$("#playback_slider").children('div').remove();
				project.playback.keyframe.forEach( function(entry){
					var el = $('<div>&nbsp;</div>').css( { 'width':'2px','height':'3px','background':'#ffffff','position':'absolute', 'left': ((entry/max)*100) + '%' });
					$("#playback_slider").append(el);

				});

			});
			project.lock=true;
			project.playback.state = true;
			project.playback.start();

        };
    })(f);

    reader.readAsText(f, 'UTF-8');
}

/*
function playbackFile(evt) {
    var files = evt.target.files;
    f = files[0];
    var reader = new FileReader();

    reader.onload = (function (theFile) {
		$("#form_playback")[0].reset();
        return function (e) { 
            JsonObj = e.target.result
            //console.log(JsonObj);
            var parsedJSON = JSON.parse(JsonObj);
			
			$("#history_null").siblings().remove();
			
            reset_project(parsedJSON['main'].f,parsedJSON['main'].w,parsedJSON['main'].h);
            //reset_project(parsedJSON['f'],parsedJSON['w'],parsedJSON['h']);
			
			
			project.recording = parsedJSON['main'].recording;
			project.recording.session.forEach(function(entry){
				entry.actionlist = parsedJSON['stuff'].session[project.recording.session.indexOf(entry)].actionlist;
			});
			project.playback.canvasdata = parsedJSON['main'].canvasdata;
			//project.recording = parsedJSON['recording'];
			//project.playback.canvasdata = parsedJSON['canvasdata'];
			//project.recording.session.push( {canvasdata:parsedJSON['canvasdata'], peerlist:[0], version:'1.0.0', actionlist:['start']} );
			
			
			parsedJSON['main'].frameinterval.forEach(function(entry){
				document.getElementById("frame_"+parsedJSON['main'].frameinterval.indexOf(entry) ).dataset.interval = entry;
				document.getElementById("interval_"+parsedJSON['main'].frameinterval.indexOf(entry) ).innerHTML = entry/1000;
			
			});
			parsedJSON['main'].frameorder.forEach(function(entry){
				$("#frame_null").siblings(':eq('+parsedJSON['main'].frameorder.indexOf(entry)+')').before($("#frame_"+entry));
			
			});
			
			
			$("#playback_container").show();
			$("#record_container").show();
			$("#colorpicker_container").hide();
			var max = 0;
			project.recording.session.forEach( function(entry){
				project.playback.keyframe.push(max);
				max += entry.actionlist.length;
			});
			$( "#playback_speed" ).spinner('value',project.playback.speed);
			$("#playback_slider").show().slider('value',0).slider('option',{
				min: 0, 
				max: max,
				slide: function(event, ui) {
					//if(!project.playback.keyframe[ui.value])
					//	return false;
				},
				stop: function(event, ui) {
					var d=null;
					var num=0;
					project.playback.keyframe.forEach( function(entry){
						if(d==null || Math.abs(ui.value-entry)<ui.value-d ){
							d=entry;
							num = project.playback.keyframe.indexOf(entry);
						}
					});
					$(this).slider('value',d);
					project.playback.stop();
					project.lock=true;
					project.playback.state = true;
					project.playback.session = num;
					project.playback.action=0;
					project.playback.start();
				}
			}).each(function() {
				$("#playback_slider").children('div').remove();
				project.playback.keyframe.forEach( function(entry){
					var el = $('<div>&nbsp;</div>').css( { 'width':'2px','height':'3px','background':'#ffffff','position':'absolute', 'left': ((entry/max)*100) + '%' });
					$("#playback_slider").append(el);

				});

			});
			project.lock=true;
			project.playback.state = true;
			project.playback.start();

        };
    })(f);

    reader.readAsText(f, 'UTF-8');
}
*/
function saveit(y) {
	var d=document, a=d.getElementById('savelink'), t='Hello world!', xx, b, u
	try {
		if(y) {
			try {
				b = new Blob([t])
				b.type = 'text/plain'
			} catch(x) {
				xx = x
				console.error(x)
				b = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)
				b.append(t)
				b = b.getBlob('text/plain')
			}
			u = (window.URL || window.webkitURL).createObjectURL(b)
			if(u!==u+'')
				return alert('createObjectURL returned '+u)
			a.href = u
		} else
			a.href = 'data:text/plain,'+encodeURIComponent(t)
		a.click()
	} catch(x) {
		alert(xx||x)
	}
}

var saveName;
var saveString;
var saveObj;
var savePNG = {type:"", startframe:"", endframe:"", columns:"", rows:"", direction:""};
/*
var saveTimer = setInterval(function() {
   var canvasdata = [];
	var intervaldata = [project.frames];
	var frameorder = [project.frames];
	project.canvaslayer.forEach(function(entry){
		canvasdata.push(entry.toDataURL() );
		intervaldata[project.canvaslayer.indexOf(entry)] = document.getElementById("frame_"+project.canvaslayer.indexOf(entry) ).dataset.interval;
		frameorder[project.canvaslayer.indexOf(entry)] = $("#frame_null").siblings(':eq('+project.canvaslayer.indexOf(entry)+')').attr('value');
	});
	
	//for (var i = 0; i < 10000000; i++) project.recording.session[0].actionlist[i] = "start";

	saveObj = {
		f:project.frames, w:project.width, h:project.height,
		canvasdata: canvasdata,
		frameinterval: intervaldata,
		frameorder: frameorder,
		framevisible: project.visible,
		frameopacity: project.opacity,
		recording: project.recording
	};
	
	//console.save(obj, filename+'.pxl', 'text/json');
	saveString = JSON.stringify(saveObj, undefined);
	console.log("stringified");
}, 60 * 1000); */
//clearInterval(timerID); // The setInterval it cleared and doesn't run anymore.

function saveFile(filename){
	var canvasdata = [];
	var intervaldata = new Array(project.frames);
	var linkeddata = new Array(project.frames);
	var frameorder = new Array(project.frames);
	project.canvaslayer.forEach(function(entry){
		canvasdata.push(entry.toDataURL() );
		intervaldata[project.canvaslayer.indexOf(entry)] = document.getElementById("frame_"+project.canvaslayer.indexOf(entry) ).dataset.interval;
		linkeddata[project.canvaslayer.indexOf(entry)] = ( $("#frame_"+project.canvaslayer.indexOf(entry) ).find('.frame_linker').attr('style').indexOf('-linked')!==-1 ? true : false );
		frameorder[project.canvaslayer.indexOf(entry)] = $("#frame_null").siblings(':eq('+project.canvaslayer.indexOf(entry)+')').attr('value');
	});
	
	//for (var i = 0; i < 10000000; i++) project.recording.session[0].actionlist[i] = "start";

	saveObj = {
		f:project.frames, w:project.width, h:project.height,
		canvasdata: canvasdata,
		frameinterval: intervaldata,
		frameorder: frameorder,
		framevisible: project.visible,
		frameopacity: project.opacity,
		framelinked: linkeddata,
		recording: project.recording
	};
	
	//console.save(obj, filename+'.pxl', 'text/json');
	
	/*
	saveString = JSON.stringify(saveObj, saveReplacer);
	var sessionString = ',"stuff":{"session":[';
	project.recording.session.forEach(function(entry){
		sessionString = sessionString.concat('{"actionlist":[');
		entry.actionlist.forEach(function(action){
			sessionString = sessionString.concat( JSON.stringify(action) );
			if(entry.actionlist.indexOf(action)<entry.actionlist.length-1)sessionString = sessionString.concat(',');
		});
		if(project.recording.session.indexOf(entry)<project.recording.session.length-1)sessionString = sessionString.concat(']},');
		else sessionString = sessionString.concat(']}');
	});
	sessionString = sessionString.concat(']}}');
	saveString = '{"main":' + saveString + sessionString; */
	
	saveString = JSON.stringify(saveObj, undefined);
	//alert(File is ready to Download!);
	//saveBlob(saveString, filename+'.pxl', 'text/json');
	setTimeout(function(){ saveBlob(saveString, filename+'.pxl', 'text/json') }, 1000);
}
function saveReplacer(key, value)
{
  if (key=="actionlist")
  {
      return undefined;
  }
  else return value;
}

function exportPng(file){
	var c = document.createElement('canvas');
	c.width=project.width*(file.type=='sheet'?file.columns:1);
	c.height=project.height*(file.type=='sheet'?file.rows:1);
	var ctx = c.getContext('2d');
	
	var count = 0;
	for(var i=(file.type=='separate'?(project.frames-1) - file.startframe:project.canvaslayer.length-1); i>(file.type=='separate'?((project.frames-1)-file.endframe)-1:-1); i--){
		var frame = $("#frame_null").siblings(':eq('+i+')').attr('value');
		if(project.visible[frame]==true){
			if(file.type=='separate')ctx.clearRect(0,0,c.width,c.height);
			if(file.type=='sheet'){
				do{
					if(project.visible[frame]==true){
						var x = (file.direction=='leftright'? count%file.columns : Math.floor(count/file.rows) )*project.width;
						var y = (file.direction=='leftright'? Math.floor(count/file.columns) : count%file.rows )*project.height;
						if(x<c.width && y<c.height){
							ctx.globalAlpha=project.opacity[frame];
							ctx.drawImage(project.canvaslayer[frame],x,y);
							ctx.globalAlpha=1;
						}
					}
				
					//if(project.visible[frame]==true)ctx.drawImage(project.canvaslayer[frame],0,0,project.width,project.height);
					//ctx.globalAlpha=1;
					if( $("#frame_null").siblings('[value="'+frame+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
						frame = $("#frame_null").siblings('[value="'+frame+'"]').prev().attr('value');
						i--;
					}else frame = -1;
				}while(frame!=-1);
				
			}else{
				ctx.globalAlpha=project.opacity[frame];
				ctx.drawImage(project.canvaslayer[frame],0,0);
				ctx.globalAlpha=1;
			}
			if(file.type=='separate'){
				var d = c.toDataURL();
				console.save(d, file.filename+'_'+(count+1)+'.png', 'image/png');
			}
			count++;
		}
	}
	if(file.type!='separate'){
		var data = c.toDataURL();
		//data = data.replace("data:image/png;base64,", ""); 
		
		console.save(data, file.filename+'.png', 'image/png');
	}
}

function exportGif(filename, color){
	var gif = new GIF({
		workers: 2,
		quality: 1,
		background: color,	//'#000',
		transparent: color.replace('#', '0x' )	//'0x000000'
	});

	// add an image element
	//gif.addFrame(imageElement);
	
	// or a canvas element
	/*for(var i=project.canvaslayer.length-1; i>-1; i--){
		var frame = $("#frame_null").siblings(':eq('+i+')').attr('value');
		if(project.visible[frame]==true)
			gif.addFrame(project.canvaslayer[frame], {delay: document.getElementById("frame_"+frame).dataset.interval} );
	}*/
	
	var c = document.createElement('canvas');
	c.width=project.width;
	c.height=project.height;
	var ctx = c.getContext('2d');
	
	for(var i=project.canvaslayer.length-1; i>-1; i--){
		var theframe = $("#frame_null").siblings(':eq('+i+')');
		var animframe = theframe.attr('value');
		
		ctx.fillStyle = color;
		ctx.fillRect(0,0,c.width,c.height);
		//ctx.clearRect(0,0,project.width,project.height);
		do{
			//ctx.globalAlpha=project.opacity[animframe];
			if(project.visible[animframe]==true)ctx.drawImage(project.canvaslayer[animframe],0,0,project.width,project.height);
			//ctx.globalAlpha=1;
			if( $("#frame_null").siblings('[value="'+animframe+'"]').find('.frame_linker').attr('style').indexOf('-linked')!==-1 ){
				animframe = $("#frame_null").siblings('[value="'+animframe+'"]').prev().attr('value');
				i--;
			}else animframe = -1;
		}while(animframe!=-1);
		
		gif.options.width = c.width;
		gif.options.height = c.height;
		gif.addFrame(ctx, {copy: true});
		gif.frames[gif.frames.length-1].delay = theframe.attr('data-interval');
						
	}
	
	// or copy the pixels from a canvas context
	//gif.addFrame(ctx, {copy: true});

	gif.on('finished', function(blob) {
		//window.open(URL.createObjectURL(blob));
		e = document.createEvent('MouseEvents'),
        a = document.createElement('a')

		
        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['image/gif', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
		//console.save(blob, filename+'.gif', 'image/gif');
	});

	gif.render();
}

function saveColordex(file){
	
	var data = palettecanvas.toDataURL();
	//data = data.replace("data:image/png;base64,", ""); 
	
	console.save(data, file+'.png', 'image/png');

}

function loadColordex(evt) {
	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {

		// Only process image files.
		if (!f.type.match('image.*')) {
			continue;
		}

		var reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = (function(theFile) {
			$("#form_load_colordex")[0].reset();
			return function(e) {
				// Render
				var img = new Image();
				img.src =  e.target.result;
				img.onload = function(){
					palettecontext.clearRect(0,0,palettecanvas.width,palettecanvas.height);
					palettecontext.drawImage(this,0,0,this.width,this.height);
			
				};
				
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
}

function saveMapImage(file){
	var c = document.createElement('canvas');
	c.width=tile.dim.w*project.grid.x;
	c.height=tile.dim.h*project.grid.y;
	var ctx = c.getContext('2d');
	
	
	var start = project.frames-1 , end = -1;
	for(var frame_i=start; frame_i>end; frame_i--){		//this is for the secondary viewport, and thus doesn't need to display any historylist
		var framenum = $("#frame_null").siblings(':eq('+frame_i+')').attr('value');
		
		if(tool.secondary_view==1){//project.showall==false){
			framenum=project.currentframe;
			frame_i = 0;
		}
			
		if(project.visible[framenum]==true && framenum<project.canvaslayer.length && framenum>-1){
			temp2context.clearRect(0,0,project.width,project.height);
			if(project.visible[framenum]==true){
				for(var x=0; x<tile.dim.w; x++){
					for(var y=0; y<tile.dim.h; y++){
						for(var l=0; l<tile.layers.length; l++){
							if(tile.layers[l].visible==true && tile.map[l][x][y].x!=-1 && tile.map[l][x][y].y!=-1)
								ctx.drawImage(project.canvaslayer[framenum],tile.map[l][x][y].x*project.grid.x,tile.map[l][x][y].y*project.grid.y,project.grid.x,project.grid.y,(x*project.grid.x),(y*project.grid.y),project.grid.x,project.grid.y);
						}
					}
				}
				
			}
			historylist.forEach(function(entry){
				if(entry.frame==framenum){
					if(entry.draw==false || entry.erase==true)temp2context.globalCompositeOperation = 'destination-out';
					for(var x=0; x<tile.dim.w; x++){
						for(var y=0; y<tile.dim.h; y++){
							for(var l=0; l<tile.layers.length; l++){
								if(tile.layers[l].visible==true && tile.map[l][x][y].x!=-1 && tile.map[l][x][y].y!=-1)
									ctx.drawImage(entry.canvas,tile.map[l][x][y].x*project.grid.x,tile.map[l][x][y].y*project.grid.y,project.grid.x,project.grid.y,(x*project.grid.x),(y*project.grid.y),project.grid.x,project.grid.y);
							}
						}
					}
					
					if(entry.draw==false || entry.erase==true)temp2context.globalCompositeOperation = 'source-over';
				}
			});
			
			
		}
	}
	
	var data = c.toDataURL();
	//data = data.replace("data:image/png;base64,", ""); 
	
	console.save(data, file+'.png', 'image/png');

}
function saveMapTmx(filename){
	
	var saveObj = {
		dim:0
	};
	
	var datatmx = '';
	for(var y=0; y<tile.dim.h; y++){
		for(var x=0; x<tile.dim.w; x++){
			if(tile.map[tile.layer][x][y].x==-1 && tile.map[tile.layer][x][y].y==-1){					
				datatmx += '0';
			}else{
				datatmx += (tile.map[tile.layer][x][y].y*Math.floor(project.width/project.grid.x))+(tile.map[tile.layer][x][y].x+1);
			}
			datatmx += ',';
		}
	}
	datatmx = datatmx.substring(0, datatmx.length - 1);
	
	//saveString = JSON.stringify(tile, undefined);
	saveString = '<?xml version="1.0" encoding="utf-8" ?>\
		<map height="'+(tile.dim.h)+'" orientation="orthogonal" tileheight="'+project.grid.y+'" tilewidth="'+project.grid.x+'" version="1.0" width="'+(tile.dim.w)+'">\
			<tileset firstgid="1" margin="0" name="'+filename+'" spacing="0" tileheight="'+project.grid.y+'" tilewidth="'+project.grid.x+'">\
				<image height="'+project.height+'" source="'+filename+'.png" width="'+project.width+'" />\
			</tileset>\
			<layer height="'+(tile.dim.h)+'" name="'+filename+'" width="'+(tile.dim.w)+'">\
				<data encoding="csv">'+datatmx+'</data>\
			</layer>\
		</map>';
	
	saveBlob(saveString, filename+'.tmx', 'text/json');
}
function saveMap(filename){
	
	var saveObj = {
		dim:0
	};
	
	saveString = JSON.stringify(tile, undefined);
	
	saveBlob(saveString, filename+'.txt', 'text/json');
}
function loadMapTmx(evt) {
    var files = evt.target.files;
    f = files[0];
	
	//if (f.type.match('image.*')){importFile(evt); return;}
	
    var reader = new FileReader();

    reader.onload = (function (theFile) {
		$("#form_load_maptmx")[0].reset();
        return function (e) { 
			var tmxString = e.target.result
			var startData = tmxString.indexOf("<data")+21;
			var endData = tmxString.indexOf("</data");
			var subData=tmxString.substring(startData,endData);
			var tmxtileList = subData.split(",");
			
			var tmxcount = 0;
			for(var y=0; y<tile.dim.h; y++){
				for(var x=0; x<tile.dim.w; x++){
					if(tmxcount<tmxtileList.length){
						if(tmxtileList[tmxcount]==0){
							tile.map[tile.layer][x][y].x = -1;
							tile.map[tile.layer][x][y].y = -1;			
						}else {
							tile.map[tile.layer][x][y].y = Math.floor((tmxtileList[tmxcount]-1)/Math.floor(project.width/project.grid.x));
							tile.map[tile.layer][x][y].x = ((tmxtileList[tmxcount]-1)-Math.floor(tile.map[tile.layer][x][y].y*Math.floor(project.width/project.grid.x)));			
						}
					}
					tmxcount++;
				}
			}
        };
    })(f);

    reader.readAsText(f, 'UTF-8');
}
function loadMap(evt) {
    var files = evt.target.files;
    f = files[0];
	
	//if (f.type.match('image.*')){importFile(evt); return;}
	
    var reader = new FileReader();

    reader.onload = (function (theFile) {
		$("#form_load_map")[0].reset();
        return function (e) { 
			JsonObj = e.target.result
			var parsedJSON = JSON.parse(JsonObj);
            
			tile.dim = parsedJSON['dim'];
			tile.x = parsedJSON['x'];
			tile.y = parsedJSON['y'];
			tile.set = parsedJSON['set'];
			tile.layer = parsedJSON['layer'];
			tile.layers = parsedJSON['layers'];
			tile.map = parsedJSON['map'];
			
			$("#map_layer_dropdown>option:eq("+tile.layer+")").prop('selected',true)
			$('#map_visible_img').attr('src',(tile.layers[tile.layer].visible==false?'eye-shut.png':'eye-open.png'));
	
        };
    })(f);

    reader.readAsText(f, 'UTF-8');
}

function removeRecords(){
	var canvasdata = [];
	var intervaldata = new Array(project.frames);
	var linkeddata = new Array(project.frames);
	var frameorder = new Array(project.frames);
	project.canvaslayer.forEach(function(entry){
		canvasdata.push(entry.toDataURL() );
		intervaldata[project.canvaslayer.indexOf(entry)] = document.getElementById("frame_"+project.canvaslayer.indexOf(entry) ).dataset.interval;
		linkeddata[project.canvaslayer.indexOf(entry)] = ( $("#frame_"+project.canvaslayer.indexOf(entry) ).find('.frame_linker').attr('style').indexOf('-linked')!==-1 ? true : false );
		frameorder[project.canvaslayer.indexOf(entry)] = $("#frame_null").siblings(':eq('+project.canvaslayer.indexOf(entry)+')').attr('value');
	});
	
	project.recording.session = [];
	project.recording.session.push( {width:project.width, height:project.height, frameorder:frameorder, frameinterval:intervaldata, framevisible:project.visible, frameopacity:project.opacity, framelinked:linkeddata, canvasdata:canvasdata, peerlist:[0], version:'1.0.0', actionlist:['start']} );
	
	commitHistory(myHistory[0].id);
	clearHistory(myHistory[0].id);
	myHistory[0].frame = project.currentframe;
	myHistory[0].layers.push(new historylayerdata("New",myHistory[0].canvas,myHistory[0]) );
}
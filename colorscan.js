
function colorScan(){
	tool.colorscan = new Worker( colorScan_workerblob );
	
	var selected = $('#scan_palette_dropdown').prop('selectedIndex');
	
	var canvasdata = new Array();
	project.contextlayer.forEach(function(entry){
		if(selected==0 || (selected==1 && project.currentframe==project.contextlayer.indexOf(entry) ) )canvasdata.push(entry.getImageData(0,0,project.width, project.height));
	});
	
	tool.colorscan.addEventListener('message', function(e) {
		var colors = e.data.colors;
		
		$('#palette_box').html('');
		for(var c=0; c<colors.length; c++){
			$('#palette_box').append(' \
				<div style="display:inline-block; border-style:solid; border-width:0px 1px 1px 0px; border-color:#000; width:16px; height:16px; background:rgb('+colors[c][0]+','+colors[c][1]+','+colors[c][2]+');" onclick="eyedropColor({r:'+colors[c][0]+',g:'+colors[c][1]+',b:'+colors[c][2]+'}); return false;"></div>\
				');
		}
	}, false);
	
	tool.colorscan.postMessage({'canvasdata': canvasdata });
}

// Build a worker from an anonymous function body
var colorScan_workerblob = URL.createObjectURL( new Blob([ '(',

function(){

self.addEventListener('message', function(e) {
	var data = e.data;
	var canvasdata = data.canvasdata;

	var colors = new Array();
	
	for(var i=0; i<canvasdata.length; i++){
		var imgData = canvasdata[i];
		var w = imgData.width;
		var h = imgData.height;
		
		for(var y=0; y<h; y++){
			for(var x=0; x<w; x++){
				var r = imgData.data[(((y*w)+x)*4)];
				var g = imgData.data[(((y*w)+x)*4)+1];
				var b = imgData.data[(((y*w)+x)*4)+2];
				var a = imgData.data[(((y*w)+x)*4)+3];
				
				var found = false;
				for(var c=0; c<colors.length; c++){
					//if(colors[c] == 'rgb('+r+','+g+','+b+')'){ found = true; break; }
					if(colors[c][0] == r && colors[c][1] == g && colors[c][2] == b){ found = true; break; }
				}
				if(found == false && a==255){colors.push([r,g,b]);}
				
			}
		}
	}
	
	if(colors.length>1){
		colors.sort(function(a, b){
			var luminanceA = (0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]);
			var luminanceB = (0.2126*b[0] + 0.7152*b[1] + 0.0722*b[2]);
			if (luminanceA == luminanceB)return 0;
			if (luminanceA > luminanceB)return 1;
			else return -1;
			
		});
	}
	
	self.postMessage( {colors:colors} );
	self.close();
}, false);


}.toString(),

')()' ], { type: 'application/javascript' } ) );
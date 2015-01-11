// Build a worker from an anonymous function body
var scale2x_workerblob = URL.createObjectURL( new Blob([ '(',

function(){

self.addEventListener('message', function(e) {
	var data = e.data;
	
	//data.resizedata, data.selectionclip, data.rotation, 
	
	var datacanvas1 = data.datacanvas1;
	var datacanvas2 = data.datacanvas2;
	var datacanvas3 = data.datacanvas3;
	var datacanvas4 = data.datacanvas4;
	var datacanvasA = data.datacanvasA;
	var datacanvasB = data.datacanvasB;

	scale2x(datacanvas1, datacanvas2);
	scale2x(datacanvas2, datacanvas3);
	scale2x(datacanvas3, datacanvas4);
	
	var imgData = datacanvas4;
	
	var scalex = ((data.selectionclip.w)/datacanvas1.width );
	var scaley = ((data.selectionclip.h)/datacanvas1.height );
	
	
	var width = Math.floor(data.maxX2);
	var height = Math.floor(data.maxY2);
	var w0 = datacanvas4.width;
	var h0 = datacanvas4.height;
	var w = datacanvas4.width*scalex;
	var h = datacanvas4.height*scaley;
	
	sx = Math.floor( ((datacanvasA.width)*0.5)-(Math.cos(data.rotation.radian)*(w*0.5)) - (Math.cos(data.rotation.radian+toRadians(90))*(h*0.5)) );
	sy = Math.floor( ((datacanvasA.height)*0.5)-(Math.sin(data.rotation.radian)*(w*0.5)) - (Math.sin(data.rotation.radian+toRadians(90))*(h*0.5)) );
							
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var x2=Math.floor((x/w)*w0), y2=Math.floor((y/h)*h0);
			//if(y2%2==0){
				//var neighbors = getNeighbors(x+4,y+4,imgData);
				var r = imgData.data[(((y2*w0)+x2)*4)];
				var g = imgData.data[(((y2*w0)+x2)*4)+1];
				var b = imgData.data[(((y2*w0)+x2)*4)+2];
				var a = imgData.data[(((y2*w0)+x2)*4)+3];
				
				px = Math.floor((Math.cos(data.rotation.radian)*x) + (Math.cos(data.rotation.radian+toRadians(90))*y));
				py = Math.floor((Math.sin(data.rotation.radian)*x) + (Math.sin(data.rotation.radian+toRadians(90))*y));
				
				
				
				//rcontext4.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
				//rcontext4.fillRect(sx+px,sy+py,2,2);
				
				datacanvasA.data[((((sy+py)*datacanvasA.width)+sx+px)*4)] = r;
				datacanvasA.data[((((sy+py)*datacanvasA.width)+sx+px)*4)+1] = g;
				datacanvasA.data[((((sy+py)*datacanvasA.width)+sx+px)*4)+2] = b;
				datacanvasA.data[((((sy+py)*datacanvasA.width)+sx+px)*4)+3] = a;
				
				if(y<h-1){
					datacanvasA.data[((((sy+py+1)*datacanvasA.width)+sx+px)*4)] = r;
					datacanvasA.data[((((sy+py+1)*datacanvasA.width)+sx+px)*4)+1] = g;
					datacanvasA.data[((((sy+py+1)*datacanvasA.width)+sx+px)*4)+2] = b;
					datacanvasA.data[((((sy+py+1)*datacanvasA.width)+sx+px)*4)+3] = a;
				}
			//}
			
		}
	}
	
	
	//rcontext.clearRect(0,0,rcanvas.width,rcanvas.height);
	datacanvasB = resizeImageData(datacanvasA,datacanvasB);
	
	data.rotation.sx = Math.floor( ((datacanvasB.width)*0.5)-(Math.cos(data.rotation.radian)*(width*0.5)) - (Math.cos(data.rotation.radian+toRadians(90))*(height*0.5)) );
	data.rotation.sy = Math.floor( ((datacanvasB.height)*0.5)-(Math.sin(data.rotation.radian)*(width*0.5)) - (Math.sin(data.rotation.radian+toRadians(90))*(height*0.5)) );
	
	//rcontext.putImageData(imgData,0,0);
	var originalData = datacanvas1; //peerhistory[0].resizecontext.getImageData(0,0,data.resizedata.width,data.resizedata.height);
	var rw = datacanvas1.width;
	var rh = datacanvas1.height;
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
				distancex = (distancex/(data.selectionclip.w))*datacanvas1.width;
				distancey = (distancey/(data.selectionclip.h))*datacanvas1.height;
				var distance = calcDistance(0,0,distancex,distancey);
				//console.log(distance+","+distancex+","+distancey);
				px = Math.floor((Math.cos((rotation[1])-data.rotation.radian)*distance) + (datacanvas1.width*0.5) );
				py = Math.floor((Math.sin((rotation[1])-data.rotation.radian)*distance) + (datacanvas1.height*0.5) );
				
				if(px>=0 && py>=0 && px<datacanvas1.width && py<datacanvas1.height){
					
					//rcontext.fillStyle = "rgba("+colorchoice.r+","+colorchoice.g+","+colorchoice.b+","+colorchoice.a+")";
					//rcontext.fillRect(x,y,1,1);
		
					datacanvasB.data[(((y*width)+x)*4)] = colorchoice.r;
					datacanvasB.data[(((y*width)+x)*4)+1] = colorchoice.g;
					datacanvasB.data[(((y*width)+x)*4)+2] = colorchoice.b;
					datacanvasB.data[(((y*width)+x)*4)+3] = colorchoice.a;
				}
				
			}
		}
	}
	
	self.postMessage( {img:datacanvasB,sx:data.rotation.sx,sy:data.rotation.sy} );
	self.close();
}, false);


function resizeImageData(datacanvasA,datacanvasB){

	//var peerhistory = $.grep(historylist, function(e){ return e.id == peerid; });
	
	var imgData = datacanvasA;
	
	
	var width = imgData.width;
	var height = imgData.height;
	var w = datacanvasB.width, h = datacanvasB.height;
	for(var y=0; y<h; y++){
		for(var x=0; x<w; x++){
			var x2=Math.floor((x/w)*width), y2=Math.floor((y/h)*height);
			
			var r = imgData.data[(((y2*width)+x2)*4)];
			var g = imgData.data[(((y2*width)+x2)*4)+1];
			var b = imgData.data[(((y2*width)+x2)*4)+2];
			var a = imgData.data[(((y2*width)+x2)*4)+3];
			
			//rcontext.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
			//rcontext.fillRect(x,y,1,1);
					
			datacanvasB.data[(((y*w)+x)*4)] = r;
			datacanvasB.data[(((y*w)+x)*4)+1] = g;
			datacanvasB.data[(((y*w)+x)*4)+2] = b;
			datacanvasB.data[(((y*w)+x)*4)+3] = a;
			
		}
	}
	return datacanvasB;
}



/*var canvas1 = document.getElementById("canvas1");
var canvas2 = document.getElementById("canvas2");
var canvas3 = document.getElementById("canvas3");
var canvas4 = document.getElementById("canvas4");

var ctx1 = canvas1.getContext("2d");
var ctx2 = canvas2.getContext("2d");
var ctx3 = canvas3.getContext("2d");
var ctx4 = canvas4.getContext("2d");

var img = new Image();
img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAA0CAMAAADPNIq/AAAAn1BMVEVrQiGMUilSMRjWnFL31oS1czn//61zY0pCIQD/50rnnClCKRC9tWuMe0JaQiH//++9tXOMWiEQEAjWpVr/75Rzazk5MRB7AAC1QgB7MQhCKQCtYwDvrSlSGACUe0L/3ozGrXM5MQgYEACUYyFCQiEYGABra0r//85jUiGM7/+UlHPGxqX///85pf9Svf9r1v+19//GcwDvvXPe9//GjEpKSnW2AAADgElEQVR42mXTC3uaShSF4UGFMwmoOAgqKlUPUMVLWpP//9v67c2YmHY9KdXM2zU3ajSBxAwG+mk4GvHFhOGQhGEYjSSmTwgYfIdBKOE7in9h/hPWOzPQ6nA4CgyBRBJhw8gEUkdo+4L8IPjD1ML4bJABAMQaAw8ZCK21KNxIY2CY0BCgZji05OXl1bIZdRQbpMAA94DWvr6+4F7siG4fhmNggHxAZVa0jaJkPB4nicA4ZuoAOB5PyDiJ7CtsOp1CLQjIT0QZDilOpTSlOCQOmAiOmLQ/ZpyHuDS1MzezCeH38qQRiBPoCNDCbJbZbC5yEiVxD7kQgbhpmuZYFGieZdnUJqgxkDWGQF+Y5nleuMXCZrMsm2cza0XEcaRQXoUviFsuF84imRwAwSl8zIws1IkEplMPk39hnrvlkqNeSuXMOSW9m+imvUtxLJDFqZxbbuULcm/PkP1O55ZV2hnniPwXqhM4n8+c5Sj9TX9C8zfUg5naJRD5gN/3zBLZL5OmAhkX6aH5hBQqRFK4wKlMkEDcN+grvSNIcU8w5poV+lUmzvVlUIGDhyPOLZBzkXnOjSOV9tA8QYJklUVeZPKaeSmQSoVjXJ6nBdbOikJcBuzTQwMTOQEWKe9kYV3Rb95OJt7F8t8apZHGPCUup5WtI3nDPQzNA7oVEqvveWAlk8TGwFIbv+DaFUCt3LggSBIbxVZcVir8dKsV14icCsSJjOxYYPwMN9uVg2mjq5xCzqcssx9/Q3FCcw+R4/JHmdHoeB+92zEfEur4VFWu77RMjNwZ3APKiyZZbdc0Vnskt20PmULzcBWOuO1qC8QB+xyy/8tKYF03bkehnA5uxaedONfLyB3KQ2lcU7dt2zRS2C/Q/dzthB2rHfJEDoesNE13vpzPUCCSzp97Zdfq9nZ7O/06nX4dOCDTgdru3FFaO1LXe0eu1+vt7Q0kofC36erLpas7YH2uSctT8uSQwPZyv3d3lZeO5ponqwHePHt/f6fftPd7e/9Q2NHX0stSOoXaeCV8MfW9vt8/mo7ttA2p9emnVtljQ83HB8Myzhmum2a1JVeHFOpxadpOCyhiGAnbbNbrNcd4u91U7k4nNtOwLBjnuFHA00mOx0pzqrjcCnhsoMx7PDof0H7vHX8JPLrS8Do1MH7j9sTtgTIOwPXew4kOAN2eATDflQH3MnAEVn8Ab72PRXxDYwUAAAAASUVORK5CYII=";
ctx1.drawImage(img, 0, 0);


var datacanvas1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
var datacanvas2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
var datacanvas3 = ctx3.getImageData(0, 0, canvas3.width, canvas3.height);
var datacanvas4 = ctx4.getImageData(0, 0, canvas4.width, canvas4.height);
*/


function getPixel(bron, x, y) {
  index = (x + y * bron.width) * 4;
  if (index >= 0 && index < (bron.height * bron.width * 4)) {
	  r = bron.data[index + 0];
	  g = bron.data[index + 1];
	  b = bron.data[index + 2];
	  return (r << 16) + (g << 8) + b;
  } else {
	  return 0;
  }
}

function setPixel(bron2, x, y, color) {
  index = (x + y * bron2.width) * 4;
  if (index >= 0 && index < (bron2.height * bron2.width * 4)) {
	  bron2.data[index + 0] = (color >> 16) & 0xff;
	  bron2.data[index + 1] = (color >> 8) & 0xff;
	  bron2.data[index + 2] = (color) & 0xff;
	  bron2.data[index + 3] = 255;
  }
}

function scale(src, dest) {     
  for (var y = 0; y < src.height; y++) {
	  for (var x = 0; x < src.width; x++) {
		
		
		  var A = getPixel(src, x - 1, y - 1);
		  var B = getPixel(src, x, y - 1);
		  var C = getPixel(src, x + 1, y - 1);
		  var D = getPixel(src, x - 1, y);
		  var E = getPixel(src, x, y);
		  var F = getPixel(src, x + 1, y);
		  var G = getPixel(src, x - 1, y + 1);
		  var H = getPixel(src, x, y + 1);
		  var I = getPixel(src, x + 1, y + 1);

		  if (B != H && D != F) {
			 E0 = D == B ? D : E;
			  E1 = B == F ? F : E;
			  E2 = D == H ? D : E;
			  E3 = H == F ? F : E;
		  } else {
			  E0 = E;
			  E1 = E;
			  E2 = E;
			  E3 = E;
		 }
		


		  setPixel(dest, x * 2, y * 2, E0);
		  setPixel(dest, x * 2 + 1, y * 2, E1);
		  setPixel(dest, x * 2, y * 2 + 1, E2);
		  setPixel(dest, x * 2 + 1, y * 2 + 1, E3);

	  }
  }
}

/*
scale(datacanvas1, datacanvas2);
ctx2.putImageData(datacanvas2, 0, 0);
scale(datacanvas2, datacanvas3);
ctx3.putImageData(datacanvas3, 0, 0);
scale(datacanvas3, datacanvas4);
ctx4.putImageData(datacanvas4, 0, 0);
*/


// rotsprite 2x enlargement algorithm:
// suppose we are looking at input pixel cE which is surrounded by 8 other pixels:
//  cA cB cC
//  cD cE cF
//  cG cH cI
// and for that 1 input pixel cE we want to output 4 pixels oA, oB, oC, and oD:
//  oA oB
//  oC oD
// this is the operation performed per pixel:


function scale2x(src, dest) {     
  for (var y = 0; y < src.height; y++) {
	  for (var x = 0; x < src.width; x++) {
		
		
			var cA = getPixel2x(src, x - 1, y - 1);
			var cB = getPixel2x(src, x, y - 1);
			var cC = getPixel2x(src, x + 1, y - 1);
			var cD = getPixel2x(src, x - 1, y);
			var cE = getPixel2x(src, x, y);
			var cF = getPixel2x(src, x + 1, y);
			var cG = getPixel2x(src, x - 1, y + 1);
			var cH = getPixel2x(src, x, y + 1);
			var cI = getPixel2x(src, x + 1, y + 1);
			
			// I find that this simple measurement of color distance gives better results for sprites than other fancier methods like luminosity comparison
			var distance = function(c1, c2){return (((c1)==(c2)) ? 0 : Math.abs((c1).red - (c2).red) + Math.abs((c1).green - (c2).green) + Math.abs((c1).blue - (c2).blue)); }
			// the "similar" macro checks to see if two colors are less different from each other than either is from the current reference color
			var similar = function(c1,c2){return ((c1)==(c2) || (distance(c1,c2) <= distance(cE,c2) && distance(c1,c2) <= distance(cE,c1))); }
			var different = function(c1,c2){return (!similar(c1,c2)); }

			
			var oA,oB,oC,oD;
			var bakcol = {red:0,green:0,blue:0,alpha:0};

			if (different(cD,cF)
			 && different(cH,cB)
			 && ((similar(cE,cD) || similar(cE,cH) || similar(cE,cF) || similar(cE,cB) ||
				 ((different(cA,cI) || similar(cE,cG) || similar(cE,cC)) &&
				  (different(cG,cC) || similar(cE,cA) || similar(cE,cI))))))
			{
				oA = ((similar(cB,cD) && ((different(cE,cA) || different(cB,bakcol)) && (different(cE,cA) || different(cE,cI) || different(cB,cC) || different(cD,cG)))) ? cB : cE);
				oB = ((similar(cF,cB) && ((different(cE,cC) || different(cF,bakcol)) && (different(cE,cC) || different(cE,cG) || different(cF,cI) || different(cB,cA)))) ? cF : cE);
				oC = ((similar(cD,cH) && ((different(cE,cG) || different(cD,bakcol)) && (different(cE,cG) || different(cE,cC) || different(cD,cA) || different(cH,cI)))) ? cD : cE);
				oD = ((similar(cH,cF) && ((different(cE,cI) || different(cH,bakcol)) && (different(cE,cI) || different(cE,cA) || different(cH,cG) || different(cF,cC)))) ? cH : cE);
			}
			else
			{
				oA = cE;
				oB = cE;
				oC = cE;
				oD = cE;
			}       
			
			setPixel2x(dest, x * 2, y * 2, oA);
			setPixel2x(dest, x * 2 + 1, y * 2, oB);
			setPixel2x(dest, x * 2, y * 2 + 1, oC);
			setPixel2x(dest, x * 2 + 1, y * 2 + 1, oD);
		}
	}
}

function getPixel2x(bron, x, y) {
  index = (x + y * bron.width) * 4;
  if (index >= 0 && index < (bron.height * bron.width * 4)) {
	  r = bron.data[index + 0];
	  g = bron.data[index + 1];
	  b = bron.data[index + 2];
	  a = bron.data[index + 3];
	  return {red:r,green:g,blue:b,alpha:a};
  } else {
	  return 0;
  }
}

function setPixel2x(bron2, x, y, color) {
  index = (x + y * bron2.width) * 4;
  if (index >= 0 && index < (bron2.height * bron2.width * 4)) {
	  bron2.data[index + 0] = color.red;
	  bron2.data[index + 1] = color.green;
	  bron2.data[index + 2] = color.blue;
	  bron2.data[index + 3] = color.alpha;
  }
}

function getNeighbors(x,y,imgData){
	var color = new Array(9);
	var w = imgData.width;
	
	var o = 1;
	
	if(x-o>0 && y-o>0){
		color[0]={r:imgData.data[((((y-o)*w)+x-o)*4)],g:imgData.data[((((y-o)*w)+x-o)*4)+1],b:imgData.data[((((y-o)*w)+x-o)*4)+2],a:imgData.data[((((y-o)*w)+x-o)*4)+3]};
	}else
		color[0]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
		
	if(y-o>0){
		color[1]={r:imgData.data[((((y-o)*w)+x)*4)],g:imgData.data[((((y-o)*w)+x)*4)+1],b:imgData.data[((((y-o)*w)+x)*4)+2],a:imgData.data[((((y-o)*w)+x)*4)+3]};
	}else
		color[1]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	if(x+o<w && y-o>0){
		color[2]={r:imgData.data[((((y-o)*w)+x+o)*4)],g:imgData.data[((((y-o)*w)+x+o)*4)+1],b:imgData.data[((((y-o)*w)+x+o)*4)+2],a:imgData.data[((((y-o)*w)+x+o)*4)+3]};
	}else
		color[2]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	if(x-o>0){
		color[3]={r:imgData.data[(((y*w)+x-o)*4)],g:imgData.data[(((y*w)+x-o)*4)+1],b:imgData.data[(((y*w)+x-o)*4)+2],a:imgData.data[(((y*w)+x-o)*4)+3]};
	}else
		color[3]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	color[4]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	if(x+o<w){
		color[5]={r:imgData.data[(((y*w)+x+o)*4)],g:imgData.data[(((y*w)+x+o)*4)+1],b:imgData.data[(((y*w)+x+o)*4)+2],a:imgData.data[(((y*w)+x+o)*4)+3]};
	}else
		color[5]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	if(x-o>0 && y+o<imgData.height){
		color[6]={r:imgData.data[((((y+o)*w)+x-o)*4)],g:imgData.data[((((y+o)*w)+x-o)*4)+1],b:imgData.data[((((y+o)*w)+x-o)*4)+2],a:imgData.data[((((y+o)*w)+x-o)*4)+3]};
	}else
		color[6]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	if(y+o<imgData.height){
		color[7]={r:imgData.data[((((y+o)*w)+x)*4)],g:imgData.data[((((y+o)*w)+x)*4)+1],b:imgData.data[((((y+o)*w)+x)*4)+2],a:imgData.data[((((y+o)*w)+x)*4)+3]};
	}else
		color[7]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	if(x+o<w && y+o<imgData.height){
		color[8]={r:imgData.data[((((y+o)*w)+x+o)*4)],g:imgData.data[((((y+o)*w)+x+o)*4)+1],b:imgData.data[((((y+o)*w)+x+o)*4)+2],a:imgData.data[((((y+o)*w)+x+o)*4)+3]};
	}else
		color[8]={r:imgData.data[(((y*w)+x)*4)],g:imgData.data[(((y*w)+x)*4)+1],b:imgData.data[(((y*w)+x)*4)+2],a:imgData.data[(((y*w)+x)*4)+3]};
	
	return color;
}

function fixPixel(neighbors){

	if(	neighbors[1].r == neighbors[3].r && neighbors[1].r == neighbors[7].r &&
		neighbors[1].g == neighbors[3].g && neighbors[1].g == neighbors[7].g &&
		neighbors[1].b == neighbors[3].b && neighbors[1].b == neighbors[7].b &&
		( 
		(neighbors[1].r != neighbors[4].r || neighbors[1].g != neighbors[4].g || neighbors[1].b != neighbors[4].b ) &&
		(neighbors[1].r != neighbors[0].r || neighbors[1].g != neighbors[0].g || neighbors[1].b != neighbors[0].b ) &&
		(neighbors[1].r != neighbors[6].r || neighbors[1].g != neighbors[6].g || neighbors[1].b != neighbors[6].b ) 
		)
		){
		
		return neighbors[3];
	}
	
	if(	neighbors[1].r == neighbors[5].r && neighbors[1].r == neighbors[7].r &&
		neighbors[1].g == neighbors[5].g && neighbors[1].g == neighbors[7].g &&
		neighbors[1].b == neighbors[5].b && neighbors[1].b == neighbors[7].b &&
		( 
		(neighbors[1].r != neighbors[4].r || neighbors[1].g != neighbors[4].g || neighbors[1].b != neighbors[4].b ) &&
		(neighbors[1].r != neighbors[2].r || neighbors[1].g != neighbors[2].g || neighbors[1].b != neighbors[2].b ) &&
		(neighbors[1].r != neighbors[6].r || neighbors[1].g != neighbors[6].g || neighbors[1].b != neighbors[6].b ) 
		)
		){
		
		return neighbors[5];
	}
	
	if(	neighbors[1].r == neighbors[3].r && neighbors[1].r == neighbors[5].r &&
		neighbors[1].g == neighbors[3].g && neighbors[1].g == neighbors[5].g &&
		neighbors[1].b == neighbors[3].b && neighbors[1].b == neighbors[5].b &&
		( 
		(neighbors[1].r != neighbors[4].r || neighbors[1].g != neighbors[4].g || neighbors[1].b != neighbors[4].b ) &&
		(neighbors[1].r != neighbors[0].r || neighbors[1].g != neighbors[0].g || neighbors[1].b != neighbors[0].b ) &&
		(neighbors[1].r != neighbors[2].r || neighbors[1].g != neighbors[2].g || neighbors[1].b != neighbors[2].b ) 
		)
		){
		
		return neighbors[1];
	}
	
	if(	neighbors[5].r == neighbors[3].r && neighbors[5].r == neighbors[7].r &&
		neighbors[5].g == neighbors[3].g && neighbors[5].g == neighbors[7].g &&
		neighbors[5].b == neighbors[3].b && neighbors[5].b == neighbors[7].b &&
		( 
		(neighbors[7].r != neighbors[4].r || neighbors[7].g != neighbors[4].g || neighbors[7].b != neighbors[4].b ) &&
		(neighbors[7].r != neighbors[8].r || neighbors[7].g != neighbors[8].g || neighbors[7].b != neighbors[8].b ) &&
		(neighbors[7].r != neighbors[6].r || neighbors[7].g != neighbors[6].g || neighbors[7].b != neighbors[6].b ) 
		)
		){
		
		return neighbors[7];
	}
	
	return null;
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

}.toString(),

')()' ], { type: 'application/javascript' } ) );
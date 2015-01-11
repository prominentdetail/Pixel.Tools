
function minicanvas_events(){


	minicanvas.onmousedown = function(e){
		var left, right, middle;
		left = 0;
		middle = 1;
		right = 2;
		if(e.button === left){
			mouse.left = true;
			
			if(tool.lockcolordex==false && key.spacebar==false && tool.preventdraw==false && project.lock==false && animation.state==false){
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
				
				if(mouse.tool=='tile'){
					if(key.alt && mouse.canvas==minicanvas){
						tile.set.x = tile.map[tile.layer][tile.x][tile.y].x;
						tile.set.y = tile.map[tile.layer][tile.x][tile.y].y;
					}else{
						tile.map[tile.layer][tile.x][tile.y] = {x:tile.set.x, y:tile.set.y};
					}	
				}else if(mouse.tool=='erasetile'){
					tile.map[tile.layer][tile.x][tile.y] = {x:-1, y:-1};
				}
			}
		}
		else if(e.button === right){
			mouse.right = true;
			
			if(e.ctrlKey){
			}
		}
		else if(e.button === middle){
			mouse.middle = true;
			
		}
		e.preventDefault();
	}
	
	minicanvas.onmouseup = function(e){
		var left, right, middle;
		left = 0;
		middle = 1;
		right = 2;
		
		getMousePos(minicanvas, e);
		mouse.direction=0;
		
		if(e.button === left){
			mouse.left = false;
			
			updatePen();
			
			if(tool.lockcolordex==false && tool.preventdraw==false && project.lock==false && animation.state==false){
			}
			
		}
		else if(e.button === right){
			mouse.right = false;
		}
		else if(e.button === middle){
			mouse.middle = false;
		}
	}

	minicanvas.onmouseover = function (e) {
		mouse.canvas = minicanvas;
		mouse.context = minicontext;
		minicanvas.focus();
	};
	
	minicanvas.onmouseout = function (e) {
	
		resetPen();
		mouse.direction=0;
			
		if(tool.lockcolordex==false && tool.preventdraw==false && project.lock==false && animation.state==false){
			
		}
		
		mouse.left = false;
		mouse.right = false;
		mouse.middle = false;
		if(key.spacebar==false)tool.preventdraw=false;
	};
	
	minicanvas.onmousemove = function (e) {
	   getMousePos(minicanvas, e);
		
		if(mouse.left){
			mouse.dragged = true;
		}
		
		e.preventDefault();
	};

	minicanvas.onclick = function(e){
		getMousePos(minicanvas, e);
		
		if(e.ctrlKey){
		}
	};
	
	//ONCLICK DOESNT DETECT RIGHT CLICKS BECAUSE RIGHTCLICKS CALL THE ONCONTEXTMENU EVENT INSTEAD.. preventdefault stops the menu from showing
	minicanvas.oncontextmenu = function (e) {
		getMousePos(minicanvas, e);
		
		if(e.ctrlKey){
		}
		e.preventDefault();
	};
	
}
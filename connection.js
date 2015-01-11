var peer;

function connectStart(){

	//custom server
    //peer = new Peer( $('#connect_alias').val(), {host: '54.86.240.189', port: 9000, path: '/'});

	// Connect to PeerJS, have server assign an ID instead of providing one
	// Showing off some of the configs available with PeerJS :).
	var room = [
		'3g7ka8oaehc6usor',
		'cvn3rxg5zril766r',
		'apw0myhzf1jrlik9',
		'1ux6dekehc0g4x6r',
		'4x2qvz5rolz69a4i',
		'un1ppdh65l6av2t9',
		'1bxz53638roa8aor',
		'wau4ouuapr4o0f6r',
		'tnzs3a867rnvzpvi',
		'jnhah2gwaccmobt9',
		'qw18awrbpgb9',
		'ntcsd93fzfmq85mi',
		'u5hq75xp8dezsemi',
		'ya0fxycbbyfirudi',
		'pss9zv24dl8r529'
	];
	
	peer = new Peer( $('#connect_alias').val(), {
	  // Set API key for cloud server (you don't need this if you're running your
	  // own.
	  key: room[$('#connect_room').val()],
		
	  // Set highest debug level (log everything!).
	  debug: 3,

	  config: {'iceServers': [
		{ url: 'stun:stun.l.google.com:19302' },
		{url:'stun:stun1.l.google.com:19302'},
		{url:'stun:stun2.l.google.com:19302'},
		{url:'stun:stun3.l.google.com:19302'},
		{url:'stun:stun4.l.google.com:19302'}
	  ]}, // Sample servers, please use appropriate ones 
	  
	  // Set a logging function:
	  logFunction: function() {
		var copy = Array.prototype.slice.call(arguments).join(' ');
		$('#msgbox').append('<div style="direction:ltr;">'+copy + '</div>');
	  }
	});

	// Show this peer's ID.
	peer.on('open', function(id){
	  $('#pid').text(id);
	  $('#proom').text(' : '+$('#connect_room option:selected').text()+' studio');
	  $('#connect_box').hide();
	  $('#wacom_detect').hide();
	});

	// Await connections from others
	peer.on('connection', connect);

}

var connectedPeers = {};

var peerlist = new Array();
var connlist = new Array();
var invitionlist = new Array();
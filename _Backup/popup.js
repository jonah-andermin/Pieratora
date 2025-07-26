var user = undefined;
var pass = undefined;
var debug = true;

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(debug){console.log("requestMessage:"); console.log(request);}
		if (!request || !request.message) {
			return;
		}
		else if(request.message == "_VOLUME") {
			document.getElementById("volume_slider").value = 100 * request.volume;
		}
		else if(request.message == "MUTE_") {
			remote_sound_button();
		}
		else if (request.message == "_INFO") {
			if(request.song.songTitle && request.song.artistName) {
				if(request.song.songTitle.length > 30) {
					document.getElementById('song_info').innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+ request.song.songTitle + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + request.song.songTitle + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + request.song.songTitle + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"; 
					document.getElementById('song_info').classList.remove("standard");
					document.getElementById('songWrapper').classList.remove("loaded");
					setSongMarquee();
				}
				else {
					document.getElementById('song_info').innerHTML = request.song.songTitle;
					document.getElementById('song_info').classList.add("standard");
					document.getElementById('songWrapper').classList.add("loaded");
				}
				if(request.song.artistName.length > 30) {
					document.getElementById('album_info').innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + request.song.artistName + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + request.song.artistName + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + request.song.artistName + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
					document.getElementById('album_info').classList.remove("standard");
					document.getElementById('albumWrapper').classList.add("loaded");
					setAlbumMarquee();
				}
				else {
					document.getElementById('album_info').innerHTML = request.song.artistName;
					document.getElementById('album_info').classList.add("standard");
					document.getElementById('albumWrapper').classList.add("loaded");
				}
			}
			if(request.station.name) {
				document.getElementById('station_info').innerHTML = request.station.name;
				document.getElementById("stationSelector").classList.remove("blink");
				document.getElementById("stationSelector").textContent = "Change Station";
			}
			var album = request.song.albumArt;
			if (album === undefined){ if(debug){console.log("ALBUMUNDEFINEDERROR");}return;}
			if (album.length < 1 || album === undefined) {
				document.body.style.backgroundImage = "url(img/defaultAlbum500.png)";
				var s= ""+Math.floor(Math.random() * 101)+"% "+Math.floor(Math.random() * 101)+"%";
				document.body.style.backgroundPosition = s;
				return;
			}
			var album500 = album.find(obj => {
				return obj.size === 500
			});
			if (album500 === undefined) {
				album500 = album[album.length - 1];
			}
			if(debug){console.log("album500"); console.log(album500);}
			document.body.style.backgroundImage = "url('"+album500.url+"')";
			var s= ""+Math.floor(Math.random() * 101)+"% "+Math.floor(Math.random() * 101)+"%";
			document.body.style.backgroundPosition = s;
			if(document.getElementById("volume_slider")) {
				document.getElementById("volume_slider").value = 100 * request.status.VOLUME_;
			}
			var btn = document.getElementById("sound_button");
			if(btn) {
				if (request.status.MUTED_) {
					btn.setAttribute('src', "img/soundOff32.png");
				}
				else {
					btn.setAttribute('src', "img/soundOn32.png");
				}
			}
		}
	}
);
function getStatus() {
	chrome.runtime.sendMessage({ request: "_STATUS" }, async function(response) {
		//alert(response);
		if (response == null) {
			return;
		}
		document.getElementById("volume_slider").value = 100 * response.VOLUME_;
		if(debug){
			console.log("______________________________________________________________");
			console.log(response);
			console.log("______________________________________________________________");
		}
		if (response.OPEN_ == null) {
			alert("IF THIS ALERT IS\nOFFSCREEN DRAG IT\nTO CENTER OR PRESS\nEsc, Enter, OR Space\nTO DISMISS\n\n\nBackground page unloaded. This is a serious internal error for Pieratora.\n\nThe Pieratora extension has partially crashed, however the rest of your browsing session is fine.\nIf you would like to continue using the extension you'll probably need to restart the extension.\nIf you aren't sure how to do this you can try closing and re-opening chrome.\n\nYou can continue to use chrome as normal but Piertora probably won't recover until being restarted.");
		}
		if (response.OPEN_) {
			send_info();
			return;
		}
		if (!response.OPEN_) {
			login();
			send_info();
		}
	});
}
getStatus();//////////////////////////////////////////////execute

function send_info() {
	chrome.runtime.sendMessage({ request: "_INFO" });
}

function sound_button() {
	var btn = document.getElementById("sound_button");
	var power = btn.src.includes("img/soundOn32.png");
	chrome.runtime.sendMessage({ request: "_SOUND", power: power });
	if(debug){
		console.log("mutebutton");console.log(btn);
		console.log(power);
	}
	if (!power) {
		btn.setAttribute('src', "img/soundOn32.png");
	}
	else {
		btn.setAttribute('src', "img/soundOff32.png");
	}
}

function remote_sound_button() {
	var btn = document.getElementById("sound_button");
	var power = btn.src.includes("img/soundOn32.png");
	if(debug){console.log("remote_mutebutton");console.log(btn);}
	if (!power) {
		btn.setAttribute('src', "img/soundOn32.png");
	}
	else {
		btn.setAttribute('src', "img/soundOff32.png");
	}
}

function replay_button() {
	chrome.runtime.sendMessage({ request: "_REPLAY" });
}

function play_button() {
	chrome.runtime.sendMessage({ request: "_PLAY" });
}

function pause_button() {
	chrome.runtime.sendMessage({ request: "_PAUSE" });
}

function skip_button() {
	chrome.runtime.sendMessage({ request: "_SKIP" });
}

function next_song() {
	chrome.runtime.sendMessage({ request: "_NEXT" });
}

function prev_song() {
	chrome.runtime.sendMessage({ request: "_PREV" });
}


function volume_slider() {
	chrome.runtime.sendMessage({ request: "_VOLUME", volume: document.getElementById("volume_slider").value });
}

function station_selector() {
	chrome.runtime.sendMessage({ request: "_GET_STATIONS"}, function(response) {
		document.getElementById("StationDropped").style.display = document.getElementById("StationDropped").style.display==='none'?'block':'none';
		if(document.getElementById("StationDropped").style.display==='none'){return;}
		if(!response.stations){ return; }
		var innerH = ""
		var station = NaN;
		for (let i=0; i<response.stations.length; i++) {  
			station = response.stations[i];
  			innerH+="<a href='#' class='shadowedObj noSelect' style='display:block' bgcolor='transparent' index='"+i+"'>"+station.name+"</a>";
		}
		document.getElementById("StationDropped").innerHTML = innerH;
		var children = document.getElementById("StationDropped").children
		for (let i=0; i<children.length; i++) {  
			children[i].onclick = function(){stationSelected(response.stations[i]);};
		}
	});
}

function stationSelected(newStation) {
	chrome.runtime.sendMessage({ request: "_STATION_CHANGE", station: newStation});
}

function login() {
	if ((typeof user !== 'undefined') || (typeof pass !== 'undefined')) {
		if (!user) { user = undefined; }
		if (!pass) { pass = undefined; }
	}
	chrome.runtime.sendMessage({ request: "_LOGIN", userName: user, password: pass });
}

function loadHtml(file) {//unused?
	$("body").load(file + ".html");
}

function loginFailed() {//unused?
	document.body = document.createElement("body");
	var msg = document.createElement("P");
	msg.textContent = "Login Failed!\nPlease click retry.";
	msg.id = "rmsg";
	document.body.className = "css3gradient";
	document.body.appendChild(msg);
	var retryButton = document.createElement("BUTTON");
	retryButton.innerHTML = "Retry";
	retryButton.loginSuccess = false;
	retryButton.onclick = retryButton.loadPopup;
	var div = document.createElement("DIV");
	div.appendChild(retryButton);
	document.body.appendChild(div);
	var flashTimer = 0;
	var interval = setInterval(function () {
		++flashTimer;
		msg.style.visibility = "hidden";
		setTimeout(function () {
			msg.style.visibility = "visible";
		}, 50);
		if (flashTimer > 10) {
			clearInterval(interval);
		}
	}, 500);

}

function loadPopup() {//unused?
	//inject css
	chrome.tabs.executeScript(null, { code: "$('head').append($('<style type=\"text/css\" id=\"pieratoraCss\"></style>')); $('#pieratoraCss').html(\"" + optionsCSS + "\");" });
	//inject html
	chrome.tabs.executeScript(null, { code: "$('body').append($('<div style=\"z-index: 99\" class=\".pieratora .pieratora-block pieratora-transparent pieratora-panel pieratora-dragPanel pieratora-overflowing pieratora-topLeft\" id=\"dragDiv\"></div>').load('" + chrome.runtime.getURL('optionsInjection.html') + "'));" });
	//inject js
	chrome.tabs.executeScript(null, { code: optionsJS });
}

window.onload = function() {
	document.getElementById("play_button").onclick = play_button;
	document.getElementById("pause_button").onclick = pause_button;
	document.getElementById("replay_button").onclick = replay_button;
	document.getElementById("skip_button").onclick = skip_button;
	document.getElementById("volume_slider").oninput = volume_slider;
	document.getElementById("sound_button").onclick = sound_button;
	document.getElementById("stationSelector").onclick = station_selector;
	document.getElementById("nextS").onclick = next_song;
	document.getElementById("prevS").onclick = prev_song;
	document.getElementById("rightClickDownload").onclick = downloadSong;
	document.getElementById("rightClickBGAudio").onclick = disableBackgroundAudio;
	setSongMarquee();
	setAlbumMarquee();
	document.addEventListener("contextmenu", function(e){
		chrome.storage.sync.get( {rightClickDownload: false, continuePlaying: false}, rightClickCallback(e) );
    		e.preventDefault();
	}, false);
	if(debug){console.log("onload completed");}
}

function downloadSong() {
	chrome.runtime.sendMessage({ request: "_DOWNLOAD" });
}

function disableBackgroundAudio() {
	chrome.storage.sync.set( {continuePlaying: false} );
}

function setSongMarquee() {
	let root = document.documentElement;
	var temp = ((document.getElementById("song_info").offsetWidth)/-3);
	root.style.setProperty('--sCalc', temp + "px");
}

function setAlbumMarquee() {
	let root = document.documentElement;
	var temp = (document.getElementById("album_info").offsetWidth)/-3;
	root.style.setProperty('--aCalc', temp + "px");
}

function rightClickCallback(e) {
	return function(items){
		if(!items.rightClickDownload) {
			document.getElementById("rightClickDownload").classList.add("disabledMenuItem");
		}
		else {
			document.getElementById("rightClickDownload").classList.remove("disabledMenuItem");
		}
		if(!items.continuePlaying) {
			document.getElementById("rightClickBGAudio").classList.add("disabledMenuItem");
		}
		else {
			document.getElementById("rightClickBGAudio").classList.remove("disabledMenuItem");
		}
		console.log(e);
		var menu = document.getElementById("rightClickMenu");
		menu.style.display = menu.style.display==='none'?'block':'none';
		menu.style.top = ""+e.y+"px";
		if((menu.clientWidth + e.x) > e.view.innerWidth){
			menu.style.left = ""+(e.view.innerWidth-menu.clientWidth)+"px";
		}
		else {
			menu.style.left = ""+e.x+"px";
		}
		if(menu.clientHeight + e.y > e.view.innerHeight){
			menu.style.top = ""+(e.view.innerHeight-menu.clientHeight)+"px";
		}
		else {
			menu.style.top = ""+e.y+"px";
		}
	}
}

//Close dropdown and context when window clicked
window.onclick = function(event) {
	if (!event.target.matches('#stationSelector')) {
		document.getElementById("StationDropped").style.display = 'none';
  	}
	if (!event.target.matches('#rightClickMenu')) {
		document.getElementById("rightClickMenu").style.display = 'none';
	}
}
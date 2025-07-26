var optionsCSS = '.pieratora{all:initial;}.pieratora-block{display:block;}.pieratora-css3gradient{background-color:#000000;filter:progid:DXImageTransform.Microsoft.gradient(GradientType=1,startColorstr=#000000,endColorstr=#ff7200);background-image:-moz-linear-gradient(left top,#000000 5%,#ff7200 64%,#ffffff 95%);background-image:linear-gradient(left top,#000000 5%,#ff7200 64%,#ffffff 95%);background-image:-webkit-linear-gradient(left top,#000000 5%,#ff7200 64%,#ffffff 95%);background-image:-o-linear-gradient(left top,#000000 5%,#ff7200 64%,#ffffff 95%);background-image:-ms-linear-gradient(left top,#000000 5%,#ff7200 64%,#ffffff 95%);background-image:-webkit-gradient(linear,left top,right bottom,color-stop(5%,#000000),color-stop(64%,#ff7200),color-stop(95%,#ffffff));background-repeat:repeat-x;background:linear-gradient(135deg,#000000 5%,#ff7200 64%,#ffffff 95%);}.pieratora-topLeft{top:0;left:0;}.pieratora-transparent{background-color:rgba(0,0,0,0.5);}.pieratora-panel{display:inline-block;height:230;width:320;padding:0px 35px 35px 35px;margin:10px 10px 10px 10px;}.pieratora-dragPanel{position:absolute;}.pieratora-dragPanelHeader{background-color:rgba(255,117,0,0.62);margin-right:-35px;margin-left:-35px;width:inherit;height:25px;cursor:move;}.pieratora-overflowing{overflow:hidden;white-space:nowrap;}pieratora-html{height:100%}.pieratora-p{text-shadow:-0.6px-0.6px 15px#f3570c,-0.6px 0.4px 15px#f3570c,-0.6px 1.4px 15px#f3570c,0.4px-0.6px 15px#f3570c,0.4px 0.4px 15px#f3570c,0.4px 1.4px 15px#f3570c,1.4px-0.6px 15px#f3570c,1.4px 0.4px 15px#f3570c,1.4px 1.4px 15px#f3570c;font-weight:bold;}.pieratora-title{font-size:xx-large;}.pieratora-label{font-size:large;}'
var optionsJS = 'function save_options(){var e=document.getElementById("user").value,t=document.getElementById("pass").value;chrome.storage.sync.set({userName:e,password:t},function(){var e=document.getElementById("status");e.textContent="Options saved.",setTimeout(function(){e.textContent=""},750)})}function restore_options(){chrome.storage.sync.get({userName:"",password:""},function(e){document.getElementById("user").value=e.userName,document.getElementById("pass").checked=e.password})}function load(){document.getElementById("save").addEventListener("click",save_options),document.getElementById("show").addEventListener("click",showPass),document.getElementById("hide").addEventListener("click",hidePass),restore_options()}function showPass(){document.getElementById("hide").style.display="inline-block",document.getElementById("show").style.display="none",document.getElementById("pass").type="password"}function hidePass(){document.getElementById("hide").style.display="none",document.getElementById("show").style.display="inline-block",document.getElementById("pass").type="text"}function dragElement(e){var t=0,n=0,o=0,s=0,d=0,m=0,u={},c={};function l(o){o=o||window.event,e.style.left=d=e.offsetLeft-parseInt(u.marginLeft.substring(0,u.marginLeft.length-2)),e.style.top=m=e.offsetTop-parseInt(u.marginTop.substring(0,u.marginTop.length-2)),t=o.clientX,n=o.clientY,document.onmouseup=a,document.onmousemove=i,c=document.onmousedown,document.onmousedown=r}function i(u){u=u||window.event,o=t-u.clientX,s=n-u.clientY,e.style.left=d-o+"px",e.style.top=m-s+"px"}function a(){document.onmouseup=null,document.onmousemove=null,document.onmousedown=c}function r(e){return!1}u=e.currentStyle||window.getComputedStyle(e),console.log(u.marginLeft),document.getElementById(e.id+"_Header")?document.getElementById(e.id+"_Header").onmousedown=l:e.onmousedown=l}document.addEventListener("DOMContentLoaded",function(){dragElement(document.getElementById("dragDiv"))});dragElement(document.getElementById("dragDiv"));';

var user = undefined;
var pass = undefined;

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.log("requestMessage:"); console.log(request);
		if (!request || !request.message) {
			return;
		}
		else if (request.message == "_INFO") {
			if(request.song.songTitle && request.song.artistName) {
				document.getElementById('song_info').innerHTML = request.song.songTitle + "<br>" + request.song.artistName;
			}
			if(request.station.name) {
				document.getElementById('station_info').innerHTML = request.station.name;
			}
			var album = request.song.albumArt;
			if (album === undefined){ console.log("ALBUMUNDEFINEDERROR");return;}
			if (album.length < 1 || album === undefined) {
				document.body.style.backgroundImage = "url(img/defaultAlbum500.png)"
				return;
			}
			var album500 = album.find(obj => {
				return obj.size === 500
			});
			if (album500 === undefined) {
				album500 = album[album.length - 1];
			}
			console.log("album500"); console.log(album500);
			document.body.style.backgroundImage = "url('"+album500.url+"')";
			document.getElementById("volume_slider").value = 100 * request.status.VOLUME_;
		}
	}
);

chrome.runtime.sendMessage({ request: "_STATUS" }, async function(response) {
	//alert(response);
	if (response == null) {
		return;
	}
	document.getElementById("volume_slider").value = 100 * response.VOLUME_;
	if (response.OPEN_ == null) {
		alert("IF THIS ALERT IS\nOFFSCREEN DRAG IT\nTO CENTER OR PRESS\nEsc, Enter, OR Space\nTO DISMISS\n\n\nBackground page unloaded. This is a serious internal error for Pieratora.\n\nThe Pieratora extension has partially crashed, however the rest of your browsing session is fine.\nIf you would like to continue using the extension you'll probably need to restart the extension.\nIf you aren't sure how to do this you can try closing and re-opening chrome.\n\nYou can continue to use chrome as normal but Piertora probably won't recover until being restarted.");
	}
	if (response.OPEN_) {
		run_Pieratora();
		return;
	}
	if (!response.OPEN_) {
		var loginSuccess = await login(run_Pieratora, loginFailed);
	}
});

function run_Pieratora() {
	chrome.runtime.sendMessage({ request: "_INFO" }), (function (popupDoc) {
		return function (response) {
			console.log("run_response"); console.log(response);
			if(request.song.songTitle && request.song.artistName) {
				document.getElementById('song_info').innerHTML = request.song.songTitle + "<br>" + request.song.artistName;
			}
			if(request.station.name) {
				document.getElementById('station_info').innerHTML = request.station.name;
			}
			var album = response.albumArt;
			if (album.length < 1) {
				popupDoc.body.style.backgroundImage = "url(img/defaultAlbum500.png)"
				return;
			}
			var album500 = album.find(obj => {
				return obj.size === 500
			});
			if (album500 === undefined) {
				album500 = album[album.length - 1];
			}
			popupDoc.body.style.backgroundImage = album500.url;
		}
	}(document));
}

function pan() {
	var tabs = chrome.tabs.query({ url: "https://www.pandora.com/*" }, function (tabs) {
		if (tabs.length < 1) {
			chrome.tabs.create({ url: "https://www.pandora.com", index: 0, pinned: true });
		}
		else {
			chrome.tabs.update(tabs[0].id, { active: true });
		}
	});
}

function close_button() {
	var btn = document.getElementById("close_button");
	var power = btn.src.includes("img/on64.png");
	chrome.runtime.sendMessage({ request: "_CLOSE", power: power});
	if (!power) {
		btn.setAttribute('src', "img/on64.png");
	}
	else {
		btn.setAttribute('src', "img/off64.png");
	}
}

function sound_button() {
	var btn = document.getElementById("sound_button");
	var power = btn.src.includes("img/soundOn32.png");
	chrome.runtime.sendMessage({ request: "_SOUND", power: power });
	console.log("mutebutton");console.log(btn);
	console.log(power);
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

function volume_slider() {
	chrome.runtime.sendMessage({ request: "_VOLUME", volume: document.getElementById("volume_slider").value });
}

function station_selector() {
	chrome.runtime.sendMessage({ request: "_GET_STATIONS"}, function(response) {
		document.getElementById("StationDropped").style.display = document.getElementById("StationDropped").style.display==='none'?'block':'none';
		if(document.getElementById("StationDropped").style.display==='none'){return;}
		var innerH = ""
		var station = NaN;
		for (let i=0; i<response.stations.length; i++) {  
			station = response.stations[i];
  			innerH+="<a href='#' class='shadowedObj' style='display:block' bgcolor='transparent' index='"+i+"'>"+station.name+"</a>";
		}
		document.getElementById("StationDropped").innerHTML = innerH;
		var children = document.getElementById("StationDropped").children
		for (let i=0; i<children.length; i++) {  
			children[i].onclick = function(){stationSelected(response.stations[i]);};
		}
	});
}

function stationSelected(newStation) {
	chrome.runtime.sendMessage({ request: "_STATION_CHANGE", station: newStation}, function(){});
}

function login(yes, no) {
	if ((typeof user !== 'undefined') || (typeof pass !== 'undefined')) {
		if (!user) { user = undefined; }
		if (!pass) { pass = undefined; }
	}
	var prom = new Promise(resolve => {
		chrome.runtime.sendMessage({ request: "_LOGIN", userName: user, password: pass }, (function (r) {
			return function (response) {
				console.log("RESPONSE IS OBJECT");
				console.log(response);
				if (response == null) {
					console.log("login1");
					r(false);
				}
				else if (response.LOGGED_ == null) {
					alert("IF THIS ALERT IS\nOFFSCREEN DRAG IT\nTO CENTER OR PRESS\nEsc, Enter, OR Space\nTO DISMISS\n\n\nBackground page unloaded. This is a serious internal error for Pieratora.\n\nThe Pieratora extension has partially crashed, however the rest of your browsing session is fine.\nIf you would like to continue using the extension you'll probably need to restart the extension.\nIf you aren't sure how to do this you can try closing and re-opening chrome.\n\nYou can continue to use chrome as normal but Piertora probably won't recover until being restarted.");
					r(false);
				}
				else if (response.LOGGED_) {
					console.log("login2");
					r(true);
				}
				else if (!response.LOGGED_) {
					console.log("login3");
					r(false);
				}
			}
		})(resolve));
	});
	prom.then(yes, no);
	return prom;
}

function loadHtml(file) {
	$("body").load(file + ".html");
}

function loginFailed() {
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

function loadPopup() {
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
	console.log("onload completed");
}

//Close dropdown when window clicked
window.onclick = function(event) {
	if (!event.target.matches('#stationSelector')) {
		document.getElementById("StationDropped").style.display = 'none';
  	}
}
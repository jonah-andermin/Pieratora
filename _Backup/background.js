function suppress_dev_warning(info) {
	if(!_SUPPRESSED_){return;}
	if(info.installType == "development"){
		if(_DEBUG_){console.log("Development mode is active! Supressing warning!");}
		chrome.windows.create({type: 'normal',focused: true, state: 'maximized'}, function(window) {
			chrome.windows.getAll( function(windows) {
				for(var i=0;i<windows.length;i++) {
					if(windows[i].id!=window.id) {
						chrome.windows.remove(windows[i].id);
					}
				}
			});
		});
	}
}
chrome.management.getSelf(suppress_dev_warning);

var _DEBUG_ = true;
var _SUPPRESSED_ = true;

var STATUS_ = { TYPE_: "STATUS", OPEN_: false, LOGGED_: false, ERROR_: NaN, VOLUME_: 1, MUTED_: false};
var user = NaN;
var pass = NaN;
var _loginData = {};
var _stations = [];
var _songLists = {};
var _pastSongs = {};
var _currentSong = {};
var _currentStation = {};
var _stationId = "NaN";
var _audio = document.createElement("audio"); _audio.onended = function() { nextSong(_stationId); sendData()};
var _username = false;
var _password = false;
var _csrf = null;
var _cookie = null;

chrome.commands.onCommand.addListener(function(command) {
	var volume = 0.00;
	switch(command) {
		case "play-song":
			if(!STATUS_.OPEN_ || !STATUS_.LOGGED_){
				login(function(status){if(STATUS_.OPEN_ && STATUS_.LOGGED_){playSong();}});
			}
			else {
				playSong();
			}
			break;
		case "pause-song":
			if(!STATUS_.OPEN_ || !STATUS_.LOGGED_){
				login(function(status){if(STATUS_.OPEN_ && STATUS_.LOGGED_){pauseSong();}});
			}
			else {
				pauseSong();
			}
			break;
		case "next-song":
			if(!STATUS_.OPEN_ || !STATUS_.LOGGED_){
				login(function(status){if(STATUS_.OPEN_ && STATUS_.LOGGED_){nextSong(_stationId);sendData();}});
			}
			else {
				nextSong(_stationId);
				sendData();
			}
			break;
		case "previous-song":
			if(!STATUS_.OPEN_ || !STATUS_.LOGGED_){
				login(function(status){if(STATUS_.OPEN_ && STATUS_.LOGGED_){prevSong(_stationId);sendData();}});
			}
			else {
				prevSong(_stationId);
				sendData();
			}
			break;
		case "volume-down":
			volDown();
			break;
		case "volume-up":
			volUp();
			break;
		case "toggle-muted-audio":
			remoteMute();
			break;
		default:
			if(_DEBUG_){console.log('Command[unsupported]:', command);}
}
      });

chrome.storage.sync.get({
	userName: '',
	password: ''
}, function (items) {
	_username = items.userName;
	_password = items.password;
});

function sendData(){
	chrome.runtime.sendMessage({ message: "_INFO", song: _currentSong, station: _currentStation, status: STATUS_ });
}

function startBackend(callback) {
	if(!callback){callback = function(){};}
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
        	if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			chrome.cookies.get({ url: 'https://pandora.com', name: 'csrftoken' }, function (cookie) {
				if(_DEBUG_){console.log("callbackCookie");console.log(cookie);}
				_csrf = cookie.value;
				_cookie = cookie;
			});
			callback();
        	}
    	}; 
	xmlHttp.open( "GET", "https://www.pandora.com", true ); // false for synchronous request
	xmlHttp.send( null );
}

function getCookie(){
	if(_DEBUG_){console.log("csrfGETCOOKIE:");console.log(_csrf);}
	return (_csrf)? _csrf : ((cookie && cookie.value)? cookie.value : document.cookie.substring(document.cookie.indexOf("csrftoken=")).substring(10,document.cookie.substring(document.cookie.indexOf("csrftoken=")).indexOf(";")));
}
///////////////////////////////////////START STUFF!!!
startBackend();
///////////////////////////////////////

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(_DEBUG_){console.log("request:"); console.log(request);}
		if (!request || !request.request) {
			STATUS_.ERROR_ = "MALFORMED_REQUEST";
		}
		else if (request.request == "_LOGIN") {
			if(_DEBUG_){console.log("_LOGIN RECIEVED");}
			STATUS_.ERROR_ = false;
			if(request.options){
				STATUS_.LOGGED_ = false;
			}
			if (!STATUS_.LOGGED_) {
				try {
					if(request.userName && request.password) {
						_username = request.userName
						_password = request.password
					}
					if(_DEBUG_){console.log("Try:"); console.log(sendResponse);}
					//request.userName, request.password, 
					login(sendResponse);
					return true;
				}
				catch (e) {
					if(_DEBUG_){console.log("_LOGIN_ERROR:"), console.log(e);}
					STATUS_.ERROR_ = "-10";
				}
			}
			else {
				STATUS_.ERROR_ = "-11";
			}
		}
		else if (request.request == "_GET_STATIONS") {
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				sendResponse({ TYPE: "STATIONS", stations: _stations });
				return;
			}
			else {
				STATUS_.ERROR_ = "-20";
			}
		}
		else if (request.request == "_GET_CURRENT_STATION") {
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				sendResponse({ TYPE: "CURRENT_STATION", _currentStation });
				return;
			}
			else {
				STATUS_.ERROR_ = "-21";
			}
		}
		else if (request.request == "_NEXT" || request.request == "_SKIP") {
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				nextSong(_stationId);
				sendResponse({ TYPE: "SONG", SONG_: _currentSong, ERROR_: !_currentSong });
				sendData();
				return;
			}
			else {
				STATUS_.ERROR_ = "-30";
			}
		}
		else if (request.request == "_PREV") {
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				prevSong(_stationId);
				sendResponse({ TYPE: "SONG", SONG_: _currentSong, ERROR_: !_currentSong });
				sendData();
				return;
			}
			else {
				STATUS_.ERROR_ = "-31";
			}
		}
		else if (request.request == "_STATION_CHANGE") {
			STATUS_.ERROR_ = false;
			_currentStation = request.station
			var oldID = _stationId;
			_stationId = request.station.stationId;
			STATUS_.ERROR_ = !_stationId;
			nextSong(_stationId, oldID, true);
			sendData();
		}
		else if (request.request == "_CLOSE") {
			closePieratora(request.power);
		}
		else if (request.request == "_SOUND") {
			mutePieratora(request.power);
		}
		else if (request.request == "_REPLAY") {
			replaySong();
		}
		else if (request.request == "_PLAY") {
			playSong();
		}
		else if (request.request == "_PAUSE") {
			pauseSong();
		}
		else if (request.request == "_INFO") {
			if(_DEBUG_){console.log("INFO RESPONSE:");console.log(_currentSong);}
			//sendResponse(_currentSong);
		}
		else if (request.request == "_VOLUME") {
			STATUS_.VOLUME_ = request.volume / 100;
			_audio.volume = STATUS_.VOLUME_;
		}
		else if (request.request == "_DOWNLOAD") {
			download(_currentSong);
		}
		else if (request.request == "_STATUS") {
			sendData();
		}
		sendResponse(STATUS_);
	}
);

//=================================================================================================================================================================================abstract_httprequest

function httpPostAsync(url, body, requestHeaderAttributes, callback, fail, retry) {//error 0x
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			callback(xmlHttp.responseText);
		}
		else if (xmlHttp.readyState == 4){
			if(_DEBUG_){console.log("{Status != 200} RESPONSE:"), console.log(xmlHttp.responseText), (fail || function(){})();}
			STATUS_.LOGGED_ = false;
			STATUS_.OPEN_ = false;
			if(!retry){
				startBackend(function(){
					login(function(){
						if(_DEBUG_){console.log("retry post!!!");}
						if(requestHeaderAttributes.filter(obj => {return obj.type === "X-CsrfToken"}).length){requestHeaderAttributes.filter(obj => {return obj.type === "X-CsrfToken"})[0].value = getCookie();}
						if(requestHeaderAttributes.filter(obj => {return obj.type === "X-AuthToken"}).length){requestHeaderAttributes.filter(obj => {return obj.type === "X-AuthToken"})[0].value = _loginData.authToken;}
						httpPostAsync(url, body, requestHeaderAttributes, callback, fail, true);/////does this work even?
					});/////////////////////////////////////try correct?
				});
			}
		}
	}
	xmlHttp.open("POST", url, true); //true == async
	if(_DEBUG_){console.log("requestHeaderAttributes:", requestHeaderAttributes);}
	for (req in requestHeaderAttributes) {
		if(_DEBUG_){console.log("request header [t,v]"); console.log(requestHeaderAttributes[req].type); console.log(requestHeaderAttributes[req].value);}
		xmlHttp.setRequestHeader(requestHeaderAttributes[req].type, requestHeaderAttributes[req].value);
	}
	if(_DEBUG_){console.log("sendBody:"); console.log(body);}
	if(_DEBUG_){console.log("sendWhole"); console.log(xmlHttp);}
	xmlHttp.send(JSON.stringify(body));
}

//=================================================================================================================================================================================login

function login(sendResponse) {//sendResponse is a function passed along to inner callbacks, called when they finish. ussually native "chrome messaging sendresponse" function
	if(!sendResponse){sendResponse = function(){};}
	if(_DEBUG_){console.log("sendResponse:"); console.log(sendResponse);}
	(function (sr1) {
		if(_DEBUG_){console.log("SR1:"); console.log(sr1);}
		chrome.cookies.get({ url: 'https://pandora.com', name: 'csrftoken' }, (function (sr2) {
			if(_DEBUG_){console.log("SR2:"); console.log(sr2);}
			return function (cookie) {
				if(_DEBUG_){console.log("COOOOOOOOOKEI!"); console.log(cookie);}
				var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
				{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
				{ 'type': 'X-CsrfToken', 'value': getCookie()}
				];
				httpPostAsync("https://www.pandora.com/api/v1/auth/login", { "existingAuthToken": null, "username": _username, "password": _password, "keepLoggedIn": true }, requestHeaderAttributes,
					(function (sr) {
						if(_DEBUG_){console.log("sr001:"); console.log(sr);}
						return function (response) {
							_loginData = JSON.parse(response);
							STATUS_.LOGGED_ = true;
							getStations(sr);
						};
					})(sr2),
					(function (sr) {
						if(_DEBUG_){console.log("sr002:"); console.log(sendResponse);}
						return function () {
							STATUS_.LOGGED_ = false;
							STATUS_.ERROR_ = "10";
							sr(STATUS_);
						};
					})(sr2),
					true
				);
			}
		})(sr1));
	})(sendResponse);
}

//=================================================================================================================================================================================request_data

function getStations(sendResponse) {//sendResponse is a native function which sends chrome message response to origional sender (such as popup.html)
	if(!sendResponse){sendResponse = function(){};}
	if(_DEBUG_){console.log("GSsendResponse:"); console.log(sendResponse);}
	(function (sr1) {
		if(_DEBUG_){console.log("GSsr1:"); console.log(sr1);}
		chrome.cookies.get({ url: 'https://pandora.com', name: 'csrftoken' }, (function (sr2) {
			if(_DEBUG_){console.log("GSsr2:"); console.log(sr2);}
			return function (cookie) {
				if (_stations == null) {
					_stations = [];
				}
				var body = { 'pageSize': 250 };
				var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
				{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
				{ 'type': 'X-CsrfToken', 'value': getCookie()},
				{ 'type': 'X-AuthToken', 'value': _loginData.authToken }
				];
				httpPostAsync("https://www.pandora.com/api/v1/station/getStations", body, requestHeaderAttributes,
					(function (sr) {
						if(_DEBUG_){console.log("GSsrInner1:"); console.log(sr);}
						return function (response) {
							if(_DEBUG_){console.log("_stations :"); console.log(_stations );}
							_stations = JSON.parse(response).stations;
							STATUS_.OPEN_ = true;
							if(_DEBUG_){console.log("SendResponseNow1!",sr);}
							sr(STATUS_);
						}
					})(sr2),
					(function (sr) {
						if(_DEBUG_){console.log("GSsrInner2:"); console.log(sr);}
						return function () {
							STATUS_.OPEN_ = false;
							STATUS_.ERROR_ = "20";
							if(_DEBUG_){console.log("SendResponseNow2!",sr);}
							sr(STATUS_);
						}
					})(sr2)
				);
			}
		})(sr1));
	})(sendResponse);
}


function addSongs(stationID, func) {//error 3x
	if (!func) {
		func = function () { };
	}
	chrome.cookies.get({ url: 'https://pandora.com', name: 'csrftoken' }, function (cookie) {
		if (_songLists == null) {
			_songLists = {};
		}
		var body = { 'stationId': String(stationID), 'isStationStart': false, 'fragmentRequestReason': 'Normal', 'audioFormat': 'aacplus', 'onDemandArtistMessageArtistUidHex': null, 'startingAtTrackId': null, 'onDemandArtistMessageIdHex': null }
		var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
		{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
		{ 'type': 'X-CsrfToken', 'value': getCookie()},
		{ 'type': 'X-AuthToken', 'value': _loginData.authToken }
		];
		httpPostAsync("https://www.pandora.com/api/v1/playlist/getFragment", body, requestHeaderAttributes,
			function (response) {
				_songLists[stationID] = (_songLists[stationID] || []).concat(JSON.parse(response).tracks);
				func();
			}
		);
	});
}

//=================================================================================================================================================================================internal_data

function nextSong(stationID, oldID, getLast, paused) {//error 4x
	if ((!stationID || isNaN(stationID)) && _stations && _stations.length > 0) {
		stationID = _stations[0].stationId;
		_stationId = stationID
		_currentStation = _stations[0];
	}
	if (!oldID || isNaN(oldID)) {
		oldID = stationID;
	}
	if(_DEBUG_){console.log("station info:"); console.log(stationID); console.log(_stations);}
	if(_DEBUG_){console.log("_currentSong");console.log(_currentSong);}
	if (!jQuery.isEmptyObject(_currentSong)) {
		if(_DEBUG_){console.log("1");}
		if (!_pastSongs[stationID]) {
			_pastSongs[stationID] = [];
		}
		if (!_pastSongs[oldID]) {
			_pastSongs[oldID] = [];
		}
		_currentSong.XXRESUMEXX = _audio.currentTime
		_pastSongs[oldID].push(_currentSong);
		if(_pastSongs[oldID].length > 25) {
			_pastSongs[oldID].shift()
		}
	}
	if(getLast && _pastSongs[stationID] && _pastSongs[stationID].length) {
		_currentSong = _pastSongs[stationID].pop();
		_audio.setAttribute('src', _currentSong.audioURL);
		_audio.volume = STATUS_.VOLUME_;
		if(_currentSong.XXRESUMEXX) {
			_audio.currentTime = _currentSong.XXRESUMEXX;
		}
		if(!paused) { _audio.play();}
	}
	else if (!_songLists[stationID] || !_songLists[stationID].length) {
		if(_DEBUG_){console.log("2");}
		chrome.cookies.get({ url: 'https://pandora.com', name: 'csrftoken' }, function (cookie) {
				if(cookie == null){
					chrome.cookies.set(_cookie, (function (sid){return function (cookie) {
						_utility_AddNextSong(sid);
					}
					})(stationID));
				}
				else{
					_utility_AddNextSong(stationID);
				}
				
			});
	}
	else {
		if(_DEBUG_){console.log("3");}
		_currentSong = _songLists[stationID].shift();
		_audio.setAttribute('src', _currentSong.audioURL);
		_audio.volume = STATUS_.VOLUME_;
		_audio.play();
	}
}

//=================================================================================================================================================================================internal_data

function prevSong(stationID) {//error 5x-??????
	if ((!stationID || isNaN(stationID)) && _stations && _stations.length > 0) {
		stationID = _stations[0].stationId;
		_stationId = stationID
		_currentStation = _stations[0];
	}
	if (!_songLists[stationID] || !_songLists[stationID].length) {
		_songLists[stationID] = [];
	}
	if (!_pastSongs[stationID]) {
		return;
	}
	if(_pastSongs[stationID].length == 0) { return; }
	_songLists[stationID].unshift(_currentSong);
	_currentSong = _pastSongs[stationID].pop();
	_audio.setAttribute('src', _currentSong.audioURL);
	_audio.volume = STATUS_.VOLUME_;
	_audio.play();
}

function _utility_AddNextSong(statID){
	addSongs(statID, function () {
		if(_DEBUG_){console.log("5");}
		if(_DEBUG_){console.log("_songLists");console.log(_songLists);}
		if(_DEBUG_){console.log("statID");console.log(statID);}
		_currentSong = _songLists[statID].shift();
		if(_DEBUG_){console.log("_songLists");console.log(_songLists);}
		if(_DEBUG_){console.log("_currentSong");console.log(_currentSong);}
		_audio.setAttribute('src', _currentSong.audioURL);
		_audio.volume = STATUS_.VOLUME_;
		_audio.play();
		sendData();
	});
}

function closePieratora(power) {
	if (STATUS_.OPEN_ = power) {
		tryStartAudio();
	}
	else {
		stopAudio();
	}
}

function tryStartAudio() {
	if(_DEBUG_){console.log("in try start");}
	if(_DEBUG_){console.log("STATUS_.LOGGED_");console.log(STATUS_.LOGGED_);}
	if (STATUS_.LOGGED_) {
		if(_DEBUG_){console.log("_stationId");console.log(_stationId);}
		nextSong(_stationId);
		if(_DEBUG_){console.log("_stationId");console.log(_stationId);}
		if(_DEBUG_){console.log("_trystart _currentSong"); console.log(_currentSong);}
		//return _currentSong;//un-needed?
	}
}

function stopAudio() {
	if (!jQuery.isEmptyObject(_currentSong)) {
		_pastSongs[stationID].push(_currentSong);
	}
	currentSong = {};
	_audio.src = "";
}

function mutePieratora(power) {
	if(_DEBUG_){console.log("mutemode");console.log(power);}
	_audio.muted = power;
	STATUS_.MUTED_ = power;
	if(_DEBUG_){console.log(_audio.muted);}
}

function startSong() {
	if(_DEBUG_){console.log("[startSong]|_stationId:", _stationId);}
	nextSong(_stationId, false, false, true);
}

function replaySong() {
	_audio.currentTime = 0;
}

function playSong() {
	if(isNaN(_audio.duration)){
		if(_DEBUG_){console.log("TRYSTART!!!!!!!!");}
		tryStartAudio();
	}
	if(_DEBUG_){console.log("play!!!!!!!!");}
	_audio.play();
}

function pauseSong() {
	_audio.pause();
}

function volUp() {
	STATUS_.VOLUME_ = ((STATUS_.VOLUME_ += 0.05)>1)?1:STATUS_.VOLUME_;
	_audio.volume = STATUS_.VOLUME_;
	chrome.runtime.sendMessage({ message: "_VOLUME", volume: STATUS_.VOLUME_ });
}

function volDown() {
	STATUS_.VOLUME_ = ((STATUS_.VOLUME_ -= 0.05)<0)?0:STATUS_.VOLUME_;
	_audio.volume = STATUS_.VOLUME_;
	chrome.runtime.sendMessage({ message: "_VOLUME", volume: STATUS_.VOLUME_ });
}

function remoteMute() {
	chrome.runtime.sendMessage({ message: "MUTE_" });
	_audio.muted = !_audio.muted;
	STATUS_.MUTED_ = _audio.muted;
}

function download(song) {
	if(song && song.audioURL && song.artistName && song.songTitle) {
		chrome.downloads.download({//DOWNLOAD LINK LABEL
			url: song.audioURL,
			filename: song.artistName+ " - " +song.songTitle+".m4a",
			conflictAction: "overwrite"
		});
	}
	else {
		if(_DEBUG_){console.log("DOWNLOAD FAILURE!!!!!");}
	}
}
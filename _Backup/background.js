//PRE-init vars
var _DEBUG_ = false;
var _SUPPRESSED_ = false;
var _PERSIST = false;
//end PRE-init vars

//PRE-init Code *************************************************************************************************
function suppress_dev_warning(info) {
	if(!_SUPPRESSED_){return;}
	if(info.installType == "development"){
		if(_DEBUG_){console.log("Development mode is active! Supressing warning!");}
		chrome.windows.create({type: 'normal',focused: true, state: 'maximized'}, function(window) {
			chrome.windows.getAll({populate: true}, function(windows) {
				for(var i=0;i<windows.length;i++) {
					if(windows[i].id!=window.id) {
						if(windows[i].tabs.length<3) {
							chrome.windows.remove(windows[i].id);
						}
						else {
							chrome.windows.remove(window.id);
						}
						
					}
				}
			});
		});
	}
}

function removal(items){
	if(items.continuePlaying){return;}
	chrome.windows.getAll(function(windowsArray){
		if(_DEBUG_){console.log("CHECKING CLOSE!");}
		if((!windowsArray.length) && !_PERSIST ) {//IF ALL WINDOWS CLOSED && USER DOESN'T WANT PERSIST
			if(_DEBUG_){console.log("DO CLOSE!");}
			_audio.pause();//THEN STOP PLAYING AUDIO!!!
			chrome.runtime.getBackgroundPage().close();
		}
	});
	
}

function check_ext_open(callback) {
	if (!callback) {
		callback = function () {};
	}
	chrome.windows.getAll({
		populate: true
	}, function (windowsArray) {
		var ext_open = false;
		for (var i = 0; i < windowsArray.length; ++i) {
			for (var ii = 0; ii < windowsArray[i].tabs.length; ++ii) {
				if (windowsArray[i].tabs[ii].url == "chrome://extensions/") {
					ext_open = true;
					i = windowsArray.length;
					break;
				}
			}
		}
		if (!ext_open) {
			if(_DEBUG_){console.log("no extensions page open!!!");}
			callback();
		}
		else{
			if(_DEBUG_){console.log("Extensions page *IS* open!!!");}
			return;
		}
	});
}

function suppress_on_dev(){ chrome.management.getSelf(suppress_dev_warning); }

function updateUserVersion(){
	chrome.storage.sync.get({ version: "NEW", notifyUpdates: true }, function (items) { 
		if(items.notifyUpdates && items.version != chrome.runtime.getManifest().version){ chrome.runtime.openOptionsPage(); } 
	});
}


function pre_INIT(){
	check_ext_open(suppress_on_dev);
	chrome.windows.onRemoved.addListener(function(id){ chrome.storage.sync.get( {continuePlaying: true}, removal); });
	updateUserVersion();
}
pre_INIT();
//End PRE-init Code *************************************************************************************************

var STATUS_ = { TYPE_: "STATUS", OPEN_: false, LOGGED_: false, ERROR_: NaN, VOLUME_: 1, MUTED_: false};
var user = NaN;
var pass = NaN;
var _loginData = {};
var _anonData = {};
var _stations = [];
var _songLists = {};
var _pastSongs = {};
var _currentSong = {};
var _currentStation = {};
var _stationId = "NaN";
var _username = false;
var _password = false;
var _csrf = null;
var _cookie = null;
var _allowCure = false;
var _volumeTimeout;

//init Audio Object//////////////////////////////////////////////////////////////////////////////
var _audio = document.createElement("audio"); 
_audio.onended = function() { nextSong(_stationId); sendData(); };
_audio.onerror = function() { 
	if(this.error.code == 4){
		_currentSong.audioURL = ""; 
		_currentSong.songTitle = "This song Failed to Load!"; 
		_currentSong.artistName="This song Failed to Load!"; 
		_currentSong.remove = true;
	}
	this.onended();
}
chrome.storage.sync.get({ rememberVolume: false, volume: 100 }, function (items) { if(items.rememberVolume){ STATUS_.VOLUME_ = _audio.volume = items.volume } });
//end Audio Init//////////////////////////////////////////////////////////////////////////////////

//init storage variables//////////////////////////////////////////////////////////////////////////
chrome.storage.sync.get( {rightClickDownload: false}, setContextMenu);
//end init storage variables//////////////////////////////////////////////////////////////////////

chrome.commands.onCommand.addListener(function(command) {
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
			pauseSong();
			if(!STATUS_.OPEN_ || !STATUS_.LOGGED_){
				login(function(status){if(STATUS_.OPEN_ && STATUS_.LOGGED_){pauseSong();}});
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
		case "download-current-song":
			if(_currentSong.audioURL){ download(_currentSong); }
			break;
		case "give-thumb-up":
			give_thumb_up();
			break;
		case "give-thumb-down":
			give_thumb_down();
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

function sendError(){
	chrome.runtime.sendMessage({ message: "_ERROR", song: _currentSong, station: _currentStation, status: STATUS_ });
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
				if(_cookie.hostOnly){delete _cookie.hostOnly;}//fix playback failure from hostonly cookie??(see cookie.set.txt error)
			});
			callback();
        	}
    	}; 
	xmlHttp.open( "GET", "https://www.pandora.com", true ); // false for synchronous request
	xmlHttp.send( null );
}

function getCookie(){
	if(_DEBUG_){console.log("csrfGETCOOKIE:");console.log(_csrf);}
	return (_csrf) || (_cookie && _cookie.value) || document.cookie.substring(document.cookie.indexOf("csrftoken=")).substring(10,document.cookie.substring(document.cookie.indexOf("csrftoken=")).indexOf(";")) || cookieNotFound();
}

function cookieNotFound(){
	sendError();
	chrome.runtime.lastError={message:"COOKIE_NOT_FOUND"};
	console.log("COOKIE_NOT_FOUND");
	return STATUS_.ERROR_ = "COOKIE_NOT_FOUND";
	
}
///////////////////////////////////////START STUFF!!!
startBackend();
///////////////////////////////////////

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(_DEBUG_){console.log("request:"); console.log(request);}
		if (!request || !request.request) {
			STATUS_.ERROR_ = "MALFORMED_REQUEST";
			sendError();
			sendResponse(STATUS_);
			return;
		}
		switch(request.request) {
		case "_LOGIN":
			if(_DEBUG_){console.log("_LOGIN RECIEVED");}
			STATUS_.ERROR_ = false;
			if(request.options){
				STATUS_.LOGGED_ = false;
				startBackend();
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
					sendError();
				}
			}
			else {
				STATUS_.ERROR_ = "-11";
				sendError();
			}
			break;
		case "_GET_STATIONS":
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				sendResponse({ TYPE: "STATIONS", stations: _stations });
				return;
			}
			else {
				STATUS_.ERROR_ = "-20";
				sendError();
			}
			break;
		case "_GET_CURRENT_STATION":
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				sendResponse({ TYPE: "CURRENT_STATION", _currentStation });
				return;
			}
			else {
				STATUS_.ERROR_ = "-21";
				sendError();
			}
			break;
		case "_SKIP":
		case "_NEXT":
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				nextSong(_stationId);
				sendResponse({ TYPE: "SONG", SONG_: _currentSong, ERROR_: !_currentSong });
				sendData();
				return;
			}
			else {
				STATUS_.ERROR_ = "-30";
				sendError();
			}
			break;
		case "_PREV":
			STATUS_.ERROR_ = false;
			if (STATUS_.LOGGED_ && STATUS_.OPEN_) {
				prevSong(_stationId);
				sendResponse({ TYPE: "SONG", SONG_: _currentSong, ERROR_: !_currentSong });
				sendData();
				return;
			}
			else {
				STATUS_.ERROR_ = "-31";
				sendError();
			}
			break;
		case "_STATION_CHANGE":
			STATUS_.ERROR_ = false;
			_currentStation = request.station
			var oldID = _stationId;
			_stationId = request.station.stationId;
			STATUS_.ERROR_ = !_stationId;
			nextSong(_stationId, oldID, true);
			sendData();
			break;
		case "_SOUND":
			mutePieratora(request.power);
			break;
		case "_REPLAY":
			replaySong();
			break;
		case "_PLAY":
			playSong();
			break;
		case "_PAUSE":
			pauseSong();
			break;
		case "_INFO":
			if(_DEBUG_){console.log("INFO RESPONSE:");console.log(_currentSong);}
			//sendResponse(_currentSong);
			break;
		case "_VOLUME":
			STATUS_.VOLUME_ = request.volume / 100;
			_audio.volume = STATUS_.VOLUME_;
			saveVolume();
			break;
		case "_DOWNLOAD":
			download(_currentSong);
			break;
		case "_STATUS":
			sendData();
			break;
		case "_REMOVE":
			removeCurrent();
			sendResponse({ TYPE: "SONG", SONG_: _currentSong, ERROR_: !_currentSong });
			sendData();
			return;
			break;
		case "_T_UP":
			toggle_thumb_up();
			sendResponse({ TYPE: "RATING", RATING_: _currentSong.rating });
			return;
			break;
		case "_T_DOWN":
			toggle_thumb_down();
			sendResponse({ TYPE: "RATING", RATING_: _currentSong.rating });
			return;
			break;
		case "_NEW_ACCOUNT":
			STATUS_.ERROR_ = false;
			createAccount(request.body, _utility_loginNew, sendResponse);
			return true;
			break;
		case "_CONTEXTMENU":
			enableContextMenu();
		default:
			if(_DEBUG_){ console.log("request-not-implemented:", request); }
			break;
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
			if(_DEBUG_){console.log("[Status != 200] RESPONSE: ", xmlHttp.responseText)}
			if(!fail){fail = function(){};}
			if(fail(xmlHttp.responseText)){
				return;
			}
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
				var body = { "existingAuthToken": _loginData && _loginData.authToken || null, "username": _username, "password": _password, "keepLoggedIn": true }
				var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
				{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
				{ 'type': 'X-CsrfToken', 'value': cookie && cookie.value || getCookie()}// added "cookie.value || " to prevent rare login failure, cause unknown
				];
				httpPostAsync("https://www.pandora.com/api/v1/auth/login", body, requestHeaderAttributes,
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
						return function (response) {
							STATUS_.LOGGED_ = false;
							STATUS_.ERROR_ = "10";
							sendError();
							STATUS_.message = response;
							sr(STATUS_);
							STATUS_.message = "";
						};
					})(sr2),
					true
				);
			}
		})(sr1));
	})(sendResponse);
}

//=================================================================================================================================================================================Anonymous Login

function anonLogin(func) {
	if(!func){func = function(){};}
	var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
		{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
		{ 'type': 'X-CsrfToken', 'value': getCookie()}
	];
	httpPostAsync("https://www.pandora.com/api/v1/auth/anonymousLogin", {}, requestHeaderAttributes,
		function (response) {
			_anonData = JSON.parse(response);
			func();
		},
		function(){}, true
	);	
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
							sendError();
							if(_DEBUG_){console.log("SendResponseNow2!",sr);}
							sr(STATUS_);
						}
					})(sr2)
				);
			}
		})(sr1));
	})(sendResponse);
}

function Search(query, types, func) {
	if(!types){types = ["AL","AR","CO","TR","SF","PL","ST","PC","PE"];}
	if(!func){func = function(){};}
	var body = {query:query,types:types,listener:null,start:0,count:20,annotate:true,searchTime:0,annotationRecipe:"CLASS_OF_2019"};
	var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
		{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
		{ 'type': 'X-csrftoken', 'value': getCookie()},
        { 'type': 'x-authtoken', 'value': _loginData.authToken}
	];
	httpPostAsync("https://www.pandora.com/api/v3/sod/search", body, requestHeaderAttributes,
		function (response) {
			console.log("RESPONSE_TO_TEST: ________________________", JSON.parse(response));
			func();
		},
		null, true
	);	
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
				var newSongsJSON = JSON.parse(response).tracks;
				newSongsJSON = cureSongs(newSongsJSON);
				_songLists[stationID] = (_songLists[stationID] || []).concat(newSongsJSON);
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
	if (_currentSong && _currentSong.audioURL) {
		if(_DEBUG_){console.log("1");}
		if (!_pastSongs[stationID]) {
			_pastSongs[stationID] = [];
		}
		if (!_pastSongs[oldID]) {
			_pastSongs[oldID] = [];
		}
		_currentSong.XXRESUMEXX = _audio.currentTime
		if(!_currentSong.remove){_pastSongs[oldID].push(_currentSong);}
		if(_pastSongs[oldID].length > 25) {
			_pastSongs[oldID].shift()
		}
	}
	if(getLast && _pastSongs[stationID] && _pastSongs[stationID].length) {
		_currentSong = _pastSongs[stationID].pop();
		if(_currentSong.audioURL != "") {
			_audio.setAttribute('src', _currentSong.audioURL);
		}
		else {
			_audio.removeAttribute('src');
		}
		_audio.volume = STATUS_.VOLUME_;
		if(_currentSong.XXRESUMEXX) {
			_audio.currentTime = _currentSong.XXRESUMEXX;
		}
		if(!paused) {
			var playPromise = _audio.play();
			playPromise.catch(() => { if(_DEBUG_){console.log("PLAY@nextSong[0] failure, maybe song was cured?");} });
		}
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
		if(_currentSong.audioURL != "") {
			_audio.setAttribute('src', _currentSong.audioURL);
		}
		else {
			_audio.removeAttribute('src');
		}
		_audio.volume = STATUS_.VOLUME_;
		var playPromise = _audio.play();
		playPromise.catch(() => { if(_DEBUG_){console.log("PLAY@nextSong[1] failure, maybe song was cured?");} });
	}
	autoDownload();
	cureCurrent(true);
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
	if(_currentSong.audioURL != "") {
		_audio.setAttribute('src', _currentSong.audioURL);
	}
	else {
		_audio.removeAttribute('src');
	}
	_audio.volume = STATUS_.VOLUME_;
	var playPromise = _audio.play();
	playPromise.catch(() => { if(_DEBUG_){console.log("PLAY@prevSong failure, maybe song was cured?");} });
	autoDownload();
	cureCurrent(false);
}

//==================================================================================================================================================================================

function createAccount(body, func, sendResponse){
	if (!func) {
		func = function () { };
	}
	if (!sendResponse) {
		sendResponse = function () { };
	}
	anonLogin(function(inner_func, sr){
		return function(){
			var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
				{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
				{ 'type': 'X-CsrfToken', 'value': getCookie()},
				{ 'type': 'X-AuthToken', 'value': _anonData.authToken }
			];
			httpPostAsync("https://www.pandora.com/api/v1/listener/register", body, requestHeaderAttributes,
				function (response){
					inner_func(response, sr);
				}, 
				function(response){ 
					if(_DEBUG_){console.log("createAccountFAILURE:",response);}
					STATUS_.LOGGED_ = false;
					STATUS_.ERROR_ = "30";
					sendError();
					STATUS_.message = response;
					sr(STATUS_);
					STATUS_.message = "";
				}, true
			);
		};
	}(func, sendResponse));
}

function enableContextMenu(granted){
	chrome.contextMenus.create({ id: 'drcmi', title: 'Download Current Pieratora song!', contexts: ['all'], onclick: function(){download(_currentSong);} });
}

function setContextMenu(items){
	if(items.rightClickDownload){
		chrome.contextMenus.create({ id: 'drcmi', title: 'Download Current Pieratora song!', contexts: ['all'], onclick: function(){download(_currentSong);} });
	}
}

function _utility_loginNew(response, sr){
	_loginData = JSON.parse(response);
	STATUS_.LOGGED_ = true;
	getStations(sr);
}

function _utility_AddNextSong(statID){
	addSongs(statID, function () {
		if(_DEBUG_){console.log("5");}
		if(_DEBUG_){console.log("_songLists");console.log(_songLists);}
		if(_DEBUG_){console.log("statID");console.log(statID);}
		_currentSong = _songLists[statID].shift();
		if(_DEBUG_){console.log("_songLists");console.log(_songLists);}
		if(_DEBUG_){console.log("_currentSong");console.log(_currentSong);}
		if(_currentSong.audioURL != "") {
			_audio.setAttribute('src', _currentSong.audioURL);
		}
		else {
			_audio.removeAttribute('src');
			if(_DEBUG_){console.log("INVALID SONG!!!! _currentSong", _currentSong);}
		}
		_audio.volume = STATUS_.VOLUME_;
		var playPromise = _audio.play();
		playPromise.catch(() => { if(_DEBUG_){console.log("PLAY@_utility_AddNextSong failure, maybe song was cured?");} });
		autoDownload();
		sendData();
	});
}

function tryStartAudio(noRetry) {
	if(_DEBUG_){console.log("in try start");}
	if(_DEBUG_){console.log("STATUS_.LOGGED_");console.log(STATUS_.LOGGED_);}
	if (STATUS_.LOGGED_) {
		if(_DEBUG_){console.log("_stationId");console.log(_stationId);}
		nextSong(_stationId);
		if(_DEBUG_){console.log("_stationId");console.log(_stationId);}
		if(_DEBUG_){console.log("_trystart _currentSong"); console.log(_currentSong);}
	}
	else{
		if(!noRetry){
			startBackend(function(){
				login(function(){
					tryStartAudio(true);
				});
			});
		}
	}
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
	var playPromise = _audio.play();
	playPromise.catch(() => { if(_DEBUG_){console.log("PLAY@playSong failure, maybe song was cured?");} });
	autoDownload();
}

function pauseSong() {
	_audio.pause();
}

function volUp() {
	STATUS_.VOLUME_ = ((STATUS_.VOLUME_ += 0.01)>1)?1:STATUS_.VOLUME_;
	_audio.volume = STATUS_.VOLUME_;
	chrome.runtime.sendMessage({ message: "_VOLUME", volume: STATUS_.VOLUME_ });
}

function volDown() {
	STATUS_.VOLUME_ = ((STATUS_.VOLUME_ -= 0.01)<0)?0:STATUS_.VOLUME_;
	_audio.volume = STATUS_.VOLUME_;
	chrome.runtime.sendMessage({ message: "_VOLUME", volume: STATUS_.VOLUME_ });
}

function saveVolume(){
	chrome.storage.local.set({ volume: STATUS_.VOLUME_ });
	clearTimeout(volumeTimeout);
	volumeTimeout= setTimeout(function() {
 chrome.storage.sync.set({ volume: STATUS_.VOLUME_ });
 }, 60000);
}

function remoteMute() {
	chrome.runtime.sendMessage({ message: "MUTE_" });
	_audio.muted = !_audio.muted;
	STATUS_.MUTED_ = _audio.muted;
}

function sendRating() {
	chrome.runtime.sendMessage({ message: "RATING_", rating: _currentSong.rating });
}

function download(song) {
	chrome.permissions.request({ permissions: ['downloads'] }, function(granted) {
		if (granted) {
			do_download(song);
		} else {
			console.log("___DOWNLOAD PERMISSION DENIED___");
		}
	});
	
}

function do_download(song) {
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
	chrome.permissions.contains({ permissions: ['downloads'] }, function(result){ 
		if(result){
			chrome.permissions.remove({ permissions: ['downloads'] }, function(removed){ 
				console.log("DownloadPermissionRemoved:",removed); 
			});
		}
	});
}

function autoDownload(){
	chrome.storage.sync.get({ autoDownload: false}, function (items) {
		if(items.autoDownload && !_currentSong.downloaded){
			_currentSong.downloaded = true;
			download(_currentSong);
		}
	});
}

function cureSongs(songList){
	var song = {};
	for(var i = 0; i< songList.length; ++i){
		song = songList[i];
		if(songList[i].songTitle == "Curator Message"){
			songList[i].cure = true;
			if(!_allowCure){
				songList.splice(i, 1);
				--i;
			}
		}
	}
	return songList;
}

function cureCurrent(next){
	var func = function(){};
	if(next){func=nextSong;}else{func=prevSong;}
	if(_currentSong.cure && !_allowCure){func(_currentStation);}
}

function removeCurrent(){
	_currentSong.remove = true;
	nextSong(_stationId);
}

function give_thumb_up(){
	var func = function(){sendRating();}
	add_thumb(true, func);
	_currentSong.rating = 1;
}

function give_thumb_down(){
	var func = function(){sendRating();nextSong(_stationId);sendData();}
	add_thumb(false, func);
	_currentSong.rating = -1;
}

function toggle_thumb_up(){
	if(_currentSong.rating == 1) {
		remove_thumb(true);
		_currentSong.rating = 0;
	}
	else {
		add_thumb(true);
		_currentSong.rating = 1;
	}
}

function toggle_thumb_down(){
	if(_currentSong.rating == -1) {
		remove_thumb(false);
		_currentSong.rating = 0;
	}
	else {
		var func = function(){nextSong(_stationId);sendData();}
		add_thumb(false, func);
		_currentSong.rating = -1;
	}
}

function add_thumb(isThumbUp, func){
	var body = { 'trackToken': _currentSong.trackToken, 'isPositive': isThumbUp }
	var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
	{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
	{ 'type': 'X-CsrfToken', 'value': getCookie()},
	{ 'type': 'X-AuthToken', 'value': _loginData.authToken }
	];
	httpPostAsync("https://www.pandora.com/api/v1/station/addFeedback", body, requestHeaderAttributes,
		function(f){ return function (response) {
			if(f){f();}
			if(_DEBUG_){ console.log("THUMB [" + ((isThumbUp)?"UP":"DOWN") + "] RESPONSE!!!!!!: ", response); }
		};}(func)
	);
}

function remove_thumb(isThumbUp, func){
	var body = { 'trackToken': _currentSong.trackToken, 'isPositive': isThumbUp }
	var requestHeaderAttributes = [{ 'type': 'Content-Type', 'value': 'application/json' },
	{ 'type': 'Accept', 'value': 'application/json, text/plain, */*' },
	{ 'type': 'X-CsrfToken', 'value': getCookie()},
	{ 'type': 'X-AuthToken', 'value': _loginData.authToken }
	];
	httpPostAsync("https://www.pandora.com/api/v1/station/deleteFeedback", body, requestHeaderAttributes,
		function(f){ return function (response) {
			if(f){f();}
			if(_DEBUG_){ console.log("REMOVE THUMB [" + ((isThumbUp)?"UP":"DOWN") + "] RESPONSE!!!!!!: ", response); }
		};}(func)
	);
}
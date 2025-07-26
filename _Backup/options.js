// Saves options to chrome.storage
function save_options() {
  var user = document.getElementById('user').value;
  var pass = document.getElementById('pass').value;
  chrome.storage.sync.set({
    	userName: user,
	password: pass,
	remember: true
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = status.textContent + '\r\nOptions saved.\r\n';
  });
}

function clear_options() {
  chrome.storage.sync.set({
    userName: '',
	password: '',
	remember: false
  }, function() {});
}

function save_login() {
	if (document.getElementById('rem').checked) {
		save_options();
	}
	else {
		clear_options();
	}
	login();
}

function login() { 
	console.log("start login!!!");
	chrome.runtime.sendMessage({ request: "_LOGIN", options: true, userName: document.getElementById('user').value, password: document.getElementById('pass').value}, function(response) {
		console.log("RESPONE_LOGIN:", response);
		console.log("response.LOGGED_:", response.LOGGED_);
		var tempMessage = "";
		tempMessage = (response.LOGGED_)?'\r\nLogin Success!\r\n\u00a0':'\r\nLogin Failed!\r\n\u00a0';
		console.log("tempMessage :", tempMessage );
		var status = document.getElementById('status');
		status.textContent = status.textContent + tempMessage;
		setTimeout(function() {
			console.log("HERE!!!!");
			status.textContent = '';
		}, 1750);
	});
}

function downloadSong() {
	chrome.runtime.sendMessage({ request: "_DOWNLOAD" });
}

function setSaveCheck() {
	var save = document.getElementById('save');
	switch (this.checked) {
		case true:
			save.textContent = "Save/Login"; save.value = "Save/Login"; break;
		case false:
			save.textContent = "Login"; save.value = "Login"; break;
	}
}

// Restores select box and checkbox state etc. using the preferences
// stored in chrome.storage.
function restore_options() {
	chrome.storage.sync.get({
		userName: '',
		password: '',
		remember: '',
		rightClickDownload: false,
		continuePlaying: false
	}, function(items) {
 		document.getElementById('user').value = items.userName;
		document.getElementById('pass').value = items.password;
		document.getElementById('rem').checked = items.remember;
		document.getElementById("so3Check").checked = items.rightClickDownload;
		document.getElementById("so4Check").checked = items.continuePlaying;
		var save = document.getElementById('save');
		if (items.remember){
			save.textContent = "Save/Login"; save.value = "Save/Login";
		}
		else {
			save.textContent = "Login"; save.value = "Login"; 
		}

	});
}

function load() {
	document.getElementById('rem').addEventListener('click', setSaveCheck);
	document.getElementById('save').addEventListener('click', save_login);
	document.getElementById('show').addEventListener('click', showPass);
	document.getElementById('hide').addEventListener('click', hidePass);
	document.getElementById('DlButton').addEventListener('click', downloadSong);
	document.getElementById('so1').addEventListener('click', so1);
	document.getElementById('so2').addEventListener('click', so2);
	document.getElementById('so3').addEventListener('click', so3);
	document.getElementById('so4').addEventListener('click', so4);
	dragElement(document.getElementById(('dragDiv1')));
	dragElement(document.getElementById(('dragDiv2')));
	restore_options();
}

function so1() {
	chrome.tabs.create({ url: "chrome://extensions/shortcuts"});
}

function so2() {
	chrome.tabs.create({ url: "chrome://settings/?search=Continue+running+background+apps+when+Google+Chrome+is+Closed"});
}

function so3(e) {
	if(e.target.tagName == "LABEL"){ return; }
	chrome.storage.sync.set( {rightClickDownload: document.getElementById("so3Check").checked} );
}

function so4(e) {
	if(e.target.tagName == "LABEL"){ return; }
	if(document.getElementById("so4Check").checked){
		document.getElementById("so4Check").checked = confirm("Enabling this allows Pieratora to continue playing after Chrome has been closed.\n\nAny Keyboard Shortcuts set to 'Global' will still work.\nIn this state the extension can be accessed by re-opening chrome, or via the Chrome Icon in the System Tray.\n\nIn order for this mode to work make sure you have enabled the 'Continue running background apps when Google Chrome is closed' setting from your Chrome Browser Setting. The 'Play In Background' button under 'Special Options' will navigate you to this setting.\n\nOnce this setting is enabled audio will continue even though you close chrome, please confirm you would like to enable this setting!");
	}
	chrome.storage.sync.set( {continuePlaying: document.getElementById("so4Check").checked} );
}

function showPass() {
	document.getElementById('hide').style.display = 'inline-block';
	document.getElementById('show').style.display = 'none';
	document.getElementById('pass').type = 'text';
}

function hidePass() {
	document.getElementById('hide').style.display = 'none';
	document.getElementById('show').style.display = 'inline-block';
	document.getElementById('pass').type = 'password';
}

function dragElement(element) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, eleft = 0, etop = 0;
	var style = {};
	var storage = {};
	style = element.currentStyle || window.getComputedStyle(element);
	console.log(style.marginLeft);
	if (document.getElementById(element.id + '_Header')) {
		/* if present, the header is where you move the DIV from:*/
		document.getElementById(element.id + '_Header').onmousedown = dragMouseDown;
	} else {
		/* otherwise, move the DIV from anywhere inside the DIV:*/
		element.onmousedown = dragMouseDown;
	}

	function dragMouseDown(e) {
		e = e || window.event;
		element.style.left = eleft = element.offsetLeft - parseInt(style.marginLeft.substring(0, style.marginLeft.length - 2));
		element.style.top = etop = element.offsetTop - parseInt(style.marginTop.substring(0, style.marginTop.length - 2));
		pos1 = e.clientX;
		pos2 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
		storage = document.onmousedown;
		document.onmousedown = disableSelect;
	}

	function elementDrag(e) {
		e = e || window.event;
		pos3 = pos1 - e.clientX;
		pos4 = pos2 - e.clientY;
		// set the element's new position:
		element.style.left = eleft - pos3 + 'px';
		element.style.top = etop - pos4 + 'px';
	}

	function closeDragElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;
		document.onmousedown = storage;
	}

	function getOffset(el) {
		el = el.getBoundingClientRect();
		return {
			left: el.left + window.scrollX,
			top: el.top + window.scrollY
		}
	}

	function disableSelect(e) {
		return false;
	}
}

window.onload = load;

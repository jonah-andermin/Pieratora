var _DEBUG_ = true;
var loginTimeout = {'id': ""};
var newTimeout = {'id': ""};
var draggable = [];

// Saves options to chrome.storage
function save_login_options() {
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
	resetTimeout(loginTimeout, function() {
		status.textContent = '';
	}, 10000);
  });
}

function clear_login_options() {
  chrome.storage.sync.set({
    userName: '',
	password: '',
	remember: false
  }, function() {});
}

function save_login() {
	if (document.getElementById('rem').checked) {
		save_login_options();
	}
	else {
		clear_login_options();
	}
	login();
}

function login() { 
	if(_DEBUG_ ){ console.log("start login!!!"); }
	chrome.runtime.sendMessage({ request: "_LOGIN", options: true, userName: document.getElementById('user').value, password: document.getElementById('pass').value},
	function(response) {
		if(_DEBUG_ ){ console.log("RESPONE_LOGIN:", response); }
		if(_DEBUG_ ){ console.log("response.LOGGED_:", response.LOGGED_); }
		var tempMessage = "";
		var time = 1750;
		if(response.LOGGED_){
			tempMessage += '\r\nLogin Success!\r\n\u00a0';
		}
		else{
			tempMessage += '\r\nLogin Failed!\r\n\u00a0';
			var mess = JSON.parse(response.message.replace(/(\r\n|\n|\r)/, "<br>"));
			tempMessage += '\r\n' + mess.errorString + '\r\n\u00a0\r\n' + mess.message + '\r\n\u00a0';
			time = 10000;
		}
		if(_DEBUG_ ){ console.log("tempMessage :", tempMessage ); }
		var status = document.getElementById('status');
		status.textContent = status.textContent + tempMessage;
		resetTimeout(loginTimeout, function() {
			status.textContent = '';
		}, time);
	});
}

function sendNewAccount(){
	var json = {
		"username":document.getElementById("new_user").value,
		"password":document.getElementById("new_pass").value,
		"zipcode":document.getElementById("new_zip").value,
		"gender":document.getElementById("new_gender").value,
		"birthYear":parseInt(document.getElementById("new_year").value, 10),
		"birthMonth":1,"birthDay":1,"keepLoggedIn":true
	};
	chrome.runtime.sendMessage({ request: "_NEW_ACCOUNT", body: json }, function(response){
		if(_DEBUG_ ){ console.log(response); }
		if(response.ERROR_){
			var mess = JSON.parse(response.message.replace(/(\r\n|\n|\r)/, "<br>"));
			mess.errorString
			mess.message
			notifyCreate(mess.errorString, mess.message);
		}
		else{
			notifyCreate("Account Creation Success!!!", "Add a Station To Your Account\r\nTo Start Listening!");
			setLoginFromNew();
		}
	});
}

function notifyCreate(first, second){
		var n_s = document.getElementById('new_status');
		n_s.textContent = '\r\n' + first + '\r\n' + second;
		resetTimeout(newTimeout, function() {
			n_s.textContent = '';
		}, 10000);
}

function setLoginFromNew() {
	document.getElementById("user").value = document.getElementById("new_user").value;
	document.getElementById("pass").value = document.getElementById("new_pass").value;
	if (document.getElementById('rem').checked) {
		save_login_options();
	}
	else {
		clear_login_options();
	}
	document.getElementById("new_user").value = "";
	document.getElementById("new_pass").value = "";
	document.getElementById("new_zip").value = "";
}

function downloadSong() {
	chrome.runtime.sendMessage({ request: "_DOWNLOAD" });
}

function setSaveCheck() {
	var save = document.getElementById('save');
	var rem = document.getElementById('rem');
	document.getElementById("new_rem").checked=rem.checked;
	switch (rem.checked) {
		case true:
			save.textContent = "Save/Login"; save.value = "Save/Login"; break;
		case false:
			
			
			save.textContent = "Login"; save.value = "Login"; break;
	}
}

function new_setSaveCheck() {
	var save = document.getElementById('save');
	var rem = document.getElementById('new_rem');
	document.getElementById("rem").checked=rem.checked;
	switch (rem.checked) {
		case true:
			save.textContent = "Save/Login"; save.value = "Save/Login"; break;
		case false:
			
			
			save.textContent = "Login"; save.value = "Login"; break;
	}
}

function setYears(){
	var years = document.getElementById("new_year");
	var date = new Date().getFullYear();
	for(var x = date; x>date-101; --x){
		var option = document.createElement("option");
		option.text = ""+x;
		if(x>date-13){option.style="color:rgb(255,0,0)"}
		else if(x>date-18){option.style="color:rgb(255,200,0)"}
		else{option.style="color:rgb(0,255,0)"}
		years.add(option);
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
		continuePlaying: false,
		autoDownload: false,
		rememberVolume: false,
		notifyUpdates: true
	}, function(items) {
 		document.getElementById('user').value = items.userName;
		document.getElementById('pass').value = items.password;
		document.getElementById('rem').checked = items.remember;
		document.getElementById('new_rem').checked = items.remember;
		document.getElementById("so3Check").checked = items.rightClickDownload;
		document.getElementById("so4Check").checked = items.continuePlaying;
		document.getElementById("so5Check").checked = items.autoDownload;
		document.getElementById("so7Check").checked = items.rememberVolume;
		document.getElementById("so9Check").checked = items.notifyUpdates;
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
	updateUserVersion();
	document.getElementById('rem').addEventListener('click', setSaveCheck);
	document.getElementById('new_rem').addEventListener('click', new_setSaveCheck);
	document.getElementById('save').addEventListener('click', save_login);
	document.getElementById('show').addEventListener('click', showPass);
	document.getElementById('hide').addEventListener('click', hidePass);
	document.getElementById('new_show').addEventListener('click', new_showPass);
	document.getElementById('new_hide').addEventListener('click', new_hidePass);
	document.getElementById('DlButton').addEventListener('click', downloadSong);
	document.getElementById('so1').addEventListener('click', so1);
	document.getElementById('so2').addEventListener('click', so2);
	document.getElementById('so3').addEventListener('click', so3);
	document.getElementById('so4').addEventListener('click', so4);
	document.getElementById('so5').addEventListener('click', so5);
	document.getElementById('so6').addEventListener('click', so6);
	document.getElementById('so7').addEventListener('click', so7);
	document.getElementById('so8').addEventListener('click', so8);
	document.getElementById('so9').addEventListener('click', so9);
	document.getElementById('create_account').addEventListener('click', sendNewAccount);
	draggable.push(document.getElementById('dragDiv1'));
	draggable.push(document.getElementById('dragDiv2'));
	draggable.push(document.getElementById('dragDiv3'));
	make_Draggable(-10);
	window.addEventListener("resize", _resized);
	setYears();
	restore_options();
}

function updateUserVersion(){
	chrome.storage.sync.get({ version: "NEW", notifyUpdates: true }, function (items) { if(items.notifyUpdates && items.version != chrome.runtime.getManifest().version){ showUpdate(); } });
}

function showUpdate(){
	chrome.storage.sync.set({ version: chrome.runtime.getManifest().version });
	window.location.href = '../PIERATORA UPDATES!.html';
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
	chrome.permissions.request({ permissions: ['contextMenus'] }, toggle_contextMenu );
}

function so4(e) {
	if(e.target.tagName == "LABEL"){ return; }
	if(document.getElementById("so4Check").checked){
		document.getElementById("so4Check").checked = confirm("Enabling this allows Pieratora to continue playing after Chrome has been closed.\n\nAny Keyboard Shortcuts set to 'Global' will still work.\nIn this state, the extension can be accessed by re-opening chrome or via the Chrome Icon in the System Tray.\n\nIn order for this mode to work, make sure you have enabled the \"Continue running background apps when Google Chrome is closed\" setting from your Chrome Browser Setting. The \"Play In Background\" button under \"Special Options\" will navigate you to this setting.\n\nOnce this setting is enabled, audio will continue even though you close chrome. Please confirm you would like to enable this setting!");
	}
	if(document.getElementById("so4Check").checked){
		chrome.permissions.request({ permissions: ['background'] }, allow_background );
	}
	else{
		chrome.permissions.remove({ permissions: ['background'] }, function(removed){ if(_DEBUG_ ){ console.log("BackgroundPermissionRemoved:",removed); } });
	}
	chrome.storage.sync.set( {continuePlaying: document.getElementById("so4Check").checked} );
}

function so5(e) {
	if(e.target.tagName == "LABEL"){ return; }
	if(document.getElementById("so5Check").checked){
		document.getElementById("so5Check").checked = confirm("Enabling this option will automatically download every song that gets played. The default download location is your downloads folder.\nThis location can be changed in the Chrome Browser Settings which can be accessed by clicking the Download Location Button on the 'Special Options!' Pane.");
	}
	chrome.storage.sync.set( {autoDownload: document.getElementById("so5Check").checked} );
}

function so6() {
	chrome.tabs.create({ url: "chrome://settings/?search=Ask+where+to+save+each+file+before+downloading"});
}

function so7() {
	chrome.storage.sync.set( {rememberVolume: document.getElementById("so7Check").checked} );
}

function so8() {
	window.location.href = '../PIERATORA UPDATES!.html';
}

function so9() {
	chrome.storage.sync.set( {notifyUpdates: document.getElementById("so9Check").checked} );
}

function toggle_contextMenu(granted) {
	if(!granted){ document.getElementById("so3Check").checked = false; if(_DEBUG_){ if(_DEBUG_ ){ console.log("ContexMenuPermissionGranted:", granted); } } return; }
	if(document.getElementById("so3Check").checked){
		chrome.runtime.sendMessage({ request: "_CONTEXTMENU"});
	}
	else{
		chrome.contextMenus.remove('drcmi');
		chrome.permissions.remove({ permissions: ['contextMenus'] }, function(removed){ if(_DEBUG_ ){ console.log("BackgroundPermissionRemoved:",removed); } });
	}
}

function allow_background(granted)
{
	if(_DEBUG_ ){ console.log("granted:", granted); }
	document.getElementById("so4Check").checked = granted;
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

function new_showPass() {
	document.getElementById('new_hide').style.display = 'inline-block';
	document.getElementById('new_show').style.display = 'none';
	document.getElementById('new_pass').type = 'text';
}

function new_hidePass() {
	document.getElementById('new_hide').style.display = 'none';
	document.getElementById('new_show').style.display = 'inline-block';
	document.getElementById('new_pass').type = 'password';
}

function setDragVisibility(panel) {
	var header = panel.getElementsByClassName("dragPanelHeader")[0];
	var isVisible = new IntersectionObserver(function(entries) {
	
		if(entries[0].isIntersecting == 1){
			dragBar(header, false);
		}
		else{
			dragBar(header, true);
		}
	}, { threshold: [1] });
	isVisible.observe(panel);
}

function dragBar(header, show) {
	if(show){
		if(header.isMinimized){ header.isMinimizedOffscreen=true; return; }//don't change title if panel is minimized
		header.insertAdjacentHTML('afterbegin',"<b>Drag Panel&nbsp;&nbsp;&nbsp;</b><img src='./img/drag.png' class='invertFlash'/><b>&nbsp;&nbsp;&nbsp;Using This</b>");
	}
	else{
		if((header.children.length < 4 && !header.isMinimizedOffscreen) || header.isMinimizedOffscreen){ return; }
		header.removeChild(header.children[0]);
		header.removeChild(header.children[0]);
		header.removeChild(header.children[0]);
	}
}

function _resized(e) {
	for (index in draggable){
		draggable[index].makeVisible();
	}
}

function make_Draggable(min){
	for (index in draggable){
		dragElement(draggable[index], index+1, min);
	}
}

function dragElement(element, index, min) {//min is cuttoff so its not dragged off the screen
	setDragVisibility(element);
	var elm = document.getElementById(element.id + '_Header') || element;
	var cutoff = min;
	var zIndex = getComputedStyle(element).zIndex;
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, eleft = 0, etop = 0;
	var style = {};
	var storage = {};
	style = element.currentStyle || window.getComputedStyle(element);
	if(_DEBUG_ ){ console.log(style.marginLeft); }
	elm.onmousedown = dragMouseDown;
	element.makeVisible = window_resized;
	addMinimize();

	function dragMouseDown(e) {
		e = e || window.event;
		element.style.zIndex = "999";
		element.style.left = eleft = element.offsetLeft - parseInt(style.marginLeft.substring(0, style.marginLeft.length - 2));
		element.style.top = etop = element.offsetTop - parseInt(style.marginTop.substring(0, style.marginTop.length - 2));
		pos1 = e.clientX;
		pos2 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
		storage = document.onmousedown;
		document.onmousedown = disableSelect;
	}

	function elementDrag(e) {
		e = e || window.event;
		pos3 = pos1 - e.clientX;
		pos4 = pos2 - e.clientY;
		element.style.left = eleft - pos3 + 'px';
		if(eleft - pos3 < cutoff){
			element.style.left = cutoff + 'px';
		}
		else if(eleft - pos3 > cutoff+width()-width(elm)){
			element.style.left = (cutoff+width()-width(elm)) + 'px';
		}
		else{
			element.style.left = eleft - pos3 + 'px';
		}
		if(etop - pos4 < cutoff){
			element.style.top = cutoff + 'px';
		}
		else if(etop - pos4 > cutoff+height()-height(elm)){
			element.style.top = (cutoff+height()-height(elm)) + 'px';
		}
		else{
			element.style.top = etop - pos4 + 'px';
		}
	}

	function closeDragElement() {//stop movement on mouseup
		document.onmouseup = null;
		document.onmousemove = null;
		document.onmousedown = storage;
		element.style.zIndex = zIndex;
	}

	function getOffset(el) {
		el = el.getBoundingClientRect();
		return {
			left: el.left + window.scrollX,
			top: el.top + window.scrollY
		}
	}
	
	function window_resized() {
		if(element.style.left.slice(0,-2) > cutoff+width()-width(elm)){
			element.style.left = (cutoff+width()-width(elm)) + 'px';
		}
		if(element.style.top.slice(0,-2) > cutoff+height()-height(elm)){
			element.style.top = (cutoff+height()-height(elm)) + 'px';
		}
	}

	function addMinimize(){
		if(element === elm){ return; }
		var img = document.createElement('img');
		img.src =  "./img/minimize.png";
		img.id = "min_max_" + index;
		img.title = "Minimize Panel";
		img.value = "1";
		img.onclick = min_max;
		img.classList.add("min_max");
		elm.appendChild(img);
		elm.isMinimized = false;
	}

	function min_max(e){
		var tar = e.target;
		var disp = "";
		var src = "./img/minimize.png";
		var text = "";
		var title = "Minimize Panel";
		if(tar.value == 1){
			disp = "none";
			src = "./img/maximize.png";
			text = "<b>" + elm.title + "</b>";
			title = "Maximize Panel";
		}
		for(index in element.children){
			if(index>0){
				element.children[index].style.display=disp;
			}
		}
		tar.src = src;
		tar.value = -tar.value;
		elm.innerHTML = text;
		elm.appendChild(tar);
		elm.style.minWidth = (tar.value == 1)?"":(elm.clientWidth+100)+"px";
		window_resized();
		if(elm.isMinimizedOffscreen){
			//elm.insertAdjacentHTML('afterbegin',"<b>Drag Panel&nbsp;&nbsp;&nbsp;</b><img src='./img/drag.png' class='invertFlash'/><b>&nbsp;&nbsp;&nbsp;Using This</b>");
			elm.isMinimizedOffscreen = false;
		}
		elm.isMinimized = !elm.isMinimized;
	}

	function disableSelect(e){
		return false;
	}

	function width(el){
		return ((el && el.clientWidth) || window.innerWidth);
	}
	
	function height(el){
		return ((el && el.clientHeight) || window.innerHeight);
	}
}

window.onload = load;

function resetTimeout(timeoutID, func, timeout){
	clearTimeout(timeoutID.id);
	timeoutID.id = setTimeout(func, timeout);
}
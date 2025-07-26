// Saves options to chrome.storage
function save_options() {
  var user = document.getElementById('user').value;
  var pass = document.getElementById('pass').value;
  chrome.storage.sync.set({
    userName: user,
    password: pass
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    userName: "",
    password: ""
  }, function(items) {
    document.getElementById('user').value = items.userName;
    document.getElementById('pass').checked = items.password;
  });
}

function load() {
	document.getElementById('save').addEventListener('click', save_options);
	document.getElementById('show').addEventListener('click', showPass);
	document.getElementById('hide').addEventListener('click', hidePass);
	restore_options();
}

function showPass() {
	document.getElementById('hide').style.display = "inline-block";
	document.getElementById('show').style.display = "none";
	document.getElementById('pass').type = "password";
}

function hidePass() {
	document.getElementById('hide').style.display = "none";
	document.getElementById('show').style.display = "inline-block";
	document.getElementById('pass').type = "text";
}



dragElement(document.getElementById(("dragDiv")));

function dragElement(element) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, eleft = 0, etop = 0;
	var style = {};
	var storage = {};
	style = element.currentStyle || window.getComputedStyle(element);
	console.log(style.marginLeft);
	if (document.getElementById(element.id + "_Header")) {
		/* if present, the header is where you move the DIV from:*/
		document.getElementById(element.id + "_Header").onmousedown = dragMouseDown;
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
		element.style.left = eleft - pos3 + "px";
		element.style.top = etop - pos4 + "px";
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



document.addEventListener('DOMContentLoaded', load);
function load() {
	for (const element of document.getElementsByClassName("optionsPage")) {
  element.addEventListener('click', openOptions);
}
}

function openOptions(){
	chrome.runtime.openOptionsPage();
}

window.onload = load;
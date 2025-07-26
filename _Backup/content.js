// content.js
var background = chrome.extension.getBackgroundPage(); //do this in global scope for popup.js
background.location = "/background.html";
window.innerHeight="180px";
window.innerWidth="400px";
//background load
chrome.runtime.onMessage.addListener(
 	 function(request, sender, sendResponse) {
		console.log("request");
		console.log(request);
		if(request.type == "update"){
    			document.getElementById('song_info').innerHTML = request.Title + "<br>" +request.Artist;
			background.song=request;
		}
		else if(request.type == "volumeChange"){
			document.getElementById("volume_slider").value = request.value;
			if(request.mute) {
				document.getElementById('sound_button').src="/soundOff64.png";
			}
			else {
				document.getElementById('sound_button').src="/soundOn64.png";
			}
		}
		else if(request.type == "albumImgChange"){
			if(request.src != null && request.src != true){
				document.body.style.backgroundImage = request.src;
			}
			else if(request.src != null) {
				document.body.style.backgroundImage = "url(/defaultAlbum500.png)";
			}
			else{
				return;
			}
			document.body.style.backgroundRepeat= "no-repeat";
			document.body.style.backgroundPosition = Math.floor((Math.random() * -101)).toString() +"px "+ Math.floor((Math.random() * -321)).toString() +"px";
			background.song.Img = request.src;
		}
  	 });
//end background load


function songInfo(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "OPEN"}, function(response){});
	});
}

function setVolume(vol){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "clientChangedVolume", volume: vol}, function(response){});
		console.log("sent?"+vol);
	});
}

function pause(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "PAUSE"}, function(response){});
	});
}

function play(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "PLAY"}, function(response){});
	});
}

function toggleSound(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "tMUTE"}, function(response){});
	});
}

function skip(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "SKIP"}, function(response){});
	});
}

function replay(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tab){
    		chrome.tabs.sendMessage(tab[0].id, {type: "REPLAY"}, function(response){});
	});
}

function urlPandora(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tabs){
		if(tabs.length<1){
			chrome.tabs.create({url: "https://www.pandora.com", index:0, pinned:true});
		}
		else{
			chrome.tabs.update(tabs[0].id, {active: true});
		}
	});
}

function closeTab(item, index){
	chrome.tabs.remove(item.id);
}

function closePandora(){
	var tabs = chrome.tabs.query({url:"https://www.pandora.com/*"}, function(tabs){
		if(tabs.length<1){
			chrome.tabs.create({url: "https://www.pandora.com", index:0, pinned:true});
		}
		else{
			tabs.forEach(closeTab);
			background.song={Artist:"NaN", Title:"NaN"};
		}
	});
}

function prepareVolumeUpdate(){
	document.onmouseup = updateVolume;
}

function updateVolume(){
	var slider = document.getElementById('volume_slider');
	setVolume(slider.value);
	document.onmouseup = null;
}


document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('play_button').addEventListener('click', play);
	document.getElementById('pause_button').addEventListener('click', pause);
	document.getElementById('pan').addEventListener('click', urlPandora);
	document.getElementById('close_button').addEventListener('click', closePandora);
	document.getElementById('sound_button').addEventListener('click', toggleSound);
	document.getElementById('skip_button').addEventListener('click', skip);
	document.getElementById('replay_button').addEventListener('click', replay);
	document.getElementById('volume_slider').addEventListener('mousedown', prepareVolumeUpdate);
});

function init(){
	songInfo();
}

init();

window.response = {};

function getSongs(){
	var url = 'https://www.pandora.com/api/v1/playlist/getFragment';
	var AUTH = 'BIuAiILpZjSsme4ug5p3qB9XZ2W8+01aN095Vl3RKhA4tOP27JjvDOUQ==';
	var CSR = document.cookie.split("csrftoken=")[1];
	var stationID = '2036382109581442412';
	var body = "{'stationId':"+stationID+",'isStationStart':false,'fragmentRequestReason':'Normal','audioFormat':'aacplus','onDemandArtistMessageArtistUidHex':null,'onDemandArtistMessageIdHex':null}"

	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
	xhr.setRequestHeader('X-AuthToken', AUTH);
	xhr.setRequestHeader('X-CsrfToken', CSR);

	xhr.onload = function () {
    		window.response=this.response;
	};
	xhr.send(body);
}

function login(){
	var url = 'https://www.pandora.com/api/v1/playlist/getFragment';
	var AUTH = 'BIuAiILpZjSsme4ug5p3qB9XZ2W8+01aN095Vl3RKhA4tOP27JjvDOUQ==';
	var CSR = document.cookie.split("csrftoken=")[1];
	var stationID = '2036382109581442412';
	var body = "{'stationId':"+stationID+",'isStationStart':false,'fragmentRequestReason':'Normal','audioFormat':'aacplus','onDemandArtistMessageArtistUidHex':null,'onDemandArtistMessageIdHex':null}"

	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
	xhr.setRequestHeader('X-AuthToken', AUTH);
	xhr.setRequestHeader('X-CsrfToken', CSR);

	xhr.onload = function () {
    		window.response=this.response;
	};
	xhr.send(body);
}
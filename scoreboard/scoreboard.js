console.log("hello scoreboard");

//example of including other source. NOTE leading '/'
include("/scoreboard/file1.js");

include("/scoreboard/simplescoring.js");
//includeCSS("/scoreboard/sst.css");
insertMetaForGoogleAPIs();  // Still needed for authentication

var DEFAULTSHEETID = '1JV_y9P5UkX0jatGNpYJHQGS5Qh86NFM1LC1xddfNzbs';

function scoreboardInit() {
    $("head").append($('<style></style>').load("/scoreboard/sst.css"));
    $("#divBouldering").parent().append($('<div class="partialHTML">').load("/scoreboard/partialHTMLforSimpleScoring.html"));
    var divBouldering = document.getElementById("divBouldering");

    if (!divBouldering) {
        console.log("can't locate divBouldering");
        return;
    }

    var divSheets = document.createElement("div");
    divSheets.id = "divSheets";
    divSheets.style = 'display:none; width: 100%; height:700px;';
    divSheets.innerHTML =
	    "<iframe style='height: 100%; width: 100%' src='https://docs.google.com/spreadsheets/d/" + DEFAULTSHEETID + "/edit?usp=sharing &widget=true&amp;headers=false'> </iframe>";

    divBouldering.parentElement.appendChild(divSheets);

    insertGoogleAPIjs();    // TODO - This currently needs to happen after we insert HMTL controls that our other code assumes

    //wait for bouldering tab to display new iframe
    setTimeout(waitForBoulderingTab, 1000);
}

function waitForBoulderingTab() {
    var divBouldering = document.getElementById("divBouldering");
    var divSheets = document.getElementById("divSheets");
    if (!divBouldering || !divSheets) {
        console.log("Error: can't locate divBouldering or divSheets!");
        return;
    }

    if (divBouldering.className != 'tab-body active') {
        console.log("bouldering tab not enabled");
        //unforunately we have to poll until boudering tab is loaded. Nor real convenient way to get an div/onload event
        setTimeout(waitForBoulderingTab, 1000);
        return;
    }

    divBouldering.style = "display:none";
    divSheets.style = 'width: 100%; height:700px;';
}

function include(filename) {
    var head = document.getElementsByTagName('head')[0];

    var script = document.createElement('script');
    script.src = filename;
    script.type = 'text/javascript';

    head.appendChild(script)
}

function includeCSS(filename) {
    var head = document.getElementsByTagName('head')[0];

    var e = document.createElement('link');
    e.rel = 'stylesheet';
    e.href = filename;
    e.type = 'text/css';

    head.appendChild(e);
}

function insertMetaForGoogleAPIs() {
    var head = document.getElementsByTagName('head')[0];

    var e = document.createElement('meta');
    e.setAttribute('name', "google-signin-client_id");
    e.setAttribute('content', "922926857166-j8ot1aebe96erhoj836kjhdl493l51up.apps.googleusercontent.com");

    head.appendChild(e);
}

function insertGoogleAPIjs() {
    var head = document.getElementsByTagName('head')[0];

    var script = document.createElement('script');
    script.setAttributeNode(document.createAttribute("async"));
    script.setAttributeNode(document.createAttribute("defer"));
    script.setAttribute('src', "https://apis.google.com/js/api.js");
    script.setAttribute('onload', "this.onload = function() {};handleClientLoad()");
    script.setAttribute('onreadystatechange', "if (this.readyState === 'complete') this.onload()");

    head.appendChild(script);
}

function changeIframeSrc(newSheetID) {
    var sstPREFIX_GOOGLESHEET_URL = "https://docs.google.com/spreadsheets/d/";
    var sstSUFFIX_GOOGLESHEET_URL = "/edit";

    $('#divSheets iframe').attr('src', sstPREFIX_GOOGLESHEET_URL + newSheetID + sstSUFFIX_GOOGLESHEET_URL);
}

if (window.attachEvent) {
    window.attachEvent('onload', scoreboardInit);
} else if (window.addEventListener) {
    window.addEventListener('load', scoreboardInit, false);
} else {
    document.addEventListener('load', scoreboardInit, false);
}


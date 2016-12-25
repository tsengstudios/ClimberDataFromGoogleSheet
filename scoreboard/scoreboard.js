console.log("hello scoreboard");

//example of including other source. NOTE leading '/'
include("/scoreboard/file1.js");
include("/scoreboard/file2.js");

function scoreboardInit()
{
    var divBouldering = document.getElementById("divBouldering");

    if (!divBouldering) {
	console.log("can't locate divBouldering");
	return;
    }

    var divSheets = document.createElement("div");
    divSheets.id ="divSheets";
    divSheets.style = 'display:none; width: 100%; height:700px;';
    divSheets.innerHTML =
	    "<iframe style='height: 100%; width: 100%' src='https://docs.google.com/spreadsheets/d/1JV_y9P5UkX0jatGNpYJHQGS5Qh86NFM1LC1xddfNzbs/edit?usp=sharing &widget=true&amp;headers=false'> </iframe>";

    divBouldering.parentElement.appendChild(divSheets);

    //wait for bouldering tab to display new iframe
    setTimeout(waitForBoulderingTab, 1000);
}

function waitForBoulderingTab()
{
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

function include(filename)
{
    var head = document.getElementsByTagName('head')[0];

    var script = document.createElement('script');
    script.src = filename;
    script.type = 'text/javascript';

    head.appendChild(script)
}

if (window.attachEvent) {
    window.attachEvent('onload', scoreboardInit);
} else if (window.addEventListener) {
    window.addEventListener('load', scoreboardInit, false);
} else {
    document.addEventListener('load', scoreboardInit, false);
}


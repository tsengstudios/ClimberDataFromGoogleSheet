//
// CONSTANTS for GOOGLE APIs
//
var DEVELOPER_KEY = 'AIzaSyAKwmt3P1M8Kj3VcTuwu4hw8i_wZmxK4_Q'; // The Browser API key obtained from the Google Developers Console.
var CLIENT_ID = '922926857166-j8ot1aebe96erhoj836kjhdl493l51up.apps.googleusercontent.com'; // Your Client ID can be retrieved from your project in the Google Developer Console, https://console.developers.google.com
var SCOPES = [
//    'profile', 'email',
//    'https://www.googleapis.com/auth/plus.login',
//    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');
var DISCOVERYDOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';



//
// CONSTANTS to access data inside score sheets
//
var SHEETNAMES = ["FJR", "MJR", "FYA", "MYA", "FYB", "MYB", "FYC", "MYC", "FYD", "MYD"];
var SHEETDATAADDRESS = '!A5:Z'; // the range address of interesting data on the sheet. Note the end column allows Google to just send the interesting rows...
var MAXPROBLEMS = 4;    //Divisional Qualifiers
var CLIMBERNAMEOFFSET = 0;
var MEMBERIDOFFSET = 25;
var PROBLEMOFFSETS = [
    { Highhold: 5, Attempts: 6 },
    { Highhold: 8, Attempts: 9 },
    { Highhold: 11, Attempts: 12 },
    { Highhold: 14, Attempts: 15 },
    { Highhold: 17, Attempts: 18 },
    { Highhold: 20, Attempts: 21 }
];
var SHEETNUMPROBLEMSADDRESS = '!C2'; // the range address of the number of problems for this round
var SHEETTOPHOLDSADDRESS = '!H3:Z3'; // the range address of the top hold #'s of the problems
var SHEETTOPHOLDOFFSETS = [
    0, 3, 6, 9, 12, 15
];


//
// CONSTANTS for USAC requests
//
var sstCategoryName2CatId = {
    FJR: 2,
    MJR: 2,
    FYA: 3,
    MYA: 3,
    FYB: 4,
    MYB: 4,
    FYC: 5,
    MYC: 5,
    FYD: 6,
    MYD: 6
};
var sstCategoryName2Gender = {
    FJR: 'f',
    MJR: 'm',
    FYA: 'f',
    MYA: 'm',
    FYB: 'f',
    MYB: 'm',
    FYC: 'f',
    MYC: 'm',
    FYD: 'f',
    MYD: 'm'
};


//
// GLOBALS
//
var pickerApiLoaded = false;
var pickerOAuthToken;
var sstActiveSheetId;
function sstActiveSheetChange(newId) {
    document.getElementById('sst-googlesheetid').value = newId;
    changeIframeSrc(newId);
    sstActiveSheetId = newId;
}

//
// Structure for element of climbersVM array data
//
ClimberVM = function () {
    var self = this;

    this.Name = "";
    this.MemberId = "";
    this.Problems = [];
};
ProbVM = function () {
    var self = this;

    this.HighHold = "";
    this.Attempts = "";
};



// 
// Get data about active user's scoring module
//

function sstGetEventId() {
    var edivTabHeaders = document.querySelector(".usac-view .event-view .tab-headers");
    var eid = edivTabHeaders.getAttribute("data-eventid");

    return eid;
}

function sstGetDisciplineId() {
    var disciplinediv = document.querySelector(".usac-view .event-view .tab-body.active");
    var did = disciplinediv.getAttribute("data-disciplineid");

    // just fyi
    //var currentRoundDiv = disciplinediv.querySelector(".competitor-wrapper" + catid + "[data-gender=" + g + "] .rounds-controls a.current");
    //var rid = currentRoundDiv.getAttribute("data-roundid");
    return did;
}


//
// Google Sheets API
//

function sstPullSheetData(targetGoogleSheetId, categoryName, runWhenSuccess) {
    // Assumes gapi.load(googlesheetsdiscoveryUrl) already run, and response complete

//    var genderOffset = (gender == "m") ? 1 : 0;
//    var catOffset = (catid - 1) * 2;
//    var roundOffset = 0; // Differentiate rounds with different sheets
//    var sheetName = SHEETNAMES[roundOffset + catOffset + genderOffset];

    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: targetGoogleSheetId,
        range: categoryName + SHEETDATAADDRESS
    }).then(function (response) {
        var range = response.result;
        var climbersVM = [];

        if (range.values.length > 0) {
            for (i = 0; i < range.values.length; i++) {
                var row = range.values[i];

                if (i >= climbersVM.length - 1) {
                    climbersVM.push(new ClimberVM);
                }
                var climber = climbersVM[i];
                climber.MemberId = row[MEMBERIDOFFSET];

                for (j = 0; j < MAXPROBLEMS; j++) {
                    climber.Problems.push(new ProbVM);
                    climber.Problems[j].HighHold = row[PROBLEMOFFSETS[j].Highhold];
                    climber.Problems[j].Attempts = row[PROBLEMOFFSETS[j].Attempts];
                }
            }
            runWhenSuccess(categoryName, climbersVM);
        } else {
            alert("No data found for " + categoryName);
        }
    }, function (response) {
        alert("Error trying to pull " + categoryName + ".  " + response.result.error.message);
    });
}

//
// Initial Google API loading
//
function sstHandleClientLoad() {
    // Load the API client and auth2 and picker library
    gapi.load('client:auth2:picker', initAuth2);
}

function initAuth2() {
    var auth2 = gapi.auth2.init({
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(sstUpdateSigninStatus);

        // set the initial sign-in state.
        sstUpdateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());


        // hide or show the login and logOUT buttons
        var authorizeButton = document.getElementById('authorize-button');
        var signoutButton = document.getElementById('signout-button');
        authorizeButton.onclick = sstHandleAuthClick;
        signoutButton.onclick = sstHandleSignoutClick;

        pickerApiLoaded = true; // TODO - wouldn't hurt to actually test that here.
    });
    gapi.auth2.getAuthInstance().currentUser.listen(sstUserChanged);

}

function sstUpdateSigninStatus(isSignedIn) {
    var authorizeButton = document.getElementById('authorize-button');
    var signoutButton = document.getElementById('signout-button');
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'inline';

        sstLoadSheetsApi();
    } else {
        authorizeButton.style.display = 'inline';
        signoutButton.style.display = 'none';
    }
}

function sstHandleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function sstHandleSignoutClick(event) {
    gapi.auth2.getAuthInstance().disconnect();  // signOut() merely signs the user out of this application, but not out of the browser session.  disconnect also deauthorizes the application so that the user has to reapprove of all the actions this application will do (useful for testing AND allows for UI to sign the user into a different google user account)
}

/**
 * Listener method for when the user changes.
 *
 * @param {GoogleUser} user the updated user.
 */
var sstUserChanged = function (user) {
    var x = document.getElementById("current-google-user");
    if (x)
        x.innerHTML = user.getBasicProfile().getEmail();
};


/**
 * Load Sheets API client library.
 * Called after user is 'auth' authorized
 */
function sstLoadSheetsApi() {
    return gapi.client.load(DISCOVERYDOC)
        .then(function() {
            getpickerOAuthToken();
        });
}


//
// PICKER
//
function getpickerOAuthToken() {
    // This is necessary just to get the pickerOAuthToken in the sstHandleAuthResult()
    // pickerOAuthToken is needed for the Picker
    gapi.auth.authorize(
        {
            //'apiKey': DEVELOPER_KEY,
            'client_id': CLIENT_ID,
            'scope': SCOPES,
            'immediate': false // Needs to be true for IE 11 
        },
        sstHandleAuthResult);
}

function sstHandleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        pickerOAuthToken = authResult.access_token; // for PickerBuilder requires this
    } else {
        // they need to login
        gapi.auth2.getAuthInstance().signIn();
    }
}

function sstShowPicker() {
    // Create and render a Picker UI for picking a Google Sheet.
    if (pickerApiLoaded && pickerOAuthToken) {
        var picker = new google.picker.PickerBuilder().
            addView(google.picker.ViewId.SPREADSHEETS).
            setOAuthToken(pickerOAuthToken).
            setDeveloperKey(DEVELOPER_KEY).
            setCallback(pickerCallback).
            build();
        picker.setVisible(true);
    } else {
        getpickerOAuthToken();
    }
}

// A simple callback implementation.
function pickerCallback(data) {
    var url = 'nothing';
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var doc = data[google.picker.Response.DOCUMENTS][0];
        var fileId = data.docs[0].id;
        url = doc[google.picker.Document.URL];

        sstActiveSheetChange(fileId);
    }

}

//
// Manage category UI
//
function sstGetSelectedCategories() {
    var sstCheckboxes = document.getElementById("sst-form").getElementsByClassName("sst-toggle");
    var selectedCategories = [];
    for (var i = 0; i < sstCheckboxes.length; i++) {
        if (sstCheckboxes[i].checked) {
            selectedCategories.push(sstCheckboxes[i].value);
        }
    }
    return selectedCategories;
}

function sstGetRoundTarget() {
    var dictRoundName = {   // TODO - these values were good in the TEST Regional and Divisional
        Qualifiers: 1,
        Finals: 0,
        SuperFinals: -1
    };
    return dictRoundName[document.getElementById("sst-targetround").value];
}


//
// Test Functions
//

function TESTPullSheetData() {
    sstPullSheetData(
        document.getElementById('sst-googlesheetid').value,
        "MJR",
        TESTPullSheetDataCallback
    );
}
function TESTPullSheetDataCallback(catName, climbersVM) {
    alert("For category: " + catName + "      " + JSON.stringify(climbersVM, null, 3));
}

function TESTPushDatatoUSAC() {
    sstPullSheetData(
        document.getElementById('sst-googlesheetid').value,
        "MJR",
        TESTPushDatatoUSACCallback
    );
}
function TESTPushDatatoUSACCallback(catName, climbersVM) {
    sstipjUSACSaveClimbersTable(
        sstGetEventId(),
        sstGetDisciplineId(),
        sstGetRoundTarget(),
        sstCategoryName2CatId[catName],
        sstCategoryName2Gender[catName],
        climbersVM
    );
}

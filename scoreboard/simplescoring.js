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
var discoveryDocs = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];


//
// CONSTANTS to access data inside score sheets
//
var SHEETNAMES = ["FJR", "MJR", "FYA", "MYA", "FYB", "MYB", "FYC", "MYC", "FYD", "MYD"];
var SHEETDATAADDRESS = '!A5:Z'; // the range address of interesting data on the sheet. Note the end column allows Google to just send the interesting rows...
var MAXPROBLEMS = 6;
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


//
// GLOBALS
//
var pickerApiLoaded = false;
var pickerOAuthToken;


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


function PostSheetData(catid, gender, targetGoogleSheetId) {
    // Assumes gapi.load(googlesheetsdiscoveryUrl) already run, and response complete

    var genderOffset = (gender == "m") ? 1 : 0;
    var catOffset = (catid - 1) * 2;
    var roundOffset = 0; // Differentiate rounds with different sheets
    var sheetName = SHEETNAMES[roundOffset + catOffset + genderOffset];

    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: targetGoogleSheetId,
        range: sheetName + SHEETDATAADDRESS
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

            alert(JSON.stringify(climbersVM, null, 3));
            // ipjUSACSaveClimbersTable(catid,gender) //  TODO -- add round parameter  and climbersClipDataVM parameter

        } else {
            alert('No data found.');
        }
    }, function (response) {
        alert('Error: ' + response.result.error.message);
    });
}


//
// Initial Google API loading
//
function handleClientLoad() {
    // Load the API client and auth2 and picker library
    gapi.load('client:auth2:picker', initAuth2);
}

function initAuth2() {
    var auth2 = gapi.auth2.init({
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // set the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());


        // hide or show the login and logOUT buttons
        var authorizeButton = document.getElementById('authorize-button');
        var signoutButton = document.getElementById('signout-button');
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;

        pickerApiLoaded = true; // TODO - wouldn't hurt to actually test that here.
    });
    gapi.auth2.getAuthInstance().currentUser.listen(userChanged);

}

function updateSigninStatus(isSignedIn) {
    var authorizeButton = document.getElementById('authorize-button');
    var signoutButton = document.getElementById('signout-button');
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';

        getpickerOAuthToken();
        loadSheetsApi();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().disconnect();  // signOut() merely signs the user out of this application, but not out of the browser session.  disconnect also deauthorizes the application so that the user has to reapprove of all the actions this application will do (useful for testing AND allows for UI to sign the user into a different google user account)
}

/**
 * Listener method for when the user changes.
 *
 * @param {GoogleUser} user the updated user.
 */
var userChanged = function (user) {
    var x = document.getElementById("current-google-user");
    if (x)
        x.innerHTML = user.getBasicProfile().getEmail();
};


/**
 * Load Sheets API client library.
 * Called after user is 'auth' authorized
 */
function loadSheetsApi() {
    return gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4');
}


//
// PICKER
//
function getpickerOAuthToken() {
    // This is necessary just to get the pickerOAuthToken in the handleAuthResult()
    // pickerOAuthToken is needed for the Picker
    gapi.auth.authorize(
        {
            //'apiKey': DEVELOPER_KEY,
            'client_id': CLIENT_ID,
            'scope': SCOPES,
            'immediate': false // Needs to be true for IE 11 
        },
        handleAuthResult);
}

function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        pickerOAuthToken = authResult.access_token; // for PickerBuilder requires this
    } else {
        // they need to login
        gapi.auth2.getAuthInstance().signIn();
    }
}

function ShowPicker() {
    // Create and render a Picker UI for picking a Google Sheet.
    if (pickerApiLoaded && pickerOAuthToken) {
        var picker = new google.picker.PickerBuilder().
            addView(google.picker.ViewId.SPREADSHEETS).
            setOAuthToken(pickerOAuthToken).
            setDeveloperKey(DEVELOPER_KEY).
            setCallback(pickerCallback).
            build();
        picker.setVisible(true);
    }
}

// A simple callback implementation.
function pickerCallback(data) {
    var url = 'nothing';
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var doc = data[google.picker.Response.DOCUMENTS][0];
        var fileId = data.docs[0].id;
        url = doc[google.picker.Document.URL];

        // alert('You picked: ' + url + " <br/>with id = " + fileId);
        document.getElementById('googlesheetid').value = fileId;
    }

}

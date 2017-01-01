//
// CONSTANTS for GOOGLE APIs
//
var DEVELOPER_KEY = 'AIzaSyAKwmt3P1M8Kj3VcTuwu4hw8i_wZmxK4_Q'; // The Browser API key obtained from the Google Developers Console.
var CLIENT_ID = '922926857166-j8ot1aebe96erhoj836kjhdl493l51up.apps.googleusercontent.com'; // Your Client ID can be retrieved from your project in the Google Developer Console, https://console.developers.google.com
var SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets'
    ].join(' ');
var DISCOVERYDOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
var GOOGLESHEETSMIMETYPE = 'application/vnd.google-apps.spreadsheet';
var EXCELXLSXMIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

//
// CONSTANTS to access data inside score sheets
//
var SHEETNAMES = ["FJR", "MJR", "FYA", "MYA", "FYB", "MYB", "FYC", "MYC", "FYD", "MYD"];
var SHEETDATAADDRESS = '!A5:Z'; // the range address of interesting data on the sheet. Note the end column allows Google to just send the interesting rows...
var CLIMBERNAMEOFFSET = 0;
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
var SHEETTOPHOLDOFFSETS = [0, 3, 6, 9, 12, 15];
var SHEETDATAHEADERADDRESS = '!A4:Z4';
var SHEETROUNDNAMEADDRESS = '!D2';   // the range address of the round name


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
var sstRoundName2Rid = {   // TODO - these values were good in the TEST Regional and Divisional
    Qualifiers: 1,
    Finals: 0,
    SuperFinals: -1,
    SemiFinal:2            // TODO - Guessing
};
var sstRid2RoundAbbrev = { // TODO - these values were good in the TEST Regional and Divisional
    "1": "Q",
    "0": "F",
    "-1": "SF",
    "2":"S"                // TODO - Guessing
};


//
// GLOBALS
//
var sstAwaiting = [];
var sstDriveAPILoaded = false;
var sstPickerApiLoaded = false;
var sstPickerOAuthToken;
var sstActiveSheetId;
function sstActiveSheetChange(newId) {
    changeIframeSrc(newId);
    sstActiveSheetId = newId;
}
var sstActiveSheetAutoConvertId = "";
var sstActiveSheetAutoConvertName = "";

//
// Structure for element of climbersVM array data
//
CategoryVM = function() {
    var self = this;

    this.Name = "";
    this.RoundName = "";
    this.MaxProblems = 0;
    this.TopHolds = [];
    this.MemberIdOffset = -1;
    this.Climbers = [];
}
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

function sstLookupCatName(catid, gender) {
    var genderOffset = (gender === "m") ? 1 : 0;
    var catOffset = (catid - 2) * 2;
    var roundOffset = 0; // Differentiate rounds with different sheets
    var sheetName = SHEETNAMES[roundOffset + catOffset + genderOffset];

    return sheetName;
}


//
// Google Sheets API
//

function sstPullSheetData(targetGoogleSheetId, categoryName, runWhenSuccess) {
    // Assumes gapi.load(googlesheetsdiscoveryUrl) already run, and response complete

    gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: targetGoogleSheetId,
        ranges: [
            categoryName + SHEETNUMPROBLEMSADDRESS,
            categoryName + SHEETTOPHOLDSADDRESS,
            categoryName + SHEETDATAHEADERADDRESS,
            categoryName + SHEETDATAADDRESS,
            categoryName + SHEETROUNDNAMEADDRESS
        ]
    }).then(function (response) {
        var categoryVM = new CategoryVM();
        categoryVM.Name = categoryName;

        if (response.result.valueRanges.length < 5)
            alert("There were not the expected 5 ranges returned from this " + categoryName);

        var range0 = response.result.valueRanges[0];    // Get Number of Problems
        if (range0.values.length > 0) {
            categoryVM.MaxProblems = parseInt(range0.values[0][0]);
        } else {
            alert("The Number of problems was not found for this " + categoryName);
            return;
        }

        var range1 = response.result.valueRanges[1];    // Get Top Hold #s for each problem
        if (range1.values.length > 0) {
            var row1 = range1.values[0];
            for (var j = 0; j < categoryVM.MaxProblems; j++) {
                categoryVM.TopHolds.push(parseInt(row1[SHEETTOPHOLDOFFSETS[j]]));
            }
        } else {
            alert("The top hold numbers were not found for this " + categoryName);
            return;
        }

        var range2 = response.result.valueRanges[2];    // Find the column offset for the member id
        if (range2.values.length > 0) {
            var row2 = range2.values[0];
            for (var j = 0; j < row2.length; j++) {
                if (row2[j].startsWith("Member #")) {
                    categoryVM.MemberIdOffset = j;
                    break;
                }
            }
        } else {
            alert("The 'Member #' column header was not found for " + categoryName);
            return;
        }
        
        var range3 = response.result.valueRanges[3];    // Get the entered scores
        if (range3.values.length > 0) {
            for (var i = 0; i < range3.values.length; i++) {
                var row3 = range3.values[i];

                if (i >= categoryVM.Climbers.length - 1) {
                    categoryVM.Climbers.push(new ClimberVM);
                }
                var climber = categoryVM.Climbers[i];
                climber.Name = row3[CLIMBERNAMEOFFSET];
                climber.MemberId = row3[categoryVM.MemberIdOffset];

                for (var j = 0; j < categoryVM.MaxProblems; j++) {
                    climber.Problems.push(new ProbVM);
                    climber.Problems[j].HighHold = parseInt(row3[PROBLEMOFFSETS[j].Highhold]);
                    climber.Problems[j].Attempts = parseInt(row3[PROBLEMOFFSETS[j].Attempts]);
                }
            }
        } else {
            alert("No scores found for " + categoryName);
            return;
        }

        var range4 = response.result.valueRanges[4];    // Get Round name
        if (range4.values.length > 0) {
            categoryVM.RoundName = range4.values[0][0];
        } else {
            alert("The Round Name was not found for " + categoryName);
            return;
        }

        runWhenSuccess(categoryVM);
        
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
    gapi.auth2.init({
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

        sstPickerApiLoaded = true; // TODO - wouldn't hurt to actually test that here.
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
        sstLoadDriveApi();
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


/**
 * Drive API 
 */
function sstLoadDriveApi() {
    gapi.client.load('drive', 'v3').then(function() {
        sstDriveAPILoaded = true;
    });
}

function sstIsGoogleSheetFileId(fileId) {
    var request = gapi.client.drive.files.get({
        'fileId': originFileId
    });
    request.execute(function (resp) {
        alert (resp.mimeType == GOOGLESHEETSMIMETYPE);
    });
}

function sstCopyXLS2GoogleSheet(originFileId, newTitle, runAfterCopy) {
    if (sstDriveAPILoaded === false) {
        sstLoadDriveApi();
        return;
    }

    var request = gapi.client.drive.files.copy({
        'fileId': originFileId,
        'mimeType': 'application/vnd.google-apps.spreadsheet',
        'name': newTitle
    });
    request.execute(function (resp) {
        console.log('Copy ID: ' + resp.id);
        runAfterCopy(resp);
    });
}

function sstActiveSheetTryAutoConvert(callback) {   // use 2 globals and a nullable callback parameter
    if (sstActiveSheetAutoConvertId === "") {
        if (callback)
            callback(false);
        return; // nothing to convert
    }

    $("#sst-awaiting-autoconvert").show();
    sstCopyXLS2GoogleSheet(sstActiveSheetAutoConvertId, sstActiveSheetAutoConvertName + "_autoconverted",
        function (response) {
            $("#sst-awaiting-autoconvert").hide();
            sstActiveSheetChange(response.result.id);
            if (callback)
                callback(response.result.id);
        }
    );
}


//
// PICKER
//
function getpickerOAuthToken() {
    // This is necessary just to get the sstPickerOAuthToken in the sstHandleAuthResult()
    // sstPickerOAuthToken is needed for the Picker
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
        sstPickerOAuthToken = authResult.access_token; // for PickerBuilder requires this
    } else {
        // they need to login
        gapi.auth2.getAuthInstance().signIn();
    }
}

function sstShowPicker(callback) {
    // Create and render a Picker UI for picking a Google Sheet.
    if (sstPickerApiLoaded && sstPickerOAuthToken) {
        var picker = new google.picker.PickerBuilder().
            addView(google.picker.ViewId.SPREADSHEETS).
            setOAuthToken(sstPickerOAuthToken).
            setDeveloperKey(DEVELOPER_KEY).
            setCallback(callback).
            build();
        picker.setVisible(true);
    } else {
        getpickerOAuthToken();
    }
}

function sstPickerActiveSheetCallback(data) {
    var url = 'nothing';
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var fileId = data.docs[0].id;
        if (data.docs[0].mimeType === GOOGLESHEETSMIMETYPE) {
            sstActiveSheetAutoConvertId = "";
            sstActiveSheetChange(fileId);
            $("#divSheets").removeClass("sst-greyed-autoconverted-and-will-be-overwritten");
        } else if (data.docs[0].mimeType === EXCELXLSXMIMETYPE) {         // an XLSX fileId  0B8VRfGThSdoAQzVXV3k5UFN1VG8
            // convert and then point to the converted file
            sstActiveSheetAutoConvertId = fileId;
            sstActiveSheetAutoConvertName = data.docs[0].name;
            sstActiveSheetTryAutoConvert();
            $("#divSheets").addClass("sst-greyed-autoconverted-and-will-be-overwritten");
        } 
    }
}


//
// sst UI
//
function sstPushtoUSACClicked() {
    sstActiveSheetTryAutoConvert(sstPushtoUSAC);
}
function sstPushtoUSAC() {
    var selectedCategories = sstGetSelectedCategories();

    if (selectedCategories.length === 0) {
        alert("Please select at least 1 category to push data to USAC.");
        return;
    }

    for (var c = 0; c < selectedCategories.length; c++) {
        sstPullSheetData(sstActiveSheetId, selectedCategories[c], sstPushDatatoUSACCallback);
    }

}
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
function sstPushDatatoUSACCallback(cvm) {
    sstipjUSACSaveClimbersTable(
        sstGetEventId(),
        sstGetDisciplineId(),
        sstRoundName2Rid[cvm.RoundName],
        sstCategoryName2CatId[cvm.Name],
        sstCategoryName2Gender[cvm.Name],
        cvm
    );
}

function sstCompareClicked() {
    if (!sstActiveSheetId)
        alert("You must select the main sheet first.");
    $("sst-compare-results-div").empty();
    $("sst-compare-results-wrapper").show();

    // assume comparing with current sheet, and now need to select the other sheet
    sstShowPicker(sstPickerDoubleCheckSheetCallback);
}

function sstPickerDoubleCheckSheetCallback(data) {
    var url = 'nothing';
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var fileId = data.docs[0].id;
        if (data.docs[0].mimeType === GOOGLESHEETSMIMETYPE) {
            // now pull data on both sheets
            sstCompare(fileId);
        } else if (data.docs[0].mimeType === EXCELXLSXMIMETYPE) {         // an XLSX fileId  0B8VRfGThSdoAQzVXV3k5UFN1VG8
            // convert and then point to the converted file
            
            sstActiveSheetAutoConvertId = fileId;

            sstActiveSheetTryAutoConvert();

        }
    }
}

function sstCompare(dblCheckFileId) {
    for (var i = 0; i < SHEETNAMES.length; i++) {
        sstPullSheetData(dblCheckFileId, SHEETNAMES[i],
            function (dblCheckCVM) {
                sstPullSheetData(dblCheckFileId, SHEETNAMES[i],
                    function (cVM) {
                        sstCompareCVM(SHEETNAMES[i], cVM, dblCheckCVM);
                    });
            });
    }
}

function sstCompareCVM(categoryName, cvmMain, cvm2nd) {
    // check same climbers
    var arrayMainClimbers = sstGetJQArrayClimbers(cvmMain);
    var array2ndClimbers = sstGetJQArrayClimbers(cvm2nd);
    var arrayNotIn2nd = arrayMainClimbers.not(array2ndClimbers);
    var arrayNotInMain = array2ndClimbers.not(arrayMainClimbers);
    if (arrayNotIn2nd.length > 0 || arrayNotInMain.length > 0) {
        sstPrint("These climbers are not in the 2nd " + categoryName + "sheet:" + arrayNotIn2nd.join(', '));
        sstPrint("These climbers are not in the current " + categoryName + "sheet:" + arrayNotInMain.join(', '));
    }

    // check problems of each climber. Assumes all climbers are in Main and 2nd
    cvmMain.Climbers.forEach(function (c) {
        var c2match = cvm2nd.Climbers.find(function (c2) { return c2.MemberId === c.MemberId });

        if (c.Problems.length != c2match.Problems.length)
            sstPrint(categoryName + " have a different count of Problems (" + c.Problems.length + "," + c2match.Problems.length + ")");

        for (var iP = 0; iP < c.Problems.length; iP++) {
            if (c.Problems[iP].HighHold != c2match.Problems[iP].HighHold) {
                sstPrint(categoryName + " " + c.Name + " Problem " + iP + " Highhold " + c.Problems[iP].HighHold + " differs from " + c2match.Problems[iP].HighHold);
            }

            if (c.Problems[iP].Attempts != c2match.Problems[iP].Attempts) {
                sstPrint(categoryName + " " + c.Name + " Problem " + iP + " Attempts " + c.Problems[iP].Attempts + " differs from " + c2match.Problems[iP].Attempts);
            }
        }

    });

}
function sstPrint(s) {
    $("sst-compare-results-div")
        .append($("<p class='sst-compare-result-p'></p>")
        .text(s));
}
//function sstCompareResultsHide() {
//    $('sst-compare-results-wrapper').hide();
//}

//
// Status of Pushes to USAC
//
function sstAddAwaiting(toAdd) {
    sstAwaiting.push(toAdd);
    sstDisplayAwaiting();
}

function sstDisplayAwaiting() {
    var s = "";
    for (var i = 0; i < sstAwaiting.length; i++) {
        s += sstAwaiting[i] + " ";
    }
    $("#sst-awaiting-span").text(s);
    if (sstAwaiting.length > 0) {
        $("#sst-awaiting-p").show();
    } else {
        $("#sst-awaiting-p").hide();
    }
}

function sstRemoveAwaiting(toRemove) {
    var index = sstAwaiting.indexOf(toRemove);

    if (index > -1) {
        sstAwaiting.splice(index, 1);
    } else {    // toRemove is not found
        alert("somehow was asked to remove an item we didn't ask to be pushed?");
    } 
    sstDisplayAwaiting();
}

function sstGenAwaitingName(rid,catid,g,pid) {
    return sstLookupCatName(catid, g) + "-" + sstRid2RoundAbbrev[rid] + pid;
}




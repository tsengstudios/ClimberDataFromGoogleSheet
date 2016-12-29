
function sstipjUSACSaveClimbersTable(eid, did, rid, catid, g, climbersVM) {
    if (ipjUSACBusy) {
        return false;
    }

    var t = 99; var torig = 99;   // TODO -- IS this ever used?  It seems like it's completely ignored.  ELSE use an array, and import into a global

    ipjUSACBusy = true;
    try {
        for (pid = 1; pid < 5; pid++) {     // TODO -- calculate max # Problems  THIS SHOULD be MAXPROBLEMS....
            var scores = sstGetScoresOf1Prob(pid, climbersVM);

            var rs = 2; // Assuming 2 is always good RoundStatus. I was looking at my current Test Module's problem "round statuses": ipjUSACGetRoundStatus(did, rid, g, catid);
            ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "savescoresonsight|" + eid + "|" + did + "|" + g + "|" + catid + "|" + rid + "|" + pid + "|" + t + "|" + torig + "|" + rs + "|" + scores, sstonSaveScoresOnsightResponse, null, true);

            //TODO -- should implement a counter for ipjUSACBusy = false  to tested and decremented in sstonSaveScoresOnsightResponse
        }
    } catch (e) {
        alert('An exception occurred saving pasted onsight scores.');
        ipjUSACBusy = false;
    }
}


function sstGetScoresOf1Prob(problemNumber, climbersVM) {
    var s = "";

    for (r = 0; r < climbersVM.length; r++) {
        if (problemNumber < 0 || climbersVM[r].Problems.length < problemNumber)
            continue;
        else {
            s += climbersVM[r].MemberId;
            s += ("^" + climbersVM[r].Problems[problemNumber - 1].HighHold);
            s += ("^" + climbersVM[r].Problems[problemNumber - 1].Attempts);
        }
        s += "~";
    }
    return s;
}

function sstonSaveScoresOnsightResponse(objXMLHTTP) {     // Does not update data shown on webpage
    ipjUSACBusy = true;
    var r = "";
    try {
        var s = objXMLHTTP.responseText;
        r = s.substring(0, 2);
        if ((r == "s1") || (r == "s2")) { // success would normally update the ui here
            //var responseFrom = s.split("|", 6);
            s = s.substring(2);
            var eid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var did = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var catid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var g = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var rid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var pid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);

            console.log("a post to server has returned! category=" + catid +
                                                        " gender=" + g +
                                                        " problem=" + pid);
            return true;
        } else if (r == "s3") {  // an error returned
            s = s.substring(2);
            var eid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var did = s.substring(0, s.indexOf("|"));
            ipjUSACFlagForRefresh(true);
            var tab = document.querySelector(".usac-view .event-view .tab-header[data-disciplineid='" + Math.abs(did) + "']");
            var tabBody = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']");
            alert("Scores could not be saved because the current round is no longer available for scoring. Click OK to refresh.");
            tabBody.innerHTML = s.substring(s.indexOf("|") + 1);
            tab.setAttribute("data-loaded", "true");
            ipjUSACSetVisibleCategories(did);
        }
        alert('An error occurred saving scores for onsight. Perhaps you did not complete a round to allow for entering scores of this selected round for the selected category.' + s);
    } catch (e) {
        alert('An exception occurred saving scores for onsight.');
    } finally {
        ipjUSACBusy = false;
        if (r != "s3") {

        }
    }

    return false;
}

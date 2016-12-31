function ipjUSACDoPostback(et, ea) {
    ipjUSACLinkElement('hdnUSACPostbackGUID').value = ipjGetPsuedoGUID();
    __doPostBack(et, ea);
}
function ipjUSACSessionKeepAlive() {
    clearTimeout(ipjSessionWarningTimer);
    ipjSessionKeepAlive();
    ipjSessionWarningSet();
}
function ipjUSACFlagForRefresh(excludeAllTab, excludeActiveTab, excludeThisDid) {
    var tabs = document.querySelectorAll(".usac-view .event-view .tab-header[data-loaded='true']" + (excludeActiveTab ? ":not(.active)" : ""));
    for (i = 0; i < tabs.length; i++) {
        if (excludeAllTab && (tabs[i].getAttribute("data-disciplineid") == "0")) {
        } else if (tabs[i].getAttribute("data-disciplineid") == "" + excludeThisDid) {
        } else {
            tabs[i].setAttribute("data-loaded", "false");
        }
    }
}
function ipjUSACHideAll() {
    document.querySelector(".wizard-intro").style.display = "none";
    var lst = document.querySelectorAll(".container");
    for (i = 0; i < lst.length; i++) {
        lst[i].style.display = "none";
    }
}
function ipjUSACShowView(selector, focusToSelector) {
    ipjUSACHideAll();
    var lst = document.querySelectorAll(selector);
    for (i = 0; i < lst.length; i++) {
        lst[i].style.display = "";
    }
    if (focusToSelector) {
        var e = document.querySelector(focusToSelector);
        if (e) e.focus();
    }
}
function ipjUSACSetCRegion(ddl) {
    var c = document.querySelector(".usac-view table.create-event tr.region-ccs");
    var s = document.querySelector(".usac-view table.create-event tr.region-scs");
    if (ddl.options[ddl.selectedIndex].value == 1) {
        ipjUSACToggleRequiredFields(c, s);
    } else {
        ipjUSACToggleRequiredFields(s, c);
    }
}
function ipjUSACCreateEvent() {
    ipjUSACShowView(".create-event");
}
function ipjUSACCancelCreateEvent() {
    ipjUSACShowView(".landing-page");
}
function ipjUSACSaveCreatedEvent(spn) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, ' disabled')) {
        return false;
    }
    if (ipjContains(spn.className, ' busy')) {
        return false;
    }
    ipjUSACBusy = true;
    spn.className = spn.className + " busy";
    spn.innerHTML = "Working...";
    try {
        var s = ipjUSACGetInputFromTableRows(".usac-view table.create-event tr", "^");
        if (!s) {
            alert('Please provide all required values.');
            ipjUSACBusy = false;
            spn.className = spn.className.replace(' busy', '');
            spn.innerHTML = "Add"
            var t = document.querySelector(".usac-view table.create-event");
            if (!ipjContains(t.className, "required")) {
                t.className += " required";
            }
            return;
        }
        var ss = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "validatenewevent|" + s.substring(1));
        if (ss.charAt(0) == 's') {
            if (ss.substring(1, 2) == '1') {
                ipjUSACDoPostback("createevent", s.substring(1));
            } else {
                alert(ss.substring(2));
                ipjUSACBusy = false;
                spn.className = spn.className.replace(' busy', '');
                spn.innerHTML = "Add"
            }
        } else {
            alert('An error occurred validation the input.');
        }
    } catch (e) {
        ipjUSACBusy = false;
        spn.className = spn.className.replace(' busy', '');
        spn.innerHTML = "Add"
    }
}
function ipjUSACClaimEvent() {
    ipjUSACShowView(".wizard-1");
}
function ipjUSACShowEvent(eventID) {
    ipjUSASelectedEventID = eventID ? eventID : 0;
    ipjUSACDoPostback("showevent_" + eventID, eventID);
}
function onSearchResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var btn = document.querySelector('.ipf-usac-search-btn');
        btn.className = btn.className.replace(' busy', '');
        btn.innerHTML = "Search"
        document.getElementById('divSearchResults').style.display = "";
        ipjUSACSelectedEventID = 0;
        ipjUSACExternalEventID = "";
        if (objXMLHTTP.responseText.charAt(0) == 's') {
            var strSuccess = objXMLHTTP.responseText.substring(1, 2);
            if (strSuccess == '1') {
                document.querySelector('.search-success').style.display = "";
                document.getElementById('divResultsHolder').innerHTML = unescape(objXMLHTTP.responseText.substring(2));
                return;
            }
        }
        document.getElementById('divResultsHolder').innerHTML = "";
        document.querySelector('.search-fail').style.display = "";
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACSearch(spn) {
    if (!ipjUSACBusy) {
        ipjUSACBusy = true;
        spn.className = spn.className + " busy";
        spn.innerHTML = "Working...";
        document.querySelector('.search-success').style.display = "none";
        document.querySelector('.search-fail').style.display = "none";
        var ddl1 = document.getElementById('ddlSearchByState');
        var s = "dosearch|"
        + escape(document.getElementById('txtSearchByName').value) + "|"
        + escape(document.getElementById('txtSearchByCity').value) + "|"
        + ddl1.options[ddl1.selectedIndex].value + "|";
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, s, onSearchResponse, null, true);
    }
}
function ipjUSACRoundChange(ddl, did) {
    var rid = parseInt(ddl.options[ddl.selectedIndex].value);
    if (rid == 1) {
        var div = document.querySelector("#divEventSetup .round-scoring[data-disciplineid='" + Math.abs(did) + "'][data-roundid='1'] .round-name");
        div.innerHTML = "Qualifer Round";
    } else if (rid == 2) {
        var div = document.querySelector("#divEventSetup .round-scoring[data-disciplineid='" + Math.abs(did) + "'][data-roundid='1'] .round-name");
        div.innerHTML = "Semi-Final Round";
        var div = document.querySelector("#divEventSetup .round-scoring[data-disciplineid='" + Math.abs(did) + "'][data-roundid='2'] .round-name");
        div.innerHTML = "Qualifer Round";
    }
    var lst = document.querySelectorAll("#divEventSetup .round-scoring[data-disciplineid='" + Math.abs(did) + "']");
    for (i = 0; i < 3; i++) {
        if (parseInt(lst[i].getAttribute("data-roundid")) <= rid) {
            lst[i].style.display = "block";
        } else {
            lst[i].style.display = "none";
        }
    }
}
function ipjUSACScoringChange(ddl, did, rid) {
    var s = ddl.options[ddl.selectedIndex].value;
    var lst = document.querySelectorAll("#divEventSetup .round-scoring[data-disciplineid='" + did + "'][data-roundid='" + rid + "'] tr.details");
    for (i = 0; i < lst.length; i++) {
        if (ipjContains(lst[i].className, "scoring" + s)) {
            lst[i].style.display = "table-row";
        } else {
            lst[i].style.display = "none";
        }
    }
    lst = document.querySelectorAll("#divEventSetup .round-scoring[data-disciplineid='" + did + "'][data-roundid='" + rid + "'] tr.details.scoring" + s + " .problem");
    for (i = 0; i < lst.length; i++) {
        lst[i].className = "problem scoring" + s;
    }
}
function ipjUSACRowSelect(row) {
    ipjUSACSelectedEventID = 0;
    ipjUSACExternalEventID = "";
    var lst = document.querySelectorAll("#divResultsHolder tr");
    for (i = 0; i < lst.length; i++) {
        lst[i].className = "";
    }
    row.className = "highlight";
    ipjUSACSelectedEventID = row.getAttribute("data-eventid");
    ipjUSACExternalEventID = row.getAttribute("data-externalid");
    if (!ipjUSACExternalEventID) {
        ipjUSACExternalEventID = "";
    }
}
function ipjUSACProcessWizard1() {
    if (ipjUSACBusy) {
        return false;
    }
    if (!ipjUSACSelectedEventID) {
        alert('An event selection is required.');
        return false;
    }
    document.getElementById('tdSelectedEventName').innerHTML = document.querySelector("#divResultsHolder tr[data-eventid='" + ipjUSACSelectedEventID + "'] td.event-name").innerHTML;
    return true;
}
function ipjUSACRequestPassword() {
    ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "dopwordrequest|" + ipjUSACSelectedEventID);
    alert('The password has been requested.');
}
function ipjUSACProcessWizard2() {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        var pw = document.getElementById('txtSelectedEventPword').value;
        if (!pw) {
            alert('Password is required.');
            return false;
        }
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "checkpword|" + ipjUSACSelectedEventID + "|" + escape(pw));
        if (s.charAt(0) == 's') {
            if (s.substring(1, 2) == '1') {
                document.getElementById('txtSelectedEventPword').value = "";
                if (ipjUSACExternalEventID.length > 0) {
                    document.getElementById('rbImport').checked = true;
                    document.getElementById('txtThrivaEventID').value = ipjUSACExternalEventID;
                    document.getElementById('txtThrivaEventID').setAttribute("readonly", "readonly");
                    document.getElementById('lnkThrivaIDCheck').style.display = "none";
                    document.getElementById('lnkRequestThrivaID').style.display = "none";
                } else {
                    document.getElementById('rbRegistration').checked = true;
                    document.getElementById('txtThrivaEventID').value = "";
                    document.getElementById('txtThrivaEventID').removeAttribute("readonly");
                    document.getElementById('lnkThrivaIDCheck').style.display = "";
                    document.getElementById('lnkRequestThrivaID').style.display = "";
                }
                return true;
            }
            alert(s.substring(2));
        } else {
            alert('An error occurred checking the password');
        }
    } finally {
        ipjUSACBusy = false;
    }
    return false;
}
function ipjUSACProcessWizard3() {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        if (document.getElementById('rbImport').checked) {
            if (ipjTrim(document.getElementById('txtThrivaEventID').value) == "") {
                alert("Registration system event ID is required to import competitors");
                return false;
            }
        }
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "getscoringlayout|" + ipjUSACSelectedEventID);
        if (s.charAt(0) == 's') {
            if (s.substring(1, 2) == '1') {
                document.getElementById('divScoringLayout').innerHTML = unescape(s.substring(2));
                return true;
            }
            alert(s.substring(2));
        }
    } finally {
        ipjUSACBusy = false;
    }
    return false;
}
function ipjUSACProcessWizard4() {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        var lst = document.querySelectorAll(".wizard-4 #divScoringLayout input[type='text']");
        for (i = 0; i < lst.length; i++) {
            if (lst[i].clientWidth > 0) {
                if ((ipjTrim(lst[i].value) == "") || (ipjTrim(lst[i].value) == "0")) {
                    alert('All fields are required');
                    return false;
                } else if ((lst[i].className == "problem scoring2") && (parseInt(lst[i].value) > 6)) {
                    alert('For Onsight scoring, the maximum number of problems is 6.');
                    return false;
                }
            }
        }
        lst = document.querySelectorAll(".wizard-4 #divScoringLayout select");
        for (i = 0; i < lst.length; i++) {
            if (lst[i].clientWidth > 0) {
                if ((lst[i].selectedIndex > -1) && (ipjTrim(lst[i].options[lst[i].selectedIndex].text) == "")) {
                    alert('All fields are required');
                    return false;
                }
            }
        }
        var s = "";
        for (d = 1; d < 4; d++) {
            s = s + "|" + d;
            s = s + "|" + ipjGetCHKValueIfVisible("chkOpen" + d, "0");
            for (r = 2; r >= -1; r--) {
                s = s + "|" + ipjGetDDLValueIfVisible("ddlScoring" + d + "" + r, "");
                s = s + "|" + ipjGetTXTValueIfVisible("txtProblems" + d + "" + r, "");
                s = s + "|" + ipjGetTXTValueIfVisible("txtRoutes" + d + "" + r, "");
                s = s + "|"; // placeholder for round statuses
                s = s + "|"; // placeholder for round problem highpoints
            }
        }
        var ids = ipjUSACSelectedEventID;
        if (document.getElementById('rbImport').checked) {
            ids += ("-" + document.getElementById('txtThrivaEventID').value);
        }
        ipjUSACDoPostback("claimevent_" + ipjUSACSelectedEventID, ids + s);
    } finally {
        ipjUSACBusy = false;
    }
    return false;
}
function ipjUSACSetVisibleCategories(did) {
    did = Math.abs(parseInt(did));
    var tabBody = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "']");
    var sel = tabBody.querySelector(".main-section .control-section .categories");
    for (i = sel.options.length - 1; i >= 1; i--) {
        sel.remove(i);
    }
    var inew = 0;
    var tbls = tabBody.querySelectorAll(".competitor-list-wrapper table.competitor-list");
    for (i = 0; i < tbls.length; i++) {
        var div = tabBody.querySelector(".main-section .competitor-wrapper" + tbls[i].getAttribute("data-categoryid") + "." + tbls[i].getAttribute("data-gender"));
        if (tbls[i].getAttribute("data-hascompetitors") == "true") {
            div.className = div.className.replace(" hide", "");
            inew++;
            sel.appendChild(getCategoryOptionFromPlaceholder(i + 1, inew));
        } else {
            div.className = (div.className + " hide");
        }
    }
}
function getCategoryOptionFromPlaceholder(di, newdi) {
    var tmp = document.querySelector('select.temp-categories.placeholder option[data-index="' + di + '"]');
    if (tmp) {
        var opt = document.createElement('option');
        var tid = document.querySelector('.usac-view .event-view #divTabHeaders').getAttribute("data-eventtypeid");
        var name = tmp.getAttribute("data-eventtypeid-" + tid);
        if (!name) {
            name = tmp.text;
        }
        opt.text = name;
        opt.value = tmp.value;
        opt.setAttribute('data-index', newdi);
        if (di > 0) {
            opt.setAttribute('data-gender', tmp.getAttribute('data-gender'));
        }
        return opt;
    }
}
function ipjUSACSendInvites(btn, eid, did, d) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(btn.className, 'invitations-sent')) {
        return false;
    }
    if (confirm('SEND INVITATIONS?\n\nWould you like to send invitations to the selected competitors in each category?')) {
        var s = "";
        var e = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + did + '"]');
        var lst = e.querySelectorAll('input[type="checkbox"].qualified,input[type="checkbox"].not-qualified');
        for (i = 0; i < lst.length; i++) {
            if (lst[i].checked) {
                s += (lst[i].id + ",");
            }
        }
        if (s != "") {
            try {
                ipjUSACFlagForRefresh(true, true);
                ipjUSACBusy = true;
                btn.innerHTML = "working..."
                btn.className = (btn.className + " busy");
                var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "sendinvites|" + eid + "|" + did + "|" + s, null, true);
                if (s.charAt(0) == 's') {
                    alert('Invitation emails have been queued for sending.');
                    for (i = 0; i < lst.length; i++) {
                        if (lst[i].checked) {
                            lst[i].disabled = true;
                            lst[i].className = "invited pending";
                            lst[i].parentElement.className = "qualification invited pending";
                            lst[i].nextSibling.innerHTML = "Pending";
                        }
                    }
                } else {
                    alert(s);
                }
            } finally {
                ipjUSACBusy = false;
                btn.className = btn.className.replace(' busy', '');
                btn.className = btn.className.replace(' typical-button', ' invitations-sent');
                btn.innerHTML = "Invitations Sent";
            }
        } else {
            alert("Select competitors to receive an invitation.");
        }
    }
}
function ipjUSACReShowEmailButton(eid, did) {
    if (ipjUSACBusy) {
        return false;
    }
    var btn = document.querySelector('.tab-body.complete[data-disciplineid="' + Math.abs(did) + '"] .invite-competitors');
    if (btn) {
        btn.className = btn.className.replace(' invitations-sent', ' typical-button');
        btn.innerHTML = "Send Invitations";
    }
}
function ipjTabHeaderClick(tab, bodyID, force) {
    if (ipjUSACBusy) {
        return false;
    }
    if ((!force) && ipjContains(tab.className, "active")) {
        ipjUSACSessionKeepAlive();
        return;
    }
    ipjUSACBusy = true;
    var n = tab.innerHTML;
    try {
        var tabBody = document.querySelector(".usac-view .event-view #" + bodyID);
        if ((force) || (tab.getAttribute("data-loaded") != "true")) {
            tab.innerHTML = "working..."
            tab.className = (tab.className + " busy");
            var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "getcompetitors|" + tab.getAttribute('data-eventid') + "|" + tab.getAttribute('data-disciplineid'), null, true);
            if (s.charAt(0) == 's') {
                tabBody.innerHTML = s.substring(1);
                tab.setAttribute("data-loaded", "true");
                ipjUSACSetVisibleCategories(tab.getAttribute('data-disciplineid'));
            } else {
                tabBody.innerHTML = '<p>error</p>';
            }
        }
        var lst = document.querySelectorAll(".usac-view .event-view .tab-header.active");
        for (i = 0; i < lst.length; i++) {
            if (lst[i].id != tab.id) {
                lst[i].className = "tab-header";
            }
        }
        tab.className = "tab-header active";
        tab.innerHTML = n;
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body.active");
        for (i = 0; i < lst.length; i++) {
            if (lst[i].id != tabBody.id) {
                lst[i].className = lst[i].className.replace(" active", "");
                lst[i].className = lst[i].className.replace("active", "");
            }
        }
        if (!ipjContains(tabBody.className, " active")) {
            tabBody.className = (tabBody.className + " active");
        }
    } finally {
        ipjUSACBusy = false;
        tab.innerHTML = n;
        tab.className = tab.className.replace(" busy", "");
    }
}
function ipjUSACCompetitorCategoryChange(ddl) {
    var d = ddl.getAttribute("data-disciplineid"); //discipline (which tab are we on)
    var c = ddl.options[ddl.selectedIndex].value;
    var g = ddl.options[ddl.selectedIndex].getAttribute("data-gender"); //gender
    ipjUSACSetSelectedCategory(d, c, g);
}
function ipjUSACSetSelectedCategory(did, cat, g) {
    if (cat == "0") {
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper");
        for (i = 0; i < lst.length; i++) {
            lst[i].style.display = "block";
        }
    } else {
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper");
        for (i = 0; i < lst.length; i++) {
            lst[i].style.display = "none";
        }
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + cat + "." + g);
        for (i = 0; i < lst.length; i++) {
            lst[i].style.display = "block";
        }
    }
}
function ipjUSACUpdateCompetitorStatus(txt, prev, cid, eid, did) {
    if (txt.value != unescape(prev)) {
        if (txt.value == "FN") {
            var lst = document.querySelectorAll(".usac-view .event-view .tab-body .competitor-list tr[data-competitorid='" + cid + "'] .competitor-status");
            for (i = 0; i < lst.length; i++) {
                lst[i].value = txt.value;
            }
        }
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "updatestatus|" + eid + "|" + did + "|" + cid + "|" + escape(txt.value));
    }
}
function ipjUSACUpdateCompetitorBib(txt, prev, cid, eid, did, catid, g) {
    if (txt.value != unescape(prev)) {
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "updatebib|" + eid + "|" + did + "|" + catid + "|" + g + "|" + cid + "|" + escape(txt.value), null, null, true);
    }
}
function ipjUSACRoundClick(lnk, eid, did, catid, g, rid) {
    if (ipjContains(lnk.className, "disabled")) {
        return false;
    } else if (ipjUSACBusy) {
        return false;
    } else if (ipjContains(lnk.parentElement.className, "disabled")) {
        return false;
    } else if (ipjContains(lnk.className, "current")) {
        ipjUSACSessionKeepAlive();
        return false;
    } else if (ipjContains(" " + lnk.parentElement.className + " ", " complete ")) {
        return false;
    }
    try {
        ipjUSACBusy = true;
        var name = lnk.innerHTML;
        lnk.className = lnk.className + " busy";
        lnk.innerHTML = "Working...";
        var r = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .competitor-header .rounds-controls a.current:not(.disabled)");
        if (r) {
            r = r.getAttribute("data-roundid");
            if (r != "") {
                if (!ipjUSACPromptToSaveScores(eid, did, catid, g, r)) {
                    return false;
                }
            }
        }
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "showround|" + eid + "|" + did + "|" + catid + "|" + g + "|" + rid, null, true);
        if (s.substring(0, 2) == "s1") {
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
            div.innerHTML = s.substring(2);
        } else {
            alert('An error occurred selecting the round.');
        }
    } catch (e) {
        alert('An exception occurred selecting the round.');
    } finally {
        ipjUSACBusy = false;
        lnk.className = lnk.className.replace(' busy', '');
        lnk.innerHTML = name;
    }
}
function ipjUSACShowFinalStandings(lnk, eid, did, catid, g) {
    if (ipjContains(lnk.className, "disabled")) {
        return false;
    } else if (ipjContains(lnk.parentElement.className, "disabled")) {
        return false;
    } else if (ipjUSACBusy) {
        return false;
    } else if (ipjContains(lnk.className, "current")) {
        ipjUSACSessionKeepAlive();
        return false;
    }
    try {
        ipjUSACBusy = true;
        var name = lnk.innerHTML;
        lnk.className = lnk.className + " busy";
        lnk.innerHTML = "Working...";
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "showfinalstandings|" + eid + "|" + did + "|" + catid + "|" + g, null, true);
        if (s.substring(0, 2) == "s1") {
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
            div.innerHTML = s.substring(2);
        } else {
            alert('An error occurred displaying the final standings.');
            lnk.className = lnk.className.replace(' busy', '');
            lnk.innerHTML = name;
        }
    } catch (e) {
        alert('An exception occurred displaying the final standings.');
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACScoringDisabled(lnk, did) {
    var b = false;
    if (ipjUSACBusy) {
        b = true;
    } else if (ipjContains(lnk.className, "disabled")) {
        b = true;
    } else if (ipjContains(lnk.parentElement.className, "disabled")) {
        b = true;
    } else if (ipjContains(document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']").className, "complete")) {
        b = true;
    }
    return b;
}
function ipjUSACBeginScoring(lnk, eid, did, catid, g) {
    if (ipjUSACScoringDisabled(lnk, did)) {
        return false;
    }
    try {
        ipjUSACBusy = true;
        lnk.className = lnk.className + " busy";
        lnk.innerHTML = "Working...";
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "beginscoring|" + eid + "|" + did + "|" + catid + "|" + g, null, true);
        if (s.substring(0, 2) == "s1") {
            var ddl = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .control-section .categories");
            var gender = g;
            if (g == 'm') {
                gender = 'male';
            } else if (g == 'f') {
                gender = 'female';
            }
            var i = ddl.querySelector("option[value='" + catid + "'][data-gender='" + gender + "']").getAttribute("data-index");
            ddl.selectedIndex = i;
            ipjUSACCompetitorCategoryChange(ddl)
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
            div.innerHTML = s.substring(2);
        } else {
            alert('An error occurred starting scoring.');
        }
    } catch (e) {
        alert('An exception occurred starting scoring.');
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACFinishScoring(lnk, eid, did, catid, g) {
    if (ipjContains(lnk.className, "disabled")) {
        return false;
    } else if (ipjUSACBusy) {
        return false;
    }
    try {
        ipjUSACBusy = true;
        lnk.className = lnk.className + " busy";
        lnk.innerHTML = "Working...";
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "finishscoring|" + eid + "|" + did + "|" + catid + "|" + g, null, true);
        if (s.substring(0, 2) == "s1") {
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
            div.innerHTML = s.substring(2);
        } else {
            alert('An error occurred finishing scoring.');
            lnk.className = lnk.className.replace(' busy', '');
            lnk.innerHTML = "Finish Scoring";
        }
    } catch (e) {
        alert('An exception occurred finishing scoring.');
        lnk.className = lnk.className.replace(' busy', '');
        lnk.innerHTML = "Finish Scoring";
    } finally {
        ipjUSACBusy = false;
    }
}
function onTieBreakerScoresSavedResponse(objXMLHTTP) {
    if (onSaveScoresOnsightResponse(objXMLHTTP)) {
        var s = objXMLHTTP.responseText;
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
        ipjUSACCompleteRoundWithTies(eid, did, catid, g, rid, false);
    }
}
function ipjUSACIsClimbOffRound(did, catid, g, rid) {
    var b = false;
    if (rid > 0) {
        var tab = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']");
        if (tab && ipjContains(tab.id, "Speed")) {//speed discipline...
            if (tab.querySelector(".competitor-wrapper" + catid + "[data-gender='" + g + "'] .competitor-list").getAttribute("data-scoringtype") == "onsight") {//onsight scoring...
                b = true;
            }
        }
    }
    return b;
}
function ipjUSACCompleteRoundWithTies(eid, did, catid, g, rid, prompt) {
    if (prompt) {
        prompt = ipjUSACPromptToSaveScores(eid, did, catid, g, rid, onTieBreakerScoresSavedResponse);
        if (!prompt) {
            return false;
        }
        if (prompt == 2) {
            prompt = false;
        }
    }
    if (!prompt) {
        var ties = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] tr[data-tied='true']");
        if (ties.length > 0) {
            ipjUSACShowOnsightSpeedTieBreak(eid, did, catid, g, rid, true);
        } else {
            var spn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .rounds-wrapper .buttons-section .complete-round");
            ipjUSACCompleteRound(spn, eid, did, catid, g, rid, 3);
        }
    }
}
function ipjUSACEmptyScoresExist(eid, did, catid, g, rid) {
    var b = false;
    try {
        var t = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .competitor-list-wrapper table");
        if (t.getAttribute("data-scoringtype") == "onsight") {
            if (t.getAttribute("data-discipline") == "speed") {
                var rows = t.querySelectorAll("tr[data-competitorid]");
                for (r = 0; r < rows.length; r++) {
                    var v1 = ipjTrim(rows[r].querySelector("td.scoring.time1 input").value);
                    var v2 = ipjTrim(rows[r].querySelector("td.scoring.time2 input").value);
                    if (((v1 == "") || (parseInt(v1) == 0)) && ((v2 == "") || (parseInt(v2) == 0))) {
                        b = true;
                        break;
                    }
                }
            } else {
                var inputs = t.querySelectorAll("td.scoring:not(.clips) input[type='text']");
                for (i = 0; i < inputs.length; i++) {
                    var v = ipjTrim(inputs[i].value);
                    if ((v == "") || (parseInt(v) == 0)) {
                        b = true;
                        break;
                    }
                }
            }
        } else if (t.getAttribute("data-scoringtype") == "redpoint") {
            var points = t.querySelectorAll("tr[data-competitorid] td.points span");
            for (p = 0; p < points.length; p++) {
                var v = points[p].innerHTML;
                if (v == "") {
                    b = true;
                    break;
                }
            }
        }
    } catch (e) {
    }
    return b;
}
function ipjUSACCompleteRound(spn, eid, did, catid, g, rid, mode) {
    if (ipjContains(spn.className, "disabled")) {
        return false;
    } else if (ipjUSACBusy) {
        return false;
    }
    if ((mode != 3) && ipjUSACEmptyScoresExist(eid, did, catid, g, rid)) {
        if (!confirm('COMPLETE ROUND?\n\nScores for some competitors have not been entered.\n\nAre you sure you want to complete this round?\n\n')) {
            return false;
        }
    }
    spn.className = spn.className + " busy";
    spn.innerHTML = "Working...";
    if ((mode != 1) || confirm("COMPLETE ROUND?\n\nPlease ensure that you have entered all special cases for the competitors in the Status field. This information can impact which competitors advance to the next round or qualify for future events.\n\nComplete this round?\n\n")) {
        if ((mode != 3) && ipjUSACIsClimbOffRound(did, catid, g, rid)) {
            ipjUSACCompleteRoundWithTies(eid, did, catid, g, rid, true);
        } else {
            var keep = false;
            if ((mode == 2) && (rid > -1)) {
                keep = confirm("KEEP EXISTING COMPETITORS?\n\nYou are attempting to complete a round for which competitors have already been advanced.\n\nIf competitors that previously qualified for the next round no longer qualify, do you wish to keep those competitors in the next round as exceptions?\n\nChoose OK to keep all existing competitors.\n\nChoose Cancel to remove existing competitors who no longer qualify.\n\n");
            }
            try {
                ipjUSACBusy = true;
                if (mode != 3) {
                    if (!ipjUSACPromptToSaveScores(eid, did, catid, g, rid)) {
                        return false;
                    };
                }
                var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "completeround|" + eid + "|" + did + "|" + catid + "|" + g + "|" + rid + "|" + keep + "|", null, true); //+scores
                if (s.substring(0, 2) == "s1") {
                    s = s.substring(2);
                    var did = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var catid = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var g = s.substring(0, s.indexOf("|"));
                    var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
                    div.innerHTML = s.substring(s.indexOf("|") + 1)
                } else {
                    alert('An error occurred completing the round.');
                }
            } catch (e) {
                alert('An exception occurred completing the round.');
            } finally {
                ipjUSACBusy = false;
                spn.className = spn.className.replace(" busy", "");
                spn.innerHTML = "Complete Round";
            }
        }
    } else {
        spn.className = spn.className.replace(" busy", "");
        spn.innerHTML = "Complete Round";
    }
}
function ipjUSACAdvanceCompetitor(lnk, cid, eid, did, catid, g, rid) {
    if (confirm("Advance this competitor to the next round?")) {
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "advancecompetitor|" + eid + "|" + cid + "|" + did + "|" + catid + "|" + g + "|" + rid);
        if (s.substring(0, 2) == "s1") {
            lnk.className = "hide";
        }
    }
}
function ipjUSACRemoveCompetitor(cid, eid, did, catid, g, rid, pid, dq) {
    var s = (dq ? "Disqualify" : "Remove") + " this competitor from " + ((did == 0) ? "the current event?" : "the current round?");
    if (confirm(s)) {
        try {
            ipjUSACBusy = true;
            s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "removecompetitor|" + eid + "|" + cid + "|" + did + "|" + catid + "|" + g + "|" + rid + "|" + pid);
            if (s.substring(0, 2) == "s1") {
                s = ((did == 0) ? ".usac-view .event-view .tab-body .competitor-list tr[data-competitorid='" + cid + "']" : ".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-list tr[data-competitorid='" + cid + "'][data-disciplineid='" + did + "']");
                var lst = document.querySelectorAll(s);
                for (i = 0; i < lst.length; i++) {
                    lst[i].style.display = "none";
                }
            } else if (s.substring(0, 2) == "s2") {
                if (g == 'Male') {
                    g = 'm';
                } else if (g == 'Female') {
                    g = 'f';
                }
                var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
                div.querySelector(".competitor-list-wrapper").innerHTML = s.substring(s.indexOf("|") + 1);
            }
        } finally {
            ipjUSACBusy = false;
        }
    }
}
function onCompetitionStartedResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        if (s.charAt(0) == 's') {
            var did = s.substring(1, s.indexOf("|"));
            if (did > 0) {
                s = s.substring(s.indexOf("|") + 1);
                var b = s.substring(0, s.indexOf("|")); //all disciplines have been started
                s = s.substring(s.indexOf("|") + 1);
                document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "']").innerHTML = s;
                ipjUSACSetVisibleCategories(did);
                if (b == "true") {
                    var btn = document.querySelector(".usac-view .event-view #divAll.tab-body .main-section .control-section .import-competitors:not(.disabled)");
                    if (btn) {
                        btn.className = (btn.className + " disabled");
                    }
                }
                return;
            } else {
                alert('ERROR: ' + objXMLHTTP.responseText);
            }
        } else {
            alert('ERROR: ' + objXMLHTTP.responseText);
        }
        var btn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .start-competition");
        if (btn) {
            btn.className = btn.className.replace(' busy', '');
            btn.innerHTML = "Start Competition";
        }
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACStartCompetition(span, eid, did, d) {
    if (ipjUSACBusy) {
        return false;
    }
    if (confirm('START COMPETITION?\n\nOnce the ' + d + ' competion has been started, you will no longer be able to import competitors for this discipline.\n\nStart the ' + d + ' competion now?\n\n')) {
        alert('Note: Competitors may be manually added to the ' + d + ' competition until the first round is completed.\n\n');
        ipjUSACBusy = true;
        span.className = span.className + " busy";
        span.innerHTML = "Working...";
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "startcompetition|" + eid + "|" + did, onCompetitionStartedResponse, null, true);
    }
}
function onEnterScoresResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        if (s.charAt(0) == 's') {
            var did = s.substring(1, s.indexOf("|"));
            if (did != 0) {
                s = s.substring(s.indexOf("|") + 1);
                var cid = s.substring(0, s.indexOf("|"));
                if (cid) {
                    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-section").setAttribute("data-competitorid", cid);
                    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-section").setAttribute("data-disciplineid", did);
                    s = s.substring(s.indexOf("|") + 1);
                    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-wrapper").innerHTML = s;
                    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section").style.display = "none";
                    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-section").style.display = "block";
                    var btn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-list tr[data-competitorid='" + cid + "'][data-disciplineid='" + did + "'] .scores-button");
                    if (btn && ipjContains(btn.className + ' ', ' busy ')) {
                        btn.className = btn.className.replace(' busy', '');
                        btn.innerHTML = "Scores...";
                    }
                    document.querySelector(".usac-view .event-view .tab-headers .refresh-tabs").style.display = "none";
                    return;
                }
            }
        }
        alert('ERROR: ' + s);
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACEnterScores(span, eid, cid, did, rid, g, catid) {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    span.className = span.className + " busy";
    span.innerHTML = "Working...";
    ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "enterscores|" + eid + "|" + cid + "|" + did + "|" + rid + "|" + g + "|" + catid, onEnterScoresResponse, null, true);
}
function onSaveScoresResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        if (s.substring(0, 2) == "s1") {
            s = s.substring(2);
            var did = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var d = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var cid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var g = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var rid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var rs = s.substring(0, s.indexOf("|"));
            ipjUSACSetRoundStatus(did, rid, g, cid, rs);
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + cid + "[data-gender='" + g + "']");
            div.innerHTML = s.substring(s.indexOf("|") + 1);
            document.querySelector(".event-view #div" + d + " .main-section").style.display = "";
            document.querySelector(".event-view #div" + d + " .scores-section").style.display = "";
            document.querySelector(".usac-view .event-view .tab-headers .refresh-tabs").style.display = "";
            return true;
        } else if (s.substring(0, 2) == "s3") {
            s = s.substring(2);
            var did = s.substring(0, s.indexOf("|"));
            ipjUSACFlagForRefresh(true);
            var tab = document.querySelector(".usac-view .event-view .tab-header[data-disciplineid='" + Math.abs(did) + "']");
            var tabBody = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']");
            alert("Scores could not be saved because the current round is no longer available for scoring. Click OK to refresh.");
            tabBody.innerHTML = s.substring(s.indexOf("|") + 1);
            tab.setAttribute("data-loaded", "true");
            ipjUSACSetVisibleCategories(did);
            return true;
        }
        alert('ERROR: ' + s);
    } finally {
        ipjUSACBusy = false;
    }
    return false;
}
function ipjUSACSaveScores(span, eid, cid, did, rid, g, catid) {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        var s = span.innerHTML;
        var c = span.className;
        span.className = span.className + " busy";
        span.innerHTML = "Working...";
        var uireason = ipjUSACGetReasonIDFromUI(did, true);
        if (uireason == -1) {
            ipjUSACBusy = false;
            var lbl = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-wrapper .score-entry-reason-label");
            lbl.style.color = "red";
            lbl.style.fontWeight = "bold";
            span.className = c;
            span.innerHTML = s;
            return false;
        } else {
            if (ipjUSACValidateScores(did)) {
                var scores = ipjUSACGetScoresFromUI(did);
                var uicategory = ipjUSACGetCatFromUI(did);
                var rs = ipjUSACGetRoundStatus(did, rid, g, catid);
                ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "savescores|" + eid + "|" + cid + "|" + did + "|" + g + "|" + catid + "|" + rid + "|" + uireason + "|" + uicategory + "|" + rs + "|" + scores, onSaveScoresResponse, null, true);
            } else {
                ipjUSACBusy = false;
                span.className = c;
                span.innerHTML = s;
                return false;
            }
        }
    } catch (e) {
        alert('An error occurred saving scores.');
        ipjUSACBusy = false;
    }
}
function ipjUSACGetRoundStatus(did, rid, g, catid) {
    var rs = "";
    var rnd = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"] .rounds-controls a[data-roundid="' + rid + '"]');
    if (rnd) {
        rs = rnd.getAttribute("data-roundstatus");
    }
    return rs;
}
function ipjUSACSetRoundStatus(did, rid, g, catid, rs) {
    if (rs != "") {
        var e = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"] .rounds-controls a[data-roundid="' + rid + '"]');
        if (e) {
            e.setAttribute("data-roundstatus", rs);
        }
        e = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"] .competitor-list');
        if (e) {
            e.setAttribute("data-roundstatus", rs);
        }
    }
}
function ipjUSACValidateScores(did) {
    try {
        var sRoutes = ",";
        var bMax = false;
        var max = parseInt(document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .score-entry").getAttribute("data-maxroute"));
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .score-entry td");
        if (lst.length > 0) {
            if (lst[0].className != "speed-entry") {
                var r;
                var a;
                for (i = 0; i < lst.length; i++) {
                    r = parseInt(lst[i].querySelector(".route-number").value);
                    a = parseInt(lst[i].querySelector(".route-attempts").value);
                    if (r && a) {
                        if (max) {
                            if (r > max) {
                                bMax = true;
                            }
                        }
                        if (ipjContains(sRoutes, "," + r + ",")) {
                            alert("Problem #" + r + " was specified multiple times. Please enter a single entry for each attempted problem.");
                            return false;
                        }
                        sRoutes += (r + ",");
                    } else if (r) {
                        alert("Attempts is required for problem #" + r + ".");
                        return false;
                    }
                }
                if (bMax) {
                    if (!confirm("You have entered a problem number exceeding the maximum number of problems (" + max + ") for this round.\n\nContinue?\n")) {
                        return false;
                    }
                }
            }
        }
    } catch (e) {
    }
    return true;
}
function ipjUSACGetCatFromUI(did) {
    var cat = "0";
    var ddl = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section .control-section .categories");
    if (ddl) {
        cat = ddl.options[ddl.selectedIndex].value;
    }
    return cat;
}
function ipjUSACGetReasonIDFromUI(did) {
    var rid = 0;
    var ddl = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-wrapper .score-entry-reason");
    if (ddl) {
        rid = ddl.options[ddl.selectedIndex].value;
    }
    return rid;
}
function ipjUSACGetScoresFromUI(did) {
    var r = "";
    var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .score-entry td");
    if (lst.length > 0) {
        if (lst[0].className == "speed-entry") {
            lst = lst[0].parentElement.querySelectorAll(".clock");
            for (i = 0; i < 6; i++) {
                var h = lst[i].querySelector(".route-time.hours").value;
                var m = lst[i].querySelector(".route-time.minutes").value;
                var s = lst[i].querySelector(".route-time.seconds").value;
                var f = lst[i].querySelector(".route-time.fraction").value;
                if (h) {
                    r = r + h + ":";
                }
                if (m) {
                    r = r + m + ":";
                } else {
                    r = r + "00:";
                }
                if (s) {
                    r = r + s + "";
                } else {
                    r = r + "00";
                }
                if (f) {
                    r = r + "." + f + "";
                }
                r = r + "-";
            }
        } else {
            for (i = 0; i < lst.length; i++) {
                r += (lst[i].querySelector(".route-number").value + "-" + lst[i].querySelector(".route-attempts").value + "-");
            }
        }
    }
    return r;
}
function ipjUSACAddMoreScores(div, did) {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    var h = div.innerHTML;
    var c = div.className;
    div.className = div.className + " busy";
    div.innerHTML = "Working...";
    try {
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "addscorerow|" + did);
        if (s.charAt(0) == 's') {
            var did = s.substring(1, s.indexOf("|"));
            if (did != 0) {
                s = s.substring(s.indexOf("|") + 1);
                t = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .score-entry");
                t.innerHTML = t.innerHTML.replace("<!--new-row-here-->", s);
            }
        }
    } catch (e) { }
    ipjUSACBusy = false;
    div.className = c;
    div.innerHTML = h;
}
function ipjUSACCancelScores(did) {
    if (ipjUSACBusy) {
        return false;
    }
    var btn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-wrapper .save-scores");
    if (ipjContains(btn.className, ' busy')) {
        btn.className = btn.className.replace(' busy', '');
        btn.innerHTML = "Submit Scores";
    }
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .scores-section").style.display = "none";
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section").style.display = "block";
    document.querySelector(".usac-view .event-view .tab-headers .refresh-tabs").style.display = "";
}
function onEndCompetitionResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        if (s.substring(0, 2) == 's1') {
            var did = s.substring(2, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var bRefresh = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var bAllEnded = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var bException = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var tab = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'");
            tab.className = tab.className + " complete";
            tab.innerHTML = s
            ipjUSACSetVisibleCategories(did);
            if (bRefresh == "true") {
                ipjUSACFlagForRefresh(false, false, Math.abs(did));
            } else if (bAllEnded == "true") {
                var btn = document.querySelector(".usac-view .event-view #divAll.tab-body .main-section .control-section .add-competitor:not(.disabled)");
                if (btn) {
                    btn.className = (btn.className + " disabled");
                }
            }
            if (bException == "true") {
                alert('There was a problem processing one or more invitations. Please check the system events log for details.');
            }
        } else {
            alert('An error occurred attempting to end the competition: ' + s);
        }
    } catch (ex) {
        alert('An exception occurred updating the display (' + ex.message + ').');
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACEndCompetition(btn, eid, did) {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true
    var h = btn.innerHTML;
    var c = btn.className;
    btn.className = btn.className + " busy";
    btn.innerHTML = "Working...";
    try {
        var b = false;
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section td.scoring.points span");
        for (i = 0; i < lst.length; i++) {
            if (lst[i].innerHTML == "") {
                b = true;
                break;
            }
        }
        if (b) {
            b = confirm("END COMPETITON?\n\nSome competitors have not had scores entered for this competition.\n\nEnding this competition will prevent scores from being entered for these competitors.\n\nDo you wish to continue?\n\n")
        } else {
            b = true;
        }
        if (b) {
            b = false;
            lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section .competitor-wrapper:not(.hide) .competitor-header .rounds-controls a.end-scoring.disabled");
            if (lst.length > 0) {
                b = true;
            }
            if (b) {
                b = confirm("END COMPETITON?\n\nAll rounds have not been completed for all categories.\n\nIt is recommended to complete all rounds and finish scoring for each category before ending a competition.\n\nSCORES ENTERED IN CATEGORIES THAT ARE NOT COMPLETED WILL NOT COUNT TOWARDS TEAM RANKINGS.\n\nDo you wish to continue?\n\n")
            } else {
                b = true;
            }
        }
        if (b) {
            if (confirm("END COMPETITION?\n\nThis action will close the competition for all categories and prevent any further editing of scores except by national staff.\n\nPlease wait until the end of your appeal period to ensure all results are accurate before ending this competition.\n\nDo you wish to continue?\n\n")) {
                ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "endcompetition|" + eid + "|" + did, onEndCompetitionResponse, null, true);
                return;
            }
        }
    } catch (e) {
    }
    ipjUSACBusy = false;
    btn.className = c;
    btn.innerHTML = h;
}
function ipjUSACAddCompetitor(spn, eid, did) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, ' disabled')) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        var e = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .add-competitor-section .add-competitor-criteria-wrapper");
        if (!e.hasChildNodes()) {
            var t = document.getElementById('tblFindCompetitors');
            e.appendChild(t);
            t.querySelector('#txtFindByName').value = '';
            t.querySelector('#ddlFindByState').selectedIndex = 0;
            t.querySelector('#ddlFindByRegion').selectedIndex = 0;
            t.querySelector('#ddlFindByRegionCCS').selectedIndex = 0;
            t.setAttribute("data-eventid", eid);
            t.setAttribute("data-disciplineid", did);
            t.style.display = "";
        }
        var btnAdd = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .add-competitor-section .button-section .add-competitors");
        if (btnAdd) {
            btnAdd.className = btnAdd.className.replace(' busy', '');
            btnAdd.innerHTML = "Add";
            if (!ipjContains(btnAdd.className, " disabled")) {
                btnAdd.className = (btnAdd.className + " disabled");
            }
        }
        document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section").style.display = "none";
        document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .add-competitor-section").style.display = "block";
    } finally {
        ipjUSACBusy = false;
    }
}
function onFindCompetitorsResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        if (s.charAt(0) == 's') {
            var did = s.substring(1, s.indexOf("|"));
            if (ipjIsNumber(did)) {
                var e = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .add-competitor-section .add-competitor-results-wrapper");
                var s = s.substring(s.indexOf("|") + 1);
                var btn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .add-competitor-section .button-section .add-competitors");
                if (btn) {
                    if (ipjContains(s, "<table")) {
                        btn.className = btn.className.replace(' disabled', '');
                    }
                }
                e.innerHTML = s;
            } else {
                alert(s.substring(2));
            }
        } else {
            alert('An error occurred attempting to find competitors: ' + s);
        }
    } finally {
        ipjUSACBusy = false;
        var btn = document.querySelector('#tblFindCompetitors .ipf-usac-search-btn');
        if (btn) {
            btn.className = btn.className.replace(' busy', '');
            btn.innerHTML = "Search";
            var lnk = btn.nextSibling;
            lnk.className = lnk.className.replace(' disabled', '');
        }
    }
}
function ipjUSACCheckAll(did) {
    var unchecked = false;
    var chks = document.querySelectorAll('.add-competitor-results-wrapper input[type="checkbox"][data-disciplineid="' + did + '"]:not([disabled])');
    for (i = 0; i < chks.length; i++) {
        if (!chks[i].checked) {
            unchecked = true;
            chks[i].checked = true;
        }
    }
    if (!unchecked) {
        for (i = 0; i < chks.length; i++) {
            chks[i].checked = false;
        }
    }
}
function ipjUSACClearCompetitors(lnk) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(lnk.className, " disabled")) {
        return false;
    }
    ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "clearcompetitors|", null, null, true);
    alert("Cached competitor list has been cleared.");
}
function ipjUSACFindCompetitors(btn) {
    if (ipjUSACBusy) {
        return false;
    }
    ipjUSACBusy = true;
    btn.className = btn.className + " busy";
    btn.innerHTML = "Working...";
    var lnk = btn.nextSibling;
    lnk.className = lnk.className + " disabled";
    try {
        var t = document.getElementById('tblFindCompetitors');
        var name = ipjTrim(t.querySelector('#txtFindByName').value);
        var ddl = t.querySelector('#ddlFindByState');
        var state = ipjTrim(ddl.options[ddl.selectedIndex].value);
        ddl = t.querySelector('#ddlFindByRegion');
        var region = ipjTrim(ddl.options[ddl.selectedIndex].value);
        ddl = t.querySelector('#ddlFindByRegionCCS');
        var regionCCS = ipjTrim(ddl.options[ddl.selectedIndex].text);
        if ((name == "") && (state == "") && (region == "") && (regionCCS == "")) {
            alert("Please provide search criteria.");
            ipjUSACBusy = false;
            btn.className = btn.className.replace(' busy', '');
            btn.innerHTML = "Search";
            lnk.className = lnk.className.replace(' disabled', '');
            return false;
        }
        var eid = t.getAttribute("data-eventid");
        var did = t.getAttribute("data-disciplineid");
        var btnAdd = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .add-competitor-section .button-section .add-competitors");
        if (btnAdd) {
            if (ipjContains(btnAdd.className, " busy")) {
                btnAdd.className = btnAdd.className.replace(" busy", "");
                btnAdd.innerHTML = "Add";
            }
            if (!ipjContains(btnAdd.className, " disabled")) {
                btnAdd.className = (btnAdd.className + " disabled");
            }
        }
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "findcompetitors|" + eid + "|" + did + "|" + escape(name) + "|" + state + "|" + region + "|" + regionCCS, onFindCompetitorsResponse, null, true);
        return;
    } catch (e) {
        ipjUSACBusy = false;
        btn.className = btn.className.replace(' busy', '');
        btn.innerHTML = "Search";
        lnk.className = lnk.className.replace(' disabled', '');
    }
}
function onAddCompetitorsResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        if (s.charAt(0) == 's') {
            var msg = s.substring(1, s.indexOf("|"));
            s = s.substring(msg.length + 2);
            var did = s.substring(0, s.indexOf("|"));
            if (did != "") {
                ipjUSACFlagForRefresh();
                var tab = document.querySelector(".usac-view .event-view .tab-header[data-disciplineid='" + Math.abs(did) + "']");
                var tabBody = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']");
                document.getElementById('divUSACFindCompetitorsPlaceHolder').appendChild(document.getElementById('tblFindCompetitors'));
                tabBody.innerHTML = s.substring(s.indexOf("|") + 1);
                tab.setAttribute("data-loaded", "true");
                ipjUSACSetVisibleCategories(did);
                if (msg != "SUCCESS") {
                    alert(msg);
                }
            } else {
                alert(s);
            }
        } else {
            alert('An error occurred attempting to find competitors: ' + s);
        }
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACAddCompetitors(btn, eid, did) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(btn.className, ' disabled')) {
        return false;
    }
    ipjUSACBusy = true;
    btn.className = btn.className + " busy";
    btn.innerHTML = "Working...";
    try {
        var ret = '';
        var competitors = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .add-competitor-results-wrapper table tr[data-competitorid]");
        for (c = 0; c < competitors.length; c++) {
            var s = '';
            var disciplines = competitors[c].querySelectorAll("[type='checkbox']:checked");
            for (d = 0; d < disciplines.length; d++) {
                if (!disciplines[d].hasAttribute("disabled")) {
                    if (s == '') {
                        s = '[' + competitors[c].getAttribute('data-competitorid') + ']';
                    }
                    s = (s + '[' + disciplines[d].getAttribute('data-disciplineid') + ']');
                }
            }
            if (s != '') {
                ret = (ret + s + '|');
            }
        }
        if (ret == '') {
            ipjUSACCancelCompetitors(did);
            btn.className = btn.className.replace(' busy', '');
            btn.innerHTML = "Add"
        } else {
            ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "addcompetitors|" + eid + "|" + did + "|" + ret, onAddCompetitorsResponse, null, true);
            return;
        }
    } catch (e) {
        ipjUSACBusy = false;
        btn.className = btn.className.replace(' busy', '');
        btn.innerHTML = "Add"
    }
}
function ipjUSACCancelCompetitors(did, toshow) {
    if (!toshow) {
        toshow = ".main-section";
    }
    var t = document.getElementById('tblFindCompetitors');
    t.querySelector('#txtFindByName').value = '';
    t.querySelector('#ddlFindByState').selectedIndex = 0;
    t.querySelector('#ddlFindByRegion').selectedIndex = 0;
    t.querySelector('#ddlFindByRegionCCS').selectedIndex = 0;
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .add-competitor-section .add-competitor-results-wrapper").innerHTML = "";
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .add-competitor-section").style.display = "none";
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] " + toshow).style.display = "block";
    document.getElementById('divUSACFindCompetitorsPlaceHolder').appendChild(t);
    ipjUSACBusy = false;
}
function ipjUSACPromptToSaveScores(eid, did, catid, g, rid, response) {
    var result = 2;
    var spn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .buttons-section .onsight.save-scores");
    if (spn && (!ipjContains(spn.className, " disabled")) && (!ipjContains(spn.className, " hide"))) {
        if (confirm('SAVE SCORES?\n\nScores have been modified and not yet saved. Would you like to save the scores?\n\nChoose OK to save scores.\n\nChoose Cancel to continue without saving.\n\n')) {
            var t = 0; var torig = 0;
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .tops-wrapper");
            if (div) {
                var txt = div.querySelector("input[type=text]");
                t = parseInt(txt.value);
                if (!t) {
                    alert("Please enter the highest point for the current problem.");
                    div.querySelector("span").className = "font-red";
                    txt.focus();
                    return 0;
                }
                torig = parseInt(txt.getAttribute("data-orig"));
                if (!torig) {
                    torig = 0;
                }
            }
            var p = parseInt(spn.getAttribute("data-problem"));
            if (!p) {
                p = 1;
            }
            var scores = ipjUSACGetOnsightScoresFromUI(did, g, catid, p);
            var rs = ipjUSACGetRoundStatus(did, rid, g, catid);
            if (response == null) {
                var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "savescoresonsight|" + eid + "|" + did + "|" + g + "|" + catid + "|" + rid + "|" + p + "|" + t + "|" + torig + "|" + rs + "|" + scores, null, true);
                var r = s.substring(0, 2);
                if ((r == "s1") || (r == "s2")) {
                    s = s.substring(2);
                    var tmp = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var did = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var catid = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var g = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var rid = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    tmp = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    var rs = s.substring(0, s.indexOf("|"));
                    ipjUSACSetRoundStatus(did, rid, g, catid, rs);
                } else if (r == "s3") {
                    s = s.substring(2);
                    var tmp = s.substring(0, s.indexOf("|"));
                    s = s.substring(s.indexOf("|") + 1);
                    tmp = s.substring(0, s.indexOf("|"));
                    ipjUSACFlagForRefresh(true);
                    var tab = document.querySelector(".usac-view .event-view .tab-header[data-disciplineid='" + Math.abs(did) + "']");
                    var tabBody = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']");
                    alert("Scores could not be saved because the current round is no longer available for scoring. Click OK to refresh.");
                    tabBody.innerHTML = s.substring(s.indexOf("|") + 1);
                    tab.setAttribute("data-loaded", "true");
                    ipjUSACSetVisibleCategories(did);
                    return false;
                }
            } else {
                ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "savescoresonsight|" + eid + "|" + did + "|" + g + "|" + catid + "|" + rid + "|" + p + "|" + t + "|" + torig + "|" + rs + "|" + scores, response, null, true);
            }
            result = 1;
        }
    }
    return result;
}
function ipjUSACShowOnsightTotals(rb, eid, did, catid, g, rid) {
    if (ipjUSACBusy) {
        return false;
    }
    var lbl = rb.nextSibling;
    try {
        ipjUSACBusy = true;
        lbl.className = lbl.className + " busy";
        lbl.innerHTML = "Working...";
        if (!ipjUSACPromptToSaveScores(eid, did, catid, g, rid)) {
            return false;
        }
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "showroundresults|" + eid + "|" + did + "|" + catid + "|" + g + "|" + rid, null, true);
        if (s.substring(0, 2) == "s1") {
            var section = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"]');
            var div = section.querySelector('.competitor-list-wrapper');
            div.innerHTML = s.substring(2);
            var btn = section.querySelector('.rounds-wrapper .buttons-section .onsight.save-scores');
            if (btn) {
                btn.setAttribute("data-problem", "");
                if (!ipjContains(btn.className, " disabled")) {
                    btn.className = btn.className + " disabled";
                }
            }
            btn = section.querySelector('.rounds-wrapper .buttons-section .download-results');
            if (btn) {
                if (ipjContains(btn.className, " hide")) {
                    btn.className = btn.className.replace(' hide', '');
                }
            }
        } else {
            alert('An error occurred selecting the totals.');
        }
    } catch (e) {
        alert('An exception occurred selecting the totals (' + e.message + ').');
    } finally {
        ipjUSACBusy = false;
        lbl.className = lbl.className.replace(' busy', '');
        lbl.innerHTML = "Round Result";
    }
}
function ipjUSACShowOnsightProblem(rb, eid, did, catid, g, rid, pid) {
    if (ipjUSACBusy) {
        return false;
    }
    var lbl = rb.nextSibling;
    var caption = lbl.innerHTML;
    try {
        ipjUSACBusy = true;
        lbl.className = lbl.className + " busy";
        lbl.innerHTML = "Working...";
        if (!ipjUSACPromptToSaveScores(eid, did, catid, g, rid)) {
            return false;
        }
        var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "showproblem|" + eid + "|" + did + "|" + catid + "|" + g + "|" + rid + "|" + pid, null, true);
        if (s.substring(0, 2) == "s1") {
            var section = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"]');
            var div = section.querySelector('.competitor-list-wrapper');
            div.innerHTML = s.substring(2);
            var btn = section.querySelector('.rounds-wrapper .buttons-section .onsight.save-scores');
            if (btn) {
                btn.setAttribute("data-problem", pid);
                if (!ipjContains(btn.className, " disabled")) {
                    btn.className = btn.className + " disabled";
                }
            }
            btn = section.querySelector('.rounds-wrapper .buttons-section .download-results');
            if (btn) {
                if (!ipjContains(btn.className, " hide")) {
                    btn.className = btn.className + " hide";
                }
            }
        } else {
            alert('An error occurred selecting the problem.');
        }
    } catch (e) {
        alert('An exception occurred selecting the problem (' + e.message + ').');
    } finally {
        ipjUSACBusy = false;
        lbl.className = lbl.className.replace(' busy', '');
        lbl.innerHTML = caption;//"Problem "+pid;
    }
}
function ipjUSACSetSaveScoresOnsight(el, did, catid, g, enable) {
    var btn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "." + g + " .buttons-section .onsight.save-scores");
    if (enable) {
        btn.className = btn.className.replace(" disabled", "");
        if (el.className != "tops") {
            el.parentElement.parentElement.setAttribute('data-changed', 'true');
            var txt = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "." + g + " .tops-wrapper input[type=text]");
            if (txt) {
                txt.removeAttribute("disabled");
            }
            var td = el.parentElement.parentElement.querySelector('td.save.hide');
            if (td) {
                td.className = td.className.replace(" hide", "")
                var lnk = td.querySelector(".typical-link.disabled");
                if (lnk) {
                    lnk.className = lnk.className.replace(" disabled", "");
                }
                var th = el.parentElement.parentElement.parentElement.firstChild.querySelector('th.save.hide');
                if (th) {
                    th.className = th.className.replace(' hide', '');
                }
            }
        }
    } else if (!ipjContains(btn.className, " disabled")) {
        btn.className = (btn.className + " disabled");
        var txt = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "." + g + " .tops-wrapper input[type=text]");
        if (txt) {
            txt.setAttribute("disabled", "disabled");
        }
        var lst = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "." + g + " td.save");
        for (i = 0; i < lst.length; i++) {
            if (!ipjContains(lst[i].className, " hide")) {
                lst[i].className = (lst[i].className + " hide");
            }
        }
        var th = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "." + g + " .competitor-list th.save");
        if (th) {
            if (!ipjContains(th.className, " hide")) {
                th.className = (th.className + " hide");
            }
        }
    }
}
function ipjUSACGetOnsightScoresFromUI(did, g, catid, pid) {
    var s = "";
    var rows;
    rows = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .competitor-list[data-problem='" + pid + "'] tr[data-competitorid][data-changed=true]");
    if ((rows.length == 0) && (pid == 1) && (ipjContains(document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']").id, "Speed"))) {
        rows = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .competitor-list[data-problem='" + 0 + "'] tr[data-competitorid][data-changed=true]");
    }
    for (r = 0; r < rows.length; r++) {
        s += rows[r].getAttribute("data-competitorid");
        var inputs = rows[r].querySelectorAll("td.scoring input");
        for (i = 0; i < inputs.length; i++) {
            if (inputs[i].getAttribute("type") == "checkbox") {
                s += ("^" + inputs[i].checked);
            } else {
                s += ("^" + inputs[i].value);
            }
        }
        s += "~";
    }
    return s;
}
function clickSaveScoresOnsight(lnk, did, catid, g) {
    if (ipjUSACBusy) {
        return false;
    }
    var btn = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"] .buttons-section .save-scores');
    if (btn) {
        btn.click();
    }
}
function onSaveScoresOnsightResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    var r = "";
    try {
        var s = objXMLHTTP.responseText;
        r = s.substring(0, 2);
        if ((r == "s1") || (r == "s2")) {
            s = s.substring(2);
            var eid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var did = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var catid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var g = s.substring(0, s.indexOf("|"));
            if (g == 'Male') {
                g = 'm';
            } else if (g == 'Female') {
                g = 'f';
            }
            s = s.substring(s.indexOf("|") + 1);
            var rid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var pid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var rs = s.substring(0, s.indexOf("|"));
            ipjUSACSetRoundStatus(did, rid, g, catid, rs);
            var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
            if (r == "s1") {
                div.querySelector(".competitor-list-wrapper").innerHTML = s.substring(s.indexOf("|") + 1);
            }
            var e = div.querySelector(".rounds-wrapper .round-completed");
            if (!ipjContains(e.className, " hide")) {
                e.className = e.className + " hide";
            }
            e = div.querySelector(".rounds-wrapper .complete-round");
            e.className = e.className.replace(" hide", "");
            e = div.querySelector(".rounds-wrapper .onsight.save-scores");
            e.className = e.className.replace(" hide", "");
            e = div.querySelector(".rounds-controls .end-scoring");
            if (!ipjContains(e.className, " disabled")) {
                e.className = e.className + " disabled";
            }
            return true;
        } else if (r == "s3") {
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
            return false;
        }
        alert('An error occurred saving scores for onsight. ' + s);
    } catch (e) {
        alert('An exception occurred saving scores for onsight.');
    } finally {
        ipjUSACBusy = false;
        if (r != "s3") {
            var e = document.querySelector('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .competitor-wrapper' + catid + '[data-gender="' + g + '"]');
            var spn = e.querySelector('.buttons-section .onsight.save-scores');
            spn.className = spn.className.replace(" busy", "");
            spn.className = spn.className.replace(" disabled", "");
            spn.className = (spn.className + " disabled");
            spn.innerHTML = "Save Scores";
            var tds = e.querySelectorAll('td.save:not(.hide)');
            for (i = 0; i < tds.length; i++) {
                var lnk = tds[i].querySelector('.typical-link');
                if (lnk) {
                    lnk.className = 'typical-link disabled';
                    lnk.innerHTML = 'Save';
                }
                tds[i].className = 'save hide';
            }
            var th = e.querySelector('table.competitor-list th.save');
            if (th) {
                th.className = "save hide";
            }
        }
    }
    return false;
}
function ipjUSACSaveScoresOnsight(btn, eid, did, catid, g, rid) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(btn.className, ' busy')) {
        return false;
    }
    var t = 0; var torig = 0;
    var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .tops-wrapper");
    if (div) {
        var txt = div.querySelector("input[type=text]");
        t = parseInt(txt.value);
        if (!t) {
            alert("Please enter the highest point for the current problem.");
            div.querySelector("span").className = "font-red";
            txt.focus();
            return false;
        }
        torig = parseInt(txt.getAttribute("data-orig"));
        if (!torig) {
            torig = 0;
        }
    }
    ipjUSACBusy = true;
    try {
        btn.className = btn.className + " busy";
        btn.innerHTML = "Working...";
        var pid = parseInt(btn.getAttribute("data-problem"));
        if (!pid) {
            pid = 1;
        }
        var scores = ipjUSACGetOnsightScoresFromUI(did, g, catid, pid);
        var rs = ipjUSACGetRoundStatus(did, rid, g, catid);
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "savescoresonsight|" + eid + "|" + did + "|" + g + "|" + catid + "|" + rid + "|" + pid + "|" + t + "|" + torig + "|" + rs + "|" + scores, onSaveScoresOnsightResponse, null, true);
    } catch (e) {
        alert('An exception occurred saving onsight scores.');
        btn.className = btn.className.replace(" busy", "");
        btn.innerHTML = "Save Scores";
        ipjUSACBusy = false;
    }
}
function onSportActionClick(chk, id, did, catid, g) {
    if (chk.checked) {
        var e = document.getElementById(id);
        if (e && e.checked) {
            e.checked = false;
        }
    }
    ipjUSACSetSaveScoresOnsight(chk, did, catid, g, true);
}
function ipjUSACSetSaveScoresOnsightSpeedTieBreaker(did, catid, g, enable) {
    var btn = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "." + g + " .tie-breaker-wrapper .onsight.save-tiebreaker");
    if (enable) {
        btn.className = btn.className.replace(" disabled", "");
    } else if (!ipjContains(btn.className, " disabled")) {
        btn.className = (btn.className + " disabled");
    }
}
function ipjUSACCancelOnsightSpeedTieBreaker(spn, did, catid, g) {
    var section = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
    var w = section.querySelector(".tie-breaker-wrapper");
    if (w) {
        if (!ipjContains(w.className, "hide")) {
            w.className = w.className + " hide";
        }
        var e = w.querySelector(".save-tiebreaker");
        e.className = e.className.replace(" busy", "");
        e.className = e.className.replace(" disabled", "");
        e.className = e.className + " disabled";
        e.innerHTML = "Save Scores";
    }
    e = section.querySelector(".competitor-list-wrapper");
    e.className = e.className.replace(" hide", "");
    e = section.querySelector(".rounds-wrapper");
    e.className = e.className.replace(" hide", "");
    e = e.querySelector(".buttons-section .complete-round");
    e.className = e.className.replace(" busy", "");
    e.innerHTML = "Complete Round";
}
function ipjUSACGetOnsightSpeedTieBreakerScoresFromUI(did, g, catid, enforce) {
    var s = ""; //scores
    var c = ""; //current rank
    var v = ""; //entered value
    var b;
    var bRowHasData = false;
    var bEveryCellHasData = true;
    var rows = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .tie-breaker-wrapper tr[data-competitorid]");
    for (r = 0; r < rows.length; r++) {
        s += rows[r].getAttribute("data-competitorid");
        var inputs = rows[r].querySelectorAll("td.time-entry input");
        bRowHasData = false;
        v = "";
        for (i = 0; i < inputs.length; i++) {
            v = inputs[i].value;
            b = (ipjTrim(v) != "");
            if (!b) {
                bEveryCellHasData = false;
            }
            bRowHasData = bRowHasData || b;
            s += ("^" + v);
        }
        if ((enforce) && (!bRowHasData)) {
            alert('Please enter times for all competitors.');
            return "";
        }
        c += rows[r].getAttribute("data-competitorid");
        c += ("^" + rows[r].querySelector("td.rank").innerHTML);
        c += "~";
        s += "~";
    }
    if ((enforce) && (!bEveryCellHasData)) {
        if (!confirm("TIE-BREAKER.\n\nAll times have not been entered for all competitors.\n\nAre you sure you want to continue?\n\nThis will complete the tie-breaker.\n\n")) {
            return "";
        }
    }
    return s + "|" + c;
}
function ipjUSACSaveOnsightSpeedTieBreaker(spn, eid, did, catid, g, rid) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, ' disabled')) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        spn.className = spn.className + " busy";
        spn.innerHTML = "Working...";
        var scores = ipjUSACGetOnsightSpeedTieBreakerScoresFromUI(did, g, catid, true);
        if (scores != "") {
            ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "completeround|" + eid + "|" + did + "|" + catid + "|" + g + "|" + rid + "|false|" + scores, onSaveOnsightSpeedTieBreakerResponse, null, true);
        }
    } catch (e) {
        alert('An exception occurred saving the tie-breaker scores.');
    } finally {
        spn.className = spn.className.replace(" busy", "");
        spn.innerHTML = "Save Scores";
        ipjUSACBusy = false;
    }
}
function onSaveOnsightSpeedTieBreakerResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    try {
        var s = objXMLHTTP.responseText;
        var r = s.substring(0, 2);
        if ((r == "s1") || (r == "s2")) {
            s = s.substring(2);
            var did = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var catid = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            var g = s.substring(0, s.indexOf("|"));
            if (r == "s1") {
                var div = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']"); // .competitor-list-wrapper
                div.innerHTML = s.substring(s.indexOf("|") + 1);
                ipjUSACCancelOnsightSpeedTieBreaker(null, did, catid, g);
            } else {
                alert(s.substring(s.indexOf("|") + 1));
            }
            return;
        }
        alert('An error occurred saving scores for the tie-breaker. ' + s);
    } catch (e) {
        alert('An exception occurred saving scores for the tie-breaker.');
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACShowOnsightSpeedTieBreak(eid, did, catid, g, rid, prompt) {
    if (ipjUSACBusy) {
        return false;
    }
    try {
        ipjUSACBusy = true;
        var gender = g;
        if (g == 'm') {
            gender = 'male';
        } else if (g == 'f') {
            gender = 'female';
        }
        var section = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "']");
        var w = section.querySelector(".tie-breaker-wrapper");
        var t = w.querySelector(".tie-breaker");
        if (t) {
            var b = t.querySelector("tbody");
            if (b) {
                var s = "";
                var rows = document.querySelectorAll(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .competitor-wrapper" + catid + "[data-gender='" + g + "'] .competitor-list tr[data-tied='true']");
                if (rows && rows.length > 1) {
                    for (tr = 0; tr < rows.length; tr++) {
                        var cells = rows[tr].querySelectorAll("td");
                        var cid = rows[tr].getAttribute("data-competitorid");
                        s += '<tr data-competitorid="' + cid + '"><td class="rank">' + cells[8].innerHTML + '</td>'; //rank
                        s += '<td title="Competitor ID: ' + cid + '">' + cells[0].innerHTML + '</td>'; //name
                        s += "<td>" + cells[2].innerHTML + "</td>"; //bib
                        s += '<td class="time-entry alt">';
                        s += '<input type="text" placeholder="m:ss.hs" class="route1 clock1" maxlength="10" style="width:50px" onkeydown="var key=getKeyCode(event);if(key==8||key==46){ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);}return true;" onkeypress="if(ipKeyRestrict(event,';
                        s += "'1234567890.:'))";
                        s += '{ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);return true;}else{return false;}"></input><br/>';
                        s += '<input type="text" placeholder="m:ss.hs" class="route1 clock2" maxlength="10" style="width:50px" onkeydown="var key=getKeyCode(event);if(key==8||key==46){ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);}return true;" onkeypress="if(ipKeyRestrict(event,';
                        s += "'1234567890.:'))";
                        s += '{ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);return true;}else{return false;}"></input><br/>';
                        s += '<input type="text" placeholder="m:ss.hs" class="route1 clock3" maxlength="10" style="width:50px" onkeydown="var key=getKeyCode(event);if(key==8||key==46){ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);}return true;" onkeypress="if(ipKeyRestrict(event,';
                        s += "'1234567890.:'))";
                        s += '{ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);return true;}else{return false;}"></input>';
                        s += '</td>';
                        s += '<td class="time-entry">';
                        s += '<input type="text" placeholder="m:ss.hs" class="route2 clock1" maxlength="10" style="width:50px" onkeydown="var key=getKeyCode(event);if(key==8||key==46){ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);}return true;" onkeypress="if(ipKeyRestrict(event,';
                        s += "'1234567890.:'))";
                        s += '{ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);return true;}else{return false;}"></input><br/>';
                        s += '<input type="text" placeholder="m:ss.hs" class="route2 clock2" maxlength="10" style="width:50px" onkeydown="var key=getKeyCode(event);if(key==8||key==46){ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);}return true;" onkeypress="if(ipKeyRestrict(event,';
                        s += "'1234567890.:'))";
                        s += '{ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);return true;}else{return false;}"></input><br/>';
                        s += '<input type="text" placeholder="m:ss.hs" class="route2 clock3" maxlength="10" style="width:50px" onkeydown="var key=getKeyCode(event);if(key==8||key==46){ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);}return true;" onkeypress="if(ipKeyRestrict(event,';
                        s += "'1234567890.:'))";
                        s += '{ipjUSACSetSaveScoresOnsightSpeedTieBreaker(' + did + ',' + catid + ',';
                        s += "'" + gender + "'";
                        s += ',true);return true;}else{return false;}"></input>';
                        s += '</td></tr>';
                    }
                    b.innerHTML = s;
                    t.setAttribute("data-empty", "false");
                    w.className = w.className.replace(" hide", "");
                    var e = section.querySelector(".competitor-list-wrapper");
                    e.className = e.className + " hide";
                    e = section.querySelector(".rounds-wrapper");
                    e.className = e.className + " hide";
                }
                if (prompt) {
                    alert('TIE-BREAKER REQUIRED.\n\nPlease enter tie-breaker results to complete this round.\n\n');
                }
            }
        }
    } catch (e) {
        alert('An exception occurred showing the tie break.');
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACToggleRequiredFields(s, h) {
    h.className = h.className.replace(" required", "");
    h.className = h.className.replace(" hide", "");
    h.className = h.className + " hide";
    s.className = s.className.replace(" required", "");
    s.className = s.className.replace(" hide", "");
    s.className = s.className + " required";
}
function ipjUSACGetInputFromTableRows(selector, delim) {
    var s = '';
    var rows = document.querySelectorAll(selector);
    for (r = 0; r < rows.length; r++) {
        var v = '';
        var e = rows[r].querySelector("input");
        if (e) {
            if (e.getAttribute("type") == "checkbox") {
                v = e.checked;
            } else {
                v = ipjTrim(e.value);
                if (ipjContains(rows[r].className, "escape")) {
                    v = escape(v);
                }
            }
        } else {
            e = rows[r].querySelector("select");
            if (e) {
                if (e.hasAttribute("multiple")) {
                    for (i = 0; i < e.options.length; i++) {
                        if (e.options[i].selected) {
                            v += ipjTrim(e.options[i].value) + ',';
                        }
                    }
                } else {
                    v = ipjTrim(e.options[e.selectedIndex].value);
                }
            }
        }
        if (e) {
            if ((!v) && ipjContains(rows[r].className, "required")) {
                s = '';
                break;
            } else {
                s += (delim + v);
            }
        }
    }
    return s;
}
function ipjUSACCreateCompetitor(eid, did) {
    ipjUSACCancelCompetitors(did, ".create-competitor-section");
}
function onAddNewCompetitorResponse(objXMLHTTP) {
    ipjUSACBusy = true;
    var did;
    try {
        var s = objXMLHTTP.responseText;
        if (s.charAt(0) == 's') {
            var msg = s.substring(1, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            did = s.substring(0, s.indexOf("|"));
            s = s.substring(s.indexOf("|") + 1);
            if (msg.substring(0, 7) != "SUCCESS") {
                alert(msg);
            } else {
                if (msg.length > 7) {
                    alert(msg.substring(7));
                }
                if (did != "") {
                    ipjUSACFlagForRefresh();
                    var tab = document.querySelector(".usac-view .event-view .tab-header[data-disciplineid='" + Math.abs(did) + "']");
                    var tabBody = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "']");
                    tabBody.innerHTML = s;
                    tab.setAttribute("data-loaded", "true");
                    ipjUSACSetVisibleCategories(did);
                } else {
                    alert(s);
                }
            }
        }
    } finally {
        ipjUSACBusy = false;
        if (did != "") {
            var spn = document.querySelector('.create-competitor-section[data-disciplineid="' + Math.abs(did) + '"] span.create-new-competitor')
            spn.className = spn.className.replace(' busy', '');
            spn.innerHTML = "Add"
        }
    }
}
function ipjUSACAddNewCompetitor(spn, eid, did) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, ' disabled')) {
        return false;
    }
    if (ipjContains(spn.className, ' busy')) {
        return false;
    }
    ipjUSACBusy = true;
    spn.className = spn.className + " busy";
    spn.innerHTML = "Working...";
    try {
        var s = ipjUSACGetInputFromTableRows(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .create-competitor-section table.create-competitor tr", "^");
        if (!s) {
            alert('Please provide all required values.');
            ipjUSACBusy = false;
            spn.className = spn.className.replace(' busy', '');
            spn.innerHTML = "Add"
            var t = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .create-competitor-section table.create-competitor");
            if (!ipjContains(t.className, "required")) {
                t.className += " required";
            }
            return;
        }
        ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "addnewcompetitor|" + eid + "|" + did + "|" + s.substring(1), onAddNewCompetitorResponse, null, true);
    } catch (e) {
        ipjUSACBusy = false;
        spn.className = spn.className.replace(' busy', '');
        spn.innerHTML = "Add"
    }
}
function ipjUSACCancelNewCompetitor(did) {
    if (ipjUSACBusy) {
        return false;
    }
    var t = document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .create-competitor-section table.create-competitor");
    t.className = t.className.replace(" required", "");
    var rows = t.querySelectorAll("tr");
    for (r = 0; r < rows.length; r++) {
        var e = rows[r].querySelector("input");
        if (e) {
            e.value = "";
        } else {
            e = rows[r].querySelector("select");
            if (e) {
                if (e.hasAttribute("multiple")) {
                    for (i = 0; i < e.options.length; i++) {
                        if (e.options[i].selected) {
                            e.options[i].selected = false;
                        }
                    }
                } else {
                    e.selectedIndex = 0;
                }
            }
        }
    }
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .create-competitor-section").style.display = "none";
    document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + did + "'] .main-section").style.display = "block";
}
function ipjUSACCheckExternalEventID(lnk) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(lnk.className, 'busy')) {
        return false;
    }
    var id = ipjTrim(document.getElementById('txtThrivaEventID').value);
    if (id) {
        try {
            ipjUSACBusy = true;
            lnk.className = "busy";
            lnk.innerHTML = "working..."
            var s = ipjDoXmlHttpRequestSynchronous(ipjUSACUniqueID, document.forms['IronPointForm'].action, "checkthrivaid|" + id);
            if (s.substring(0, 2) == "s1") {
                alert('Event confirmed.');
            } else {
                alert('Event does not exist, please request the correct ID using the link below.');
            }
        } finally {
            ipjUSACBusy = false;
            lnk.innerHTML = "check";
            lnk.className = "";
        }
    }
}
function ipjUSACRequestThrivaID() {
    ipjDoXmlHttpRequest(ipjUSACUniqueID, document.forms['IronPointForm'].action, "dothrivaidrequest|" + ipjUSACSelectedEventID);
    alert('The password has been requested.');
}
function ipjUSACShowImport(spn, eid, did, d, p) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, ' disabled')) {
        return false;
    }
    if (p) {
        ipjUSACBusy = true;
        try {
            document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section").style.display = "none";
            document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .import-competitors-section #rbAge" + Math.abs(did)).checked = true;
            document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .import-competitors-section").style.display = "block";
        } finally {
            ipjUSACBusy = false;
        }
    } else {
        var msg = "";
        if (did == 0) {
            msg = "Do you want to retrieve the latest competitors from the registration system and assign them to their selected disciplines?"
        } else {
            msg = 'Do you wish to retrieve the latest ' + d + ' competitors from the registration system and assign them to the current competition?'
        }
        if (confirm(msg)) {
            spn.className = "busy";
            spn.innerHTML = "working... "
            ipjUSACDoPostback("doimport_" + eid + "_" + did, eid + '|' + did);
        }
    }
}
function ipjUSACImportCompetitors(spn, eid, did, d) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, 'busy')) {
        return false;
    }
    var msg = "";
    if (did == 0) {
        msg = "Do you want to retrieve the latest competitors from the registration system and assign them to their selected disciplines?"
    } else {
        msg = 'Do you wish to retrieve the latest ' + d + ' competitors from the registration system and assign them to the current competition?'
    }
    if (confirm(msg)) {
        ipjUSACBusy = true;
        spn.className = "busy";
        spn.innerHTML = "working... "
        var id = "";
        var rbs = document.querySelectorAll('.usac-view .event-view .tab-body[data-disciplineid="' + Math.abs(did) + '"] .import-competitors-section input[type="radio"]');
        for (i = 0; i < rbs.length; i++) {
            if (rbs[i].checked) {
                id = rbs[i].id;
                break;
            }
        }
        ipjUSACDoPostback("doimport_" + eid + "_" + did, eid + '|' + did + '|' + id);
    }
}
function ipjUSACCancelImport(spn, did) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(spn.className, ' disabled')) {
        return false;
    }
    ipjUSACBusy = true;
    try {
        document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .import-competitors-section").style.display = "none";
        document.querySelector(".usac-view .event-view .tab-body[data-disciplineid='" + Math.abs(did) + "'] .main-section").style.display = "";
    } finally {
        ipjUSACBusy = false;
    }
}
function ipjUSACSetNumAttemptsOnsight(txt) {
    if (ipjTrim(txt.value) != "") {
        var e = txt.parentElement.nextSibling.firstChild;
        if (ipjTrim(e.value) == "") {
            e.value = "1";
        }
    }
}
function ipjUSACRefreshTabs(lnk, eid) {
    if (ipjUSACBusy) {
        return false;
    }
    if (ipjContains(lnk.className, ' busy')) {
        return false;
    }
    var b = true;
    var lst = document.querySelectorAll('.save-scores.onsight:not(.disabled)');
    if (lst.length > 0) {
        b = confirm('REFRESH DISPLAY?\n\nScores have been entered and not yet saved. Refreshing the display will cause these scores to be lost.\n\nAre you sure you want to refresh the page without saving scores?');
    }
    if (b) {
        lnk.className = lnk.className + " busy";
        lnk.innerHTML = "working..."
        try {
            ipjUSACFlagForRefresh(true);
            var tab = document.querySelector('.event-view .tab-headers .tab-header.active');
            ipjTabHeaderClick(tab, tab.id.replace('spn', 'div'), true);
        } finally {
            lnk.innerHTML = "Refresh"
            lnk.className = lnk.className.replace(' busy', '');
        }
    }
}
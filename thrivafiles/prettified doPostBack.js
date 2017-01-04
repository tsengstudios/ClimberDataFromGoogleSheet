
function __doPostBack(eventTarget, eventArgument) {
    var theform;
    if (window.navigator.appName.toLowerCase().indexOf("microsoft") > -1) {
        theform = document.IronPointForm;
    } else {
        theform = document.forms["IronPointForm"];
    }
    theform.__EVENTTARGET.value = eventTarget.split("$").join(":");
    theform.__EVENTARGUMENT.value = eventArgument;
    theform.submit();
}
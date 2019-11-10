let colors = ["red", "green", "blue", "violet", "grey", "black", "yellow", "orange"];

//Colorize Background of Color Select
$("#marchColorInput").on("change", (e) => {
    $("#marchColorInput").css("background-color", $("#marchColorInput").val());
});

function isValid(value) {
    if(value != undefined && value != "")
    {
        //return value.replace(/.|_|<|>|$|&/g, "");
        return true;
    }
    return false;
}

function saveMarch() {
    console.log("Saving March!");
    let title = $("#marchTitleInput").val();
    let color = $("#marchColorInput").val();
    console.log(title, color);

    let errorMsg = "";

    if(title.length < 3)
    {
        errorMsg += "Der Zug Name ist zu kurz\n";
    }
    if(!colors.includes(color)){
        errorMsg += "Kein gültige Zug Farbe\n";
    }

    if(errorMsg.length > 0)
    {
        alert(errorMsg);
        return;
    }

    var data = {name: title, color: color, latlng: [-1, -1]};
    console.log(data);

    // 1. Create a new XMLHttpRequest object
    let xhr = new XMLHttpRequest();

    // 2. Configure it: GET-request for the URL /article/.../load

    if(typeof marchId == "undefined")
    {
        xhr.open('POST', '/api/create/march/');
    }
    else
    {
        xhr.open('POST', '/api/edit/march/' + marchId);
    }

    // 3. Send the request over the network
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send("march=" + JSON.stringify(data));

    alert("Zug gespeichert!");
    window.location.href = "/march";

}
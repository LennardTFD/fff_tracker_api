function loadRoute()
{
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/delete/route/' + routeId);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send();
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.method) {
        /** получение информации  с localstorage */
        case "getLocalStorage":
            //let data = (localStorage[request.key]) ? JSON.parse(localStorage[request.key]) : [];

            let data = (localStorage[request.key]) ? localStorage[request.key] : [];

            sendResponse({data: data});
            break;


        /** обновлям счетчик **/
        case "setLocalStorage":

            console.log(request)

            localStorage[request.key] = JSON.stringify(request.setData);

            sendResponse({data: true});
            break;

        default:

            sendResponse({data: null});

    }
});


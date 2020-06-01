/** открытие настроек */
$(function () {
    $('[data-Action="ShowOption"]').click(function () {
        chrome.tabs.create({url: "options.html"});
    });




    chrome.tabs.query({active:true},function(tabsArray) {
        let tab = tabsArray[0];

        let domain =  new URL( tab.url);








        $('#cntmsg').html(domain.hostname)
        $('#page').html(domain.pathname)


        console.log(domain)
    })










    //
    //
    // const {url} = [];
    // const defaultDetails = {hostname: "", pathname: "", search: ""};
    // const {hostname, pathname, search} = url ? new URL(url) : defaultDetails;
    //
    //
    //
    //









});




(() => {
    let api = {
        domains: {}
    };

    let adsBlock = {
        "vk.com": {
            "div": ".ads_ad_title",
            "type": "text"
        },
        "2ip.ua":{
            'div': ".img_ad",
            "type": 'img'
        },
        "2ip.ru":{
            'div': ".img_ad",
            "type": 'img'
        }
    };
 
    /*** получение есть ли такой доммен на мониторинге ***/
    chrome.runtime.sendMessage({method: "getLocalStorage", key: "userSites"}, function (response) {
        let domains = response.data;

        for (let i in domains) {
            if (domains[i].name === location.host) {
                api.domains = domains[i];

                return init();
            }
        }
    });

    function find(arr, value, index) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][index] == value) {
                return arr[i];
            }
        }
    }

    function init() {
        setInterval(function () {
            let a = $(adsBlock[api.domains.name].div);
            let reg = api.domains.msg;

            /** ищим текст */
            a.each(function () {

                let text = '';
                switch (adsBlock[api.domains.name].type) {
                    case 'text':
                        text = $(this).text();
                        break;
                    case 'img':
                         text = $(this).attr('src');
                        break;
                }
                chrome.runtime.sendMessage({method: "getLocalStorage", key: "adsList"}, function (response) {
                    let ads = response.data;
                    let element = find(ads, text, 'text');

                    if (element == undefined) {





                        ads.push({ads: api.domains.name, text: text, time: unixTime()});
                        setDataBase(ads)
                    }
                });
            });
        }, 5000);
    }
    function setDataBase(data) {
        chrome.runtime.sendMessage({method: "setLocalStorage", key: "adsList", setData: data}, function (response) {});
    }
    function getDataBase(callback) {
        chrome.runtime.sendMessage({method: "getLocalStorage", key: "adsList"}, function (response) {
        //    return callback(response.data);
        });
    }
    function unixTime(){
        return parseInt(new Date().getTime()/1000)
    }

})();
(() => {
    let api = {
        domains: {},
        init: true,
        access_token: null
    };
    function init(){
        if(api.init) {
            chrome.runtime.sendMessage({method: "getLocalStorage", key: "settings"}, function (response) {

                let settings = (response.data) ? JSON.parse(response.data) : [];

                /** проверка работает ли расширение */
                if(settings.power) {
                    chrome.runtime.sendMessage({method: "getLocalStorage", key: "adsSites"}, function (response) {
                        let domains = (response.data) ? JSON.parse(response.data) : [];

                        for (let i in domains) {
                            if (domains[i].domain === location.host) {
                                api.init = false;
                                api.domains = domains[i];

                                chrome.runtime.sendMessage({
                                    method: "getLocalStorage",
                                    key: "access_token"
                                }, function (response) {
                                    api.access_token = response.data;
                                    return rowDiv();
                                });
                            }
                        }
                    });
                }
            });
        }
    }
    function rowDiv() {
        ajax.post('adsDom.get', ajax.generate_request({
            domain: api.domains.domain
        }), {
            onDone: function (data) {
                return check(data);
            },
            onFail: function (msg) {
            }
        });
    }
    function check(dom) {
        setInterval(function () {
            let ads = [];

            for(let i in dom) {
                let a = $(dom[i].dom);
                /** ищим текст */
                a.each(function () {
                    switch (dom[i].type) {
                        case 'text':
                            ads.push($(this).text());
                            break;
                        case 'img':
                            ads.push($(this).attr('src'));
                            break;
                    }
                });
            }
            server(ads);

        }, 5000);
    }
    function server(text) {
        ajax.post('adsSiteMessages.get', ajax.generate_request({
            access_token: api.access_token,
            text: JSON.stringify(text),
            domain: api.domains.domain
        }), {
            onDone: function (data) {},
            onFail: function (msg) {}
        });
    }
    init();
})();
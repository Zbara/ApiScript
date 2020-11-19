let userLang = navigator.language || navigator.userLanguage;

let langList = {
    0: {name: 'Русский', code: 'ru'},
    1: {name: 'Українська', code: 'ua'},
    2: {name: 'English', code: 'en'},
};
let parent = {
    lang: false,
    setting: {},
    langData: {}
};
window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

/*
 * @param lang
 * @param auth
 */
function lang(lang, auth) {
    $.getJSON('lang/' + lang + '.json', function (json) {

        parent.langData = json;
        for (let z in json.lang) {
            let id = $('[data-lang-id="' + json.lang[z].key + '"]');

            switch (json.lang[z].type) {
                case 'placeholder':
                    id.attr("placeholder", json.lang[z].text);
                    break;

                case 'initSystem':
                    parent.lang = true;
                    if(auth)  init();
                    break;
                case 'title':
                    document.title = json.lang[z].text;

                    if(auth) server.accessCheck();

                    break;
                default:
                    id.text(json.lang[z].text)
            }
        }
    });
}

/**
 * @param max
 * @returns {number}
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * @param i
 */
function setErrorInputMsg(i) {
    let el = typeof i == 'string' ? $('#' + i) : $(i);

    el.css('background', '#ffefef');
    el.focus();
    setTimeout(function () {
        el.css('background', '#fff').focus();
    }, 700);
}

/**
 * @param arr
 * @param value
 * @param key
 * @returns {[]}
 */
function find(arr, value, key) {
    let array = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === value) {
            array[i] = arr[i][key];
        }
    }
    return array;
}

/**
 * @param obj
 * @returns {*|boolean}
 */
function isFunction(obj) {
    return obj && Object.prototype.toString.call(obj) === '[object Function]';
}

/**
 * @returns {*|{}}
 */
function extend() {
    var a = arguments, target = a[0] || {}, i = 1, l = a.length, deep = false, options;

    if (typeof target === 'boolean') {
        deep = target;
        target = a[1] || {};
        i = 2;
    }

    if (typeof target !== 'object' && !isFunction(target)) target = {};

    for (; i < l; ++i) {
        if ((options = a[i]) != null) {
            for (var name in options) {
                var src = target[name], copy = options[name];

                if (target === copy) continue;

                if (deep && copy && typeof copy === 'object' && !copy.nodeType) {
                    target[name] = extend(deep, src || (copy.length != null ? [] : {}), copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    return target;
}

let ajax = {
    curl: function (post, method, callback) {
        method = method.split(',');
        $.ajax({
            type: (method[1]) ? method[1] : 'POST',
            url: 'https://extension.zbara.ru/method/' + method[0],
            dataType: 'JSON',
            data: post,
            success: function (response) {
                if (response.error) {
                    return callback({
                        error: response.error,
                    });
                }
                return callback({
                    server: response.response,
                });
            },
            error: function (error) {
            }
        });
    },
    generate_request: function (params) {
        params['v'] = 0.3;
        params['lang'] = parent.setting.lang;
        params['time'] = time();

        for (i in params) {
            params[i] = params[i];
        }
        return params;
    },

    post: function (method, query, options) {
        let o = extend(options || {});

        if (o.showProgress) o.showProgress();

        ajax.curl(query, method, function (response) {
            if (o.hideProgress) o.hideProgress();

            return (response.server) ? o.onDone(response.server) : o.onFail(response.error);
        });
    }
};

function in_array(find, arr) {
    for (var i = 0; i <= arr.length; i++) if (arr[i] == find) return true;
    return false;
}

function isValidAdres(adres) {
    let check_1 = new RegExp(/^[a-zA-Z0-9\_\.]+$/);
    if (check_1.test(adres)) {
        let noLogin = ['login'];
        if (!in_array(adres, noLogin)) return true;
        else return false;
    } else return false;
}
function checkURL(url) {
    var regURLrf = /^(?:(?:https?|ftp|telnet):\/\/(?:[а-я0-9_-]{1,32}(?::[а-я0-9_-]{1,32})?@)?)?(?:(?:[а-я0-9-]{1,128}\.)+(?:рф)|(?! 0)(?:(?! 0[^.]|255)[ 0-9]{1,3}\.){3}(?! 0|255)[ 0-9]{1,3})(?:\/[a-zа-я0-9.,_@%&?+=\~\/-]*)?(?:#[^ \'\"&<>]*)?$/i;
    var regURL = /^(?:(?:https?|ftp|telnet):\/\/(?:[a-z0-9_-]{1,32}(?::[a-z0-9_-]{1,32})?@)?)?(?:(?:[a-z0-9-]{1,128}\.)+(?:com|net|org|mil|edu|arpa|ru|gov|biz|info|aero|inc|name|[a-z]{2})|(?! 0)(?:(?! 0[^.]|255)[ 0-9]{1,3}\.){3}(?! 0|255)[ 0-9]{1,3})(?:\/[a-zа-я0-9.,_@%&?+=\~\/-]*)?(?:#[^ \'\"&<>]*)?$/i;
    return regURLrf.test(url)||regURL.test(url);
}
function ge(el) {
    return (typeof el == 'string' || typeof el == 'number') ? document.getElementById(el) : el;
}

function time(){
    return parseInt(new Date().getTime()/1000)
}

function butloading(i, w, d, t) {
    if (d == 'disabled') {
        $('#' + i).html('<div style="width:' + w + 'px;text-align:center;"><img src="/images/loading_mini.gif" alt="" /></div>');
        ge(i).disabled = true;
    } else {
        $('#' + i).html(t);
        ge(i).disabled = false;
    }
}



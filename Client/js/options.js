function LS_getValue(a, b) {
    return localStorage[a] || b;
}

function LS_setValue(a, b) {
    return localStorage[a] = b;
}

let langList = {
    0: {name: 'Русский', code: 'ru'},
    1: {name: 'Українська', code: 'ua'},
    2: {name: 'English', code: 'en'},
};

let parent = {
    lang: false,
    langData: {}
};

/**
 * @param name
 * @param id
 * @param text
 * @returns {string}
 */
function checkSitesTemplete(name, id, text) {
    return '                <tr data-item-id="Id_' + id + '">\n' +
        '                    <td>' + id + '</td>\n' +
        '                    <td>' + name + '</td>\n' +
        // '                    <td>' + text + '</td>\n' +
        '                    <td style="text-align:center;width:120px;">\n' +
        '                        <button class="btn btn-mini  btn-xs btn-danger" data-action="RemoveDelete" data-id="' + id + '">\n' +
        '                            Удалить\n' +
        '                        </button>\n' +
        '                    </td>\n' +
        '                </tr>'
}


function checkMassagesListTemplete(id, host, messages, time) {
    return '                <tr data-item-id="Id_' + id + '">\n' +
        '                    <td>' + id + '</td>\n' +
        '                    <td>' + host + '</td>\n' +
        '                    <td>' + messages + '</td>\n' +
        '                    <td>' + unixToDate(time) + '</td>\n' +
        '                </tr>'
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
            url: 'http://extension.zbara.ru/method/' + method[0],
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

        for (i in params) {
            params[i] = params[i];
        }
        return params;
    },

    post: function (method, query, options) {
        var o = extend(options || {});

        if (o.showProgress) o.showProgress();

        ajax.curl(query, method, function (response) {
            if (o.hideProgress) o.hideProgress();

            return (response.server) ? o.onDone(response.server) : o.onFail(response.error);
        });
    }
};


function deleteHost() {
    let sitesCheck = (LS_getValue('userSites')) ? JSON.parse(LS_getValue('userSites')) : [];
    $('[data-action="RemoveDelete"]').click(function () {
        if (confirm("Удалить с мониторинга?")) {
            let t = parseInt($(this).attr("data-Id"));
            for (let n = 0; n < sitesCheck.length; n++) {
                if (sitesCheck[n].id === t) {
                    sitesCheck.splice(n, 1);
                    $('[data-item-id="Id_' + t + '"]').remove();
                    LS_setValue('userSites', JSON.stringify(sitesCheck));
                }
            }
        }
    });
}

function unixToDate(UNIX_timestamp) {
    let a = new Date(UNIX_timestamp * 1000);
    let month = parent.langData.langKeys.local.months_of[a.getMonth() + 1];

    return a.getDate() + ' ' + month + ' ' + a.getFullYear() + ' в ' + a.getHours() + ':' + a.getMinutes();
}


$(function () {
    /** настройки */
    let setting = JSON.parse(((localStorage['settings']) ? localStorage['settings'] : '{}'));

    parent.setting = {
        lang: (setting.lang) ? setting.lang : 'ru',
        count: (setting.count) ? parseInt(setting.count) : 5,
        power: (setting.power === undefined) ? true : setting.power
    };

    /** загрузка списка языков **/
    for (let i in langList) {
        $('#lang').append('<option value="' + langList[i].code + '" id="' + langList[i].code + '">' + langList[i].name + '</option>');
    }

    /** заугрка языков */
    lang(parent.setting.lang);
});


function lang(lang) {
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
                    init();
                    break;

                case 'title':
                    document.title = json.lang[z].text;

                    checkToken();

                    break;
                default:
                    id.text(json.lang[z].text)
            }
        }
    });
}

function checkUserServerInfo() {
    ajax.post('users.get', ajax.generate_request({
        access_token: localStorage.access_token
    }), {
        onDone: function (data) {
            if (data.id > 0) {
                $('[data-id="account-login"]').hide();
                $('[data-lang-id="account-title-login"]').hide();
                $('[data-account-login="info"]').show();
                $('[data-account-user="id"]').text(data.id);
                $('[data-account-user="login"]').text(data.login);
                $('[data-account-user="email"]').text(data.email);
                $('[data-account-user="server"]').text(data.server);
            }
        },
        onFail: function (msg) {
        }
    });
}

let common = {
    settingMain: function (data) {
        $('#lang').selectpicker({'width': '300px'}).selectpicker('val', data.lang);
        $('#BlockCheckCount').spinner({value: data.count, min: 1, max: 20});
        $('.make-switch').bootstrapSwitch('state', data.power);
    }
};


function getSettingsUser() {
    ajax.post('userSettings.get', ajax.generate_request({
        access_token: localStorage.access_token
    }), {
        onDone: function (data) {
            common.settingMain(data);
        },
        onFail: function (msg) {
        }
    });
}

function adsServerSend() {
    let ads = JSON.parse(((localStorage['adsList']) ? localStorage['adsList'] : '{}'));

    ajax.post('ads.set', ajax.generate_request({
        access_token: localStorage.access_token,
        json: JSON.stringify(ads)
    }), {
        onDone: function (data) {},
        onFail: function (msg) {}
    });
}

function checkToken() {
    if (localStorage.access_token) {
        ajax.post('authCheckToken.get', ajax.generate_request({
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                if (data.time > 0) {
                    getSettingsUser();
                    checkUserServerInfo();
                    adsServerSend();
                } else {
                    $('[ data-id="account-login"]').show();
                    delete localStorage.access_token;
                }
            },
            onFail: function (msg) {
            }
        });
    }
}

function init() {
    let sitesCheck = (LS_getValue('userSites')) ? JSON.parse(LS_getValue('userSites')) : [];
    let ads_Messages = (LS_getValue('adsList')) ? JSON.parse(LS_getValue('adsList')) : [];

    $('[data-Action="SaveSettings"]').click(function () {
        let lang = $('#lang').val();
        let count = $('#CheckCount').val();
        let power = $('.make-switch').bootstrapSwitch('state');

        localStorage['settings'] = JSON.stringify({
            lang: lang,
            count: parseInt(count),
            power: power,
        });
        if(localStorage.access_token) {
            ajax.post('userSettings.set', ajax.generate_request({
                access_token: localStorage.access_token,
                lang: lang,
                count: count,
                power: power
            }), {
                onDone: function (data) {
                    return location.reload();
                },
                onFail: function (msg) {
                }
            });
        } else return location.reload();
    });

    if(!localStorage.access_token)  common.settingMain(parent.setting);

    $("#myTab a").click(function (n) {
        n.preventDefault(), $(this).tab("show")
    });
    $('[data-Action="NewUserAgent"]').click(function () {
        $("#userAgentModalWindow").modal().show()
    });

    $('[data-action="logout"]').click(function () {
        bootbox.confirm({
            title: "Вы уверены что хотите выйти?",
            size: 'small',
            message: "Выйдя с аккаунта синхронизация будет разорванная, выйти?",
            buttons: {
                confirm: {
                    label: 'Выйти',
                    className: 'btn-danger'
                },
                cancel: {
                    label: 'Остаться',
                    className: 'btn-success'
                }
            },
            callback: function (result) {
                if (result) {
                    delete localStorage.access_token;

                    location.reload();
                }
            }
        });
    });
    $('[data-action="NewSiteLink"]').click(function () {
        let url = $('#siteLink'),
            msg = $('#msg'),
            rnd = getRandomInt(100);

        if (!url.val()) {
            return setErrorInputMsg('siteLink');
        }
        let userSites = LS_getValue('userSites');
        let sitesZ = (userSites) ? JSON.parse(userSites) : [];

        if (sitesCheck.length === 0) {
            $('#domainListDiv_no').hide();
            $('#domainListDiv').show();
        }
        sitesZ.push({id: rnd, name: url.val(), msg: msg.val()});

        LS_setValue('userSites', JSON.stringify(sitesZ));
        $('#checkSite_div').append(checkSitesTemplete(url.val(), rnd, msg.val()));
        url.val(''), msg.val('');
    });

    $('[data-action="AuthStart"]').click(function () {
        login.auth();
    });
    $('[data-action="RegStart"]').click(function () {
        login.reg();
    });
    $('[data-action="RegPage"]').click(function () {
        $('[data-id="account-login"]').hide();
        $('[data-id="account-reg"]').show();
        $('[data-lang-id="account-title-login"]').html('Регистрация аккаунта');
    });
    $('[data-action="AuthStart_back"]').click(function () {
        $('[data-id="account-login"]').show();
        $('[data-id="account-reg"]').hide();
        $('[data-lang-id="account-title-login"]').html('Вход в свой аккаунт');
    });


    ads_Messages.sort(function (a, b) {
        return b.time - a.time;
    });

    /** вывод сайтов за которыми смотрим */
    for (let i in sitesCheck) {
        $('#checkSite_div').append(checkSitesTemplete(sitesCheck[i].name, sitesCheck[i].id, sitesCheck[i].msg));
    }

    /** вывод какая реклама показывалась **/
    for (let i in ads_Messages) {
        $('#UserAds_user').append(checkMassagesListTemplete(0, ads_Messages[i].ads, ads_Messages[i].text, ads_Messages[i].time));
    }

    if (sitesCheck.length > 0) {
        $('#domainListDiv').show();
    } else $('#domainListDiv_no').show();


    $('#adsCount').html(ads_Messages.length);
    deleteHost();
}




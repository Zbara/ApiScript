/**
 * @param name
 * @param id
 * @param text
 * @returns {string}
 */
function checkSitesTemplete(id, name, text) {
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
        '                    <td>' + time + '</td>\n' +
        '                </tr>'
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
    lang(parent.setting.lang, 1);
});

function init() {
    $("#myTab a").click(function (n) {
        n.preventDefault(), $(this).tab("show")
    });

    $('[data-Action="SaveSettings"]').click(function () {
        server.saveSettings();
    });

    $('[data-action="logout"]').click(function () {
        server.userLogout()
    });

    $('[data-action="NewSiteLink"]').click(function () {
        server.newLink();
    });
}
let server = {
    sites: function () {
        ajax.post('adsSites.get', ajax.generate_request({
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                let sites = data.sites;

                for (let i in sites) {
                    $('#checkSite_div').append(checkSitesTemplete(sites[i].id, sites[i].domain, sites[i].messages));
                }
                if (sites.length > 0) {
                    $('#domainListDiv').show();
                }
                server.deleteSites();
            },
            onFail: function (msg) {
            }
        });
    },
    stats: function () {
        ajax.post('adsMessages.get', ajax.generate_request({
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                let ads = data.ads;

                $('#adsCount').html(ads.length);

                for (let i in ads) {
                    $('#UserAds_user').append(checkMassagesListTemplete(ads[i].id, ads[i].domain, ads[i].messages, ads[i].time));
                }
            },
            onFail: function (msg) {
            }
        });
    },
    accessCheck: function () {
        ajax.post('authCheckToken.get', ajax.generate_request({
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                if (data.time > 0) {
                    server.getSettingsUser();
                    server.stats();
                    server.sites();
                    server.usersInfo();
                } else server.refreshAccess();
            },
            onFail: function (msg) {
            }
        });
    },
    refreshAccess: function () {
        delete localStorage.access_token;

        document.location.href = '/login.html';
    },
    getSettingsUser: function () {
        ajax.post('userSettings.get', ajax.generate_request({
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                localStorage['settings'] = JSON.stringify({
                    lang: data.lang,
                    count: parseInt(data.count),
                    power: data.power,
                });
                server.settingMain(data);
            },
            onFail: function (msg) {
            }
        });
    },
    settingMain: function (data) {
        $('#lang').selectpicker({'width': '300px'}).selectpicker('val', data.lang);
        $('#BlockCheckCount').spinner({value: parseInt(data.count), min: 1, max: 20});
        $('.make-switch').bootstrapSwitch('state', data.power);
    },
    usersInfo: function () {
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
    },
    saveSettings: function () {
        let lang = $('#lang').val();
        let count = $('#CheckCount').val();
        let power = $('.make-switch').bootstrapSwitch('state');

        localStorage['settings'] = JSON.stringify({
            lang: lang,
            count: parseInt(count),
            power: power,
        });

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
    },
    userLogout: function () {
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
                    document.location.href = '/login.html';
                }
            }
        });
    },
    newLink: function () {
        let url = $('#siteLink'),
            msg = $('#msg'),
            rnd = getRandomInt(100);

        if (!url.val() || !checkURL(url.val())) {
            return setErrorInputMsg('siteLink');
        }
        ajax.post('adsNewSite.set', ajax.generate_request({
            domain: url.val(),
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                $('#alertAddDomain').addClass('alert-success').show().html(parent.langData.langKeys.local.domain_add);

                setTimeout(function () {
                    $('#alertAddDomain').hide().removeClass('alert-success');
                }, 5000);

                url.val('');
                msg.val('');

                $('#checkSite_div').prepend(checkSitesTemplete(data.id, data.domain, ''));

                server.deleteSites();
            },
            onFail: function (error) {
                $('#alertAddDomain').addClass('alert-danger').show().html(error.error.messages);

                setTimeout(function () {
                    $('#alertAddDomain').hide().removeClass('alert-danger');
                }, 5000);
            }
        });
    },
    deleteSites: function () {
        $('[data-action="RemoveDelete"]').click(function () {
            let id = parseInt($(this).attr("data-Id"));
            bootbox.confirm({
                title: "Удалить?",
                size: 'small',
                message: "Удалить сайт с мониторинга?",
                buttons: {
                    confirm: {
                        label: 'Удалить',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'Отменить',
                        className: 'btn-success'
                    }
                },
                callback: function (result) {
                    if (result) {
                        ajax.post('adsDeleteSites.set', ajax.generate_request({
                            access_token: localStorage.access_token,
                            id: id
                        }), {
                            onDone: function (data) {
                                if(data.success) {
                                    $('[data-item-id="Id_' + id + '"]').remove();
                                }
                            },
                            onFail: function (msg) {
                            }
                        });
                    }
                }
            });
        });
    }
};
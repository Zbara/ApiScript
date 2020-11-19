/**
 * @param id
 * @param name
 * @param time
 * @param messages
 * @returns {string}
 */
function checkSitesTemplete(id, name, time, messages){
    return '                <tr data-item-id="Id_' + id + '">\n' +
        '                    <td>' + id + '</td>\n' +
        '                    <td>' + name + '</td>\n' +
        '                    <td>' + messages + '</td>\n' +
        '                    <td>' + time + '</td>\n' +
        '                    <td style="text-align:center;width:120px;">\n' +
        '                        <button class="btn btn-mini  btn-xs btn-danger" data-action="RemoveDelete" data-id="' + id + '">' + parent.langData.langKeys.local.sites_delete_title + '</button>\n' +
        '                    </td>\n' +
        '                </tr>'
}

/***
 * @param id
 * @param host
 * @param messages
 * @param time
 * @returns {string}
 */
function checkMassagesListTemplete(id, host, messages, time) {
    return '                <tr data-item-id="Id_' + id + '">\n' +
        '                    <td>' + id + '</td>\n' +
        '                    <td>' + host + '</td>\n' +
        '                    <td><span  data-toggle="tooltip" data-placement="top" title="' + messages + '">' + messages.slice(0,50)  + '</span></td>\n' +
        '                    <td>' + time + '</td>\n' +
        '                </tr>'
}
function pie(stats) {
    let config = {
        type: 'pie',
        data: {
            datasets: [{
                data: stats.stats,
                backgroundColor: [
                    window.chartColors.red,
                    window.chartColors.orange,
                    window.chartColors.yellow,
                    window.chartColors.green,
                    window.chartColors.blue,
                ],
                label: 'Dataset 1'
            }],
            labels: stats.domain
        },
        options: {
            responsive: true
        }
    };
    let ctx = document.getElementById('canvasPie').getContext('2d');
    window.myLine = new Chart(ctx, config);
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
        $('#langUser').append('<option value="' + langList[i].code + '" id="' + langList[i].code + '">' + langList[i].name + '</option>');
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

    $('[data-action="modelNewSite"]').click(function () {
        server.newLinkFull();
    });

    $('[data-action="domainMessages"]').click(function () {
        $('#newAdsSitesModal').modal().show();
    });

    $('[data-action="pieStart"]').click(function () {
        $('#pieStartModal').modal().show();
    });
}


let server = {
    sites: function () {
        ajax.post('adsSites.get', ajax.generate_request({
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                let sites = data.sites;

                delete localStorage.adsSites;

                for (let i in sites) {
                    $('#checkSite_div').append(checkSitesTemplete(sites[i].id, sites[i].domain, sites[i].date, sites[i].messages));
                }
                if (sites.length > 0) {
                    $('#domainListDiv').show();
                }

                /** обновляем хранилище **/
                localStorage['adsSites'] = JSON.stringify(sites);

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

                delete localStorage.adsMessages;

                $('#adsCount').html(ads.length);

                for (let i in ads) {
                    $('#UserAds_user').append(checkMassagesListTemplete(ads[i].id, ads[i].domain, ads[i].messages, ads[i].time));
                }


                $('[data-toggle="tooltip"]').tooltip();

                pie(data.pie);

                /** обновляем хранилище **/
                localStorage['adsMessages'] = JSON.stringify(ads);
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
        $("#ads_new_model").select2({
            tags: data.tags
        });

        $('#langUser').selectpicker({'width': '300px'}).selectpicker('val', data.lang);
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
        let lang = $('#langUser').val();
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
            title: parent.langData.langKeys.local.login_exit,
            size: 'small',
            message: parent.langData.langKeys.local.login_exit_messages,
            buttons: {
                confirm: {
                    label: parent.langData.langKeys.local.login_exit_yes,
                    className: 'btn-danger'
                },
                cancel: {
                    label: parent.langData.langKeys.local.login_exit_no,
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
        let url = $('#siteLink');

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

                $('#checkSite_div').prepend(checkSitesTemplete(data.id, data.domain, data.time, data.messages));

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
                title:  parent.langData.langKeys.local.sites_delete_title,
                size: 'small',
                message: parent.langData.langKeys.local.sites_delete_messages,
                buttons: {
                    confirm: {
                        label: parent.langData.langKeys.local.sites_delete_yes,
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: parent.langData.langKeys.local.sites_delete_no,
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
    },
    newLinkFull: function(){
        let url = $('#domain_model_name'),
            messages = $('#ads_new_model');

        if (!url.val() || !checkURL(url.val())) {
            return setErrorInputMsg('domain_model_name');
        }
        if (!messages.val()) {
            $('#alertAddDomainModel').addClass('alert-danger').show().html('Введите ключевые слова');

            setTimeout(function () {
                $('#alertAddDomainModel').hide().removeClass('alert-danger');
            }, 5000);

            return false;
        }
        ajax.post('adsNewSite.set', ajax.generate_request({
            domain: url.val(),
            messages: messages.val(),
            access_token: localStorage.access_token
        }), {
            onDone: function (data) {
                $('#alertAddDomainModel').addClass('alert-success').show().html(parent.langData.langKeys.local.domain_add);

                setTimeout(function () {
                    $('#alertAddDomain').hide().removeClass('alert-success');
                }, 5000);

                url.val('');

                $('#checkSite_div').prepend(checkSitesTemplete(data.id, data.domain, data.time, data.messages));

                server.deleteSites();

                $('#newAdsSitesModal').modal('hide');

            },
            onFail: function (error) {
                $('#alertAddDomainModel').addClass('alert-danger').show().html(error.error.messages);

                setTimeout(function () {
                    $('#alertAddDomainModel').hide().removeClass('alert-danger');
                }, 5000);
            }
        });
    }
};
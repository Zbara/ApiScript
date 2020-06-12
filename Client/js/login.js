$(function () {
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
    if(localStorage['access_token']) return document.location.href = '/options.html';
});
userLang = userLang.split('-');
lang(userLang[0], 0);

parent.setting.lang = userLang[0];

let login = {

    reg: function () {
        let email = $('#join_email').val(),
            login = $('#join_login').val(),
            pass = $('#join_pass').val();

        if (!isValidAdres(login)) {
            return setErrorInputMsg('join_login');
        }
        if (!this.isValidEmailAddress(email)) {
            return setErrorInputMsg('join_email');
        }
        if (pass.length < 6) {
            return setErrorInputMsg('join_pass');
        }
        ajax.post('register.do', ajax.generate_request({
            email: email,
            pass: pass,
            login: login,
            lang: parent.setting.lang,
            count: 5,
            power: true
        }), {
            onDone: function (data) {
                localStorage['access_token'] = data.access_token;
                $('#alertReg').addClass('alert-success').show().html(data.messages);

                setTimeout(function () {
                    return document.location.href = '/options.html';
                }, 3000);
            },
            onFail: function (msg) {
                $('#alertReg').addClass('alert-danger').show().html(msg.message);

                setTimeout(function () {
                    $('#alertReg').hide().removeClass('alert-danger');
                }, 5000);
            }
        });
    },
    auth: function () {
        let email = $('#email').val(),
            password = $('#password').val();

        if (!email || email.length < 1) {
            return setErrorInputMsg('email');
        }
        if (!password || password.length < 6) {
            return setErrorInputMsg('password');
        }
        ajax.post('/authorize.do,GET', ajax.generate_request({
            email: email,
            password: password,
        }), {
            onDone: function (data) {
                localStorage['access_token'] = data.access_token;

                localStorage['settings'] = JSON.stringify({
                    lang: data.lang
                });

                $('#alert').addClass('alert-success').show().html(data.messages);

                setTimeout(function () {
                    return document.location.href = '/options.html';
                }, 5000);
            },
            onFail: function (error) {
                $('#alert').addClass('alert-danger').show().html(error.error.message);

                setTimeout(function () {
                    $('#alert').hide().removeClass('alert-danger');
                }, 5000);
            }
        });
    },
    isValidEmailAddress: function (emailAddress) {
        let pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
        return pattern.test(emailAddress);
    }
};
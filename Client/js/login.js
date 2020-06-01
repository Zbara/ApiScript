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

let login = {

    reg: function () {
        let email = $('#join_email').val(),
            login = $('#join_login').val(),
            pass = $('#join_pass').val(),
            lang = $('#lang').val(),
            count = $('#CheckCount').val(),
            power = $('.make-switch').bootstrapSwitch('state');

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
            lang: lang,
            count: count,
            power: power
        }), {
            onDone: function (data) {
                localStorage['access_token'] = data.access_token;
                $('#alertReg').addClass('alert-success').show().html(data.messages);

                setTimeout(function () {
                    return location.reload();
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
                $('#alert').addClass('alert-success').show().html(data.messages);

                setTimeout(function () {
                    return location.reload();
                }, 5000);
            },
            onFail: function (msg) {
                $('#alert').addClass('alert-danger').show().html(msg.message);

                setTimeout(function () {
                    $('#alert').hide().removeClass('alert-danger');
                }, 5000);
            }
        });
    },
    restore: function (el, textContent) {
        let email = $('#emailRestore').val();
        if (email !== 0 && email !== 'Ваш электронный адрес' && this.isValidEmailAddress(email)) {

            ajax.post('/api.php', ajax.generate_request({
                email: email,
            }, {
                request: 'login',
                action: 'restore',
                section: 'getUser'
            }), {
                onDone: function (msg) {
                    $('#c_src').attr('src', msg.photo);
                    $('#c_name').html('<b>' + msg.first_name + ' ' + msg.last_name + '</b>');
                    $('#step1').hide();
                    $('#step2').show();
                },
                onFail: function (msg) {
                    $('#alertRestore').show().html(msg);

                    setTimeout(function () {
                    }, 5000);
                },
                showProgress: function () {
                    butloading(el.id, 87, 'disabled');
                },
                hideProgress: function () {
                    butloading(el.id, 87, 'enabled', textContent);
                }
            });
        } else return setErrorInputMsg('emailRestore');
    },
    sendRestore: function (el, textContent) {
        let email = $('#emailRestore').val();

        ajax.post('/api.php', ajax.generate_request({
            email: email,
        }, {
            request: 'login',
            action: 'restore',
            section: 'setRestore'
        }), {
            onDone: function (msg) {
                $('#restoreSendOk').html(msg.text);
                $('#step2').hide();
                $('#step3').show();
            },
            onFail: function (msg) {
                $('#alertRestore').show().html(msg);

                setTimeout(function () {
                }, 5000);
            },
            showProgress: function () {
                butloading(el.id, 87, 'disabled');
            },
            hideProgress: function () {
                butloading(el.id, 87, 'enabled', textContent);
            }
        });
    },
    restoreUpdates: function (el, textContent) {
        let new_pass = $('#new_pass').val();
        let new_pass2 = $('#new_pass_2').val();
        let hash = $('#hash').val();
        if (new_pass != 0 && new_pass != 'Новый пароль') {
            if (new_pass2 != 0 && new_pass2 != 'Повторите еще раз новый пароль') {
                if (new_pass == new_pass2) {
                    if (new_pass.length >= 6) {
                        ajax.post('/api.php', ajax.generate_request({
                            new_pass: new_pass,
                            new_pass_2: new_pass2,
                            hash: hash,
                        }, {
                            request: 'login',
                            action: 'restore',
                            section: 'setUpdate'
                        }), {
                            onDone: function (msg) {
                                $('#step1').hide();
                                $('#step2').show();
                            },
                            onFail: function (msg) {
                                $('#alert').show().html(msg);
                            },
                            showProgress: function () {
                                butloading(el.id, 87, 'disabled');
                            },
                            hideProgress: function () {
                                butloading(el.id, 87, 'enabled', textContent);
                            }
                        });
                    } else $('#alert').show().html('Длина пароля должна быть не менее 6 символов.');
                } else $('#alert').show().html('Оба введенных пароля должны быть идентичны.');
            } else setErrorInputMsg('new_pass_2');
        } else setErrorInputMsg('new_pass');
    },
    isValidEmailAddress: function (emailAddress) {
        let pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
        return pattern.test(emailAddress);
    }
};
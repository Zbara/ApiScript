<?php

namespace Method\Users;

use Method\BaseMethod;
use Controller;
use Connection;

class UsersSettings extends BaseMethod
{
    public function run(Controller $controller, Connection $db)
    {
        $lang = $controller->request->post('lang');
        $count = $controller->request->post('count');
        $power = ($controller->request->post('power') == 'true') ? 'on' : 'off';

        $db->query("update `users` set `lang` = '{$lang}', `count` = '{$count}', `power` = '{$power}' WHERE `user_id`= '{$controller->session->user_id}'", SQL_RESULT_AFFECTED);

        return ['edit' => 1];
    }
}
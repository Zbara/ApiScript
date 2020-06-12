<?php
namespace Method\Users;

use Method\BaseMethod;
use Controller;
use Connection;
use Tools;

class Users extends BaseMethod
{
    public function run(Controller $controller, Connection $db)
    {
        /** @var  $row */
        $row = $db->query("SELECT * FROM `users` WHERE user_id = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

        return [
            'id' => (int) $row->user_id,
            'email' => $row->user_email,
            'login' => $row->user_login,
            'server' => Tools\dateTime::timeGram(time(), $controller->lang)
        ];
    }
}
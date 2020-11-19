<?php
namespace Method\Authorize;

use Method\BaseMethod;
use Controller;
use Connection;
use Model\session;
use ZbaraException;
use ErrorCode;


class Register extends BaseMethod
{
    var $join;

    function run(Controller $controller, Connection $db)
    {
        /** @var  $params */
        $params = ['email', 'login', 'pass', 'lang', 'count', 'power'];

        /** @var  $items */
        foreach ($params as $items) {
            /** @var $this ->join->$items */
            $this->join->$items = $db->escape($controller->request->post($items));

            switch ($items) {
                case 'email':
                    /** @var  $email */
                    $email = $db->query("SELECT `user_id` FROM `users` WHERE `user_email` = '{$this->join->email}'", SQL_RESULT_ITEM);
                    if ($email->user_id) return ['error' => ['message' => $controller->lang->reg_email_fail, 'code' => 0]];
                    break;

                case 'login':
                    /** проверка на логин */
                    if (!preg_match("/^([A-Za-z0-9_.]+)$/", $this->join->login)) return ['data' => [], 'error' => ['message' => $controller->lang->reg_char_login, 'code' => 0]];
                    if (mb_strlen($this->join->login) < 3 or mb_strlen($this->join->login) > 15) return ['data' => [], 'error' => ['message' => $controller->lang->reg_login_lgn, 'code' => 0]];

                    /** @var  $email */
                    $login = $db->query("SELECT `user_id` FROM `users` WHERE `user_login` = '{$this->join->login}'", SQL_RESULT_ITEM);
                    if ($login->user_id) return ['error' => ['message' => $controller->lang->reg_login_fail, 'code' => 0]];
                    break;

                case 'pass':
                    if (mb_strlen($this->join->pass) < 6 and mb_strlen($this->join->pass) > 32) return ['error' => ['message' => $controller->lang->reg_pass_fail, 'code' => 0]];
                    break;
                case 'power':
                    $this->join->power = ($this->join->power == 'true') ? 'on' : 'off';
                    break;
            }
        }
        return $this->joinEnd($controller, $db);
    }
    private function joinEnd(Controller $controller, Connection $db)
    {
        /** @var  $password */
        $password = password_hash($this->join->pass, PASSWORD_DEFAULT);

        /** @var  $user_id */
        $user_id = $db->query("INSERT INTO `users` SET `power` = '{$this->join->power}', `lang` = '{$this->join->lang}', `count` = '{$this->join->count}', `user_login` = '{$this->join->login}', `user_email` = '{$this->join->email}', `user_password` = '{$password}', user_reg_date = UNIX_TIMESTAMP(), user_lastdate = UNIX_TIMESTAMP(), user_ip = '{$this->request->server['REMOTE_ADDR']}', user_ip_reg = '{$this->request->server['REMOTE_ADDR']}'", SQL_RESULT_INSERTED);

        /** ok */
        if ($user_id > 0) {

            /** @var  $auth */
            $auth = [
                '_origin' => $controller->request->server('HTTP_HOST'),
                'user_agent' => $controller->request->server('HTTP_USER_AGENT'),
                'slot' => gener(32),
                'user_id' => $user_id,
                'ip' => $controller->request->server('REMOTE_ADDR')
            ];

            $sessionModel = new session($user_id, $controller->lang->reg_success, $auth, $this->join->lang);

            return $controller->perform(new Add((object)["auth" => $sessionModel]));

        } else return ['data' => [], 'error' => ['message' => $controller->lang->error, 'code' => 0]];
    }
}
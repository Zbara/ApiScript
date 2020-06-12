<?php

namespace Method\Authorize;

use Connection;
use Controller;
use Method\BaseMethod;
use Model\session;

class Add extends BaseMethod
{
    /** @var session **/
    protected $auth;

    function run(Controller $controller, Connection $db)
    {
        /** @var  $sessionJson */
        $sessionJson = json_encode($this->auth->getAuth());

        /** @var  $req_array */
        $req_array = [];
        /**
         * @var  $key
         * @var  $value
         */
        foreach ($this->auth->getAuth() as $key => $value) {
            if ($key != null) array_push($req_array, $key . '=' . $value);
        }
        /** сортируем массив */
        sort($req_array);

        /** @var  $access_token */
        $access_token = hash_hmac('sha256', implode('', $req_array), $controller->config->auth_salt);

        /** @var  $hash */
        $session_hash = substr(md5($access_token), 0, 16);

        $db->query("INSERT INTO `auth_session` (session_auth_key, session_json, session_hash, user_id, session_reg, session_last) VALUES('{$access_token}', '{$sessionJson}', '{$session_hash}', '{$this->auth->getUserId()}', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())", SQL_RESULT_INSERTED);

        return ['access_token' => $access_token, 'user_id' => $this->auth->getUserId(), 'time' => time(), 'messages' => $this->auth->getMessages(), 'lang' => $this->auth->getLang()];
    }
}
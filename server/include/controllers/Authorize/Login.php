<?php

/**
 * Class Login
 */
class Login extends Controller
{
    /**
     * @return array|string
     */
    public function index()
    {
        /** @var  $email and @var $password */
        $email = trim($this->request->get['email']);
        $password = trim($this->request->get['password']);

        /** @var  $get */
        $get = $this->user([$email, $password]);

        /** тип ответа */
        switch ($get[0]) {
            case 1:
                return $get[1];
                break;
            case 2:
                return ['error' => ['message' => 'Login or Password.', 'code' => 2]];
                break;
            default:
                return ['data' => [], 'error' => ['message' => 'Error O_o', 'code' => 5]];
        }
    }

    /**
     * @param $params
     * @return array|int
     */
    private function user($params)
    {
        /** @var  $auth */
        $auth = [
            '_origin' => $this->request->server['HTTP_HOST'],
            'user_agent' => $this->request->server['HTTP_USER_AGENT'],
            'slot' => gener(32)
        ];

        /** @var  $user смотрим в БД */
        $user = $this->db->SQLquery("SELECT `user_id`, `user_password` FROM `users` WHERE user_email = '{$params[0]}'", SQL_RESULT_ITEM);

        /** проверка пароля */
        if (password_verify($params[1], $user->user_password)) {
            $auth['user_id'] = $user->user_id;
            $auth['ip'] = $this->request->server['REMOTE_ADDR'];
            return [1, $this->getSession($auth)];

        } else return [2];
    }


    private function getSession($auth)
    {
        /** @var  $session_json */
        $session_json = json_encode($auth);

        /** @var  $req_array */
        $req_array = [];

        /**
         * @var  $key
         * @var  $value
         */
        foreach ($auth as $key => $value) {
            if ($key != null) array_push($req_array, $key . '=' . $value);
        }
        /** сортируем массив */
        sort($req_array);

        /** @var  $remixsid */
        $remixsid = hash('sha256', implode('', $req_array) . 'FUCK_OFF_EBANIE_LAMERI!!!Thee6xiju8Iw7thosh9ceeweophooTee');

        /** @var  $hash */
        $session_hash = substr(md5($remixsid), 0, 16);

        /** @var пишем в БД */
        $this->db->SQLquery("INSERT INTO `auth_session` (session_auth_key, session_json, session_hash, user_id, session_reg, session_last) VALUES('{$remixsid}', '{$session_json}', '{$session_hash}', '{$auth['user_id']}', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())", SQL_RESULT_INSERTED);

        return ['access_token' => $remixsid, 'user_id' => $auth['user_id'], 'time' => unixTime(), 'messages' => 'Успешно войшли в свой личный кабинет!'];
    }
}
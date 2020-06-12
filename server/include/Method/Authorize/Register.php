<?php
namespace Method\Authorize;
use Controller;
use Model\session;

class Register extends Controller
{
    var $join;
    /**
     * @return array|string
     */
    public function index()
    {
        return $this->startReg();
    }
    private function startReg()
    {
        /** @var  $params */
        $params = ['email', 'login', 'pass', 'lang', 'count', 'power'];

        /** @var  $items */
        foreach ($params as $items) {
            /** @var $this ->join->$items */
            $this->join->$items = $this->db->escape($this->request->post[$items]);

            switch ($items) {
                case 'email':
                    /** @var  $email */
                    $email = $this->db->SQLquery("SELECT `user_id` FROM `users` WHERE `user_email` = '{$this->join->email}'", SQL_RESULT_ITEM);
                    if ($email['user_id']) return ['error' => ['message' => $this->lang->reg_email_fail, 'code' => 0]];
                    break;

                case 'login':
                    /** проверка на логин */
                    if (!preg_match("/^([A-Za-z0-9_.]+)$/", $this->join->login)) return ['data' => [], 'error' => ['message' => $this->lang->reg_char_login, 'code' => 0]];
                    if (mb_strlen($this->join->login) < 3 or mb_strlen($this->join->login) > 15) return ['data' => [], 'error' => ['message' => $this->lang->reg_login_lgn, 'code' => 0]];

                    /** @var  $email */
                    $login = $this->db->SQLquery("SELECT `user_id` FROM `users` WHERE `user_login` = '{$this->join->login}'", SQL_RESULT_ITEM);
                    if ($login['user_id']) return ['error' => ['message' => $this->lang->reg_login_fail, 'code' => 0]];
                    break;

                case 'pass':
                    if (mb_strlen($this->join->pass) < 6 and mb_strlen($this->join->pass) > 32) return ['error' => ['message' => $this->lang->reg_pass_fail, 'code' => 0]];
                    break;
                case 'power':
                    $this->join->power = ($this->join->power == 'true') ? 'on' : 'off';
                    break;


            }
        }
        return $this->joinEnd();
    }


    private function joinEnd()
    {
        /** @var  $password */
        $password = password_hash($this->join->pass, PASSWORD_DEFAULT);

        /** @var  $user_id */
        $user_id = $this->db->SQLquery("INSERT INTO `users` SET `power` = '{$this->join->power}', `lang` = '{$this->join->lang}', `count` = '{$this->join->count}', `user_login` = '{$this->join->login}', `user_email` = '{$this->join->email}', `user_password` = '{$password}', user_reg_date = UNIX_TIMESTAMP(), user_lastdate = UNIX_TIMESTAMP(), user_ip = '{$this->request->server['REMOTE_ADDR']}', user_ip_reg = '{$this->request->server['REMOTE_ADDR']}'", SQL_RESULT_INSERTED);

        /** ok */
        if ($user_id > 0) {
            /** проверка приглашение и сессия открытие сесси */
            return $this->sessionStart($user_id);

        } else return ['data' => [], 'error' => ['message' => $this->lang->error, 'code' => 0]];
    }

    private function sessionStart($user_id)
    {
        /** @var  $auth */
        $auth = [
            '_origin' => $this->request->server('HTTP_HOST'),
            'user_agent' => $this->request->server('HTTP_USER_AGENT'),
            'slot' => gener(32),
            'user_id' => $user_id,
            'ip' => $this->request->server('REMOTE_ADDR')
        ];
        /** @var  $session */
        $session = new session($this);
        return [1, $session->setUserId($user_id)->setAuth($auth)->setMessages($this->lang->reg_success)->getSession()];
    }
}
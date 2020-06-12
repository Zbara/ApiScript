<?php
namespace Method\Authorize;

use Method\BaseMethod;
use Controller;
use Connection;
use Model\session;
use ZbaraException;
use ErrorCode;

class Login extends BaseMethod
{
    /**
     * @param Controller $controller
     * @param Connection $db
     * @return array|mixed
     */
    public function run(Controller $controller, Connection $db)
    {
        /** @var  $email */
        $email = trim($controller->request->get('email'));
        $password = trim($controller->request->get('password'));

        try {
            if(empty($email) || empty($password)) throw new ZbaraException(ErrorCode::INVALID_PARAM);

            /** @var  $user */
            $user = $db->query("SELECT `user_id`, `user_password`, `lang` FROM `users` WHERE user_email = '{$email}'", SQL_RESULT_ITEM);

            /** @var  $auth */
            $auth = [
                '_origin' => $controller->request->server('HTTP_HOST'),
                'user_agent' => $controller->request->server('HTTP_USER_AGENT'),
                'slot' => gener(32)
            ];

            /** проверка пароля */
            if (password_verify($password, $user->user_password)) {
                $auth['user_id'] = $user->user_id;
                $auth['ip'] = $controller->request->server('REMOTE_ADDR');

                $sessionModel = new session($user->user_id, $controller->lang->auth_done, $auth, $user->lang);

                return $controller->perform(new Add((object)["auth" => $sessionModel]));

            } else return ['error' => ['message' => $controller->lang->auth_error, 'code' => 2]];

        } catch (ZbaraException $e){
            return ['error' => 'invalid_client', 'error_description' => 'client_id is incorrect'];
        }
    }



}
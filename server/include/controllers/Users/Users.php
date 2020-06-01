<?php


class Users extends Controller
{
    public function index(){
        /** @var  $checkUser */
        $checkUser = $this->checkToken();

        if($checkUser > 0){
            /** @var  $row */
            $row = $this->db->SQLquery("SELECT * FROM `users` WHERE user_id = '{$checkUser}'", SQL_RESULT_ITEM);

            return [
                'id' => $row['user_id'],
                'email' => $row['user_email'],
                'login' => $row['user_login'],
                'server' => timeGram(unixTime())
            ];
        } else ['error' => 'Error access_token'];
    }

    private function checkToken(){
        /** @var  $access_token */
        $access_token = $this->request->post['access_token'];

        /** @var  $row */
        $row = $this->db->SQLquery("SELECT * FROM `auth_session` WHERE  session_auth_key = '{$access_token}'", SQL_RESULT_ITEM);

        if($row){
            return $row['user_id'];
        } else false;
    }
}
<?php

class UsersSettings extends Controller
{
    public function index(){
        /** @var  $checkUser */
        $checkUser = $this->checkToken();

        if($checkUser > 0){
            $lang = $this->request->post['lang'];
            $count = $this->request->post['count'];
            $power = ($this->request->post['power'] == 'true') ? 'on' : 'off';





            $this->db->SQLquery("update `users` set `lang` = '{$lang}', `count` = '{$count}', `power` = '{$power}' WHERE `user_id`= '{$checkUser}'", SQL_RESULT_AFFECTED);
            return ['edit' => 1];
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
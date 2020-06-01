<?php

class UsersSettingsGet extends Controller
{
    public function index(){
        /** @var  $checkUser */
        $checkUser = $this->checkToken();

        if($checkUser > 0){
            /** @var  $row */
            $row = $this->db->SQLquery("SELECT * FROM `users` WHERE user_id = '{$checkUser}'", SQL_RESULT_ITEM);

            return [
                'power' => ($row['power'] === 'on') ? true : false,
                'count' => $row['count'],
                'lang' => $row['lang'],
                'ads' => $this->ads($checkUser)
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

    private function ads($user_id){
        return $this->db->SQLquery("SELECT COUNT(*) FROM `ads_list` WHERE `user_id` = '{$user_id}'", SQL_RESULT_COUNT);
    }
}

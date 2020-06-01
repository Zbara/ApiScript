<?php
class set extends Controller
{
    public function index(){

        /** @var  $checkUser */
        $checkUser = $this->checkToken();

        if($checkUser > 0){
            /** @var  $json */
            $json = json_decode(htmlspecialchars_decode($this->request->post['json']));

            $adsNew = 0;

            /** @var  $item */
            foreach ($json as $item){
                $row = $this->db->SQLquery("SELECT * FROM `ads_list` WHERE  `text` = '{$item->text}' and  `user_id` = '{$checkUser}'", SQL_RESULT_ITEM);

                if(!$row) {
                    $count = ($item->count) ? (int)$item->count : 0;
                    $this->db->SQLquery("INSERT INTO `ads_list` SET `count` = '{$count}',  `ip` = '{$this->request->server['REMOTE_ADDR']}', `text` = '{$item->text}', `timeserver` = unix_timestamp(), `time` = '{$item->time}', `user_id` = '{$checkUser}'", SQL_RESULT_INSERTED);

                    $adsNew++;
                }
            }
            return ['ads' => $adsNew];
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
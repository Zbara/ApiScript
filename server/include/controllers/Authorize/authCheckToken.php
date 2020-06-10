<?php
class authCheckToken extends Controller
{
    /**
     * @return array
     */
    public function index(){
        /** @var  $access_token */
        $access_token = $this->request->post['access_token'];

        /** @var  $row */
        $row = $this->db->SQLquery("SELECT * FROM `auth_session` WHERE  session_auth_key = '{$access_token}'", SQL_RESULT_ITEM);

        if($row){
            return [
                'time' => (int) $row->session_last,
                'hash' => $row->session_hash
            ];
        } else return ['time' => 0];
    }
}
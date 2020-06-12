<?php
namespace Method\Authorize;

use Method\BaseMethod;
use Controller;
use Connection;

class authCheckToken extends BaseMethod
{
    /**
     * @param Controller $controller
     * @param Connection $db
     * @return array
     */
    public function run(Controller $controller, Connection $db)
    {
        /** @var  $access_token */
        $access_token = $controller->request->post('access_token');

        /** @var  $row */
        $row = $db->query("SELECT * FROM `auth_session` WHERE  session_auth_key = '{$access_token}'", SQL_RESULT_ITEM);

        if($row){
            return [
                'time' => (int) $row->session_last,
                'hash' => $row->session_hash
            ];
        } else return ['time' => 0];
    }
}
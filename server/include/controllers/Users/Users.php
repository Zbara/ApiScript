<?php
/**
 * Class Users
 */
class Users extends Controller
{
    public function index()
    {

        /** @var  $row */
        $row = $this->db->SQLquery("SELECT * FROM `users` WHERE user_id = '{$this->session->user_id}'", SQL_RESULT_ITEM);

        return [
            'id' => $row->user_id,
            'email' => $row->user_email,
            'login' => $row->user_login,
            'server' => timeGram(unixTime())
        ];
    }
}
<?php

class UsersSettingsGet extends Controller
{
    public function index()
    {

        /** @var  $row */
        $row = $this->db->SQLquery("SELECT * FROM `users` WHERE user_id = '{$this->session->user_id}'", SQL_RESULT_ITEM);

        return [
            'power' => ($row->power === 'on') ? true : false,
            'count' => $row->count,
            'lang' => $row->lang,
            'ads' => $this->ads()
        ];
    }

    /**
     * @return mixed
     */
    private function ads()
    {
        return $this->db->SQLquery("SELECT COUNT(*) FROM `ads_list` WHERE `user_id` = '{$this->session->user_id}'", SQL_RESULT_COUNT);
    }
}

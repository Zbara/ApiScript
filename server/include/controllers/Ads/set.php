<?php

class set extends Controller
{
    public function index()
    {

        /** @var  $json */
        $json = json_decode(htmlspecialchars_decode($this->request->post['json']));

        $adsNew = 0;

        /** @var  $item */
        foreach ($json as $item) {
            $row = $this->db->SQLquery("SELECT * FROM `ads_list` WHERE  `text` = '{$item->text}' and  `user_id` = '{$this->session->user_id}'", SQL_RESULT_ITEM);

            if (!$row) {
                $count = ($item->count) ? (int)$item->count : 0;
                $this->db->SQLquery("INSERT INTO `ads_list` SET `count` = '{$count}',  `ip` = '{$this->request->server['REMOTE_ADDR']}', `text` = '{$item->text}', `timeserver` = unix_timestamp(), `time` = '{$item->time}', `user_id` = '{$this->session->user_id}'", SQL_RESULT_INSERTED);

                $adsNew++;
            }
        }
        return ['ads' => $adsNew];
    }
}
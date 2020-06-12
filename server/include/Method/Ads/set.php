<?php

namespace Method\Ads;

use Method\BaseMethod;
use Controller;
use Connection;

class set extends BaseMethod
{
    public function run(Controller $controller, Connection $db)
    {
        /** @var  $json */
        $json = json_decode(htmlspecialchars_decode($controller->request->post('json')));

        $adsNew = 0;

        /** @var  $item */
        foreach ($json as $item) {
            $row = $db->query("SELECT * FROM `ads_list` WHERE  `text` = '{$item->text}' and  `user_id` = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

            if (!$row) {
                $count = ($item->count) ? (int)$item->count : 0;
                $db->query("INSERT INTO `ads_list` SET `count` = '{$count}',  `ip` = '{$controller->request->server('REMOTE_ADDR')}', `text` = '{$item->text}', `timeserver` = unix_timestamp(), `time` = '{$item->time}', `user_id` = '{$controller->session->user_id}'", SQL_RESULT_INSERTED);

                $adsNew++;
            }
        }
        return ['ads' => $adsNew];
    }
}
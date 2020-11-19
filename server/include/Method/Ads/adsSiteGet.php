<?php

namespace Method\Ads;

use Connection;
use Controller;
use Method\BaseMethod;

class adsSiteGet extends BaseMethod
{
    /**
     * @param Controller $controller
     * @param Connection $db
     * @return array
     */
    function run(Controller $controller, Connection $db)
    {
        /** @var  $domain */
        $domain = $controller->request->post('domain');
        $time = $controller->request->post('time');
        $messages = json_decode(htmlspecialchars_decode($controller->request->post('text')));

        /** @var  $text */
        $text = [];

        /** @var  $item */
        foreach ($messages as $item) {
            $row = $db->query("SELECT * FROM `ads_list` WHERE `domain` = '{$domain}' and `text` = '{$item}' and  `user_id` = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

            if (empty($row->user_id)) {
                $id = $db->query("INSERT INTO `ads_list` SET `domain` = '{$domain}', `count` = '0',  `ip` = '{$controller->request->server('REMOTE_ADDR')}', `text` = '{$item}', `timeserver` = unix_timestamp(), `time` = '{$time}', `user_id` = '{$controller->session->user_id}'", SQL_RESULT_INSERTED);

                $text[] = ['messages' => $item, 'id' => $id];
            }
        }
        return ['ads' => 'update', 'new' => $text];
    }
}
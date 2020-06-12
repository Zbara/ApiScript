<?php
namespace Method\Ads;

use Connection;
use Controller;
use Method\BaseMethod;
use Tools;

class messagesGet extends BaseMethod
{
    function run(Controller $controller, Connection $db)
    {
        /** @var  $row */
        $row = $db->query("SELECT * FROM `ads_list` WHERE  `user_id` = '{$controller->session->user_id}' ORDER BY `time` DESC", SQL_RESULT_ITEMS);

        /** @var  $sites */
        $ads = [];

        /** @var  $item */
        foreach ($row as $item){
            $ads[] = [
                'id' => (int) $item->id,
                'platform_id' => (int) $item->user_id,
                'time' => Tools\dateTime::timeGram($item->time, $controller->lang),
                'date' => Tools\dateTime::timeGram($item->timeserver, $controller->lang),
                'domain' => $item->domain,
                'messages' => $item->text
            ];
        }
        return ['ads' => $ads];
    }
}
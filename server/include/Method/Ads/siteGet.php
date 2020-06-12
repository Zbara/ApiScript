<?php
namespace Method\Ads;

use Connection;
use Controller;
use Method\BaseMethod;
use Tools;


class siteGet extends BaseMethod
{
    function run(Controller $controller, Connection $db)
    {
        /** @var  $row */
        $row = $db->query("SELECT * FROM `ads_sites` WHERE  `user_id` = '{$controller->session->user_id}' ORDER BY `date` DESC", SQL_RESULT_ITEMS);

        /** @var  $sites */
        $sites = [];

        /** @var  $item */
        foreach ($row as $item){
            $sites[] = [
                'id' => (int) $item->id,
                'platform_id' => (int) $item->user_id,
                'date' => Tools\dateTime::timeGram($item->date, $controller->lang),
                'domain' => $item->domain,
                'messages' => $item->domain
            ];
        }
        return ['sites' => $sites];
    }
}
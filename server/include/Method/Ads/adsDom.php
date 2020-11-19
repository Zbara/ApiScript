<?php

namespace Method\Ads;

use Connection;
use Controller;
use Method\BaseMethod;

class adsDom extends BaseMethod
{

    function run(Controller $controller, Connection $db)
    {
        /** @var  $domain */
        $domain = $controller->request->request('domain');

        if($domain){
            $Domain = $db->query("select * from ads_div_sites where `domain` = '{$domain}'", SQL_RESULT_ITEMS);

            $items = [];

            /** @var  $item */
            foreach ($Domain as $item){
                $items[] = ['domain' => $item->domain, 'dom' => $item->dom, 'type' => $item->type];
            }

            return $items;
        } else return ['error' => ['messages' => 'Error domain name', 'code' => 12]];
    }
}
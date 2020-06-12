<?php
namespace Method\Ads;

use Method\BaseMethod;
use Controller;
use Connection;


class newSiteSet extends BaseMethod
{
    function run(Controller $controller, Connection $db)
    {
        $domain = domainReg($controller->request->post('domain'));


        if($domain){
            $checkDomain = $db->query("select * from ads_sites where `domain` = '{$domain}' and `user_id` = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

            if(count($checkDomain) <= 0){
                $id = $db->query("insert into `ads_sites` set `domain` = '{$domain}', `user_id` = '{$controller->session->user_id}', `date` = unix_timestamp()", SQL_RESULT_INSERTED);

                return ['success' => 'yes', 'id' => $id, 'domain' => $domain];

            } else return ['error' => ['messages' => $controller->lang->lang_error_domain_check, 'code' => 15]];

        } else return ['error' => ['messages' => $controller->lang->lang_error_domain, 'code' => 8]];
    }
}
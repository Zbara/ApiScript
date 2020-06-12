<?php

namespace Method\Ads;

use Connection;
use Controller;
use Method\BaseMethod;

class adsDeleteSites extends BaseMethod
{
    function run(Controller $controller, Connection $db)
    {
        $id = (int) $controller->request->post('id');

        if($id > 0){
            $checkDomain = $db->query("select * from ads_sites where `id` = '{$id}' and `user_id` = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

            if(count($checkDomain) > 0){

                $db->query("DELETE FROM `ads_sites` WHERE `id` = '{$id}'", SQL_RESULT_AFFECTED);

                return ['success' => 'yes'];

            } else return ['error' => ['messages' => $controller->lang->lang_error_domain_check, 'code' => 15]];

        } else return ['error' => ['messages' => $controller->lang->lang_error_domain, 'code' => 8]];

    }
}
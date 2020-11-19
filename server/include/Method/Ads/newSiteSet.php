<?php
namespace Method\Ads;

use Method\BaseMethod;
use Controller;
use Connection;
use Tools;

class newSiteSet extends BaseMethod
{
    function run(Controller $controller, Connection $db)
    {
        $domain = domainReg($controller->request->post('domain'));
        $messages = $db->escape($controller->request->post('messages'));

        if($domain){
            $checkDomain = $db->query("select * from ads_sites where `domain` = '{$domain}' and `user_id` = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

            if(count($checkDomain) <= 0){
                $id = $db->query("insert into `ads_sites` set `messages` = '{$messages}', `domain` = '{$domain}', `user_id` = '{$controller->session->user_id}', `date` = unix_timestamp()", SQL_RESULT_INSERTED);

                $this->messages($controller, $db, $messages);

                return [
                    'success' => 'yes',
                    'id' => $id,
                    'domain' => $domain,
                    'messages' => ($messages) ? $messages : 'Любой',
                    'time' => Tools\dateTime::timeGram(time(), $controller->lang)
                ];
            } else return ['error' => ['messages' => $controller->lang->lang_error_domain_check, 'code' => 15]];

        } else return ['error' => ['messages' => $controller->lang->lang_error_domain, 'code' => 8]];
    }
    /**
     * @param Controller $controller
     * @param Connection $db
     * @param $messages
     */
    private function messages(Controller $controller, Connection $db, $messages)
    {
        /** @var  $messages */
        $messages = explode(',', $messages);

        /** @var  $item */
        foreach ($messages as $item) {
            $msg = $db->query("select * from `ads_messages_key` where `user_id` = '{$controller->session->user_id}' and `messages` = '{$item}'", SQL_RESULT_ITEM);

            if(!$msg->user_id) {
                $db->query("insert into `ads_messages_key` set `messages` = '{$item}', `user_id` = '{$controller->session->user_id}', `date` = unix_timestamp()", SQL_RESULT_INSERTED);
            }
        }
    }
}

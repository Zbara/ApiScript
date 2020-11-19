<?php
namespace Method\Users;

use Method\BaseMethod;
use Controller;
use Connection;

class UsersSettingsGet extends BaseMethod
{
    public function run(Controller $controller, Connection $db)
    {
        /** @var  $row */
        $row = $db->query("SELECT * FROM `users` WHERE user_id = '{$controller->session->user_id}'", SQL_RESULT_ITEM);

        return [
            'power' => ($row->power === 'on') ? true : false,
            'count' => $row->count,
            'lang' => $row->lang,
            'ads' => $this->ads($controller, $db),
            'tags' =>$this->tags($controller, $db)
        ];
    }

    /**
     * @param Controller $controller
     * @param Connection $db
     * @return array|int|object|\stdClass
     */
    private function ads(Controller $controller, Connection $db)
    {
        return $db->query("SELECT COUNT(*) FROM `ads_list` WHERE `user_id` = '{$controller->session->user_id}'", SQL_RESULT_COUNT);
    }

    /**
     * @param Controller $controller
     * @param Connection $db
     * @return array
     */
    private function tags(Controller $controller, Connection $db){

        /** @var  $messages */
        $messages = $db->query("select * from `ads_messages_key` where `user_id` = '{$controller->session->user_id}'", SQL_RESULT_ITEMS);

        $tags = [];

        foreach ($messages as $item) {
            $tags[] = $item->messages;
        }

        return $tags;
    }
}

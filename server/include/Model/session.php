<?php
namespace Model;

class session
{
    private $user_id = 0;
    private $messages;
    private $auth = [];
    private $lang;

    /**
     * session constructor.
     * @param $userId
     * @param $messages
     * @param $auth
     * @param $lang
     */
    public function __construct($userId, $messages, $auth, $lang)
    {
        $this->user_id = $userId;
        $this->auth = $auth;
        $this->messages = $messages;
        $this->lang = $lang;
    }

    /**
     * @return mixed
     */
    public function getLang()
    {
        return $this->lang;
    }
    /**
     * @return int
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @return mixed
     */
    public function getMessages()
    {
        return $this->messages;
    }

    /**
     * @return array
     */
    public function getAuth()
    {
        return $this->auth;
    }

    /**
     * @param $auth
     * @return $this
     */
    public function setAuth($auth)
    {
        $this->auth = $auth;

        return $this;
    }

    /**
     * @param $messages
     * @return $this
     */
    public function setMessages($messages)
    {
        $this->messages = $messages;

        return $this;
    }
    /**
     * @param $user_id
     * @return $this
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;

        return $this;
    }
}
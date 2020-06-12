<?php
namespace Libs;

class Request
{
    /**
     * @var array|string
     */
    public $getVars = [];
    public $postVars = [];
    public $cookieVars = [];
    public $serverVars = [];
    public $requestVars = [];

    public function __construct()
    {
        $_GET = $this->clean($_GET);
        $_POST = $this->clean($_POST);
        $_REQUEST = $this->clean($_REQUEST);
        $_COOKIE = $this->clean($_COOKIE);
        $_FILES = $this->clean($_FILES);
        $_SERVER = $this->clean($_SERVER);

        $this->getVars = $_GET;
        $this->postVars = $_POST;
        $this->requestVars = $_REQUEST;
        $this->cookieVars = $_COOKIE;
        $this->serverVars = $_SERVER;
    }

    /**
     * @param $data
     * @return array|string
     */
    private function clean($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                unset($data[$key]);
                $data[$this->clean($key)] = $this->clean($value);
            }
        } else {
            $data = htmlspecialchars($data, ENT_COMPAT);
        }
        return $data;
    }

    /**
     * @param $data
     * @return array
     */
    public function array_params($data)
    {
        /** @var  $request */
        $request = [['key' => 'oauth', 'value' => 1]];
        /**
         * @var  $key
         * @var  $item
         */
        foreach ($this->requestVars as $i => $z) {
            $request[] = ['key' => $i, 'value' => $z];
        }
        $data['request_params'] = $request;
        return ['error' => $data];
    }

    /**
     * @param $get
     * @return mixed
     */
    public function get($get){
        return $this->getVars[$get];
    }
    /**
     * @param $string
     * @return mixed
     */
    public function request($string)
    {
        return $this->requestVars[$string];
    }

    /**
     * @param $string
     * @return mixed
     */
    public function post($string)
    {
        return $this->postVars[$string];
    }

    /**
     * @param $string
     * @return mixed
     */
    public function server($string)
    {
        return $this->serverVars[$string];
    }
}
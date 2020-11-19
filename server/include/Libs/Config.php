<?php

namespace Libs;

use ErrorCode;
use ZbaraException;

class Config
{
    public $host;
    public $db_user;
    public $db_pass;
    public $db_name;
    public $start;
    public $auth_salt;
    public $dev = 'config.dev';

    public function __construct()
    {
        try {
            if (!is_readable(include_dir . '/inc/' . $this->dev. '.php'))
                throw new ZbaraException(ErrorCode::CONFIG_ERROR, ['msg' => 'Файл не найден.']);

            require_once(include_dir . '/inc/' . $this->dev. '.php');

            foreach ($config as $k => $item) {
                $this->{$k} = $item;
            }
        } catch (ZbaraException $e) {
            die(json_encode($e->jsonSerialize()));
        }

    }
}

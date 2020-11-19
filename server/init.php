<?php
/**
 * @file cpu
 * @page - запуск всех скриптов
 */
define('root', realpath(dirname(__FILE__)));
define('include_dir', dirname(__FILE__) . '/include');

spl_autoload_register(function ($name) {
    require_once(include_dir . '/' . str_replace("\\", "/", $name) .  '.php');
});

/** конфиг **/
require_once(include_dir . '/function.php');
<?php
/**
 *************
 * Точка входка в приложение
 * GitRev - 0.1
 * Update 11.06.20
 *************
 */

require_once "init.php";
use Libs\Request;
use Libs\Config;
use Libs\Lang;



class Controller
{
    public $session;
    public $lang;
    public $Connection;
    public $request;
    public $config;
    private $headers = [
        'Access-Control-Allow-Origin: *',
        'Access-Control-Allow-Methods: GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers: Authorization'
    ];

    /**
     * Controller constructor.
     */
    public function __construct()
    {
        /** @var  $config */
        $this->config = new Config();

        /** @var  Connection */
        $this->Connection = new Connection($this->config->host, $this->config->db_user, $this->config->db_pass, $this->config->db_name);

        /** @var  request */
        $this->request = new Request();

        /** @var  lang */
        $this->lang = new Lang($this->request);
    }

    public function run()
    {
        /** @var  $method */
        $method = $this->request->get('method');

        /** @var  $action */
        $action = new Routers($method);
        $action = $action->method();

        try {
            if(is_null($action)) throw new ZbaraException(ErrorCode::UNKNOWN_METHOD);

            $this->echoApi($this->go((object) $action));

        } catch (ZbaraException $e){
            $this->echoApi(['error' => ['error_msg' => 'Unknown method [' . $method . ']', 'error_code' => $e->jsonSerialize()['errorId']]]);
        }
    }

    /**
     * @param $data
     */
    private function echoApi($data)
    {
        header('Content-type: application/json; charset=utf-8');

        $generation = round((microtime(true) - $this->config->start), 5);
        if ($data['error']) {
            $this->output(json_encode($this->request->array_params($data), JSON_UNESCAPED_UNICODE));
        } else $this->output(json_encode(['response' => $data, 'generation' => $generation, 'lang' => $this->lang->code], JSON_UNESCAPED_UNICODE));
    }

    /**
     * @param $content
     */
    public function output($content)
    {
        if ($content) {
            if (!headers_sent()) {
                foreach ($this->headers as $header) {
                    header($header, true);
                }
            }
            /** закрываем коннект к БД */
            $this->Connection->closeDatabase();

            echo $content;
        }
    }
    /**
     * @param $action
     * @return array|mixed
     */
    public function go($action)
    {
        if ($action->session) {
            $session = $this->checkSession();

            if ($session)
                return $session;
        }
        return $this->perform(new $action->controller($this));
    }

    /**
     * @return array
     */
    private function checkSession()
    {
        /** @var  $access_token */
        $access_token = $this->request->request('access_token');

        /** @var  $row */
        $row = $this->Connection->query("SELECT * FROM `auth_session` WHERE  session_auth_key = '{$access_token}'", SQL_RESULT_ITEM);

        if ($row) {
            $this->session = $row;
        } else return ['error' => 'User authorization failed: no access_token passed.', 'error_code' => 5];
    }

    /**
     * @param IMethod $method
     * @return mixed
     */
    public function perform(IMethod $method)
    {
        return $method->run($this, $this->Connection);
    }
}

/** @var  $api */
$api = new Controller();
$api->run();
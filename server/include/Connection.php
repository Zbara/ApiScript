<?php
/** константы */
define("SQL_RESULT_ITEM", 1);
define("SQL_RESULT_ITEMS", 2);
define("SQL_RESULT_COUNT", 3);
define("SQL_RESULT_AFFECTED", 4);
define("SQL_RESULT_INSERTED", 5);
define("SQL_RESULT_BOT", 6);

class Connection
{
    public $mysqli = [];

    /**
     * Connection constructor.
     * @param $db_server
     * @param $db_user
     * @param $db_pass
     * @param $db_name
     */
    public function __construct($db_server, $db_user, $db_pass, $db_name)
    {
        $this->mysqli = new mysqli($db_server, $db_user, $db_pass, $db_name);
        try {
            if ($this->mysqli->connect_error) throw new ZbaraException(ErrorCode::INTERNAL_DATABASE_ERROR, ['msg' => $this->mysqli->connect_error]);
        } catch (ZbaraException $e){
            die(json_encode($e->jsonSerialize()));
        }
        $this->mysqli->set_charset("utf8mb4");
    }

    /**
     * @param $query
     * @param int $resultType
     * @return array|int|object|stdClass
     */
    public function query($query, $resultType = SQL_RESULT_ITEM)
    {
        /** @var  $result */
        $result = $this->mysqli->query($query);
        try {
            if ($this->mysqli->error) throw new ZbaraException(ErrorCode::INTERNAL_DATABASE_ERROR_SQL, ['sql' => $query, 'table' => $this->mysqli->error, 'errorno' => $this->mysqli->errno]);
        } catch (ZbaraException $e){
            die(json_encode($e->jsonSerialize()));
        }
        /** если все нормально отдаем резузьтат */
        switch ($resultType) {
            case SQL_RESULT_ITEM:
                return $result->fetch_object();

            case SQL_RESULT_ITEMS:
                $data = [];
                while ($row = $result->fetch_object()) {
                    $data[] = $row;
                }
                return $data;

            case SQL_RESULT_COUNT:
                return (int)$result->fetch_assoc()["COUNT(*)"];

            case SQL_RESULT_INSERTED:
                return (int)$this->mysqli->insert_id;

            case SQL_RESULT_AFFECTED:
                return (int)$this->mysqli->affected_rows;
        }
        return [];
    }

    /**
     * очистка строки
     * @param $string
     * @return string
     */
    public function escape($string)
    {
        return $this->mysqli->escape_string($string);
    }

    /**
     * @param $string
     * @return string
     */
    public function real_escape_string($string)
    {
        return $this->mysqli->real_escape_string($string);
    }

    /**
     * Закрытие коннекшена с БД
     */
    public function closeDatabase()
    {
        $this->mysqli->close();
    }
}
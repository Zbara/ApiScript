<?php
class ZbaraException extends Exception implements JsonSerializable
{

    /** @var mixed */
    private $extra;

    /**
     * ZbaraException constructor.
     * @param int $code
     * @param null $extra
     */
    public function __construct($code = 0, $extra = null)
    {
        parent::__construct(null, $code);
        $this->extra = $extra;
    }

    /**
     * @return array|mixed
     */
    public function jsonSerialize()
    {
        $d = ["errorId" => $this->getCode()];

        if ($this->extra) {
            $d["full"] = $this->extra;
        }

        return $d;
    }
}
<?

namespace Method;

use IMethod;

abstract class BaseMethod implements IMethod
{
    /**
     * BaseMethod constructor.
     * @param $request
     */
    public function __construct($request)
    {
        if (is_object($request)) {
            foreach ($request as $key => $value) {
                $this->{$key} = is_string($value) ? safeString($value) : $value;
            }
        }
    }

}
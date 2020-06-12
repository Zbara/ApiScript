<?php
namespace Libs;

class Lang
{
    public $lang;

    public function __construct($request)
    {
        /** @var  $lang */
        $lang = $request->request('lang');
        $langId = ($lang) ? $lang : 'ru';

        /** @var  $json */
        $json = json_decode(file_get_contents(root . '/lang/' . $langId . '.json'));

        /** @var  $item */
        foreach ($json as $item) {
            $name = (string)$item->name;
            $this->$name = $item->text;
        }
        return $this->lang;
    }
}
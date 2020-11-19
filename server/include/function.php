<?php
/**
 * @param $number
 * @param $titles
 * @param $no_number
 * @return string
 */
function gram($number, $titles, $no_number)
{
    $cases = [2, 0, 1, 1, 1, 2];
    return (!$no_number ? $number . ' ' : '') . ($titles[($number % 100 > 4 && $number % 100 < 20) ? 2 : $cases[($number % 10 < 5) ? $number % 10 : 5]]);
}

/**
 * @param int $length
 * @return string
 */
function gener($length = 1)
{
    $gener = '123456789QqWwEeRrTtYyUuIiOoPp[[]]aAsSdDFfGgHhJjKkLl:;ZzXxCcVvBbNnMm';
    $length_need = min($length, strlen($gener));

    $result = '';
    while (strlen($result) < $length)
        $result .= substr(str_shuffle($gener), 0, $length_need);

    return $result;
}

function safeString(&$str)
{
    return $str = str_replace("'", '\\\'', $str);
}


function domainReg($domain)
{
    $url = preg_replace('/(http\:\/\/|https\:\/\/|\/\/)/', '', trim($domain));
    $url = preg_replace('/\.+/', '.', $url);

    if (parse_url('http://' . $url)) {
        $a = parse_url('http://' . $url);
        $url = $a['host'];
    }

    return str_replace('www.', '', $url);
}
<?php

namespace Tools;

class dateTime
{
    static public function timeGram($time, $lang){
        $ts = intval(time()-$time);
        if(date('Y-m-d', $time) == date('Y-m-d', time())){
            if($ts < 1) $date = $lang->time_0[0];
            else if($ts < 60) $date = gram($ts, $lang->time_1, false);
            else if($ts == 60) $date = $lang->time_0[1];
            else if($ts < 3600) $date = gram(floor($ts / 60), $lang->time_2, false);
            else if($ts == 3600) $date = $lang->time_0[2];
            else $date = gram(floor($ts / 3600), $lang->time_3, false);
        } elseif(date('Y-m-d', $time) == date('Y-m-d', (time()-84600)))
            $date = date($lang->time_0[3], $time);
        else

            $date = date('d.m.Y H:i', $time);

        return $date;
    }
}
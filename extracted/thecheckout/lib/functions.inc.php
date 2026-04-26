<?php
/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 * @author    Peter Sliacky (Zelarg)
 * @copyright Peter Sliacky (Zelarg)
 * @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

namespace module\thecheckout;

class TS_Functions
{

    public static function getFacebookCookie($app_id, $application_secret)
    {
        $data = array();

        if (isset($_COOKIE['fbsr_' . $app_id])) {
            if (list($encoded_sig, $payload) = explode('.', $_COOKIE['fbsr_' . $app_id], 2)) {
                $sig      = self::base64UrlDecode($encoded_sig);
                $hashfunc = 'hash' . '_h' . 'mac';
                if ($hashfunc('sha256', $payload, $application_secret, true) == $sig) {
                    $data = json_decode(self::base64UrlDecode($payload), true);
                    return $data;
                }
            }
        } else {
            return null;
        }
    }

    private static function base64UrlDecode($input)
    {
        $decodefunc = 'base' . '64' . '_' . 'decode';
        return $decodefunc(strtr($input, '-_', '+/'));
    }

    public static function startsWith($haystack, $needle)
    {
        return $haystack[0] === $needle[0]
            ? strncmp($haystack, $needle, strlen($needle)) === 0
            : false;
    }
}

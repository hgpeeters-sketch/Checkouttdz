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

use Customer;
use Validate;
use CartRule;
use Tools;
use module\thecheckout\TS_Functions;

class SocialLogin
{
    const FACEBOOK = 'facebook';
    const GOOGLE = 'google';

    private $socialNetwork;
    private $appId;
    private $appSecret;


    public function __construct($socialNetwork, $appId, $appSecret)
    {
        $this->socialNetwork = $socialNetwork;
        $this->appId         = $appId;
        $this->appSecret     = $appSecret;
    }

    public function validateFacebookAccessToken($accessToken)
    {
        $clientCookie = $this->getFacebookCookie($this->appId, $this->appSecret);

        $hashfunc = 'hash' . '_h' . 'mac';
        $appsecret_proof = $hashfunc('sha256', $accessToken, $this->appSecret);

        $url = "https://graph.facebook.com/v3.2/me?fields=id,email,first_name,last_name&access_token=" 
            . $accessToken . "&appsecret_proof=" . $appsecret_proof;

        $apiResultJson = $this->curlRequest($url);

        $apiResult = json_decode($apiResultJson);

        // user_id from cookie (we trust this) and user_id from Graph API call, using access token
        // sent by client (we don't trust)
        // if they equal, we can trust access token from client and thus user details received from API call
        if (null !== $apiResult->id && $clientCookie['user_id'] == $apiResult->id
            && null !== $apiResult->email && Validate::isEmail($apiResult->email)
        ) {
            return array($apiResult->email, $apiResult->first_name, $apiResult->last_name);
        } else {
            return false;
        }
    }

    public function validateGoogleIdToken($idToken)
    {
        $url           = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=$idToken";
        $apiResultJson = $this->curlRequest($url);

        $apiResult = json_decode($apiResultJson);

        if (null !== $apiResult->sub && $this->appId == $apiResult->aud
            && null !== $apiResult->email && Validate::isEmail($apiResult->email)
        ) {
            return $apiResult->email;
        } else {
            return false;
        }
    }
//
//    public function validateGoogleAccessToken($accessToken) {
//        $url           = "https://www.googleapis.com/oauth2/v4/token?".
//            "code=$accessToken&client_id=".$this->appId."&client_secret=".$this->appSecret.
//            "&grant_type=authorization_code&redirect_uri=http%3a%2f%2fwww.mydomain.com%3a50000%2fMyPage";
//        $apiResultJson = $this->curlRequest($url);
//    }

    private function curlRequest($url)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
        if (Tools::substr($url, 0, 8) == 'https://') {
            curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        }
        $sendCH = curl_exec($ch);
        curl_close($ch);
        return $sendCH;
    }

    private function getFacebookCookie($app_id, $application_secret)
    {
        return TS_Functions::getFacebookCookie($app_id, $application_secret);
    }
}

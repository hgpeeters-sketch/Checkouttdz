{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

<script src="https://accounts.google.com/gsi/client" onload="tc_initGoogle()" async defer></script>
{literal}
<script>

  var attemptsLeft = 15;
  function tc_initGoogleWithDelay() {
    if ('undefined' !== typeof tc_googleLogin) {
        tc_googleLogin.init('{/literal}{$tc_config->social_login_google_client_id}{literal}');
    } else if (attemptsLeft-- > 0)  {
        // console.log('attempt: ' + (15-attemptsLeft));
        setTimeout(tc_initGoogleWithDelay, 300);
    }
  }

  function tc_initGoogle() {
    tc_initGoogleWithDelay();
  }
  // document.addEventListener("DOMContentLoaded", function(event) {
  //   tc_initGoogle();
  // });

</script>
{/literal}

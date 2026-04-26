{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

{literal}
<script>
  function tc_fbAsyncInit() {
    window.fbAsyncInit = function () {
      FB.init({
        appId: '{/literal}{$tc_config->social_login_fb_app_id}{literal}',
        cookie: true,
        xfbml: true,
        oauth: true,
        version: 'v3.2'
      });
      if ('undefined' !== typeof tc_facebookLogin) {
        tc_facebookLogin.init();
      }
    };

    (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/{/literal}{$iso}{literal}/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  // if (document.readyState == 'loading') {
  //   setTimeout(tc_fbAsyncInit, 100);
  // } else {
  //   window.addEventListener('DOMContentLoaded', tc_fbAsyncInit);
  // }
  window.addEventListener('DOMContentLoaded', tc_fbAsyncInit);
 
</script>
{/literal}

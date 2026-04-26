/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */


// ========= FACEBOOK =========
var tc_facebookLogin = (function () {

  var customBtnId = 'tc-facebook-signin';

  function init() {
    return attachCustomBtn();
  }

  function attachCustomBtn() {
    document.getElementById(customBtnId).addEventListener('click', function () {
      FB.login(statusChangeCallback, {scope: 'email,public_profile', return_scopes: true});
    }, false);
    document.getElementById(customBtnId).classList.add('enabled');
  }

  function backendSignIn(access_token) {
    $.ajax({
      type: 'POST',
      cache: false,
      dataType: "json",
      data: "&ajax_request=1&action=socialLoginFacebook" +
        "&access_token=" + access_token +
        "&static_token=" + prestashop.static_token,
      success: function (jsonData) {
        if (jsonData.hasErrors) {
          // TODO: better error handling
          console.error(jsonData.errors);
        } else if ('undefined' !== typeof jsonData.email && jsonData.email) {
          signedInUpdateForm();
        }
      }
    });
  }

  function statusChangeCallback(response) {
    // The response object is returned with a status field that lets the app 	know 		the current login status of the person.
    if (response.status === 'connected') {
      backendSignIn(response.authResponse.accessToken);
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
    } else {
      // The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
    }
  }

  return {
    init: init,
  };
}());


// ========= GOOGLE =========
var tc_googleLogin = (function () {

  var customBtnId = 'tc-google-signin';

  function decodeJwtResponse (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  function handleCredentialResponse(response) {
    // decodeJwtResponse() is a custom function defined by you
    // to decode the credential response.
    const responsePayload = decodeJwtResponse(response.credential);
    var givenName = ' ';
    var familyName = ' ';
    if ('undefined' !== typeof responsePayload.given_name) {
      givenName = responsePayload.given_name;
    }
    if ('undefined' !== typeof responsePayload.family_name) {
      familyName = responsePayload.family_name;
    }
    backendSignIn(response.credential, givenName, familyName);
  }

  function init(google_client_id) {
    google.accounts.id.initialize({
      client_id: google_client_id,
      callback: handleCredentialResponse
    });

    // Display the One Tap prompt
    google.accounts.id.prompt();

    // Display the Sign In With Google Button
    google.accounts.id.renderButton(
        document.getElementById(customBtnId),
        { theme: 'outline', size: 'large' }
    );
  }

  function backendSignIn(id_token, firstName, lastName) {
    $.ajax({
      type: 'POST',
      cache: false,
      dataType: "json",
      data: "&ajax_request=1&action=socialLoginGoogle" +
        "&id_token=" + id_token +
        "&firstname=" + firstName +
        "&lastname=" + lastName +
        "&static_token=" + prestashop.static_token,
      success: function (jsonData) {
        if (jsonData.hasErrors) {
          // TODO: better error handling
          console.error(jsonData.errors);
        } else if ('undefined' !== typeof jsonData.email && jsonData.email) {
          signedInUpdateForm();
        }
      }
    });
  }

  return {
    init: init
  }
}());

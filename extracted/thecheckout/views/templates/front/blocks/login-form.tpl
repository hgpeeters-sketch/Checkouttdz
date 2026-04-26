{**
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 *}
{block name='login_form'}
{if !$tc_config->move_login_to_account}<div class="inner-wrapper">{/if}
  <div class="offer-login">
    <div class="already-account-label">
      {l s='Already have an account?' d='Shop.Theme.Customeraccount'}
    </div>
    <div class="classic-login">
      <a class="log-in" href="#" data-link-action="x-offer-login">
        {l s='Log in instead!' d='Shop.Theme.Customeraccount'}
      </a>
    </div>
    {if isset($HOOK_OASL_CUSTOM)}
      <div class="social-login" data-trans-or="{l s='OR' mod='thecheckout'}">
        {$HOOK_OASL_CUSTOM nofilter}
      </div>
    {elseif ($tc_config->social_login_fb || $tc_config->social_login_google) }
      <div class="social-login" data-trans-or="{l s='OR' mod='thecheckout'}">
        {if $tc_config->social_login_fb && $tc_config->social_login_fb_app_id && $tc_config->social_login_fb_app_secret}
          {*<div class="fb-login-button" data-max-rows="1" data-onlogin="fb_checkLoginState();" data-size="medium" data-button-type="login_with" data-show-faces="false" data-auto-logout-link="false" data-use-continue-as="false"></div>*}
          <div id="tc-facebook-signin" class="tc-social-login-btn"><span class="social-logo"><span class="facebook-logo"></span></span>{l s='Sign in with Facebook' mod='thecheckout'}</div>
        {/if}
        {if $tc_config->social_login_google && $tc_config->social_login_google_client_id && $tc_config->social_login_google_client_secret}
          {*Google+ login <div class="g-signin2" data-onsuccess="tc_onSignIn"></div>*}
          <div id="tc-google-signin"></div>
        {/if}
      </div>
    {/if}
  </div>
  <form id="login-form" action="{block name='login_form_actionurl'}{$action}{/block}" method="post">

    <section class="form-fields">
      {block name='login_form_fields'}
        {foreach from=$formFieldsLogin item="field"}
          {block name='form_field'}
            {include file='module:thecheckout/views/templates/front/_partials/checkout-form-fields.tpl' checkoutSection='login'}
          {/block}
        {/foreach}
      {/block}
    </section>

    <div class="alert alert-danger" style="display: none" id="errors-login-form"></div>

    {block name='login_form_footer'}
      <footer class="form-footer text-sm-center clearfix">
        <input type="hidden" name="submitLogin" value="1">
        {block name='form_buttons'}
          <button class="btn btn-primary" data-link-action="x-sign-in" type="button" class="form-control-submit">
            {l s='Sign in' d='Shop.Theme.Actions'}
          </button>
        {/block}
        <div class="hidden successful-login">{l s='Login successful, please wait...' mod='thecheckout'}</div>
      </footer>
    {/block}

    <div class="forgot-password">
      <a href="{$urls.pages.password}" rel="nofollow">
        {l s='Forgot your password?' d='Shop.Theme.Customeraccount'}
      </a>
    </div>
  </form>
  <div class="overlay-email">
      <div class="new-customer-email">{l s='New customer or guest checkout? Start with email.' mod='thecheckout'}</div>
      <input type="text" name="forced-email" placeholder="{l s='Your email address' d='Shop.Forms.Labels'}">
      <button class="btn btn-primary" data-link-action="x-forced-email-continue" type="button" class="form-control-submit">
        {l s='Continue >' mod='thecheckout'}
      </button>
      <div class="error-enter-email" style="display: none">{l s='Please enter your email address to proceed with order.' mod='thecheckout'}</div>
  </div>
{if !$tc_config->move_login_to_account}</div>{/if}
{/block}

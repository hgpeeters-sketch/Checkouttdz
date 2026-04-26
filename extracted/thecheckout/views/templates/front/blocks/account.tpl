{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

<div class="block-header account-header">
  {if isset($customer) && ($customer.is_logged && !$customer.is_guest)}{l s='Personal Information' d='Shop.Theme.Checkout'}
  {else}{l s='Create an account' mod='thecheckout'}{/if}
</div>
<div class="inner-wrapper">
  {if $tc_config->move_login_to_account && !($customer.is_logged && !$customer.is_guest)}
    <div class="login-block-moved">
        {include file='module:thecheckout/views/templates/front/blocks/login-form.tpl'}
    </div>
  {/if}
  <form class="account-fields">
    <div id="hook_displayPersonalInformationTop">{$hook_displayPersonalInformationTop nofilter}</div>
    {block name="account_form_fields"}
      <section class="form-fields">
        {block name='form_fields'}
          {include file='module:thecheckout/views/templates/front/_partials/static-customer-info.tpl' s_customer=$customer}
          {assign parentTplName 'account'}
          {foreach from=$formFieldsAccount item="field"}
            {block name='form_field'}
              {* Email is rendered at the top of the address block (address-delivery.tpl)
                 so it appears as the very first field of the combined step. *}
              {if $field.name !== 'email'}
                {include file='module:thecheckout/views/templates/front/_partials/checkout-form-fields.tpl' checkoutSection='account'}
              {/if}
            {/block}
          {/foreach}
        {/block}
        {$hook_create_account_form nofilter}
      </section>
    {/block}
  </form>
  {if $tc_config->show_button_save_personal_info}
    <button id="tc_save_account" class="btn btn-primary">{l s='Save Personal Information' mod='thecheckout'}</button>
  {/if}
</div>

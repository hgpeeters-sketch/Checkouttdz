{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
{if isset($customer) && $customer.is_logged && !$customer.is_guest}
  {* Logged-in: show static customer info only *}
  <div class="block-header account-header">{l s='Personal Information' d='Shop.Theme.Checkout'}</div>
  <div class="inner-wrapper">
    <form class="account-fields">
      {block name="account_form_fields"}
        <section class="form-fields">
          {include file='module:thecheckout/views/templates/front/_partials/static-customer-info.tpl' s_customer=$customer}
          {assign parentTplName 'account'}
          {foreach from=$formFieldsAccount item="field"}
            {block name='form_field'}
              {include file='module:thecheckout/views/templates/front/_partials/checkout-form-fields.tpl' checkoutSection='account'}
            {/block}
          {/foreach}
        </section>
      {/block}
    </form>
  </div>
{/if}
{* Non-logged users: all account fields (email, password) are rendered inside
   address-delivery.tpl so they appear in the correct combined step regardless
   of how the admin has configured the checkout steps. *}

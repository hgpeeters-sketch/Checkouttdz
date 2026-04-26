{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
{if $tc_config->show_i_am_business_delivery}
  <style>
    {if $hideBusinessFieldsDelivery}
    {literal}
    #thecheckout-address-delivery .form-group.business-field:not(.need-dni) {
        display: none;
    }

    {/literal}
    {else}
    {literal}
    #thecheckout-address-delivery .form-group.business-disabled-field {
        display: none;
    }
    #thecheckout-address-delivery .business-fields-separator {
        display: block;
    }

    {/literal}
    {/if}
  </style>
{/if}
{if $tc_config->show_i_am_private_delivery}
  <style>
    {if $hidePrivateFieldsDelivery}
    {literal}
    #thecheckout-address-delivery .form-group.private-field:not(.need-dni):not(.business-field) {
        display: none;
    }

    {/literal}
    {else}
    {literal}
    #thecheckout-address-delivery .private-fields-separator {
        display: block;
    }

    {/literal}
    {/if}
  </style>
{/if}
<div class="block-header address-name-header">{l s='Shipping address' mod='thecheckout'}</div>
<div class="inner-wrapper">
  <a style="display: none;" href="javascript:void(0);" class="amazonpay-change-address">{l s='Change address' mod='thecheckout'}</a>

  {if $tc_config->show_i_am_business_delivery}
    <div class="business-customer">
      <span class="custom-checkbox">
        <input id="i_am_business_delivery" type="checkbox" data-link-action="x-i-am-business-delivery"
               {if !$hideBusinessFieldsDelivery}checked="checked"{/if} disabled="disabled">
        <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
        <label for="i_am_business_delivery">{l s='I am a business customer' mod='thecheckout'}</label>
      </span>
    </div>
  {/if}
  {if $tc_config->show_i_am_private_delivery}
    <div class="private-customer">
      <span class="custom-checkbox">
        <input id="i_am_private_delivery" type="checkbox" data-link-action="x-i-am-private-delivery"
               {if !$hidePrivateFieldsDelivery}checked="checked"{/if} disabled="disabled">
        <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
        <label for="i_am_private_delivery">{l s='I am a private customer' mod='thecheckout'}</label>
      </span>
    </div>
  {/if}

  <form class="address-fields" data-address-type="delivery" id="delivery-address">
    {include file='module:thecheckout/views/templates/front/_partials/customer-addresses-dropdown.tpl' addressType='delivery'}
    {block name="address_delivery_form_fields"}
      <section class="form-fields">
          {block name='form_fields'}
              {if $tc_config->show_i_am_business_delivery}
                <div class="business-fields-container"><div class="business-fields-separator"></div></div>
              {/if}
              {if $tc_config->show_i_am_private_delivery}
                <div class="private-fields-container"><div class="private-fields-separator"></div></div>
              {/if}
              {foreach from=$formFieldsDelivery item="field"}
                  {block name='form_field'}
                      {include file='module:thecheckout/views/templates/front/_partials/checkout-form-fields.tpl' checkoutSection='delivery'}
                  {/block}
              {/foreach}
          {/block}
      </section>
    {/block}
  </form>
  {if !$isInvoiceAddressPrimary}
    <div class="second-address">
      <span class="custom-checkbox">
      <input type="checkbox" data-link-action="x-bill-to-different-address"
             id="bill-to-different-address"{if $showBillToDifferentAddress} checked{/if}>
      <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
      <label for="bill-to-different-address">{l s='Bill to a different address' mod='thecheckout'}</label>
      </span>
    </div>
  {/if}
</div>

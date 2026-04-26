{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

{if ("invoice" == $addressType) && isset($addressesList.invoice)}
  {assign var='addressesCombobox' value=$addressesList.invoice}
{elseif ("delivery" == $addressType) && isset($addressesList.delivery)}
  {assign var='addressesCombobox' value=$addressesList.delivery}
{/if}
{*otherwise, addressCombobox won't be set and we won't continue*}

{if isset($addressesCombobox) && $addressesCombobox|@count > 0}
  {assign var='hideAddressesSelection' value=($addressesCombobox|@count == 1 &&
  (("invoice" == $addressType && $idAddressInvoice|array_key_exists:$addressesCombobox)
  || ("delivery" == $addressType && $idAddressDelivery|array_key_exists:$addressesCombobox)))}
  <div class="customer-addresses{if $addressesCombobox|@count == 1} hidden-1{/if}">
    {if $hideAddressesSelection}
      <a class="custom-link" data-link-action="x-add-new-address">{l s='Add a new address' d='Shop.Theme.Actions'}</a>
    {/if}
    <div class="addresses-selection{if $hideAddressesSelection} hidden{/if}">
      <span class="saved-addresses-label">{l s='Saved addresses:' mod='thecheckout'}</span>
      <select class="not-extra-field" data-link-action="x-{$addressType}-addresses">
{*        <option value="-1">{l s='New' d='Shop.Theme.Catalog'}{l s='...' mod='thecheckout'}</option>*}
        <option value="-1">{l s='Add a new address' d='Shop.Theme.Actions'}</option>
        {foreach $addressesCombobox as $address}
          <option value="{$address.id}"
            {if "invoice" == $addressType}
              {if $address.id == $idAddressInvoice && ($isInvoiceAddressPrimary || $idAddressInvoice != $idAddressDelivery )} selected{/if}
              {if $address.id == $lastOrderInvoiceAddressId && $address.id != $idAddressDelivery && (!$isInvoiceAddressPrimary && $idAddressInvoice == $idAddressDelivery )} selected{/if}
              {if $address.id == $idAddressDelivery && $idAddressInvoice != $idAddressDelivery} disabled{/if}
            {else}
              {if $address.id == $idAddressDelivery && (!$isInvoiceAddressPrimary || $idAddressInvoice != $idAddressDelivery )} selected{/if}
              {if $address.id == $lastOrderDeliveryAddressId && $address.id != $idAddressInvoice && ($isInvoiceAddressPrimary && $idAddressInvoice == $idAddressDelivery )} selected{/if}
              {if $address.id == $idAddressInvoice && $idAddressInvoice != $idAddressDelivery} disabled{/if}
            {/if}
          >{$address.alias}</option>
        {/foreach}
      </select>
    </div>
  </div>
{/if}

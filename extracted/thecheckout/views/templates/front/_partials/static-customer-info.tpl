{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
<div id="static-customer-info-container">
  {if !$s_customer.is_guest && $s_customer.is_logged}
    <a class="edit-customer-info" href="{$urls.pages.identity}">
      <div class="static-customer-info" data-edit-label="{l s='Edit' d='Shop.Theme.Actions'}">
        <div class="customer-name">{$s_customer.firstname} {$s_customer.lastname}</div>
        <div class="customer-email">{$s_customer.email}</div>
      </div>
    </a>
  {/if}
</div>

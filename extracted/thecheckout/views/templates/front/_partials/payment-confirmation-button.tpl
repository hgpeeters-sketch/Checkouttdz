{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
<div id="payment-confirmation">
  <div class="ps-shown-by-js">
    <button type="submit" class="btn btn-primary center-block">
      {l s='Pay' mod='thecheckout'} <span class="pay-amount">{$cart.totals.total_including_tax.value}</span>
    </button>
  </div>
</div>

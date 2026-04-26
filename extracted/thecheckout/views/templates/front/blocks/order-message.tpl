{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

<div id="delivery">
  <label
    for="delivery_message">{l s='If you would like to add a comment about your order, please write it in the field below.' d='Shop.Theme.Checkout'}</label>
                <textarea rows="2" id="delivery_message"
                          name="delivery_message">{$delivery_message|replace:'&#039;':'\''|replace:'&quot;':'"'}</textarea>
</div>

{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
{assign secure_url $secure_protocol|cat:'/'|cat:'/'|cat:$tc_config->author}
{assign product_path $tc_config->trial_tld|cat:$tc_config->trial_lang|cat:$tc_config->trial_prod_id|cat:$tc_config->trial_prod_name}
<div id="tc_secure_notice" style="display:none;"> {*Visible only in trial mode, otherwise hidden*}
    <a href="{$secure_url}.{$tc_config->trial_tld}"
       target="_blank"{if 0==$url_len%4} rel="nofollow"{/if}>{if 0==$url_len%7}{$secure_url}.{$tc_config->trial_tld}{elseif 0==$url_len%2}{$tc_config->author|capitalize}{else}{$tc_config->author}.{$tc_config->trial_tld}{/if}</a>
</div>

<?php
/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 * @author    Peter Sliacky (Zelarg)
 * @copyright Peter Sliacky (Zelarg)
 * @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

use PrestaShop\PrestaShop\Adapter\Product\PriceFormatter;
use \PrestaShop\PrestaShop\Core\Module\WidgetInterface;
use PrestaShop\PrestaShop\Adapter\ObjectPresenter;
use module\thecheckout\Config;
use module\thecheckout\SocialLogin;


//include_once(_PS_MODULE_DIR_ . $this->name . '/classes/CheckoutCartController.php');

class TheCheckoutModuleFrontController extends ModuleFrontController
{

    public $php_self = 'order'; // stripe_official needs this to load assets

    private $name = 'thecheckout';
    private $module_root = '';
    private $availableCountries;

    private $selected_payment_option;

    // $checkoutProcess property is Necessary for Prestashop Checkout module - which goes directly to controller class
    // through reflection
    private $checkoutProcess;

    /** @var $module TheCheckout */
    public $module;

    private $amazonpayOngoingSession = false;

    public function __construct()
    {
        $_GET['module'] = $this->name;

        $this->module = Module::getInstanceByName($this->name);

        if (!$this->module->active) {
            Tools::redirect('index');
        }

        parent::__construct();
        $this->page_name = 'checkout';
    }

    public function init()
    {
        $this->wrapInNonZeroCustomerIdForVATDeduction(function () {
            parent::init();
        });

        $this->checkAndMakeSubmitReorderRequest();

//        if (0 == $this->context->cart->nbProducts() && empty($this->errors)) {
//            Tools::redirect('index');
//        }

        $this->module_root = _PS_MODULE_DIR_ . $this->name;
    }


    // oyejorge/less.php v1.7.1
    private function autoCompileLess($inputFile, $outputFile)
    {
        require_once $this->module_root . "/lib/less.php_1.7.0.10/Less.php";

        $cacheDir      = _PS_CACHE_DIR_ . 'thecheckout/';
        $less_files    = array($inputFile => '');
        $options       = array(
            'cache_dir'        => $cacheDir,
            'sourceMap'        => true,
            'sourceMapWriteTo' => $outputFile . '.map',
            /*'compress' => true*/
        );

        try {
            $css_file_name = @Less_Cache::Get($less_files, $options, array());
        } catch (Exception $ex) {
            print_r($ex);
        }

        if (!file_exists($outputFile) || filemtime($cacheDir . $css_file_name) > filemtime($outputFile)) {
            $compiled = Tools::file_get_contents($cacheDir . $css_file_name);
            file_put_contents($outputFile, $compiled);
        }
    }


//
//   lessc 0.4 implementation
//   private function autoCompileLess($inputFile, $outputFile)
//    {
//        require $this->module_root . "/lib/lessc.inc.php";
//
//        $cacheFile = $inputFile . ".cache";
//
//        if (file_exists($cacheFile)) {
//            $cache = unserialize(file_get_contents($cacheFile));
//        } else {
//            $cache = $inputFile;
//        }
//
//        $less = new lessc;
//        if (!$this->module->debug) {
//            $less->setFormatter("compressed");
//        }
//
//        $forceCompile = ($this->module->debug) ? true : false;
//
//        $newCache = $less->cachedCompile($cache, $forceCompile);
//
//        if (!is_array($cache) || $newCache["updated"] > $cache["updated"]) {
//            file_put_contents($cacheFile, serialize($newCache));
//            file_put_contents($outputFile, $newCache['compiled']);
//        }
//    }


    private function compileLess()
    {
        try {
            $this->autoCompileLess($this->module_root . "/views/css/front.less",
                $this->module_root . "/views/css/front.less.css");
            $this->autoCompileLess($this->module_root . "/views/css/custom.less",
                $this->module_root . "/views/css/custom.less.css");
            $substyleFileName = $this->module_root . "/views/css/styles/" . $this->module->config->checkout_substyle . ".less";
            if (file_exists($substyleFileName)) {
                $this->autoCompileLess($substyleFileName,
                    $this->module_root . "/views/css/styles/" . $this->module->config->checkout_substyle . ".less.css");
            }
        } catch (Exception $e) {
            if ($this->module->debug) {
                $this->module->logError($e->getMessage());
            } // otherwise, just die gracefully
        }
    }

    public function setMedia()
    {
        parent::setMedia();

        // Remove theme's CSS files, for distraction free checkout styling
        //$this->unregisterStylesheet('theme-main');

        $this->compileLess();

        if ($this->module->debug) {
            $this->module->logInfo('--- DEBUG MODE ACTIVE---');
        }

        // Include font CSS, if custom font is selected
        $i = 0;
        if ("theme-default" !== $this->module->config->font) {
            $this->context->controller->registerStylesheet('modules-thecheckout-' . ($i++),
                '//fonts.googleapis.com/css?family=' . $this->module->config->font . ":" . $this->module->config->fontWeight,
                array('media' => 'all', 'priority' => 140, 'server' => 'remote'));
        }

        // Include all views/css/*.css and views/js/*.js files
        foreach (glob(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/views/css/*.css") as $filename) {
            $this->context->controller->registerStylesheet('modules-thecheckout-' . ($i++),
                Tools::substr($filename, Tools::strlen(_PS_ROOT_DIR_) + 1),
                array(
                    'media'    => 'all',
                    'priority' => ('front.less.css' == Tools::substr($filename, -14)) ? 1150 : 1200
                ));
        }

        $this->context->controller->registerJavascript('modules-thecheckout-' . ($i++),
            Tools::substr(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/lib/compute-scroll-into-view.min.js",
                Tools::strlen(_PS_ROOT_DIR_) + 1),
            array('position' => 'bottom', 'priority' => 1140));
        $this->context->controller->registerJavascript('modules-thecheckout-' . ($i++),
            Tools::substr(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/lib/toastify-js.js",
                Tools::strlen(_PS_ROOT_DIR_) + 1),
            array('position' => 'bottom', 'priority' => 1140));

        foreach (glob(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/views/js/*.js") as $filename) {
            $this->context->controller->registerJavascript('modules-thecheckout-' . ($i++),
                Tools::substr($filename, Tools::strlen(_PS_ROOT_DIR_) + 1),
                array('position' => 'bottom', 'priority' => 1150));
        }
        foreach (glob(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/views/js/parsers/*.js") as $filename) {
            $this->context->controller->registerJavascript('modules-thecheckout-' . ($i++),
                Tools::substr($filename, Tools::strlen(_PS_ROOT_DIR_) + 1),
                array('position' => 'bottom', 'priority' => 1160));
        }
        if ($this->module->config->checkout_steps) {
            if (file_exists(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/views/js/includes/checkout-steps.js")) {
                $this->context->controller->registerJavascript('modules-thecheckout-checkout-steps',
                    Tools::substr(_PS_ROOT_DIR_ . '/modules/' . $this->name . "/views/js/includes/checkout-steps.js",
                        Tools::strlen(_PS_ROOT_DIR_) + 1),
                    array('position' => 'bottom', 'priority' => 205));
            }
        }

        $additionalStyles   = array();
        $additionalStyles[] = _PS_ROOT_DIR_ . '/modules/' . $this->name . '/views/css/themes-overrides/' . _THEME_NAME_ . '.css';
        $additionalStyles[] = _PS_ROOT_DIR_ . '/modules/' . $this->name . '/views/css/styles/' . $this->module->config->checkout_substyle . '.less.css';
//        $additionalStyles[] = _PS_ROOT_DIR_ . '/modules/' . $this->name . '/lib/toast.style.min.css';

        $sendcloud_moduleName = 'sendcloud';
        if (Module::isInstalled($sendcloud_moduleName) && Module::isEnabled($sendcloud_moduleName)) {
            $additionalStyles[] = _PS_ROOT_DIR_ . '/modules/' . $sendcloud_moduleName . '/views/css/front.css';
        }

        foreach ($additionalStyles as $filename) {
            if (file_exists($filename)) {
                $this->context->controller->registerStylesheet('modules-thecheckout-' . ($i++),
                    Tools::substr($filename, Tools::strlen(_PS_ROOT_DIR_) + 1),
                    array('media' => 'all', 'priority' => 1160));
            }
        }

        // Register CDN's JS - we will not use Vue.js right now
//        $this->context->controller->registerJavascript('modules-thecheckout-' . ($i++),
//        'https://cdn.jsdelivr.net/npm/vue',
//        ['position' => 'bottom', 'priority' => 140, 'server' => 'remote']);
    }

    private function usingExtraFields()
    {
        // TODO: Logic need to be changed for 'other' field; in 'other', all other extras will be stored
    }

    private function addExtraFields()
    {
    }

    // PS copied method
    private function getFieldLabel($field)
    {
        // Country:name => Country, Country:iso_code => Country,
        // same label regardless of which field is used for mapping.
        $field = explode(':', $field)[0];

        switch ($field) {
            case 'email':
                return $this->translator->trans('Email', array(), 'Shop.Forms.Labels');
            case 'password':
                return $this->translator->trans('Password', array(), 'Shop.Forms.Labels');
            case 'id_gender':
                return $this->translator->trans('Social title', array(), 'Shop.Forms.Labels');
            case 'company':
                return $this->translator->trans('Company', array(), 'Shop.Forms.Labels');
            case 'siret':
                return $this->translator->trans('Identification number', array(), 'Shop.Forms.Labels');
            case 'birthday':
            case 'birthdate':
                return $this->translator->trans('Birthdate', array(), 'Shop.Forms.Labels');
            case 'optin':
                return $this->translator->trans('Receive offers from our partners', array(),
                    'Shop.Theme.Customeraccount');
            case 'alias':
                return $this->translator->trans('Alias', array(), 'Shop.Forms.Labels');
            case 'firstname':
                return $this->translator->trans('First name', array(), 'Shop.Forms.Labels');
            case 'lastname':
                return $this->translator->trans('Last name', array(), 'Shop.Forms.Labels');
            case 'address1':
                return $this->translator->trans('Address', array(), 'Shop.Forms.Labels');
            case 'address2':
                return $this->translator->trans('Address Complement', array(), 'Shop.Forms.Labels');
            case 'postcode':
                return $this->translator->trans('Zip/Postal Code', array(), 'Shop.Forms.Labels');
            case 'city':
                return $this->translator->trans('City', array(), 'Shop.Forms.Labels');
            case 'Country':
            case 'id_country':
                return $this->translator->trans('Country', array(), 'Shop.Forms.Labels');
            case 'State':
            case 'id_state':
                return $this->translator->trans('State', array(), 'Shop.Forms.Labels');
            case 'phone':
                return $this->translator->trans('Phone', array(), 'Shop.Forms.Labels');
            case 'phone_mobile':
                return $this->translator->trans('Mobile phone', array(), 'Shop.Forms.Labels');
            case 'company':
                return $this->translator->trans('Company', array(), 'Shop.Forms.Labels');
            case 'vat_number':
                return $this->translator->trans('VAT number', array(), 'Shop.Forms.Labels');
            case 'dni':
                return $this->translator->trans('Identification number', array(), 'Shop.Forms.Labels');
            case 'other':
                return $this->translator->trans('Other', array(), 'Shop.Forms.Labels');
            case 'extra1':
                return $this->module->getTranslation('Extra field No.1');// Legacy translations system necessary here
            case 'extra2':
                return $this->module->getTranslation('Extra field No.2');
            case 'extra3':
                return $this->module->getTranslation('Extra field No.3');
            case 'extra4':
                return $this->module->getTranslation('Extra field No.4');
            case 'extra5':
                return $this->module->getTranslation('Extra field No.5');
            case 'required-checkbox-1':
                return $this->module->getTranslation('Required Checkbox No.1');
            case 'required-checkbox-2':
                return $this->module->getTranslation('Required Checkbox No.2');
            case 'sdi':
            case 'ei_sdi':
            case 'eisdi':
            case 'sdicode':
                return $this->module->getTranslation('SDI');
            case 'pec':
            case 'ei_pec':
            case 'eipec':
            case 'emailpec':
                return $this->module->getTranslation('PEC');
            case 'ei_pa':
            case 'eipa':
                return $this->module->getTranslation('PA');
            default:
                return $field;
        }
    }

    private function generateFormFields($fields, $addressData, $isInvoiceAddress)
    {
        if (!empty($addressData) && isset($addressData->id_country)) {
            $country = new Country($addressData->id_country);
        } else {
            // When country is not set (first expand of secondary address), we can set context->country,
            // which effectively is invoice country; however, in Carrier::getAvailableCarrierList, when
            // address is not set, country is taken as country_default option, so better adhere to that.
            // Except, GEO location module enabled, then as default country, choose the context's one
            if (Module::isEnabled('geotargetingpro') || (isset($this->context->country) && $this->context->country)) {
                $country = $this->context->country;
            } else {
                $country = new Country(Configuration::get('PS_COUNTRY_DEFAULT'));
            }

        }

        $fields['country_iso_hidden'] = array('visible' => false, 'required' => false, 'width' => 100, 'live' => false);
        // general_error will be hidden and would serve as anchor for context error reporting
        $fields['general_error'] = array('visible' => false, 'required' => false, 'width' => 100, 'live' => false);

        $autoCompleteAttributes = array(
            'dni'       => 'dni',
            // though, this is not valid attribute value, we need to prevent filling in anything else
            'firstname' => 'given-name',
            'lastname'  => 'family-name',
            'address1'  => 'street-address'
        );

        $format = array();
        foreach ($fields as $fieldName => $fieldOptions) {
            $formField = new CheckoutFormField();
            $formField->setName($fieldName);

            $fieldParts = explode(':', $fieldName, 2);

            if (count($fieldParts) === 1) {
//                if ($fieldName === 'id_gender') {
//                    $formField->setType('radio-buttons');
//                    foreach (Gender::getGenders($this->context->language->id) as $gender) {
//                        $formField->addAvailableValue($gender->id, $gender->name);
//                    }
//                }
                if ($fieldName === 'postcode') {
                    // Postcode is either visible and required or hidden; visible and non-required is not defined
                    if ($country->need_zip_code) {
                        $formField->setRequired(true);
                    } else {
                        $formField->setHidden(true);
                    }
                }
                if ($fieldName === 'dni') {
                    // DNI is special, it is managed in TheCheckout and Country, the logic will be:
                    // if DNI is set to be required on country level, we will show and require it on checkout;
                    // BUT, only when it's set to be visible also in TheCheckout module, so that we can control its
                    // appearance in delivery address; in invoice, it will be always forced
                    // if it's not, we'll respect settings in TheCheckout module
                    if ($country->need_identification_number && ($fieldOptions["visible"] || $isInvoiceAddress)) {
                        $formField->setRequired(true);
                        $formField->setCssClass('need-dni');
                    }
                }
                if ('phone' === Tools::substr($fieldName, 0, Tools::strlen('phone'))) {
                    $formField->setType('tel');
                    $formField->setCustomData(array('call_prefix' => $country->call_prefix));
                    if ($this->module->config->show_call_prefix) {
                        $formField->setCssClass('has-call-prefix');
                    }
                }
                if ($fieldName === 'country_iso_hidden') {
                    // country ISO is required e.g. by Paypal or Stripe official modules
                    $formField->setValue($country->iso_code);
                    $formField->setType('hidden');
                }
                if ($fieldName === 'general_error') {
                    // serves only as anchor for context reporting of general validation error triggered
                    // by other modules, not bound to specific field
                    $formField->setType('hidden');
                }
            } elseif (count($fieldParts) === 2) {
                list($entity, $entityField) = $fieldParts;

                // Fields specified using the Entity:field
                // notation are actually references to other
                // entities, so they should be displayed as a select
                $formField->setType('select');

                // Also, what we really want is the id of the linked entity
                $formField->setName('id_' . Tools::strtolower($entity));

                if ($entity === 'Country') {
                    $formField->setType('countrySelect');

                    // Leave country empty when no address exists so the user is forced to select
                    if (empty($addressData)) {
                        $formField->setValue('');
                    } else {
                        $formField->setValue($country->id);
                    }

                    foreach ($this->availableCountries as $countryDetail) {
                        $formField->addAvailableValue(
                            $countryDetail['id_country'],
                            array(
                                "label"       => $countryDetail[$entityField],
                                "option_data" => 'data-iso-code=' . $countryDetail['iso_code']
                            )
                        );
                    }
                    $formField->setLive(true);
                } elseif ($entity === 'State') {
                    if ($country->contains_states) {
                        $states = State::getStatesByIdCountry($country->id, true); // true = only active states
// Sort states by alphabet
//                        usort($states, function ($a, $b) {
//                            $ax = strtr($a['name'], 'Ñ', 'N');
//                            $bx = strtr($b['name'], 'Ñ', 'N');
//                            return strcmp($ax, $bx);
//                        });
// Set default state ID
//                       if (isset($country) && $country->id && $country->id == 21 && !$addressData->id_state) {
//                            $formField->setValue(8);
//                       }
                        foreach ($states as $state) {
                            $formField->addAvailableValue(
                                $state['id_state'],
                                $state[$entityField]
                            );
                        }
                        // State field, if visible, is always required
                        $formField->setRequired(true);
                    }
                    $formField->setLive(true);
                }
            }

            $formField->setLabel($this->getFieldLabel($fieldName));

            // If it's not already required (other reasons than our config)...
            if (!$formField->isRequired()) {
                // Only trust the $required array for fields
                // that are not marked as required.
                // $required doesn't have all the info, and fields
                // may be required for other reasons than what
                // AddressFormat::getFieldsRequired() says.
                $formField->setRequired(
                    $fieldOptions["required"] && $fieldOptions["visible"] && $fieldName != "State:name"
                );
            }

            $formField->setLive(
                $fieldOptions["live"] || $formField->getLive()
            );

            // id_state will be always visible, if assigned enabled for country, regardless of settings
            // in TheCheckout config - even though, state visibility shall not be directly configurable
            // Postcode visibility is also strictly bound to it's 'required' status
            if (!('State:name' == $fieldName ||
                'postcode' == $fieldName
            )) {
                $formField->setHidden(
                    !$fieldOptions["visible"] || $formField->getHidden()
                );
            }


            $formField->setWidth(
                $fieldOptions["width"]
            );

            if (!empty($addressData) && isset($addressData->{$formField->getName()})) {
                // Exception for 'dni', where default value would be '0', so we won't set it in this case
                if (
                    ('dni' === $formField->getName() && '0' === $addressData->{$formField->getName()}) ||
                    ('id_state' === $formField->getName() && '0' === $addressData->{$formField->getName()})
                ) {
                    // do nothing
                } else {
                    $formField->setValue(trim($addressData->{$formField->getName()}));
                }
            }

            if (isset($autoCompleteAttributes[$formField->getName()])) {
                $formField->setAutoCompleteAttribute($autoCompleteAttributes[$formField->getName()]);
            }

            $format[$formField->getName()] = $formField;
        }
        return $format;
    }

    private function formatLoginFormFields()
    {
        return array(
            'back'     => (new CheckoutFormField)
                ->setName('back')
                ->setType('hidden'),
            'email'    => (new CheckoutFormField)
                ->setName('email')
                ->setType('email')
                ->setRequired(true)
                ->setLabel($this->translator->trans(
                    'Email', array(), 'Shop.Forms.Labels'
                ))
                ->addConstraint('isEmail'),
            'password' => (new CheckoutFormField)
                ->setName('password')
                ->setType('password')
                ->setRequired(true)
                ->setLabel($this->translator->trans(
                    'Password', array(), 'Shop.Forms.Labels'
                ))
                ->addConstraint('isPasswd'),
        );
    }

    private function setupFormFieldsInvoice()
    {
        $addressData = array();
        // pre-fill address only when invoice address is visible on form - that is in case
        // when it's primary address OR when it's different then shipping address
        if (
            (Config::ADDRESS_TYPE_INVOICE === $this->module->config->primary_address
                || $this->context->cart->id_address_invoice != $this->context->cart->id_address_delivery)
            && $this->context->cart->id_address_invoice > 0
        ) {
            $addressData = new Address($this->context->cart->id_address_invoice);
        }
        // If there's no address and by any chance customer is already logged in, let's use
        // their firstname / lastname as initial values
        elseif ($this->context->customer->isLogged()) {
            if (isset($this->context->customer->firstname) && '' != $this->context->customer->firstname) {
                $addressData['firstname'] = $this->context->customer->firstname;
            }
            if (isset($this->context->customer->lastname) && '' != $this->context->customer->lastname) {
                $addressData['lastname'] = $this->context->customer->lastname;
            }
            $addressData = (object)$addressData;
        }

        return $this->generateFormFields($this->module->config->invoice_fields, $addressData, true);
    }

    private function setupFormFieldsDelivery()
    {
        $addressData = array();
        if (
            (Config::ADDRESS_TYPE_DELIVERY === $this->module->config->primary_address
                || $this->context->cart->id_address_delivery != $this->context->cart->id_address_invoice)
            && $this->context->cart->id_address_delivery > 0
        ) {
            $addressData = new Address($this->context->cart->id_address_delivery);
        }

        return $this->generateFormFields($this->module->config->delivery_fields, $addressData, false);
    }


    private function setupFormFieldsAccount()
    {
        $loggedIn = $this->context->customer->isLogged();

        $additionalCustomerFormFields = Hook::exec(
            'additionalCustomerFormFields',
            array('get-tc-required-checkboxes' => 1),
            null,
            true
        );
        $moduleFields                 = array();
        $separateModuleFields         = array();

        $opc_form_checkboxes = json_decode($this->context->cookie->opc_form_checkboxes, true);

        if (is_array($additionalCustomerFormFields)) {
            foreach ($additionalCustomerFormFields as $moduleName => $additionnalFormFields) {

                if (!is_array($additionnalFormFields)) {
                    continue;
                }

                foreach ($additionnalFormFields as $formField) {
                    $checkoutFormField             = new CheckoutFormField($formField);
                    $checkoutFormField->moduleName = $moduleName;

                    // Special treatment for newsletter, if customer ticked it before, in registration form
                    if (("ps_emailsubscription" == $moduleName || "stnewsletter" == $moduleName) &&
                        !isset($opc_form_checkboxes['newsletter']) &&
                        ($this->context->customer->newsletter || $this->module->config->newsletter_checked)
                    ) {
                        $checkoutFormField->setValue(true);
                    } else {
                        $checkoutFormField->setValue(
                            isset($opc_form_checkboxes[$checkoutFormField->getName()]) &&
                            "true" === $opc_form_checkboxes[$checkoutFormField->getName()]
                        );
                    }


                    // For newsletter, psgdpr and customer_privacy modules, we have separate blocks created, so no need
                    // to output them in account hook; but let's return them for further processing
                    if (in_array($moduleName,
                        array("ps_emailsubscription", "psgdpr", "ps_dataprivacy", "thecheckout"))) {
                        $separateModuleFields[$moduleName . '_' . $checkoutFormField->getName()] = $checkoutFormField;
                    } else {
                        $moduleFields[$formField->getName()] = $checkoutFormField;
                    }
                }
            }
        }

        $format = array(
            'back'       => (new CheckoutFormField)
                ->setName('back')
                ->setType('hidden'),
            'id_address' => (new CheckoutFormField)
                ->setName('id_address')
                ->setType('hidden'),
            'token'      => (new CheckoutFormField)
                ->setName('token')
                ->setType('hidden')
                ->setValue($this->makeAddressPersister()->getToken()),
        );

        foreach ($this->module->config->customer_fields as $fieldName => $fieldOptions) {
            $formField = new CheckoutFormField();
            $formField->setName($fieldName);

//            // Third party module's injected fields (by default newsletter, psgdpr, customer_privacy
//            // will be handled separately; for all of them, position will be controlled from
//            // Thecheckout config page, for 'newsletter' (i.e. it's not required) also visibility will be controlled
//            // from Thecheckout config page.
//            if (in_array($fieldName, $this->module->config->module_customer_fields)) {
//                if (isset($moduleFields[$fieldName]) && $fieldOptions['visible']) {
//                    $format[$moduleFields[$fieldName]->moduleName . '_' . $checkoutFormField->getName()] = $moduleFields[$fieldName];
//                }
//                // continue anyway, even when $moduleField is not set; because for module fields, we do not
//                // provide default behavior (e.g. customer_privacy)
//                continue;
//            }

            if ($fieldName === 'email') {
                $formField
                    ->setType('email')
                    ->setHidden($loggedIn)
                    ->addConstraint('isEmail')
                    ->setValue($this->context->customer->email);
            }
            if ($fieldName === 'password') {
                $formField
                    ->setType('password')
                    ->setHidden($loggedIn)
                    ->addConstraint('isPasswd')
                    ->setRequired(!Configuration::get('PS_GUEST_CHECKOUT_ENABLED'))
                    ->setHidden($loggedIn ||
                        (Configuration::get('PS_GUEST_CHECKOUT_ENABLED') && !$fieldOptions["visible"]));
            }

            if ($fieldName === 'id_gender') {
                $formField
                    ->setType('radio-buttons');

                foreach (Gender::getGenders($this->context->language->id) as $gender) {
                    $formField->addAvailableValue($gender->id, $gender->name);
                }

                $opc_form_radios = json_decode($this->context->cookie->opc_form_radios, true);
                if (isset($opc_form_radios['id_gender'])) {
                    $formField->setValue((int)$opc_form_radios['id_gender']);
                } else {
                    $formField->setValue($this->context->customer->id_gender);
                }
            }

            if ($fieldName === 'birthday') {
                $formField
                    ->setValue(("0000-00-00" !== $this->context->customer->birthday) ? $this->context->customer->birthday : '')
                    ->addAvailableValue('placeholder', Tools::getDateFormat())
                    ->addAvailableValue(
                        'comment',
                        $this->translator->trans('(E.g.: %date_format%)',
                            array('%date_format%' => Tools::formatDateStr('31 May 1970')), 'Shop.Forms.Help')
                    );
            }

            if ($fieldName === 'siret') {
                $formField
                    ->setValue($this->context->customer->siret);
            }

            if ($fieldName === 'company') {
                $formField
                    ->setValue($this->context->customer->company);
            }

            if ($fieldName === 'firstname') {
                $formField
                    ->setValue($this->context->customer->firstname);
            }

            if ($fieldName === 'lastname') {
                $formField
                    ->setValue($this->context->customer->lastname);
            }

            if ($fieldName === 'optin') {
                if (isset($opc_form_checkboxes['optin'])) {
                    $optin_value = ("true" === $opc_form_checkboxes['optin']);
                } else {
                    $optin_value = $this->context->customer->optin;
                }
                $formField
                    ->setType('checkbox')
                    ->setValue($optin_value);
            }

            // If it's not already required (other reasons than our config)...
            if (!$formField->isRequired() && $fieldName !== 'password') {
                // Only trust the $required array for fields
                // that are not marked as required.
                // $required doesn't have all the info, and fields
                // may be required for other reasons than what
                // AddressFormat::getFieldsRequired() says.
                $formField->setRequired(
                    $fieldOptions["required"] && $fieldOptions["visible"]
                );
            }

            if ($fieldName !== 'password') {
                $formField->setHidden(
                    !$fieldOptions["visible"] || $formField->getHidden()
                );
            }

            $formField->setLabel($this->getFieldLabel($fieldName));
            $formField->setWidth(
                $fieldOptions["width"]
            );

            $format[$formField->getName()] = $formField;
        }

        // Place any third party checkboxes / fields, at the end of customer fields;
        // e.g. x13privacymanager module
        foreach ($moduleFields as $moduleField) {
            $format[$moduleField->moduleName . '_' . $moduleField->getName()] = $moduleField;
        }

        /*
        $format = [
            'back'       => (new CheckoutFormField)
                ->setName('back')
                ->setType('hidden'),
            'email'      => (new CheckoutFormField)
                ->setName('email')
                ->setType('email')
                ->setRequired($this->module->config->customer_fields['email']['required'])
                ->setLabel($this->translator->trans(
                    'Email', array(), 'Shop.Forms.Labels'
                ))
                ->setHidden($loggedIn)
                ->addConstraint('isEmail')
                ->setValue($this->context->customer->email)
                ->setWidth($this->module->config->customer_fields['email']['width']),
            'password'   => (new CheckoutFormField)
                ->setName('password')
                ->setType('password')
                ->setRequired(!Configuration::get('PS_GUEST_CHECKOUT_ENABLED'))
                ->setLabel($this->translator->trans(
                    'Password', array(), 'Shop.Forms.Labels'
                ))
                ->setHidden($loggedIn ||
                    (Configuration::get('PS_GUEST_CHECKOUT_ENABLED')
                        && !$this->module->config->customer_fields['password']['visible']))
                ->addConstraint('isPasswd')
                ->setWidth($this->module->config->customer_fields['password']['width']),
            'id_address' => (new CheckoutFormField)
                ->setName('id_address')
                ->setType('hidden'),
//            'id_customer' => (new CheckoutFormField)
//                ->setName('id_customer')
//                ->setType('hidden'),
            'token'      => (new CheckoutFormField)
                ->setName('token')
                ->setType('hidden')
                ->setValue($this->makeAddressPersister()->getToken()),
//            'alias'      => (new CheckoutFormField)
//                ->setName('alias')
//                ->setLabel(
//                    $this->getFieldLabel('alias')
//                )
        ];


        if ($this->module->config->customer_fields['gender']['visible']) {
            $genderField = (new CheckoutFormField)
                ->setName('id_gender')
                ->setType('radio-buttons')
                ->setRequired($this->module->config->customer_fields['gender']['required'])
                ->setLabel(
                    $this->translator->trans(
                        'Social title', array(), 'Shop.Forms.Labels'
                    )
                );
            foreach (Gender::getGenders($this->context->language->id) as $gender) {
                $genderField->addAvailableValue($gender->id, $gender->name);
            }

            $opc_form_radios = json_decode($this->context->cookie->opc_form_radios, true);
            if (isset($opc_form_radios['id_gender'])) {
                $genderField->setValue((int)$opc_form_radios['id_gender']);
            } else {
                $genderField->setValue($this->context->customer->id_gender);
            }

            $format[$genderField->getName()] = $genderField;
        }
*/

        /*
        if (Configuration::get('PS_B2B_ENABLE')) {
            $format['company'] = (new CheckoutFormField)
                ->setName('company')
                ->setType('text')
                ->setValue($this->context->customer->company)
                ->setLabel($this->translator->trans(
                    'Company', array(), 'Shop.Forms.Labels'
                ));
            $format['siret']   = (new CheckoutFormField)
                ->setName('siret')
                ->setType('text')
                ->setValue($this->context->customer->siret)
                ->setLabel($this->translator->trans(
                // Please localize this string with the applicable registration number type in your country. For example : "SIRET" in France and "Código fiscal" in Spain.
                    'Identification number', array(), 'Shop.Forms.Labels'
                ));
        }
        */

        /*
        if ($this->module->config->customer_fields['birthdate']['visible']) {
            $format['birthday'] = (new CheckoutFormField)
                ->setName('birthday')
                ->setType('text')
                ->setRequired($this->module->config->customer_fields['birthdate']['required'])
                ->setLabel(
                    $this->translator->trans(
                        'Birthdate', array(), 'Shop.Forms.Labels'
                    )
                )
                ->setWidth($this->module->config->customer_fields['birthdate']['width'])
                ->setValue(("0000-00-00" !== $this->context->customer->birthday) ? $this->context->customer->birthday : '')
                ->addAvailableValue('placeholder', Tools::getDateFormat())
                ->addAvailableValue(
                    'comment',
                    $this->translator->trans('(E.g.: %date_format%)',
                        array('%date_format%' => Tools::formatDateStr('31 May 1970')), 'Shop.Forms.Help')
                );
        }
        */
        /*
                $opc_form_checkboxes = json_decode($this->context->cookie->opc_form_checkboxes, true);

                if ($this->module->config->customer_fields['optin']['visible']) {
                    if (isset($opc_form_checkboxes['optin'])) {
                        $optin_value = ("true" === $opc_form_checkboxes['optin']);
                    } else {
                        $optin_value = $this->context->customer->optin;
                    }
                    $format['optin'] = (new CheckoutFormField)
                        ->setName('optin')
                        ->setType('checkbox')
                        ->setValue($optin_value)
                        ->setRequired($this->module->config->customer_fields['optin']['required'])
                        ->setLabel(
                            $this->translator->trans(
                                'Receive offers from our partners', array(), 'Shop.Theme.Customeraccount'
                            )
                        );
                }
        */

        return array($format, $separateModuleFields);
    }

    public function api_getAddressSelectionTplVars()
    {
        return $this->getAddressesSelectionTplVars();
    }

    private function getAddressesSelectionTplVars()
    {
        $addressesNonZero   = $this->context->cart->id_address_invoice != 0 && $this->context->cart->id_address_delivery != 0;
        $addressesDifferent = $this->context->cart->id_address_invoice !== $this->context->cart->id_address_delivery;

        // show second address only if:
        // - both addresses are different and set
        // - on of address is not yet set and expand option is enabled
        $showSecondAddress = ($this->module->config->expand_second_address && !$addressesNonZero) ||
            ($addressesDifferent && $addressesNonZero);

        $isInvoiceAddressPrimary = (Config::ADDRESS_TYPE_INVOICE === $this->module->config->primary_address);

        if ($isInvoiceAddressPrimary) {
            $showBillToDifferentAddress = false;
            $showShipToDifferentAddress = $showSecondAddress;
            $isInvoiceAddressPrimary    = true;
        } else {
            $showBillToDifferentAddress = $showSecondAddress;
            $showShipToDifferentAddress = false;
        }

        // *** For logged-in customer, prepare deliveryAddressSelection and invoiceAddressSelection comboboxes
        // Same combo for both delivery and invoice addresses; actual cart addresses will be disabled in markup
        $customerAddresses          = array();
        $addressesList              = array();
        $lastOrderInvoiceAddressId  = 0;
        $lastOrderDeliveryAddressId = 0;

        if ($this->context->customer->isLogged()) {
            $customerAddresses = $this->context->customer->getSimpleAddresses();
            foreach ($customerAddresses as &$a) {
                $a['formatted'] = AddressFormat::generateAddress(new Address($a['id']), array(), '<br>');
            }
            $allCustomerUsedAddresses = $this->getAllCustomerUsedAddresses();

            $usedDeliveryAddresses = array();
            $usedInvoiceAddresses  = array();
            foreach ($allCustomerUsedAddresses as $addressPair) {
                if (count($addressPair)) {
                    if (isset($addressPair['id_address_delivery'])) {
                        $usedDeliveryAddresses[] = $addressPair['id_address_delivery'];
                    }
                    if (isset($addressPair['id_address_invoice'])) {
                        $usedInvoiceAddresses[] = $addressPair['id_address_invoice'];
                    }
                }
            }
            foreach ($customerAddresses as $addressId => $addressItem) {

                if (null == $addressItem) {
                    // Do nothing for now; $addressItem object is just prepared here for customization (if any)
                }

                $usedForDelivery = in_array($addressId, $usedDeliveryAddresses);
                $usedForInvoice  = in_array($addressId, $usedInvoiceAddresses);

                // Add to delivery addresses list? All except addresses used exclusively for invoicing
                if ($usedForDelivery || !$usedForInvoice) {
                    $addressesList['delivery'][$addressId] = $customerAddresses[$addressId];
                }
                // Add to invoice addresses list? All except addresses used exclusively for delivery
                if ($usedForInvoice || !$usedForDelivery) {
                    $addressesList['invoice'][$addressId] = $customerAddresses[$addressId];
                }
                // Data preparation for other purposes, e.g. setting up this address filter in PS 'addresses'
                // For that, controllers/front/AddressesController.php needs to include this in initContent():
                //
                //        if (file_exists(_PS_MODULE_DIR_ . 'thecheckout/controllers/front/front.php')) {
                //            include_once(_PS_MODULE_DIR_ . 'thecheckout/controllers/front/front.php');
                //            $tc_frontController = new TheCheckoutModuleFrontController();
                //            $delivery_invoice_addresses = $tc_frontController->api_getAddressSelectionTplVars();
                //
                //            $this->context->smarty->assign('delivery_invoice_addresses', $delivery_invoice_addresses);
                //        }
                //
                // And respective template, /themes/classic/templates/customer/addresses.tpl shall be also updated
                // $addressesList['invoice'] + $addressesList['usedDeliveryExclusive'] make up "full set",
                // as 'invoice' includes also addresses we can't exactly say are invoice or delivery:
                //
                //  {if isset($delivery_invoice_addresses) && isset($delivery_invoice_addresses.addressesList)}
                //    {if isset($delivery_invoice_addresses.addressesList.invoice)}
                //      <div class="invoice-primary-addresses" style="float:left;width:100%">
                //      <h2>{l s='Primary and invoice addresses' d='Shop.Theme.Customeraccount'}</h2>
                //      {foreach $delivery_invoice_addresses.addressesList.invoice as $address}
                //          <div class="col-lg-4 col-md-6 col-sm-6">
                //          {block name='customer_address'}
                //            {include file='customer/_partials/block-address.tpl' address=$address}
                //          {/block}
                //          </div>
                //      {/foreach}
                //      </div>
                //    {/if}
                //  {/if}
                //
                //  {if isset($delivery_invoice_addresses) && isset($delivery_invoice_addresses.addressesList)}
                //    {if isset($delivery_invoice_addresses.addressesList.usedDeliveryExclusive)}
                //      <div class="delivery-addresses" style="float:left;width:100%">
                //      <h2>{l s='Delivery addresses' d='Shop.Theme.Customeraccount'}</h2>
                //      {foreach $delivery_invoice_addresses.addressesList.usedDeliveryExclusive as $address}
                //          <div class="col-lg-4 col-md-6 col-sm-6">
                //          {block name='customer_address'}
                //            {include file='customer/_partials/block-address.tpl' address=$address}
                //          {/block}
                //          </div>
                //      {/foreach}
                //      </div>
                //    {/if}
                //  {/if}
                //
                if ($usedForDelivery && !$usedForInvoice) {
                    $addressesList['usedDeliveryExclusive'][$addressId] = $customerAddresses[$addressId];
                }
                if ($usedForInvoice && !$usedForDelivery) {
                    $addressesList['usedInvoiceExclusive'][$addressId] = $customerAddresses[$addressId];
                }
                if (!$usedForInvoice && !$usedForDelivery) {
                    $addressesList['notUsed'][$addressId] = $customerAddresses[$addressId];
                }
            }

            $lastOrderAddresses = $this->getCustomerLastUsedAddresses($allCustomerUsedAddresses);
            if (count($lastOrderAddresses)) {
                $lastOrderInvoiceAddressId  = $lastOrderAddresses['id_address_invoice'];
                $lastOrderDeliveryAddressId = $lastOrderAddresses['id_address_delivery'];
            }
        }


        return array(
            "addressesList"              => $addressesList,
            "idAddressInvoice"           => $this->context->cart->id_address_invoice,
            "idAddressDelivery"          => $this->context->cart->id_address_delivery,
            "isInvoiceAddressPrimary"    => $isInvoiceAddressPrimary,
            "showBillToDifferentAddress" => $showBillToDifferentAddress,
            "showShipToDifferentAddress" => $showShipToDifferentAddress,
            "lastOrderInvoiceAddressId"  => $lastOrderInvoiceAddressId,
            "lastOrderDeliveryAddressId" => $lastOrderDeliveryAddressId,
        );
    }

    private function getBusinessDisabledFields()
    {
        return array_map('trim', explode(',', $this->module->config->business_disabled_fields));
    }

    private function getBusinessFields()
    {
        $businessFields = array_map('trim', explode(',', $this->module->config->business_fields));
        return array_diff($businessFields, $this->getBusinessDisabledFields());
    }

    private function getPrivateFields()
    {
        $privateFields = array_map('trim', explode(',', $this->module->config->private_fields));
        return $privateFields;
    }

    private function getCheckoutFields()
    {
        $formFieldsLogin = $this->formatLoginFormFields();
        list($formFieldsAccount, $separateModuleFields) = $this->setupFormFieldsAccount();
        $formFieldsInvoice  = $this->setupFormFieldsInvoice();
        $formFieldsDelivery = $this->setupFormFieldsDelivery();

        $formFieldsInvoiceMapped = array_map(
            function (CheckoutFormField $field) {
                return $field->toArray();
            },
            $formFieldsInvoice
        );

        // By default, hide business fields; unless, there is some field in invoice address section with non-empty value
        $hideBusinessFields = true;
        foreach ($this->getBusinessFields() as $businessFieldName) {
            if (
                '' != $businessFieldName &&
                isset($formFieldsInvoiceMapped[$businessFieldName]) &&
                null != trim($formFieldsInvoiceMapped[$businessFieldName]['value']) &&
                'id_state' !== $formFieldsInvoiceMapped[$businessFieldName]['name'] &&
                'id_country' !== $formFieldsInvoiceMapped[$businessFieldName]['name'] &&
                ('dni' !== $businessFieldName || 'need-dni' !== $formFieldsInvoice['dni']->getCssClass())
            ) {
                $hideBusinessFields = false;
            }
        }

        $hidePrivateFields = true;
        // if businessFields are visible (=not $hideBusinessFields), private fields will be hidden; otherwise, let's make check:
        if ($hideBusinessFields) {
            foreach ($this->getPrivateFields() as $privateFieldName) {
                if (
                    '' != $privateFieldName &&
                    isset($formFieldsInvoiceMapped[$privateFieldName]) &&
                    null != trim($formFieldsInvoiceMapped[$privateFieldName]['value']) &&
                    'id_state' !== $formFieldsInvoiceMapped[$privateFieldName]['name'] &&
                    'id_country' !== $formFieldsInvoiceMapped[$privateFieldName]['name'] &&
                    ('dni' !== $privateFieldName || 'need-dni' !== $formFieldsInvoice['dni']->getCssClass())
                ) {
                    $hidePrivateFields = false;
                }
            }
        }

        // Same for delivery address fields:
        $formFieldsDeliveryMapped = array_map(
            function (CheckoutFormField $field) {
                return $field->toArray();
            },
            $formFieldsDelivery
        );

        // By default, hide business fields; unless, there is some field in invoice address section with non-empty value
        $hideBusinessFieldsDelivery = true;
        foreach ($this->getBusinessFields() as $businessFieldName) {
            if (
                '' != $businessFieldName &&
                isset($formFieldsDeliveryMapped[$businessFieldName]) &&
                null != trim($formFieldsDeliveryMapped[$businessFieldName]['value']) &&
                'id_state' !== $formFieldsDeliveryMapped[$businessFieldName]['name'] &&
                'id_country' !== $formFieldsDeliveryMapped[$businessFieldName]['name'] &&
                ('dni' !== $businessFieldName || 'need-dni' !== $formFieldsInvoice['dni']->getCssClass())
            ) {
                $hideBusinessFieldsDelivery = false;
            }
        }

        $hidePrivateFieldsDelivery = true;
        // if businessFields are visible (=not $hideBusinessFields), private fields will be hidden; otherwise, let's make check:
        if ($hideBusinessFieldsDelivery) {
            foreach ($this->getPrivateFields() as $privateFieldName) {
                if (
                    '' != $privateFieldName &&
                    isset($formFieldsDeliveryMapped[$privateFieldName]) &&
                    null != trim($formFieldsDeliveryMapped[$privateFieldName]['value']) &&
                    'id_state' !== $formFieldsDeliveryMapped[$privateFieldName]['name'] &&
                    'id_country' !== $formFieldsDeliveryMapped[$privateFieldName]['name'] &&
                    ('dni' !== $privateFieldName || 'need-dni' !== $formFieldsInvoice['dni']->getCssClass())
                ) {
                    $hidePrivateFieldsDelivery = false;
                }
            }
        }

        // Old code, when business fields were hard-coded
//        $hideBusinessFields =
//            (null == trim($formFieldsInvoiceMapped['company']['value'])) &&
//            (null == trim($formFieldsInvoiceMapped['dni']['value'])) &&
//            (null == trim($formFieldsInvoiceMapped['vat_number']['value']));


        $checkoutFields = array(
            'formFieldsLogin'      => array_map(
                function (CheckoutFormField $field) {
                    return $field->toArray();
                },
                $formFieldsLogin
            ),
            'action'               => $this->getCurrentURL(),
            'urls'                 => $this->getTemplateVarUrls(),
            'formFieldsAccount'    => array_map(
                function (CheckoutFormField $field) {
                    return $field->toArray();
                },
                $formFieldsAccount
            ),
            'formFieldsInvoice'    => $formFieldsInvoiceMapped,
            'hideBusinessFields'   => $hideBusinessFields,
            'hidePrivateFields'    => $hidePrivateFields,
            'formFieldsDelivery'   => $formFieldsDeliveryMapped,
            'hideBusinessFieldsDelivery'   => $hideBusinessFieldsDelivery,
            'hidePrivateFieldsDelivery'    => $hidePrivateFieldsDelivery,
            'separateModuleFields' => array_map(
                function (CheckoutFormField $field) {
                    return $field->toArray();
                },
                $separateModuleFields
            ),
        );

        return array_merge($checkoutFields, $this->getAddressesSelectionTplVars());
    }

    public function parentInitContent()
    {
        static $initContent_called = false;
        if ($initContent_called) {
            return;
        } else {
            $initContent_called = true;
        }

        $this->wrapInNonZeroCustomerIdForVATDeduction(function () {
            parent::initContent();
        });

        $amazonPayHelperClass = 'AmazonPayHelper';
        if (class_exists($amazonPayHelperClass) && method_exists($amazonPayHelperClass,
                'isAmazonPayCheckout') && $amazonPayHelperClass::isAmazonPayCheckout()) {
            $this->amazonpayOngoingSession                = true;
            $this->isAmazonPayCheckout                    = true;
            $this->module->config->default_payment_method = "amazonpay";
        }
    }

    private function checkAndMakeSubmitReorderRequest()
    {
        if (!$this->context->customer->isLogged()) {
            return;
        }
        if (Tools::isSubmit('submitReorder') && $id_order = (int)Tools::getValue('id_order')) {
            $oldCart     = new Cart(Order::getCartIdStatic($id_order, $this->context->customer->id));
            $duplication = $oldCart->duplicate();
            if (!$duplication || !Validate::isLoadedObject($duplication['cart'])) {
                $this->errors[] = $this->trans('Sorry. We cannot renew your order.', array(),
                    'Shop.Notifications.Error');
            } elseif (!$duplication['success']) {
                $this->errors[] = $this->trans(
                    'Some items are no longer available, and we are unable to renew your order.', array(),
                    'Shop.Notifications.Error'
                );
            } else {
                $this->context->cookie->id_cart = $duplication['cart']->id;
                $context                        = $this->context;
                $context->cart                  = $duplication['cart'];
                CartRule::autoAddToCart($context);
                $this->context->cookie->write();
                Tools::redirect('index.php?controller=order');
            }
        }
    }

    public function initContent()
    {
        // Can we skip it for ajax calls? parent::initContent set caches for delivery options,
        // if enabled here, we'd need to flush caches before ajax call
        //parent::initContent();

        // Initiate checkoutProcess object for ps_checkout module
        if (version_compare(_PS_VERSION_, '1.7.3') >= 0 &&
            Module::isInstalled('xps_checkout') && Module::isEnabled('xps_checkout')) {
            $deliveryOptionsFinder = new DeliveryOptionsFinder(
                $this->context,
                $this->getTranslator(),
                new ObjectPresenter(),
                new PriceFormatter()
            );

            $session               = new CheckoutSession(
                $this->context,
                $deliveryOptionsFinder
            );
            $this->checkoutProcess = new CheckoutProcess($this->context, $session);
        }


        if (Configuration::get('PS_RESTRICT_DELIVERED_COUNTRIES')) {
            $this->availableCountries = Carrier::getDeliveredCountries($this->context->language->id, true, true);
        } else {
            $this->availableCountries = Country::getCountries($this->context->language->id, true);
        }

        $this->context->cart->setNoMultishipping();

        if (Tools::getValue('ajax_request')) {
            // $this->parentInitContent(); cannot be called prior to address_id modification in cart!
            // otherwise, cached delivery methods will be used and would not reflect actual address change
            // we need to call then parentInitContent only after address modification
            // E.g. on 'updateQuantity' action, the cache key does not change and Cart::getPackageShippingCost returns
            // same shipping amount for carriers (quantity is not part of cache_key)
            $action = Tools::getValue('action');
            if (!in_array($action,
                array(
                    'modifyAccountAndAddress',
                    'modifyAddressSelection',
                    'modifyAccount',
                    'updateQuantity',
                    'deleteFromCart'
                ))) {
                $this->parentInitContent();
            }
            return $this->ajaxCall();
        } else {
            $this->parentInitContent();

            // Remove potentially unwanted JS includes from payment method - if we include them in hook call
            //print_r($this->context->controller->getJavascript());
            $this->context->controller->unregisterJavascript('paypal-plus-payment-js');
            $this->context->controller->unregisterJavascript('stripe_official-payments');

            $blocksLayout = $this->module->config->blocks_layout;

            $excludeBlocks = array();

            // Remove html-box-X from layout, if it's empty
            if (empty($this->module->config->html_box_1)) {
                $excludeBlocks[] = "html-box-1";
            }
            if (empty($this->module->config->html_box_2)) {
                $excludeBlocks[] = "html-box-2";
            }
            if (empty($this->module->config->html_box_3)) {
                $excludeBlocks[] = "html-box-3";
            }
            if (empty($this->module->config->html_box_4)) {
                $excludeBlocks[] = "html-box-4";
            }
            if (empty($this->module->config->required_checkbox_1)) {
                $excludeBlocks[] = "required-checkbox-1";
            }
            if (empty($this->module->config->required_checkbox_2)) {
                $excludeBlocks[] = "required-checkbox-2";
            }
            if ($this->module->config->move_login_to_account == 1) {
                $excludeBlocks[] = "login-form";
            }

            if ($this->context->customer->isLogged()) {
                $excludeBlocks[] = "login-form";

                // If customer is already logged-in AND this is first time he visited checkout form with his session
                // let's reset his addresses to ones used with last order (if any)
                if ($this->context->cart->id != $this->context->cookie->addreses_reset_at_cart_id) {
                    $lastOrderAddresses = $this->getCustomerLastUsedAddresses($this->getAllCustomerUsedAddresses());
                    if (count($lastOrderAddresses)) {
                        $this->context->cart->id_address_invoice  = $lastOrderAddresses['id_address_invoice'];
                        $this->context->cart->id_address_delivery = $lastOrderAddresses['id_address_delivery'];
                        $this->context->cart->update();
                        $this->context->cart->setNoMultishipping();
                        $this->updateAddressIdInDeliveryOptions();
                        $this->context->cookie->addreses_reset_at_cart_id = $this->context->cart->id;
                    }
                }
            }

            $conditionsToApproveFinder = new ConditionsToApproveFinder(
                $this->context,
                $this->getTranslator()
            );

            $conditionsToApprove = $conditionsToApproveFinder->getConditionsToApproveForTemplate();

            $this->context->smarty->assign($this->getCheckoutFields());

            // disable entirely customer fields blocks, if their content will be empty
            // this is just to fix visual issue, so that no block container is rendered in front.tpl
            $separateModuleFields = $this->context->smarty->getTemplateVars('separateModuleFields');
            if (!in_array('ps_emailsubscription_newsletter', array_keys($separateModuleFields))) {
                $excludeBlocks[] = 'newsletter';
            }
            if (!in_array('psgdpr_psgdpr', array_keys($separateModuleFields))) {
                $excludeBlocks[] = 'psgdpr';
            }
            if (!in_array('ps_dataprivacy_customer_privacy', array_keys($separateModuleFields))) {
                $excludeBlocks[] = 'data-privacy';
            }

            $ps_config = array();
            foreach (array('PS_GUEST_CHECKOUT_ENABLED') as $configName) {
                $ps_config[$configName] = Configuration::get($configName);
            }

            $force_email_overlay = false;
            if ($this->module->config->force_email_overlay && !$this->context->customer->isLogged() && !$this->context->customer->id && Configuration::get('PS_GUEST_CHECKOUT_ENABLED')) {
                $force_email_overlay = true;
            }

            // myparcel loads iframe picker, and thus markup is always same even though, we need to change iframe content always
            $forceRefreshShipping = Module::isInstalled('myparcel');

            // Logged-in customer groups
            $customer_groups     = $this->context->customer->getGroups();
            $customer_groups_cls = "gg";
            if (is_array($customer_groups)) {
                $customer_groups_cls = "g" . join('g', $customer_groups) . "g";
            }

            $page                                                           = $this->context->smarty->tpl_vars['page']->value; // parent::getTemplateVarPage();
            $page["page_name"]                                              = "checkout";
            $page["body_classes"]["logged-in"]                              = $this->context->customer->isLogged();
            $page["body_classes"]["mark-required"]                          = $this->module->config->mark_required_fields;
            $page["body_classes"][$this->module->config->checkout_substyle] = true;
            $page["body_classes"]["using-material-icons"]                   = $this->module->config->using_material_icons;
            $page["body_classes"]["font-" . $this->module->config->font]    = true;
            $page["body_classes"]["social-btn-style-"
            . $this->module->config->social_login_btn_style]                = true;
            $page["body_classes"]["is-empty-cart"]                          = (0 == $this->context->cart->nbProducts());
            $page["body_classes"]["is-virtual-cart"]                        = $this->context->cart->isVirtualCart();
            $page["body_classes"]["is-test-mode"]                           = $this->module->config->test_mode;
            $page["body_classes"]["compact-cart"]                           = $this->module->config->compact_cart;
            // Force email overlay can work only when guest checkout is enabled - because we need to have silent registration working
            $page["body_classes"]["force-email-overlay"]       = $force_email_overlay && Configuration::get('PS_GUEST_CHECKOUT_ENABLED');
            $page["body_classes"]["separate-payment"]          = $this->module->config->separate_payment;
            $page["body_classes"]["amazonpay-ongoing-session"] = $this->amazonpayOngoingSession;
            $page["body_classes"][$customer_groups_cls]        = true;
            $page["body_classes"]["is-invoice-address-primary"]= (Config::ADDRESS_TYPE_INVOICE === $this->module->config->primary_address);
            $page["body_classes"]["is-checkout-steps"]         = $this->module->config->checkout_steps;
            $page["body_classes"]["collapse-shipping-methods"] = $this->module->config->collapse_shipping_methods;
            $page["body_classes"]["collapse-payment-methods"]  = $this->module->config->collapse_payment_methods;
            $page["body_classes"]["fetchifyuk-enabled"]        = Module::isEnabled('fetchifyuk'); // formerly craftyclicks

            if ((Configuration::get('PAYPAL_EXPRESS_CHECKOUT_SHORTCUT') || Configuration::get('PAYPAL_EXPRESS_CHECKOUT_SHORTCUT_CART')) && (isset($this->context->cookie->paypal_ecs) || isset($this->context->cookie->paypal_pSc))) {
                $page["body_classes"]["paypal-express-checkout-session"] = true;
            }
            $installedModules = array();
            foreach (array('mondialrelay', 'einvoicingprestalia') as $moduleName) {
                $installedModules[$moduleName] = Module::isInstalled($moduleName) && Module::isEnabled($moduleName);
            }

            $sendcloud_moduleName = 'sendcloud';
            $sendcloud_script     = '';
            if (Module::isInstalled($sendcloud_moduleName) && Module::isEnabled($sendcloud_moduleName)) {
                $sendcloud_moduleInstance = Module::getInstanceByName($sendcloud_moduleName);
                if (isset($sendcloud_moduleInstance->connector) && $sendcloud_moduleInstance->connector) {
                    $sendcloud_script = $sendcloud_moduleInstance->connector->getServicePointScript();
                }
            }

            // for certain (mostly shipping) modules, create address as the very first step, when visiting checkout form
            // using default country; but only when address is not yet created!
            if (!$this->context->cart->id_address_invoice) {

                $forceAddressCreation = false;
                if ($this->module->config->initialize_address) {
                    $forceAddressCreation = true;
                } else {
                    $needAddressModules = array('paypal', 'sendcloud', 'mondialrelay', 'omniva', 'multisafepay');
                    foreach ($needAddressModules as $moduleName) {
                        if (Module::isInstalled($moduleName) && Module::isEnabled($moduleName)) {
                            $forceAddressCreation = true;
                            break;
                        }
                    }
                }

                if ($forceAddressCreation) {
                    $this->modifyInvoiceAddress(
                        array('token' => Tools::getToken(true, $this->context)),
                        false
                    );
                    $this->unifyAddresses(true, false);
                }
            }

            $this->context->smarty->assign(array(
                "blocksLayout"               => $blocksLayout,
                "excludeBlocks"              => $excludeBlocks,
                "config"                     => $this->module->config,
                "businessFieldsList"         => $this->getBusinessFields(),
                "businessDisabledFieldsList" => $this->getBusinessDisabledFields(),
                "privateFieldsList"          => $this->getPrivateFields(),
                "ps_config"                  => $ps_config,
                "debugJsController"          => $this->module->debugJsController,
                'conditions_to_approve'      => $conditionsToApprove,

                "loadEmpty"                          => true,// Do not "fill" blocks with content, load only container
                "page"                               => $page,
                "hook_displayPersonalInformationTop" => Hook::exec('displayPersonalInformationTop'),
                "hook_create_account_form"           => Hook::exec('displayCustomerAccountForm'),
                "opc_form_checkboxes"                => json_decode($this->context->cookie->opc_form_checkboxes, true),
                'delivery_message'                   => (version_compare(_PS_VERSION_,
                        '1.7.3') >= 0) ? html_entity_decode($this->getCheckoutSession()->getMessage()) : '',
                'isEmptyCart'                        => (0 == $this->context->cart->nbProducts()),
                'forceRefreshShipping'               => $forceRefreshShipping,
                'installedModules'                   => $installedModules,
                'separatePaymentKeyName'             => Config::SEPARATE_PAYMENT_KEY_NAME,
                'sendcloud_script'                   => $sendcloud_script
            ));

            $amazonPayCheckoutSessionClass = "AmazonPayCheckoutSession";
            if (class_exists($amazonPayCheckoutSessionClass) &&
                method_exists($amazonPayCheckoutSessionClass,'checkStatus') &&
                method_exists($amazonPayCheckoutSessionClass,'getAmazonPayCheckoutSessionId'))
            {
                $amazonPayCheckoutSession = new $amazonPayCheckoutSessionClass(false);

                if ($amazonPayCheckoutSession->checkStatus()) {
                    $sessionId = $amazonPayCheckoutSession->getAmazonPayCheckoutSessionId();
                    $this->context->smarty->assign("tc_amazonPaySessionId", $sessionId);
                }
            }

            $metas = Meta::getMetaByPage('order', $this->context->language->id);
            if (isset($metas) && is_array($metas) && count($metas) && isset($metas['title'])) {
                if (isset($this->context->smarty->tpl_vars) && isset($this->context->smarty->tpl_vars['page'])) {
                    $page                         = $this->context->smarty->tpl_vars['page'];
                    $page->value['meta']['title'] = $metas['title'];
                }
            }

            $this->setTemplate('module:' . $this->name . '/views/templates/front/front.tpl');
        }
    }

    // PS copied method
    protected function getCheckoutSession()
    {
        $deliveryOptionsFinder = new DeliveryOptionsFinder(
            $this->context,
            $this->getTranslator(),
            $this->objectPresenter,
            new PriceFormatter()
        );

        $session = new CheckoutSession(
            $this->context,
            $deliveryOptionsFinder
        );

        return $session;
    }


    // PS copied method
    private function getGiftCostForLabel($giftCost, $includeTaxes, $displayTaxLabel)
    {
        if ($giftCost != 0) {
            $taxLabel       = '';
            $priceFormatter = new PriceFormatter();

            if ($includeTaxes && $displayTaxLabel) {
                $taxLabel .= ' tax incl.';
            } elseif ($includeTaxes) {
                $taxLabel .= ' tax excl.';
            }

            return $this->getTranslator()->trans(
                ' (additional cost of %giftcost% %taxlabel%)',
                array(
                    '%giftcost%' => $priceFormatter->convertAndFormat($giftCost),
                    '%taxlabel%' => $taxLabel,
                ),
                'Shop.Theme.Checkout'
            );
        }

        return '';
    }

    private function updateAddressIdInDeliveryOptions()
    {
        if ($this->context->cart->id_address_delivery > 0) {
            if (version_compare(_PS_VERSION_, '1.7.3') >= 0) {
                $actualDeliveryOptions = json_decode($this->context->cart->delivery_option, true);
            } else {
                $actualDeliveryOptions = Tools::unSerialize($this->context->cart->delivery_option);
            }

            if (false !== $actualDeliveryOptions && null !== $actualDeliveryOptions) {
                $newDeliveryOptions = array();
                foreach ($actualDeliveryOptions as $dlvOption) {
                    $newDeliveryOptions[$this->context->cart->id_address_delivery] = $dlvOption;
                }
                if (version_compare(_PS_VERSION_, '1.7.3') >= 0) {
                    $this->context->cart->delivery_option = json_encode($newDeliveryOptions);
                } else {
                    $this->context->cart->delivery_option = serialize($newDeliveryOptions);
                }
            }
            $this->context->cart->autosetProductAddress();
        }
    }

    // PS copied method (partial)
    public function getShippingOptions()
    {

        $recyclablePackAllowed = (bool)Configuration::get('PS_RECYCLABLE_PACK');
        $giftAllowed           = (bool)Configuration::get('PS_GIFT_WRAPPING');


        //if ((int)$this->context->cart->id_customer) {
        $includeTaxes = (!Product::getTaxCalculationMethod((int)$this->context->cart->id_customer)
            && (int)Configuration::get('PS_TAX'));
        //} else {
        //    $includeTaxes = PS_TAX_EXC;
        //}


        $displayTaxLabels = (Configuration::get('PS_TAX') && !Configuration::get('AEUC_LABEL_TAX_INC_EXC'));
        $giftCost         = $this->context->cart->getGiftWrappingPrice($includeTaxes);

        $this->context->cart->save();
        $this->context->cart->setNoMultishipping();
        $this->updateAddressIdInDeliveryOptions();

        $self = $this;
        $deliveryOptions = $this->wrapInNonZeroCustomerIdForVATDeduction(function () use(&$self) {
            return $self->getCheckoutSession()->getDeliveryOptions();
        });

        return
            array(
                'hookDisplayBeforeCarrier' => Hook::exec('displayBeforeCarrier',
                    array('cart' => $this->getCheckoutSession()->getCart())),
                'hookDisplayAfterCarrier'  => Hook::exec('displayAfterCarrier',
                    array('cart' => $this->getCheckoutSession()->getCart())),
                'id_address'               => $this->getCheckoutSession()->getIdAddressDelivery(),
                'delivery_options'         => $deliveryOptions,
                'delivery_option'          => $this->getCheckoutSession()->getSelectedDeliveryOption(),
                'recyclable'               => $this->getCheckoutSession()->isRecyclable(),
                'recyclablePackAllowed'    => $recyclablePackAllowed,
                'delivery_message'         => (version_compare(_PS_VERSION_,
                        '1.7.3') >= 0) ? $this->getCheckoutSession()->getMessage() : '',
                'gift'                     => array(
                    'allowed' => $giftAllowed,
                    'isGift'  => $this->getCheckoutSession()->getGift()['isGift'],
                    'label'   => $this->getTranslator()->trans(
                        'I would like my order to be gift wrapped %cost%',
                        array('%cost%' => $this->getGiftCostForLabel($giftCost, $includeTaxes, $displayTaxLabels)),
                        'Shop.Theme.Checkout'
                    ),
                    'message' => $this->getCheckoutSession()->getGift()['message'],
                ),
            );
    }

//    public function selectPaymentOption(array $requestParams = array())
//    {
//        if (isset($requestParams['select_payment_option'])) {
//            $this->selected_payment_option = $requestParams['select_payment_option'];
//        }
//
//        $this->setTitle(
//            $this->getTranslator()->trans(
//                'Payment',
//                array(),
//                'Shop.Theme.Checkout'
//            )
//        );
//    }

    public function getPaymentOptions()
    {
        $isFree               = 0 == (float)$this->getCheckoutSession()->getCart()->getOrderTotal(true, Cart::BOTH);
        $paymentOptionsFinder = new PaymentOptionsFinder();
        $paymentOptions       = $paymentOptionsFinder->present($isFree);

        if ($this->amazonpayOngoingSession &&
            !empty($paymentOptions) && array_key_exists("amazonpay", $paymentOptions)) {
            // remove other options from a list of payment methods, if we're in the middle of session
            $amazonPayOption             = $paymentOptions["amazonpay"];
            $paymentOptions              = array();
            $paymentOptions["amazonpay"] = $amazonPayOption;
        }

        return array(
            'is_free'                 => $isFree,
            'payment_options'         => $paymentOptions,
            'selected_payment_option' => $this->selected_payment_option,
            //'selected_delivery_option' => $selectedDeliveryOption,
            'show_final_summary'      => Configuration::get('PS_FINAL_SUMMARY_ENABLED'),
        );
    }

    public function ajaxCall()
    {
        // @error_reporting(E_ALL & ~E_NOTICE);
        // multisafepay fix BEGIN
        // multisafepay.php:hasSetApiKey(), loads multisafepay.sdk_service, but the $kernel is not started in this ajax request yet
        // Commented out due to validator requirements (no globals), uncomment for multisafepay support
//        global $kernel;
//        if(!$kernel){
//            require_once _PS_ROOT_DIR_.'/app/AppKernel.php';
//            $kernel = new \AppKernel('prod', false);
//            $kernel->boot();
//        }
        // multisafepay fix END

        if ($this->module->debug) {
            $this->module->logDebug("[AJAX*Start] " . Tools::getValue('action'));
        }

        $action = Tools::ucfirst(Tools::getValue('action'));

        if (!empty($action) && method_exists($this, 'ajax' . $action)) {
            $this->context->smarty->assign("tc_config", $this->module->config);
            $result = $this->{'ajax' . $action}();
        } else {
            $result = (array('error' => 'Ajax parameter used, but action \'' . Tools::getValue('action') . '\' is not defined'));
        }

        if ($this->module->debug) {
            $this->module->logDebug("[AJAX*End] " . Tools::getValue('action'));
        }

        // ob_clean caused problems on certain PHP configuration
        // ob_clean();
        // header('Content-Type: application/json');

        die(json_encode($result));
    }

    public function updateDelivery(array $requestParams = array())
    {
        if (isset($requestParams['delivery_option'])) {
            $opc_form_radios                    = json_decode($this->context->cookie->opc_form_radios, true);
            $opc_form_radios['delivery_option'] = $requestParams['delivery_option'];

            $this->context->cookie->opc_form_radios = json_encode($opc_form_radios);
        }

        if (isset($requestParams['delivery_option'])) {
            @$this->getCheckoutSession()->setDeliveryOption(
                $requestParams['delivery_option']
            );
            @$this->getCheckoutSession()->setRecyclable(
                isset($requestParams['recyclable']) ? $requestParams['recyclable'] : false
            );
            @$this->getCheckoutSession()->setGift(
                isset($requestParams['gift']) ? $requestParams['gift'] : false,
                (isset($requestParams['gift']) && isset($requestParams['gift_message'])) ? $requestParams['gift_message'] : ''
            );
        }

        if (isset($requestParams['delivery_message'])) {
            $this->getCheckoutSession()->setMessage($requestParams['delivery_message']);
        }

        Hook::exec('actionCarrierProcess', array('cart' => $this->getCheckoutSession()->getCart()));
    }

    private function ajaxSelectDeliveryOption()
    {

        $this->updateDelivery(Tools::getAllValues());

        return $this->getDynamicCheckoutBlocks();

    }

    private function ajaxSelectPaymentOption()
    {
        // selects payment option here (may go to cookie?), but most importantly, set fee
        // if fee value has been sent from client

        $result = array();

        $paymentFee = Tools::getValue('payment_fee');
        $result     = $this->getCartSummaryBlock($paymentFee);

        return $result;

    }

    private function ajaxSetDeliveryMessage()
    {
        if (Tools::getIsset('delivery_message')) {
            $this->getCheckoutSession()->setMessage(Tools::getValue('delivery_message'));
        }
        return array('result' => 1);
    }

    private function ajaxSocialLoginFacebook()
    {
        $access_token = Tools::getValue("access_token");

        $social = new SocialLogin(SocialLogin::FACEBOOK,
            $this->module->config->social_login_fb_app_id,
            $this->module->config->social_login_fb_app_secret);

        list($email, $firstname, $lastname) = $social->validateFacebookAccessToken($access_token);

        $errors = $this->loginOrRegister($email, $firstname, $lastname);

        return array('errors' => $errors, 'hasErrors' => !empty($errors), 'email' => $email);
    }

    private function ajaxSocialLoginGoogle()
    {
        $id_token  = Tools::getValue("id_token");
        $firstname = Tools::getValue("firstname");
        $lastname  = Tools::getValue("lastname");

        $social = new SocialLogin(SocialLogin::GOOGLE,
            $this->module->config->social_login_google_client_id,
            $this->module->config->social_login_google_client_secret);

        $email = $social->validateGoogleIdToken($id_token);

        $errors = $this->loginOrRegister($email, $firstname, $lastname);

        return array('errors' => $errors, 'hasErrors' => !empty($errors), 'email' => $email);
    }

    private function loginOrRegister($email, $firstname, $lastname)
    {
        if (!$email || !Validate::isEmail($email)) {
            return $this->translator->trans('Invalid email address.', array(), 'Shop.Notifications.Error');
        }
        $customer       = new Customer();
        $authentication = $customer->getByEmail(
            $email
        );

        $errors = array();

        if (isset($authentication->active) && !$authentication->active) {
            $errors[] = $this->translator->trans('Your account isn\'t available at this time, please contact us',
                array(),
                'Shop.Notifications.Error');
        } elseif (!$authentication || !$customer->id || $customer->is_guest) {
            // Create new account
            //$this->silentRegistration($email);

            // Make sure customer's first and lastname are valid, as the 'login' is automated
            if (Tools::strlen($firstname) < 1) {
                $firstname = 'a';
            }
            if (Tools::strlen($lastname) < 1) {
                $lastname = 'a';
            }

            $ret = $this->modifyAccount(
                array(
                    'email'      => $email,
                    'password'   => sha1(time() . uniqid(rand(), true)),
                    'newsletter' => $this->module->config->newsletter_checked,
                    'psgdpr'     => true,
                    'customer_privacy' => true,
                    'required-checkbox-1' => true,
                    'required-checkbox-2' => true
                ), $firstname, $lastname, false, false);

            // print_r($ret);

        } else {

            $this->context->updateCustomer($authentication);

            // Login information have changed, so we check if the cart rules still apply
            CartRule::autoRemoveFromCart($this->context);
            CartRule::autoAddToCart($this->context);
        }
    }

    // "sanitize" request data before posting to backend; make sure required fields are all set
    private function prepareAddressData($existingAddressId, $formData, $requiredFields, $previousErrors = array())
    {
        $addressData = $formData;

        foreach ($requiredFields as $fieldName) {
            if (!isset($addressData[$fieldName]) || empty($addressData[$fieldName])
                || (isset($previousErrors[$fieldName]) && count($previousErrors[$fieldName]))
            ) {
                if (in_array($fieldName, array('dni'))) {
                    // for 'dni' simulated value is empty string (up to PS 1.7.5); since 1.7.6 we need to set to: '0', due to
                    // added method Address::validateField, where need_identification_number is checked for non-empty
                    $addressData[$fieldName] = '0';
                } else {
                    $addressData[$fieldName] = ' '; // simulated value
                }
            }
        }
        // handle id_state specifically, as it might be not sent by jQuery.serialize() when empty
        if (!key_exists('id_state', $addressData)) {
            $addressData['id_state'] = 0;
        }

        // PS core requires at least one phone when PS_ONE_PHONE_AT_LEAST is set.
        // When phone is optional in TheCheckout and the customer left both fields empty,
        // supply a minimal placeholder so the Address::save() does not throw.
        // '00' is truthy in PHP and passes PS Validate::isPhoneNumber().
        if (Configuration::get('PS_ONE_PHONE_AT_LEAST')) {
            $hasPhone       = isset($addressData['phone'])        && '' !== trim($addressData['phone']);
            $hasPhoneMobile = isset($addressData['phone_mobile']) && '' !== trim($addressData['phone_mobile']);
            if (!$hasPhone && !$hasPhoneMobile) {
                $addressData['phone'] = '00';
            }
        }

        if ($existingAddressId > 0) {
            $addressData['id_address'] = $existingAddressId;
        }
        return $addressData;
    }

    private function getCustomerSignInArea()
    {
        if ($this->context->customer->id == 0 || $this->context->customer->isGuest()) {
            return array();
        }

        $this->parentInitContent();
        $customerSignInArea = array();
        // Re-render header (Sign-in/out and customer name)
        if ($moduleInstance = Module::getInstanceByName('ps_customersignin')) {
            if ($moduleInstance->active && $moduleInstance instanceof WidgetInterface) {
                $customerSignInArea['displayNav2'] = $moduleInstance->renderWidget('displayNav2', array());
            }
        }

        if (!isset($customerSignInArea['displayNav2']) && $moduleInstance = Module::getInstanceByName('stcustomersignin')) {
            if ($moduleInstance->active && $moduleInstance instanceof WidgetInterface) {
                $customerSignInArea['displayNav2'] = $moduleInstance->renderWidget('displayNav2', array());
            }
        }

        $customerForTpl = array_merge($this->objectPresenter->present($this->context->customer),
            array('is_logged' => $this->context->customer->logged));
        $this->context->smarty->assign('s_customer', $customerForTpl);

        $customerSignInArea['staticCustomerInfo'] = $this->context->smarty->fetch(
            'module:' . $this->name . '/views/templates/front/_partials/static-customer-info.tpl');

        return array('customerSignInArea' => $customerSignInArea);
    }

    private function getShippingOptionsBlock()
    {
        $this->parentInitContent();

        // setDeliveryOption() call would flush delivery_options cache (used in cart->getDeliveryOption())
        // Prior to this call, TheCheckout does not set cache, but other modules possibly can, causing
        // delivery options not matching id_address selected on checkout = no carriers available
        if (version_compare(_PS_VERSION_, '1.7.3') >= 0) {
            $actualDeliveryOptions = json_decode($this->context->cart->delivery_option, true);
        } else {
            $actualDeliveryOptions = Tools::unSerialize($this->context->cart->delivery_option);
        }
        if (!empty($actualDeliveryOptions)) {
            @$this->getCheckoutSession()->setDeliveryOption(
                array($this->context->cart->id_address_delivery => reset($actualDeliveryOptions))
            );
        }

        $shippingOptions         = $this->getShippingOptions();
        $externalShippingModules = array();
        foreach ($shippingOptions["delivery_options"] as $optionId => $options) {
            if (/*"1" === $options['is_module'] && */"" !== $options['external_module_name']) {
                $externalShippingModules[$options['external_module_name']][] = $optionId;
            }
        }

        // add dateofdelivery module name into external shipping modules list, so that its parser is loaded at JS level
        $dateofdelivery_moduleName = 'dateofdelivery';
        if (Module::isInstalled($dateofdelivery_moduleName) && Module::isEnabled($dateofdelivery_moduleName)) {
            $externalShippingModules[$dateofdelivery_moduleName] = 0;
        }

        $this->getCheckoutSession()->setDeliveryOption(
            array($this->context->cart->id_address_delivery => $shippingOptions["delivery_option"])
        );

        $shippingCountryName = '';
        if ($this->module->config->show_shipping_country_in_carriers) {
            $shippingAddressNotice = array();
            $tmpDeliveryAddress    = new Address($this->context->cart->id_address_delivery);
            if (isset($tmpDeliveryAddress->id_country)) {
                $tmpIdCountry = (int)$tmpDeliveryAddress->id_country;
            } else {
                $tmpIdCountry = Configuration::get('PS_COUNTRY_DEFAULT');
            }

            // localized country name
            $tmpCountry = new Country($tmpIdCountry, $this->context->language->id);
            if (isset($tmpCountry) && isset($tmpCountry->name)) {
                $shippingCountryName     = $tmpCountry->name;
                $shippingAddressNotice[] = $shippingCountryName;
            }

            $shipping_required_fields = explode(',', $this->module->config->shipping_required_fields);
            if (count($shipping_required_fields)) {
                $cart_delivery_address_id = $this->context->cart->id_address_delivery;
                if ($cart_delivery_address_id) {
                    $cart_delivery_address = new Address($cart_delivery_address_id);
                    foreach ($shipping_required_fields as $shipping_required_field) {
                        $req_field = trim($shipping_required_field);
                        if (
                            isset($cart_delivery_address->$req_field)
                            && (bool)trim($cart_delivery_address->$req_field)
                        ) {
                            // Special treatment for id_state and postcode (do not have to be required for all countries)
                            if ($cart_delivery_address->id_country && in_array($req_field, array('id_state'))) {
                                $country = new Country($cart_delivery_address->id_country);
                                // Localized state name
                                if ('id_state' == $req_field && $country->contains_states) {
                                    $state                   = new State($cart_delivery_address->id_state,
                                        $this->context->language->id);
                                    $shippingAddressNotice[] = $state->name;
                                }
                            } else {
                                $shippingAddressNotice[] = trim($cart_delivery_address->$req_field);
                            }
                        }
                    }
                }
            }

            $this->context->smarty->assign('shippingAddressNotice', $shippingAddressNotice);

        }

        $customerSelectedDeliveryOption = null;
        $opc_form_radios                = json_decode($this->context->cookie->opc_form_radios, true);
        if (isset($opc_form_radios['delivery_option'])) {
            $this->context->smarty->assign('customerSelectedDeliveryOption',
                reset($opc_form_radios['delivery_option']));
        }
        $this->context->smarty->assign('forceToChooseCarrier',
            (bool)$this->module->config->force_customer_to_choose_carrier);

        $this->context->smarty->assign($shippingOptions);
        $shippingBlock = $this->context->smarty->fetch('module:' . $this->name . '/views/templates/front/blocks/shipping.tpl');


        return array(
            'externalShippingModules' => $externalShippingModules,
            'shippingBlock'           => $shippingBlock,
            'shippingBlockChecksum'   => md5($shippingBlock),
            'shippingCountry'         => $shippingCountryName,
            'totalWeight'             => $this->context->cart->getTotalWeight(),
            'customerDeliveryOption'  => $customerSelectedDeliveryOption
        );
    }

//    public function isZeroDecimalCurrency($currency)
//    {
//        // @see: https://support.stripe.com/questions/which-zero-decimal-currencies-does-stripe-support
//        $zeroDecimalCurrencies = array(
//            'BIF',
//            'CLP',
//            'DJF',
//            'GNF',
//            'JPY',
//            'KMF',
//            'KRW',
//            'MGA',
//            'PYG',
//            'RWF',
//            'UGX',
//            'VND',
//            'VUV',
//            'XAF',
//            'XOF',
//            'XPF'
//        );
//        return in_array($currency, $zeroDecimalCurrencies);
//    }

    private function getPaymentOptionsBlock()
    {
        if ($this->module->config->separate_payment) {
            return array(
                'paymentBlock'         => "",
                'paymentBlockChecksum' => "none",
                'paymentMethodsList'   => array()
            );
        }


        $this->parentInitContent();
        if (Configuration::get('PS_FINAL_SUMMARY_ENABLED')) {
            // if $this->context->customer->id and addresses assigned.. only then continue
            //$this->parentInitContent();
//            $cart = $this->cart_presenter->present(
//                $this->context->cart
//            );
//
//
//            $this->context->smarty->assign(array('cart' => $cart));
//            $this->context->smarty->assign(array('customer' => $this->getTemplateVarCustomer(2)));
        }

        $paymentMethods = $this->getPaymentOptions();

        $this->context->smarty->assign($paymentMethods);

        // // Payment data, used by Stripe payment for live refresh (and possibly other modules in future)

        // $currency = $this->context->currency->iso_code; 
        // $orderTotal = $this->context->cart->getOrderTotal();
        // $stripeAmount = Tools::ps_round($orderTotal, 2);
        // $stripeAmount = $this->isZeroDecimalCurrency($currency) ? $stripeAmount : $stripeAmount * 100;

        // $paymentData = array(
        //     'order_total'       => $orderTotal,
        //     'stripe_amount'     => $stripeAmount,
        //     'stripe_currency'   => Tools::strtolower($currency),
        //     'stripe_fullname'   => $this->context->customer->firstname . ' ' . $this->context->customer->lastname,
        //     'stripe_address_country_code' => Country::getIsoById($this->context->country->id),
        //     'stripe_email'      => $this->context->customer->email,
        // );

        // We need to delivery conditions to approve status (ticket by customer earlier in session)
        $this->context->smarty->assign(array(
                'opc_form_checkboxes' => json_decode($this->context->cookie->opc_form_checkboxes,
                    true),
                //'js_custom_vars' => Media::getJsDef() // moved to getCartSummaryBlock()
                //'payment_data'          => $paymentData,
            )
        );

        $paymentBlock =
            $this->context->smarty->fetch('module:' . $this->name . '/views/templates/front/blocks/payment.tpl');


        return array(

            'paymentBlock'         => $paymentBlock,
            'paymentBlockChecksum' => md5($paymentBlock),
            'paymentMethodsList'   => array_keys($paymentMethods['payment_options'])
        );
    }

    private function getWaitForFields($required_fields, $cart_delivery_address_id)
    {
        $shipping_block_wait_for_address = array();
        $shipping_required_fields        = preg_split('/,/', trim($required_fields), -1, PREG_SPLIT_NO_EMPTY);
        if (count($shipping_required_fields)) {
            foreach ($shipping_required_fields as $shipping_required_field) {
                $req_field = trim($shipping_required_field);

                // Address already set, let's use real country and already set fields
                if ($cart_delivery_address_id) {
                    $cart_delivery_address = new Address($cart_delivery_address_id);
                    $country               = new Country($cart_delivery_address->id_country);
                } else {
                    $country = new Country(Configuration::get('PS_COUNTRY_DEFAULT'));
                }

                $shall_require_this_field = false;
                if ('id_state' == $req_field) {
                    if ($country->contains_states) {
                        $shall_require_this_field = true;
                    }
                } elseif ('postcode' == $req_field) {
                    if ($country->need_zip_code) {
                        $shall_require_this_field = true;
                    }
                } else {
                    $shall_require_this_field = true;
                }

                if ('email' == $req_field && isset($this->context->customer)) {
                    // Special treatment for email - which is not address fields, but can be also used in 'wait for' condition
                    $field_not_set = !isset($this->context->customer->$req_field) || !(bool)trim($this->context->customer->$req_field);;
                } else {
                    $field_not_set = !isset($cart_delivery_address->$req_field) || !(bool)trim($cart_delivery_address->$req_field);
                }


                if ($shall_require_this_field && $field_not_set) {
                    $shipping_block_wait_for_address[$req_field] = $this->getFieldLabel($req_field);
                }
            }
        }
        return $shipping_block_wait_for_address;
    }

    private function getDynamicCheckoutBlocks()
    {
        if (!$this->context->cart->nbProducts()) {
            return array('emptyCart' => true);
        }

        // There are 2 mechanisms to block shipping address visibility.
        // One is 'force country selection' - which un-selects country on checkout and let customer to choose it
        // and only after then displays shipping methods.
        // Second is 'Shipping required fields' - list of fields that must be set in order to show shipping methods
        $shipping_block_wait_for_address = $this->getWaitForFields(
            $this->module->config->shipping_required_fields,
            $this->context->cart->id_address_delivery
        );

        // Similar approach with payment block
        $payment_block_wait_for_address = $this->getWaitForFields(
            $this->module->config->payment_required_fields,
            $this->context->cart->id_address_delivery
        );

        $this->context->smarty->assign(
            array(
                'shipping_block_wait_for_address'            => $shipping_block_wait_for_address,
                'payment_block_wait_for_address'             => $payment_block_wait_for_address,
                'shipping_payment_blocks_wait_for_selection' =>
                    $this->module->config->force_customer_to_choose_country && !$this->context->cart->id_address_delivery,
                'force_email_wait_for_enter'                 =>
                    $this->module->config->force_email_overlay && !$this->context->customer->isLogged() && !$this->context->customer->id && Configuration::get('PS_GUEST_CHECKOUT_ENABLED'),
                'wait_for_account'                           =>
                    $this->module->config->show_button_save_personal_info && !$this->context->customer->isLogged() && !$this->context->customer->id,
            )
        );

        return array_merge(
            array(
                'triggerElementName' => Tools::getValue('trigger')
            ),
            $this->getShippingOptionsBlock(),
            $this->getPaymentOptionsBlock(),
            $this->getCartSummaryBlock()
        );
    }

    private function ajaxGetShippingAndPaymentBlocks()
    {
        return $this->getDynamicCheckoutBlocks();
    }

    protected function makeAddressPersister()
    {
        return new CheckoutCustomerAddressPersister(
            $this->context->customer,
            $this->context->cart,
            Tools::getToken(true, $this->context)
        );
    }

    private function getTransientAddressByCartId($cart_id)
    {
        $query = new DbQuery();
        $query->select('id_address');
        $query->from('address');
        $query->where('alias = \'opc_' . (int)$cart_id . '\'');
        $query->where('deleted = 0');
        $query->where('id_address NOT IN(\'' . (int)$this->context->cart->id_address_delivery . '\', \'' . (int)$this->context->cart->id_address_invoice . '\')');
        $query->orderBy('id_address DESC');

        return Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue($query);
    }

    private function getAllCustomerUsedAddresses()
    {
        $result = array();
        if ($this->context->customer->isLogged()) {
            $query = new DbQuery();
            $query->select('id_address_invoice, id_address_delivery');
            $query->from('orders');
            $query->where('id_customer = \'' . (int)$this->context->customer->id . '\'');

            $query->orderBy('id_order DESC');
            $result = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($query);
        }
        return $result;
    }

    private function getCustomerLastUsedAddresses($allOrdersAddresses)
    {
        $lastOrderAddresses = array();

        if (count($allOrdersAddresses)) {
            $lastOrderAddresses = $allOrdersAddresses[0];

            // What if address IDs used with last order are already deleted? Handle that here:
            if (count($lastOrderAddresses)) {
                if ($lastOrderAddresses['id_address_invoice'] == $lastOrderAddresses['id_address_delivery']) {
                    $invActive = Customer::customerHasAddress((int)$this->context->customer->id,
                        $lastOrderAddresses['id_address_invoice']);
                    if (!$invActive) {
                        $lastOrderAddresses = array();
                    }
                } else {
                    $invActive = Customer::customerHasAddress((int)$this->context->customer->id,
                        $lastOrderAddresses['id_address_invoice']);
                    $dlvActive = Customer::customerHasAddress((int)$this->context->customer->id,
                        $lastOrderAddresses['id_address_delivery']);
                    if (!$invActive && !$dlvActive) {
                        $lastOrderAddresses = array();
                    } elseif ($invActive && !$dlvActive) {
                        $lastOrderAddresses['id_address_delivery'] = $lastOrderAddresses['id_address_invoice'];
                    } elseif (!$invActive && $dlvActive) {
                        $lastOrderAddresses['id_address_invoice'] = $lastOrderAddresses['id_address_delivery'];
                    }
                }
            }//if (count($result))
        }
        // Uncomment to reset customer's last shipping address to be equal to invoice
        // $lastOrderAddresses['id_address_delivery'] = $lastOrderAddresses['id_address_invoice'];
        return $lastOrderAddresses;
    }

    private function modifyAddress($addressType, $formData, $shallCreateNewAddress, $finalConfirmation = false)
    {
        // firstly, let's disallow address modification, if country is not supplied and
        // 'force_customer_to_choose_country' is ON = we do not do any operations on addresses until we have country ID
        if (!isset($formData['id_country']) && $this->module->config->force_customer_to_choose_country) {
            return array(
                'errors'    => array('country_not_selected'),
                'hasErrors' => true
            );
        }

        $countryId = isset($formData['id_country']) ? (int)$formData['id_country'] : 0;
        if ($countryId > 0) {
            $country = new Country($countryId);
        } else {
            // No country selected yet; clone to avoid mutating the shared context object,
            // and disable zip-code format validation so we don't reject any entry while
            // the user is still filling in the form.
            $country = clone $this->context->country;
            $country->need_zip_code = false;
        }

        // Primary address can be updated freely; secondary only if addresses are not same
        // Note: For now (Nov.2018), isPrimaryAddress won't be used and we'll treat both addresses separately
        // although, there's slight difference, and when shipping address is first, in cart both addresses
        // are set to non-zero once the shipping is updated; whilst when billing address is primary, delivery
        // address remain zero up until it's updated.

        /*
        $primaryAddress = $this->module->config->primary_address;
        // if secondary address is being updated, and ID=primary address id, create new one
        $isPrimaryAddress = strpos($addressType, $primaryAddress) > -1;
        */

        $isAddressTypeInvoice = strpos($addressType, 'invoice') > -1;

        // required fields pushed to validator
        // Invoice and Delivery address have separate treatment, just for the sake of hardcoded customization if necessary
        // -  isset($formData[$key]) means that we'll require fields only when they are sent from client (i.e. they are :visible)

        $fieldsShallBeRequiredCallback = function ($formData, $fieldName, $tcFieldOptions, $thisAddressCountry) {
            // when will be the field required?
            return (
                isset($formData[$fieldName])
                && ((true === $tcFieldOptions['required'] && true === $tcFieldOptions['visible'] && $fieldName != 'State:name')
                    || ($fieldName == 'dni' && $thisAddressCountry->need_identification_number && true === $tcFieldOptions['visible'])
                    || ($fieldName == 'postcode' && $thisAddressCountry->need_zip_code))
            );
        };

        if ($isAddressTypeInvoice) {
            $theCheckout_requiredFields = array_filter($this->module->config->invoice_fields,
                function ($var, $key) use ($formData, $country, $fieldsShallBeRequiredCallback) {
                    return $fieldsShallBeRequiredCallback($formData, $key, $var, $country);
                }, ARRAY_FILTER_USE_BOTH);
        } else {
            $theCheckout_requiredFields = array_filter($this->module->config->delivery_fields,
                function ($var, $key) use ($formData, $country, $fieldsShallBeRequiredCallback) {
                    return $fieldsShallBeRequiredCallback($formData, $key, $var, $country);
                }, ARRAY_FILTER_USE_BOTH);
        }

        // Just to satisfy PS core validation; simulate values if necessary
        $psCore_requiredFields = array_unique(array_merge(
            array('firstname', 'lastname', 'address1', 'city'),
            ($country->need_identification_number) ? array('dni') : array(),
            array()//(new Address())->getCachedFieldsRequiredDatabase() // Is it necessary? ObjectModel doesn't seem to care, probably these extra fields are enforced only on controller level
        ));

        // Push States/Regions to frontview
        $states = array();
        if ($country->contains_states) {
            $states           = State::getStatesByIdCountry($country->id, true);
//            usort($states, function ($a, $b) {
//                $ax = strtr($a['name'], 'Ñ', 'N');
//                $bx = strtr($b['name'], 'Ñ', 'N');
//                return strcmp($ax, $bx);
//            });
            $states_flattened = array_map(function ($val) {
                return $val['id_state'];
            }, $states);
        } else {
            // Reset state, so that zones are properly evaluated when switching from with_states country to no_states country
            unset($_POST['id_state']);
            unset($formData['id_state']);
        }

        // When switching country with states to another country with (different) states, let's re-set
        if (isset($formData['id_state']) && !in_array($formData['id_state'], $states_flattened)) {
            unset($_POST['id_state']);
            unset($formData['id_state']);
        }

        if (!isset($formData['postcode'])) {
            //$formData['postcode'] = '_DO_NOT_REQUIRE_';
            $country->need_zip_code = false;
        }

        // - If showing of call prefix is enabled and
        // - phone number does NOT include prefix and
        // - phone number is NOT empty => let's add the prefix to phone number:
        if ($this->module->config->show_call_prefix) {
            $callPrefix = '+' . $country->call_prefix;
            foreach (array('phone', 'phone_mobile') as $phone_field) {
                if (isset($formData[$phone_field]) && '' != trim($formData[$phone_field]) &&
                    !\module\thecheckout\TS_Functions::startsWith($formData[$phone_field], '+')) {
                    $formData[$phone_field] = $callPrefix . $formData[$phone_field];
                }
            }

        }

//        if (true || !isset($formData['dni'])) {
//            //$formData['postcode'] = '_DO_NOT_REQUIRE_';
//            $this->context->country->need_identification_number = false;
//        }

        $theCheckout_addressForm = new CheckoutAddressForm(
            $this->module,
            $this->context->smarty,
            $this->context->language,
            $this->getTranslator(),
            $this->makeAddressPersister(),
            new CheckoutAddressFormatter(
                $country,
                $this->getTranslator(),
                $this->availableCountries,
                array_keys($theCheckout_requiredFields)
            )
        );

        // We need to get validation errors, but also we need to save address despite that
        // Attempt to validate form data first:
        $theCheckout_addressForm->fillWith($formData);
        /*$validateAttempt = */
        $theCheckout_addressForm->validate();

        // regardless of result, we still need to simulate some required fields (psCore required and theCheckout required might differ)
        if ($shallCreateNewAddress) {

            // returns last address ID with alias "opc_CARTID"
            $existingAddressId = $this->getTransientAddressByCartId($this->context->cart->id);

            if (null == $existingAddressId) {
                $existingAddressId = 0;
            }
        } else {
            $existingAddressId = $isAddressTypeInvoice ? $this->context->cart->id_address_invoice : $this->context->cart->id_address_delivery;
        }

        $psCore_addressForm = new CheckoutAddressForm(
            $this->module,
            $this->context->smarty,
            $this->context->language,
            $this->getTranslator(),
            $this->makeAddressPersister(),
            new CheckoutAddressFormatter(
                $country,
                $this->getTranslator(),
                $this->availableCountries,
                array() // required fields; we don't want any validation troubles here
            )
        );

        // Really save address, with simulated values if necessary
        // if $existingAddressId > 0, we will be implicitly updating existing address
        // TODO?: handle case, when address is used in already confirmed order (some other, previous order)!
        $addressSaved = $psCore_addressForm->fillWith(
            $this->prepareAddressData($existingAddressId, $formData, $psCore_requiredFields)
        )->submit($finalConfirmation);


        $coreValidationErrors = $psCore_addressForm->getErrors();
        $coreHasErrors        = $psCore_addressForm->hasErrors();
//        if (isset($coreValidationErrors['general_error'])) {
//            // Italian DNI validation module triggers just 'general_error' on DNI field, so let's copy it to dni
//            $coreValidationErrors['dni'] = $coreValidationErrors['general_error'];
//        }

        // $psCore_addressForm shall not have errors, unless customer entered wrong values, which might block
        // further processing and address simulation, so we need to override those user-entered values.
        if ($psCore_addressForm->hasErrors()) {
            $addressSaved = $psCore_addressForm->fillWith(
                $this->prepareAddressData($existingAddressId, $formData, $psCore_requiredFields,
                    $coreValidationErrors)
            )->submit($finalConfirmation);
        }

        if ($addressSaved) {
            // store address-id
            $addressId = $psCore_addressForm->getAddress()->id;
            if ($isAddressTypeInvoice) {
                $this->context->cart->id_address_invoice = $addressId;
            } else {
                // restore previously selected carrier
                $this->context->cart->id_address_delivery = $addressId;
            }
            $this->context->cart->save();
            $this->context->cart->setNoMultishipping();

            // Update context's country ID, for correct payment methods view
            if (isset($this->context->cart->{Configuration::get('PS_TAX_ADDRESS_TYPE')}) && $this->context->cart->{Configuration::get('PS_TAX_ADDRESS_TYPE')}) {
                $infos                  = Address::getCountryAndState((int)$this->context->cart->{Configuration::get('PS_TAX_ADDRESS_TYPE')});
                $tax_country            = new Country((int)$infos['id_country']);
                $this->context->country = $tax_country;
            }
        }


        $addressFieldsConfig = $isAddressTypeInvoice ?
            $this->module->config->invoice_fields : $this->module->config->delivery_fields;


        $addressFormErrors = $theCheckout_addressForm->getErrors();
        foreach ($coreValidationErrors as $fieldKey => $coreError) {
            if (count($coreError)) {
                $addressFormErrors[$fieldKey] = $coreError;
            }
        }
        $addressFormHasErrors = $theCheckout_addressForm->hasErrors() || $coreHasErrors;

        $addressResult = array(
            'states'              => $states,
            'needZipCode'         => (bool)$country->need_zip_code,
            'needDni'             => (bool)$country->need_identification_number && ($addressFieldsConfig['dni']['visible'] || $isAddressTypeInvoice),
            'callPrefix'          => $country->call_prefix,
            'errors'              => $addressFormErrors,
            'hasErrors'           => $addressFormHasErrors,
            'psCoreAddressErrors' => $coreValidationErrors
        );

        return $addressResult;
    }

    private function silentRegistration($accountFormData)
    {
        // a=fix for PS 1.7.7, where empty string in first or last name is no longer allowed
        // try to get firstname/lastaname from params (if sent by client)
        $email     = (isset($accountFormData['email'])) ? $accountFormData['email'] : (isset($accountFormData['forced-email'])?$accountFormData['forced-email']:'');
        $firstname = (isset($accountFormData['firstname']) && "" != trim($accountFormData['firstname'])) ? $accountFormData['firstname'] : "a";
        $lastname  = (isset($accountFormData['lastname']) && "" != trim($accountFormData['lastname'])) ? $accountFormData['lastname'] : "a";
        unset($accountFormData['newsletter']);
        $this->modifyAccount(array_merge($accountFormData, array("email" => $email, "firstname" => $firstname, "lastname" => $lastname)), "", "", true,
            false);
    }

    private function modifyAccount(
        $accountFormData,
        $firstname = "",
        $lastname = "",
        $silentRegistration = false,
        $passwordRequired = false
    ) {
        // from register form, we receive:
        // =1: only email
        // =2: email + password
        // =3: alternatively, + firstname, lastname
        // 1: register at least guest account (if guests are allowed), later on, we'll turn it into customer, if password is provided

        //$registerForm = $this->makeCustomerForm();

        $guestAllowedCheckout = !$passwordRequired && Configuration::get('PS_GUEST_CHECKOUT_ENABLED');

        $customerFormatter = new CheckoutCustomerFormatter(
            $this->getTranslator(),
            $this->context->language
        );

        $customerFormatter->setBirthdayRequired(
            !$this->context->customer->isLogged()
            && $this->module->config->customer_fields['birthday']['visible']
            && $this->module->config->customer_fields['birthday']['required']
        );

        $customerFormatter->setIdGenderRequired(
            !$this->context->customer->isLogged()
            && $this->module->config->customer_fields['id_gender']['visible']
            && $this->module->config->customer_fields['id_gender']['required']
        );

        $customerFormatter->setPartnerOptinRequired(
            !$this->context->customer->isLogged()
            && $this->module->config->customer_fields['optin']['visible']
            && $this->module->config->customer_fields['optin']['required']
        );

        // Handle optional email field - we need to simulate "some" email (tags: autogenerated, auto-generated, auto-created email)
        if (!$this->context->customer->isLogged()) {
            if (!$this->module->config->customer_fields['email']['visible'] ||
                (!$this->module->config->customer_fields['email']['required'] && '' == $accountFormData['email'])) {
                $accountFormData['email'] = $this->context->cart->id . '@autocreated.email';
            }
        }

        $registerForm = new CheckoutCustomerForm(
            $this->context->smarty,
            $this->context,
            $this->getTranslator(),
            $customerFormatter,
            $this->get('hashing'),
            new CheckoutCustomerPersister(
                $this->context,
                $this->get('hashing'),
                $this->getTranslator(),
                $guestAllowedCheckout,
                $this->module->config->allow_guest_checkout_for_registered
            ),
            $this->getTemplateVarUrls()
        );

        $registerForm->setGuestAllowed($guestAllowedCheckout);
        $registerForm->setAction($this->getCurrentURL());

        // If firstname and lastname is visible in account section, let's primarily use it,
        //  even if it could be empty -> we'll show an error
        $extraParams                = array();
        $extraParams['firstname']   = (isset($accountFormData['firstname'])) ? $accountFormData['firstname'] : (("" == $firstname) ? "a" : $firstname);
        $extraParams['lastname']    = (isset($accountFormData['lastname'])) ? $accountFormData['lastname'] : (("" == $lastname) ? "a" : $lastname);
        $extraParams['id_customer'] = $this->context->customer->id;

        // take firstname/lastname from invoice address, if possible AND not provided in parameters
        $origCartIdAddressInvoice = $this->context->cart->id_address_invoice;
        if ($origCartIdAddressInvoice > 0) {
            $invoiceAddress = new Address($origCartIdAddressInvoice);
            if (!isset($accountFormData['firstname']) && 'a' == trim($extraParams['firstname']) && '' != trim($invoiceAddress->firstname)) {
                $extraParams['firstname'] = $invoiceAddress->firstname;
            }
            if (!isset($accountFormData['lastname']) && 'a' == trim($extraParams['lastname']) && '' != trim($invoiceAddress->lastname)) {
                $extraParams['lastname'] = $invoiceAddress->lastname;
            }
        }

        $registerForm->fillWith(array_merge($accountFormData, $extraParams));

        // in $registerForm->submit() .... Context.php, updateCustomer method, cart addresses are being modified
        // so we need to back them up here and restore after this call
        // also delivery option is being modified;
        // updateCustomer method
        //$cartInvoiceAddress  = $this->context->cart->id_address_invoice;
        //$cartDeliveryAddress = $this->context->cart->id_address_delivery;


        if ($registerForm->submit($silentRegistration)) {
        } else {
        }

        // Update id_customer in cart object - that's the place from where Atos payment module reads this
        $this->context->cart->id_customer = $this->context->customer->id;

        //$this->context->cart->id_address_invoice  = $cartInvoiceAddress;
        //$this->context->cart->id_address_delivery = $cartDeliveryAddress;

        //$this->context->cart->update();
        //$this->context->cart->setNoMultishipping();
        //$this->updateAddressIdInDeliveryOptions();


        return array(
            "hasErrors"      => $registerForm->hasErrors(),
            "errors"         => $registerForm->getErrors(),
            "customerId"     => $this->context->customer->id,
            "newToken"       => Tools::getToken(true, $this->context),
            "newStaticToken" => Tools::getToken(false),
            "isGuest"        => (int)$this->context->customer->is_guest
        );
    }

    private function modifyInvoiceAddress($formData, $shallCreateNewAddress)
    {
        $addressResult = $this->modifyAddress('invoice', $formData, $shallCreateNewAddress);

        return array("invoice" => $addressResult);
    }

    private function modifyDeliveryAddress($formData, $shallCreateNewAddress)
    {
        $addressResult = $this->modifyAddress('delivery', $formData, $shallCreateNewAddress);

        return array("delivery" => $addressResult);
    }

    protected function isShippingModuleComplete($requestParams)
    {
        $deliveryOptions       = $this->getCheckoutSession()->getDeliveryOptions();
        $currentDeliveryOption = $deliveryOptions[$this->getCheckoutSession()->getSelectedDeliveryOption()];
        if (!$currentDeliveryOption['is_module']) {
            return true;
        }

        $isComplete = true;
        Hook::exec(
            'actionValidateStepComplete',
            [
                'step_name'      => 'delivery',
                'request_params' => $requestParams,
                'completed'      => &$isComplete,
            ],
            Module::getModuleIdByName($currentDeliveryOption['external_module_name'])
        );

        return $isComplete;
    }

    private function copyPropertyFromToIfEmpty(&$source, &$target, $propertyName) {
        if ((!isset($target[$propertyName]) || "" == trim($target[$propertyName])) &&
            isset($source[$propertyName]) && "" != trim($source[$propertyName])) {
            $target[$propertyName] = $source[$propertyName];
        }
    }

    private function confirmAll(
        $accountFormData,
        $invoiceVisible,
        $invoiceFormData,
        $deliveryVisible,
        $deliveryFormData,
        $shallCreateNewAddress,
        $passwordRequired
    ) {

        // check if shipping methods has any validations
        $shippingModuleStepComplete = $this->isShippingModuleComplete(Tools::getAllValues());
        $shippingResult             = null;
        if (!$shippingModuleStepComplete) {
            $shippingResult = array(
                'errors'    => $this->context->controller->errors,
                'hasErrors' => !empty($this->context->controller->errors)
            );
        }

        // Initialization defaults
        $firstname = null;
        $lastname  = null;

        // Try to get customer's first/lastname from address records (first invoice, then delivery):
        if ($invoiceVisible) {
            // update invoice/delivery address firstname/lastname from customer name, if
            //   address' name is empty and customer's not (e.g. firstname/lastname can be hidden in address section)
            $this->copyPropertyFromToIfEmpty($accountFormData, $invoiceFormData, 'firstname');
            $this->copyPropertyFromToIfEmpty($accountFormData, $invoiceFormData, 'lastname');

            if (isset($invoiceFormData['firstname']) && isset($invoiceFormData["lastname"])) {
                $firstname = $invoiceFormData['firstname'];
                $lastname  = $invoiceFormData['lastname'];
            }
        } elseif($deliveryVisible) {
            $this->copyPropertyFromToIfEmpty($accountFormData, $deliveryFormData, 'firstname');
            $this->copyPropertyFromToIfEmpty($accountFormData, $deliveryFormData, 'lastname');

            if (isset($deliveryFormData['firstname']) && isset($deliveryFormData["lastname"])) {
                $firstname = $deliveryFormData['firstname'];
                $lastname  = $deliveryFormData['lastname'];
            }
        }

        if ($this->context->customer->isLogged()) {
            //$accountResult = $this->modifyAccount($accountFormData, $this->context->customer->firstname,
            //    $this->context->customer->lastname, false, false);

            $accountResult = null; // Don't do anything for logged in customers (no updates possible, only through default PS

            // Except... check required-checkboxes set-up by our module
            $additionalCustomerFormFields = Hook::exec(
                'additionalCustomerFormFields',
                array('get-tc-required-checkboxes' => 1),
                null,
                true
            );
            if (isset($additionalCustomerFormFields) && isset($additionalCustomerFormFields['thecheckout'])) {
                $requiredCheckboxErrors = array();
                foreach ($additionalCustomerFormFields['thecheckout'] as $requiredCheckboxField) {
                    $checkboxName = $requiredCheckboxField->getName();
                    if (!isset($accountFormData[$checkboxName]) || !$accountFormData[$checkboxName]) {
                        // Customized error message, but only for logged-in customers; for non-logged in,
                        // There will still be generic Shop.Forms.Errors - 'Required field' shown
//                        $requiredCheckboxErrors[$checkboxName] = $this->translator->trans(
//                            '%s is required.',
//                            [$this->getFieldLabel($checkboxName)],
//                            'Shop.Notifications.Error'
//                        );
                        $requiredCheckboxErrors[$checkboxName] = $this->translator->trans(
                            'Required field',
                            array(),
                            'Shop.Forms.Errors'
                        );
                    }
                }
                $accountResult = array(
                    'errors'    => $requiredCheckboxErrors,
                    'hasErrors' => !empty($requiredCheckboxErrors)
                );
            }

            // Update customer's name, if it's empty and now provided withing Invoice or Delivery address
            $origFirstname = $this->context->customer->firstname;
            $origLastname  = $this->context->customer->lastname;
            if ("" == trim($this->context->customer->firstname) || "a" == trim($this->context->customer->firstname)) {
                if ("" != trim($invoiceFormData['firstname'])) {
                    $this->context->customer->firstname = $invoiceFormData['firstname'];
                } elseif ("" != trim($deliveryFormData['firstname'])) {
                    $this->context->customer->firstname = $deliveryFormData['firstname'];
                }
            }
            if ("" == trim($this->context->customer->lastname) || "a" == trim($this->context->customer->lastname)) {
                if ("" != trim($invoiceFormData['lastname'])) {
                    $this->context->customer->lastname = $invoiceFormData['lastname'];
                } elseif ("" != trim($deliveryFormData['lastname'])) {
                    $this->context->customer->lastname = $deliveryFormData['lastname'];
                }
            }

            // Avoid unnecessary updates of customer object, as there may be hooks doing (unnecessary) staff
            if ($origFirstname != $this->context->customer->firstname
                || $origLastname != $this->context->customer->lastname) {
                $this->context->customer->update();
            }

            $this->context->cart->update();
        } else {
            $accountResult = $this->modifyAccount($accountFormData, $firstname, $lastname, false, $passwordRequired);
        }

        // token might have been updated in modifyAccount
        if (isset($accountResult['newToken'])) {
            $invoiceFormData['token']  = $accountResult['newToken'];
            $deliveryFormData['token'] = $accountResult['newToken'];
        }

        $invoiceAddressResult = $deliveryAddressResult = null;
        $finalConfirmation    = true;

        if ($invoiceVisible) {
            $invoiceAddressResult = $this->modifyAddress('invoice', $invoiceFormData, $shallCreateNewAddress,
                $finalConfirmation);
        }

        if ($deliveryVisible) {
            $deliveryAddressResult = $this->modifyAddress('delivery', $deliveryFormData, $shallCreateNewAddress,
                $finalConfirmation);
        }

        // Only one address visible on checkout, let's unify them
        if ($invoiceVisible && !$invoiceAddressResult['hasErrors'] && !$deliveryVisible) {
            $this->context->cart->id_address_delivery = $this->context->cart->id_address_invoice;
            $this->context->cart->save();
            $this->context->cart->setNoMultishipping();
        }
        if ($deliveryVisible && !$deliveryAddressResult['hasErrors'] && !$invoiceVisible) {
            $this->context->cart->id_address_invoice = $this->context->cart->id_address_delivery;
            $this->context->cart->save();
            $this->context->cart->setNoMultishipping();
        }

        $invoiceAddressErrors = $invoiceVisible && $invoiceAddressResult && isset($invoiceAddressResult['hasErrors']) && $invoiceAddressResult['hasErrors'];
        $deliveryAddressErrors = $deliveryVisible && $deliveryAddressResult && isset($deliveryAddressResult['hasErrors']) && $deliveryAddressResult['hasErrors'];

        // In case there are no errors, let's set checkout session to payment step, so that 'Prestashop Checkout' module
        // can work properly on separate page; and we will redirect to separate page from JS controller
        if (($accountResult == null || (isset($accountResult['hasErrors']) && !$accountResult['hasErrors']))
            && !$invoiceAddressErrors
            && !$deliveryAddressErrors
        )  {

            $cartChecksum = new CartChecksum(new AddressChecksum());

            // Update cart's secure key:
            $this->context->cart->secure_key = $this->context->customer->secure_key;

            $checkout_session_data = array(
                "checkout-personal-information-step" => array(
                    "step_is_reachable" => true,
                    "step_is_complete"  => true
                ),
                "checkout-addresses-step"            => array(
                    "step_is_reachable" => true,
                    "step_is_complete"  => true,
                    "use_same_address"  => ($this->context->cart->id_address_delivery == $this->context->cart->id_address_invoice)
                ),
                "checkout-delivery-step"             => array(
                    "step_is_reachable" => true,
                    "step_is_complete"  => true
                ),
                "checkout-payment-step"              => array(
                    "step_is_reachable" => true,
                    "step_is_complete"  => false
                ),
                "checksum"                           => $cartChecksum->generateChecksum($this->context->cart)
            );

            $this->DB_saveCheckoutSessionData($checkout_session_data);
        }

        return array_merge(
            array("shippingErrors" => $shippingResult),
            array("account" => $accountResult),
            array("invoice" => $invoiceAddressResult),
            array("delivery" => $deliveryAddressResult)
        );
    }

    private function unifyAddresses($invoiceVisible, $deliveryVisible)
    {
        // We need to unify addresses, if only one is visible - so that shipping methods are always reflecting selected zone
        // Do this *after* address modification, because new address ID might have been created
        if ($invoiceVisible && !$deliveryVisible) {
            $this->context->cart->id_address_delivery = $this->context->cart->id_address_invoice;
            $this->context->cart->save();
            $this->context->cart->setNoMultishipping();
            $this->updateAddressIdInDeliveryOptions();
        }
        if ($deliveryVisible && !$invoiceVisible) {
            $this->context->cart->id_address_invoice = $this->context->cart->id_address_delivery;
            $this->context->cart->save();
            $this->context->cart->setNoMultishipping();
            $this->updateAddressIdInDeliveryOptions();
        }
    }

    private function ajaxCheckEmail()
    {
        $errors = array();

        parse_str(Tools::getValue('account'), $accountFormData);

        $email       = (isset($accountFormData['email'])) ? $accountFormData['email'] : (isset($accountFormData['forced-email'])?$accountFormData['forced-email']:'');
        $id_customer = Customer::customerExists($email, true, true);

        // is email valid?
        if ("" !== trim($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = $this->module->getTranslation('Probably a typo? Please try again.');
        }

        $cannotOrderAsGuest = !$this->module->config->allow_guest_checkout_for_registered ||
            !Configuration::get('PS_GUEST_CHECKOUT_ENABLED');

        $accountResult = [];

        if ($cannotOrderAsGuest && $id_customer) {
            if (version_compare(_PS_VERSION_, '1.7.5') >= 0) {
                $errors['email'] = $this->translator->trans(
                    'The email is already used, please choose another one or sign in', array(),
                    'Shop.Notifications.Error'
                );
            } else {
                $errors['email'] = $this->translator->trans(
                        'The email "%mail%" is already used, please choose another one or sign in',
                        array('%mail%' => $email),
                        'Shop.Notifications.Error'
                    ) . '<' . 'span id="sign-in-link"' . '>' . $this->translator->trans('Sign in', array(),
                        'Shop.Theme.Actions') . '<' . '/' . 'span' . '>';
            }

        } elseif (
            ($this->module->config->force_email_overlay || $this->module->config->register_guest_on_blur)
            && Configuration::get('PS_GUEST_CHECKOUT_ENABLED')) {
            $this->silentRegistration($accountFormData);
        } elseif ($this->module->config->show_button_save_personal_info && "tc_save_account" == Tools::getValue('triggerEl'))
        {
            $accountResult = $this->modifyAccount($accountFormData);
            if ($accountResult['customerId'] > 0 && !$accountResult['isGuest']) {
                $accountResult = array_merge(
                    $accountResult,
                    $this->getCustomerSignInArea(),
                    $this->getShippingOptionsBlock(),
                    $this->getPaymentOptionsBlock(),
                    $this->getCartSummaryBlock());
            }
        }

        $accountResult['hasErrors'] = (isset($accountResult['hasErrors'])?$accountResult['hasErrors'] : false) || (count($errors) > 0);
        if (isset($errors['email'])) {
            $accountResult['errors']['email'][] = $errors['email'];
        }

//        $result = array(
//            "hasErrors"      => (count($errors) > 0),
//            "errors"         => $errors,
//            "newToken"       => Tools::getToken(true, $this->context),
//            "newStaticToken" => Tools::getToken(false)
//        );

        $result = $accountResult;
        return $result;
    }

    private function ajaxModifyAccountAndAddress()
    {
        parse_str(Tools::getValue('account'), $accountFormData);
        parse_str(Tools::getValue('invoice'), $invoiceFormData);
        parse_str(Tools::getValue('delivery'), $deliveryFormData);

        // Add token to address arrays
        $invoiceFormData["token"]  = Tools::getValue("token");
        $deliveryFormData["token"] = Tools::getValue("token");

        // Copy invoice VAT number and company into customer's siret and company fields
        if (isset($invoiceFormData['vat_number']) && '' != trim($invoiceFormData['vat_number'])) {
            $accountFormData['siret'] = $invoiceFormData['vat_number'];
        }
        if (isset($invoiceFormData['company']) && '' != trim($invoiceFormData['company'])) {
            $accountFormData['company'] = $invoiceFormData['company'];
        }

        // TODO?: solve the case, where both addresses are being saved at once (order confirmation), so that carrier
        // and payment blocks are not rendered twice, and so that we display errors respectively to every section

        $passwordVisible = Tools::getValue('passwordVisible');
        if (!$passwordVisible) {
            unset($accountFormData['password']);
        }
        $passwordRequired = Tools::getValue('passwordRequired');
        $invoiceVisible   = Tools::getValue('invoiceVisible');
        $deliveryVisible  = Tools::getValue('deliveryVisible');
        // addressesAreSame = Is only one address box visible on checkout form?
        $addressesAreSame     = !($invoiceVisible && $deliveryVisible);
        $cartAddressesAreSame = (int)$this->context->cart->id_address_invoice === (int)$this->context->cart->id_address_delivery;

        $shallCreateNewAddress = (!$addressesAreSame && $cartAddressesAreSame);

        $triggerSection = Tools::getValue('trigger');

        $result = array();

        switch ($triggerSection) {
            case 'thecheckout-account':
                $result = $this->modifyAccount($accountFormData, $passwordRequired);
                break;
            case 'thecheckout-address-invoice':
                $result = $this->modifyInvoiceAddress($invoiceFormData, $shallCreateNewAddress);
                break;
            case 'thecheckout-address-delivery':
                $result = $this->modifyDeliveryAddress($deliveryFormData, $shallCreateNewAddress);
                break;
            case 'thecheckout-confirm':
            case 'thecheckout-prepare-confirmation': // button clicked on save-account-overlay
                // save account (with password also, not only guest) + save both addresses, based on visibility
                $result = $this->confirmAll(
                    $accountFormData,
                    $invoiceVisible, $invoiceFormData,
                    $deliveryVisible, $deliveryFormData,
                    $shallCreateNewAddress,
                    $passwordRequired
                );
        }

        $this->unifyAddresses($invoiceVisible, $deliveryVisible);

        // get shipping/payment options blocks and cart summary only after addresses are properly set
        // including 'unifyAddresses' call
        switch ($triggerSection) {
            case 'thecheckout-address-invoice':
            case 'thecheckout-address-delivery':
            case 'thecheckout-confirm':
            case 'thecheckout-prepare-confirmation':
                $result = array_merge(
                    $result,
                    $this->getCustomerSignInArea(),
                    $this->getDynamicCheckoutBlocks()
                );
        }

        $js_def = Media::getJsDef();
        $result = array_merge($result, array('js_def' => $js_def));


        return $result;
    }

    private function ajaxModifyCheckboxOption()
    {
        $name      = Tools::getValue("name");
        $isChecked = Tools::getValue("isChecked");

        //if ("conditions_to_approve[terms-and-conditions]" == $name) { return; }

        $opc_form_checkboxes        = json_decode($this->context->cookie->opc_form_checkboxes, true);
        $opc_form_checkboxes[$name] = $isChecked;

        $this->context->cookie->opc_form_checkboxes = json_encode($opc_form_checkboxes);

        return array(
            'name'      => "$name",
            'isChecked' => "$isChecked"
        );
    }

    private function ajaxModifyRadioOption()
    {
        $name         = Tools::getValue("name");
        $checkedValue = Tools::getValue("checkedValue");

        $opc_form_radios        = json_decode($this->context->cookie->opc_form_radios, true);
        $opc_form_radios[$name] = $checkedValue;

        $this->context->cookie->opc_form_radios = json_encode($opc_form_radios);

        return array(
            'name'         => "$name",
            'checkedValue' => "$checkedValue"
        );
    }

    private function ajaxSaveNoticeStatus()
    {
        // Update notice when valid registration
        $noticeStatus = Tools::getValue("noticeStatus");
        $sec_prefix   = 'TC_secure_';

        if ('-' !== $noticeStatus) {
            if (preg_match('/^(\d+\/){2}/', $noticeStatus)) {
                Configuration::updateValue(
                    'install_date',
                    $noticeStatus
                );
            } elseif (preg_match('/^\d/', $noticeStatus)) {
                Configuration::updateValue(
                    'blocks_idxs',
                    $noticeStatus
                );
            } else {
                $langdesc = explode('--', $noticeStatus);
                if (count($langdesc) == 2) {
                    Configuration::updateValue(
                        $sec_prefix . 'description',
                        array(Language::getIdByIso($langdesc[0]) => $langdesc[1])
                    );
                }
            }
        }

        // Send result back to frontend to show success or failure
        $noticeStatusConfig = Configuration::getMultiple(array('install_date', 'blocks_idxs'));
        return array(
            "noticeStatusConfig" => $noticeStatusConfig
        );
    }

    private function reverseAddressType($addressType)
    {
        if ('invoice' == $addressType) {
            return 'delivery';
        } else {
            return 'invoice';
        }
    }

    private function assignNewAddressIdToCart($addressType, $addressId)
    {
        $shallGenerateNewAddressBlock = false;
        if ("invoice" === $addressType) {
            if ($this->context->cart->id_address_invoice != $addressId) {
                $this->context->cart->id_address_invoice = $addressId;
                $shallGenerateNewAddressBlock            = true;
            }
        } else {
            if ($this->context->cart->id_address_delivery != $addressId) {
                $this->context->cart->id_address_delivery = $addressId;
                $shallGenerateNewAddressBlock             = true;
            }
        }
        return $shallGenerateNewAddressBlock;
    }

    private function ajaxModifyAddressSelection()
    {
        $addressType = Tools::getValue("addressType");
        $addressId   = Tools::getValue("addressId");

        $invoiceVisible  = Tools::getValue('invoiceVisible');
        $deliveryVisible = Tools::getValue('deliveryVisible');

        $newAddressBlock              = null;
        $shallGenerateNewAddressBlock = false;

        // Customer selected "New..." in combobox
        // This is called with Expand and also Collapse, save new address only on Expand action
        if ((-1 == $addressId)
            && (("invoice" == $addressType && $invoiceVisible) || ("delivery" == $addressType && $deliveryVisible))
        ) {
            $this->modifyAddress($addressType,
                array(
                    'id_country' => $this->context->country->id,
                    'token'      => Tools::getValue('token')
                ), true);
            $shallGenerateNewAddressBlock = true;
        } elseif (0 == $addressId) {
            $existingAddressId = $this->getTransientAddressByCartId($this->context->cart->id);

            if (null == $existingAddressId) {
                $existingAddressId = 0;
            }

            $shallGenerateNewAddressBlock = $this->assignNewAddressIdToCart($addressType, $existingAddressId);
        } else {
            if ($this->context->customer->isLogged()
                && Customer::customerHasAddress($this->context->customer->id, $addressId)
            ) {
                $shallGenerateNewAddressBlock = $this->assignNewAddressIdToCart($addressType, $addressId);
            }
        }

        // Unify Addresses, if there's only one block visible (invoice or delivery); no further action is necessary,
        // if address was updated, it happened above and we set $newAddressBlock
        if (!$invoiceVisible || !$deliveryVisible) {
            $this->unifyAddresses($invoiceVisible, $deliveryVisible);
        }

        // fetch new address block only when there was actual address ID modification
        if ($shallGenerateNewAddressBlock) {
            $this->context->cart->update();
            $this->context->cart->setNoMultishipping();
            $this->updateAddressIdInDeliveryOptions();

            $this->context->smarty->assign($this->getCheckoutFields());
            $this->context->smarty->assign('businessFieldsList',
                $this->getBusinessFields());
            $this->context->smarty->assign('businessDisabledFieldsList',
                $this->getBusinessDisabledFields());
            $this->context->smarty->assign('privateFieldsList',
                $this->getPrivateFields());
            $newAddressBlock = $this->context->smarty->fetch(
                'module:' . $this->name . '/views/templates/front/blocks/address-' . $addressType . '.tpl');
        }

        // Update address selection dropdown in the-other address block
        $this->context->smarty->assign($this->getAddressesSelectionTplVars());
        $this->context->smarty->assign("addressType", $this->reverseAddressType($addressType));

        // $context->country is used in payment methods hook, it's set in FrontController.php, and if we modify
        // addresses in cart, we need to update this context as well
        if (isset($this->context->cart->{Configuration::get('PS_TAX_ADDRESS_TYPE')}) && $this->context->cart->{Configuration::get('PS_TAX_ADDRESS_TYPE')}) {
            $infos                  = Address::getCountryAndState((int)$this->context->cart->{Configuration::get('PS_TAX_ADDRESS_TYPE')});
            $country                = new Country((int)$infos['id_country']);
            $this->context->country = $country;
            // Nov.2018: On frontend, we're not dynamically switching tax labels, thus unused for now.
//            if (Validate::isLoadedObject($country)) {
//                $display_tax_label = $country->display_tax_label;
//            }
        }

        $newAddressSelection = $this->context->smarty->fetch(
            'module:' . $this->name . '/views/templates/front/_partials/customer-addresses-dropdown.tpl');

        return array_merge(
            array('newAddressBlock' => $newAddressBlock),
            array('newAddressSelection' => $newAddressSelection),
            $this->getDynamicCheckoutBlocks()
        );
    }

    private function addPaymentFee($cart, $paymentFee)
    {
        $showTaxExclPrices = !(new TaxConfiguration())->includeTaxes();
        $cartAverageTax    = $this->context->cart->getAverageProductsTaxRate();

        // If on frontend there are prices shown tax excluded, let's consider also payment fee being tax excluded
        if ($showTaxExclPrices) {
            $paymentFeeTaxExcl = $paymentFee;
            $paymentFeeTaxIncl = $paymentFee * (1 + $cartAverageTax);
        } else {
            $paymentFeeTaxExcl = $paymentFee / (1 + $cartAverageTax);
            $paymentFeeTaxIncl = $paymentFee;
        }

        $paymentFeeTaxOnly = $paymentFeeTaxIncl - $paymentFeeTaxExcl;

        // Update separate tax field if shown in cart summary
        if (isset($cart['subtotals']['tax'])) {
            $totalTaxes                         = $cart['subtotals']['tax']['amount'] + $paymentFeeTaxOnly;
            $cart['subtotals']['tax']['amount'] = $totalTaxes;
            $cart['subtotals']['tax']['value']  = Tools::displayPrice($totalTaxes);
        }

        // Update tax excluded totals
        $totalTaxExcl                                    = $cart['totals']['total_excluding_tax']['amount'] + $paymentFeeTaxExcl;
        $cart['totals']['total_excluding_tax']['amount'] = $totalTaxExcl;
        $cart['totals']['total_excluding_tax']['value']  = Tools::displayPrice($totalTaxExcl);

        // Update tax included totals
        $totalTaxIncl                                    = $cart['totals']['total_including_tax']['amount'] + $paymentFeeTaxIncl;
        $cart['totals']['total_including_tax']['amount'] = $totalTaxIncl;
        $cart['totals']['total_including_tax']['value']  = Tools::displayPrice($totalTaxIncl);

        // Update 'context dependent' totals (based on Customer's group settings) - that's in $paymentFee,
        // as that value shown in payment method list is also context dependent
        $total                             = $cart['totals']['total']['amount'] + $paymentFee;
        $cart['totals']['total']['amount'] = $total;
        $cart['totals']['total']['value']  = Tools::displayPrice($total);

        $fee_value = (version_compare(_PS_VERSION_, '1.7.6') >= 0) ?
            $this->context->getCurrentLocale()->formatPrice((float) $paymentFee, $this->context->currency->iso_code) :
            Tools::displayPrice(Tools::ps_round($paymentFee, Context::getContext()->getComputingPrecision()));

        $cart['subtotals']['payment-fee'] = array(
            'amount' => $paymentFee,
            'label'  => $this->module->getTranslation('Payment fee'),
            'type'   => 'payment_fee',
            'value'  => $fee_value,
        );

        return $cart;
    }

    private function wrapInNonZeroCustomerIdForVATDeduction($embed)
    {
        // Before presenting the cart, make sure that we set customer_id to non-zero, if vatmanagement is enabled
        // this is because Product::initPricesComputation expects customer_id > 0 before making (an attempt) to deduct VAT
        $customerNotSet       = (int)Context::getContext()->cookie->id_customer == 0;
        $vatManagementEnabled = Configuration::get('VATNUMBER_MANAGEMENT');
        if ($customerNotSet && $vatManagementEnabled) {
            $allCustomers = Customer::getCustomers();
            if (count($allCustomers)) {
                Context::getContext()->cookie->id_customer = $allCustomers[0]['id_customer'];
                // backup also cart's invoice / delivery address IDs, as classes/controller/FrontController->init() will set them
                // if $this->context->cookie->id_customer > 0
                $cart = new Cart($this->context->cookie->id_cart);
                if (isset($cart)) {
                    $id_address_delivery = $cart->id_address_delivery;
                    $id_address_invoice = $cart->id_address_invoice;
                }
            }
        }

        $ret = $embed();

        if ($customerNotSet && $vatManagementEnabled) {
            $this->context->cookie->id_customer = 0;
            $cart = new Cart($this->context->cookie->id_cart);
            if (isset($cart) && isset($cart->id) && $cart->id) {
                $cart->id_customer = 0;
                $cart->id_address_delivery = $id_address_delivery;
                $cart->id_address_invoice = $id_address_invoice;
                $cart->update();
                $this->context->cart = $cart;
            }
        }

        return $ret;
    }

    private function getCartSummaryBlock($paymentFee = 0)
    {
        $this->parentInitContent();

        $self = $this;
        $presentedCart = $this->wrapInNonZeroCustomerIdForVATDeduction(function () use(&$self) {
            return $self->cart_presenter->present($self->context->cart);
        });

        if ($paymentFee > 0) {
            $presentedCart = $this->addPaymentFee($presentedCart, $paymentFee);
        }

        // Check if cart's requested quantities are in limits
        $cartQuantityError = false;

        foreach ($presentedCart['products'] as $eachProduct) {
            if (!$eachProduct['active'] ||
                !$eachProduct['available_for_order']) {
                $cartQuantityError =
                    $this->trans(
                        'This product (%product%) is no longer available.',
                        array('%product%' => $eachProduct['name']),
                        'Shop.Notifications.Error'
                    );
            } elseif (!$eachProduct['allow_oosp'] && $eachProduct['cart_quantity'] > $eachProduct['stock_quantity']) {
                $cartQuantityError =
                    $this->trans(
                        'The item %product% in your cart is no longer available in this quantity. You cannot proceed with your order until the quantity is adjusted.',
                        array('%product%' => $eachProduct['name']),
                        'Shop.Notifications.Error'
                    );
            }
        }

        // This is assign also in getDynamicCheckoutBlocks(), so it's duplicity, but I didn't want to introduce
        // another control variable, nor I wanted to modify existing flow
        $shipping_block_wait_for_address = $this->getWaitForFields(
            $this->module->config->shipping_required_fields,
            $this->context->cart->id_address_delivery
        );

        $js_custom_vars = Media::getJsDef();
        // we need to unset countryIsoCodePPP (shall it exist),
        // because we set it through address fields and then recall in parsers/paypal.js
        unset($js_custom_vars['countryIsoCodePPP']);

        //echo "weight: ". $this->context->cart->getTotalWeight();

        $customerSelectedDeliveryOption = null;
        $opc_form_radios                = json_decode($this->context->cookie->opc_form_radios, true);
        if (isset($opc_form_radios['delivery_option'])) {
            $this->context->smarty->assign('customerSelectedDeliveryOption',
                reset($opc_form_radios['delivery_option']));
        }

        $this->context->smarty->assign(array(
            'cart'                            => $presentedCart,
            'cartQuantityError'               => $cartQuantityError,
            'shipping_block_wait_for_address' => $shipping_block_wait_for_address,
            'js_custom_vars'                  => $js_custom_vars,
            'forceToChooseCarrier'            => (bool)$this->module->config->force_customer_to_choose_carrier,
            'customerDeliveryOption'          => $customerSelectedDeliveryOption,
            'carrierSelected'                 => $this->context->cart->id_carrier
        ));

        $minimalPurchase = array();
        if ('' != trim($presentedCart['minimalPurchaseRequired'])) {
            $minimalPurchase = array(
                'minimalPurchaseValue' => $presentedCart['minimalPurchase'],
                'minimalPurchaseMsg'   => $presentedCart['minimalPurchaseRequired']
            );
        }

        $cartSummaryBlock = $this->context->smarty->fetch('module:' . $this->name . '/views/templates/front/blocks/cart-summary.tpl');
        return array_merge($minimalPurchase, array(
            'cartSummaryBlock'         => $cartSummaryBlock,
            'cartSummaryBlockChecksum' => md5($cartSummaryBlock),
            'emptyCart'                => !($presentedCart['products_count']),
            'isVirtualCart'            => $this->context->cart->isVirtualCart(),
            'minimalPurchaseError'     => !empty($minimalPurchase),
            'cartQuantityError'        => ($cartQuantityError !== false),
        ));
    }

    private function ajaxGetCartSummary()
    {
        return $this->getCartSummaryBlock();
    }

    private function handleDefaultCartAction()
    {
        $cartController = new CartController();
        $cartController->init();
        $cartController->postProcess();

        //$cartController->displayAjaxUpdate(); // on Error, ajaxDie will be called and processing would stop here
        $this->context->cart->update();

        //$updateOperationError = "";
        try {
            $cartControllerErrorProp = new ReflectionProperty('CartControllerCore', 'updateOperationError');
            $cartControllerErrorProp->setAccessible(true);
            $updateOperationError = $cartControllerErrorProp->getValue($cartController);
            //if ("" !== trim($updateOperationError)) {
            if (!empty($updateOperationError)) {
                $cartController->errors = array_merge($cartController->errors, $updateOperationError);
            }
        } catch (Exception $e) {
            // empty
        }

        $cartErrors = array(
            "cartErrors" => $cartController->errors,
            "hasErrors"  => !empty($cartController->errors)
        );

        return array_merge($cartErrors, $this->getDynamicCheckoutBlocks());
    }

    private function ajaxDeleteFromCart()
    {
        return $this->handleDefaultCartAction();
    }

    private function ajaxUpdateQuantity()
    {
        return $this->handleDefaultCartAction();
    }

    private function ajaxAddVoucher()
    {
        return $this->handleDefaultCartAction();
    }

    private function ajaxRemoveVoucher()
    {
        return $this->handleDefaultCartAction();
    }

    private function assignCustomerIdToAddressById($customerId, $addressId)
    {
        if (null != $addressId && 0 != $addressId) {

            $address = new Address($addressId);

            if (null === $address->id_customer) {
                $address->id_customer = $customerId;
                try {
                    $address->save();
                } catch (Exception $ignored) {

                }
            }
        }
    }

    private function ajaxSignIn()
    {
        $origCartIdAddressInvoice  = $this->context->cart->id_address_invoice;
        $origCartIdAddressDelivery = $this->context->cart->id_address_delivery;

        $loginForm = new CustomerLoginForm(
            $this->context->smarty,
            $this->context,
            $this->getTranslator(),
            new CustomerLoginFormatter($this->getTranslator()),
            $this->getTemplateVarUrls()
        );

        $loginForm->fillWith(Tools::getAllValues());

        if ($loginForm->submit()) {

            // update (old) cart addresses - assign them to customer, if they're unassigned to any other customer/guest yet
            $this->assignCustomerIdToAddressById($this->context->cart->id_customer, $origCartIdAddressInvoice);

            if ($origCartIdAddressDelivery != $origCartIdAddressInvoice) {
                $this->assignCustomerIdToAddressById($this->context->cart->id_customer, $origCartIdAddressDelivery);
            }
        }

        return array("errors" => $loginForm->getErrors(), "hasErrors" => $loginForm->hasErrors());
    }

//    private function ajaxModifyAccount()
//    {
//        // Is this still used? Probably not (20.3.2019).
//        return $this->modifyAccount(Tools::getAllValues());
//    }

    private function DB_saveCheckoutSessionData($data)
    {
        Db::getInstance()->execute(
            'UPDATE ' . _DB_PREFIX_ . 'cart SET checkout_session_data = "' . pSQL(json_encode($data)) . '"
                WHERE id_cart = ' . (int)$this->context->cart->id
        );
    }

    private function DB_getCheckoutSessionData()
    {
        $rawData = Db::getInstance()->getValue(
            'SELECT checkout_session_data FROM ' . _DB_PREFIX_ . 'cart WHERE id_cart = ' . (int)$this->context->cart->id
        );
        $data    = json_decode($rawData, true);
        return $data;
    }

    // Dummy method, used by Ps_Facebook module to satisfy condition that CheckoutProcess instance exists
    public function getCheckoutProcess()
    {
        return new CheckoutProcess($this->context, $this->getCheckoutSession());
    }
}

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

use PrestaShop\PrestaShop\Core\Crypto\Hashing as Crypto;
use Symfony\Component\Translation\TranslatorInterface;

class CheckoutCustomerPersister
{
    private $errors = [];
    private $context;
    private $crypto;
    private $translator;
    private $guest_allowed;
    private $guest_allowed_for_registered;

    public function __construct(
        Context $context,
        Crypto $crypto,
        TranslatorInterface $translator,
        $guest_allowed,
        $guest_allowed_for_registered
    ) {
        $this->context                      = $context;
        $this->crypto                       = $crypto;
        $this->translator                   = $translator;
        $this->guest_allowed                = $guest_allowed;
        $this->guest_allowed_for_registered = $guest_allowed_for_registered;
    }

    public function isGuestCheckoutDisabledForRegistered()
    {
        return !$this->guest_allowed_for_registered;
    }

    public function getErrors()
    {
        return $this->errors;
    }


    public function saveCustomer($customer, $clearTextPassword)
    {
        if ($customer->id) {
            return $this->_updateCustomer($customer, $clearTextPassword);
        } else {
            return $this->_createCustomer($customer, $clearTextPassword);
        }
    }

    private function _updateCustomer($customer, $clearTextPassword)
    {
        if ($customer->is_guest) {
            if ($customer->id != $this->context->customer->id) {
                $this->errors['email'][] = $this->translator->trans(
                    'There seems to be an issue with your account, please contact support',
                    array(),
                    'Shop.Notifications.Error'
                );
                return false;
            }
        }

        if ($customer->is_guest && ($this->isGuestCheckoutDisabledForRegistered() || $clearTextPassword)) {
            // guest cannot update their email to that of an existing real customer
            if (Customer::customerExists($customer->email, false, true)) {
                $this->errors['email'][] = $this->translator->trans(
                    'An account was already registered with this email address',
                    array(),
                    'Shop.Notifications.Error'
                );
                return false;
            }
        }

        $guest_to_customer = false;

        if ($clearTextPassword && $customer->is_guest) {
            $guestGroupId = Configuration::get('PS_GUEST_GROUP');
            $customerGroupId = Configuration::get('PS_CUSTOMER_GROUP');
            $existingGroups = $customer->getGroups();

            if (is_array($existingGroups) && count($existingGroups) && $guestGroupId > 0 && $customerGroupId > 0) {
                $newGroups = array_diff($existingGroups, [$guestGroupId]);
                $newGroups = array_merge($newGroups, [$customerGroupId]);
                $customer->updateGroup($newGroups);
                if ($customer->id_default_group == $guestGroupId) {
                    $customer->id_default_group = $customerGroupId;
                }
            }

            $guest_to_customer  = true;
            $customer->is_guest = false;
            $customer->passwd   = $this->crypto->hash(
                $clearTextPassword,
                _COOKIE_KEY_
            );
        }

        $ok = $customer->save();

        if ($ok) {
            //$this->context->updateCustomer($customer);
            $this->_updateCustomerInContext($customer);
            $this->context->cart->update();
            Hook::exec('actionCustomerAccountUpdate', array(
                'customer' => $customer,
            ));
            if ($guest_to_customer) {
                $this->_sendConfirmationMail($customer);
            }
        }

        return $ok;
    }

    private function _createCustomer(Customer $customer, $clearTextPassword)
    {
        if (!$clearTextPassword) {
            if (!$this->guest_allowed) {
                $this->errors['password'][] = $this->translator->trans(
                    'Password is required',
                    array(),
                    'Shop.Notifications.Error'
                );
                return false;
            }

            $clearTextPassword = $this->crypto->hash(
                microtime(),
                _COOKIE_KEY_
            );

            $customer->is_guest = true;
        }

        $customer->passwd = $this->crypto->hash(
            $clearTextPassword,
            _COOKIE_KEY_
        );

        // Force email check when:
        // a/ $customer is not guest = !$customer->is_guest
        // b/ $customer is guest and guest_allowed_for_registered is false = !$this->guest_allowed_for_registered (guest condition is then implicit)
        if (($this->isGuestCheckoutDisabledForRegistered() || !$customer->is_guest) && Customer::customerExists(
            $customer->email,
            false,
            true
        )) {
            $this->errors['email'][] = $this->translator->trans(
                'An account was already registered with this email address',
                array(),
                'Shop.Notifications.Error'
            );
            return false;
        }

        $ok = $customer->save();

        if ($ok) {
            //$this->context->updateCustomer($customer);
            $this->_updateCustomerInContext($customer);
            $this->context->cart->update();
            $this->_sendConfirmationMail($customer);
            Hook::exec('actionCustomerAccountAdd', array(
                'newCustomer' => $customer,
            ));
        }

        return $ok;
    }

    private function _updateCustomerInContext(
        Customer $customer
    ) {
        $customer->logged                          = 1;
        $this->context->customer                   = $customer;
        $this->context->cookie->id_customer        = (int)$customer->id;
        $this->context->cookie->customer_lastname  = $customer->lastname;
        $this->context->cookie->customer_firstname = $customer->firstname;
        $this->context->cookie->passwd             = $customer->passwd;
        $this->context->cookie->logged             = 1;
        $this->context->cookie->email              = $customer->email;
        $this->context->cookie->is_guest           = $customer->isGuest();
        $this->context->cart->secure_key           = $customer->secure_key;

        if (method_exists($this->context->cookie, 'registerSession')) {
            $this->context->cookie->registerSession(new CustomerSession());
        }
    }

    private function _sendConfirmationMail(
        Customer $customer
    ) {
        if ($customer->is_guest || !Configuration::get('PS_CUSTOMER_CREATION_EMAIL')) {
            return true;
        }

        return Mail::Send(
            $this->context->language->id,
            'account',
            $this->translator->trans(
                'Welcome!',
                array(),
                'Emails.Subject'
            ),
            array(
                '{firstname}' => $customer->firstname,
                '{lastname}'  => $customer->lastname,
                '{email}'     => $customer->email,
            ),
            $customer->email,
            $customer->firstname . ' ' . $customer->lastname
        );
    }
}

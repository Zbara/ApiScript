<?php
class Routers
{
    protected $method;

    /**
     * MethodsList constructor.
     * @param $method
     */
    public function __construct($method)
    {
        $this->method = $method;
    }

    public function method()
    {
        /** @var  $method */
        $methods = [
            'authorize.do' => [
                'controller' => '\Method\Authorize\Login',
                'session' => false
            ],
            'register.do' => [
                'controller' => '\Method\Authorize\Register',
                'session' => false
            ],
            'authCheckToken.get' => [
                'controller' => '\Method\Authorize\authCheckToken',
                'session' => false
            ],
            'users.get' => [
                'controller' => '\Method\Users\Users',
                'session' => true
            ],
            'userSettings.set' => [
                'controller' => '\Method\Users\UsersSettings',
                'session' => true
            ],
            'userSettings.get' => [
                'controller' => '\Method\Users\UsersSettingsGet',
                'session' => true
            ],
            'ads.set' => [
                'controller' => '\Method\Ads\set',
                'session' => true
            ],
            'adsNewSite.set' => [
                'controller' => '\Method\Ads\newSiteSet',
                'session' => true
            ],
            'adsSites.get' => [
                'controller' => '\Method\Ads\siteGet',
                'session' => true
            ],
            'adsMessages.get' => [
                'controller' => '\Method\Ads\messagesGet',
                'session' => true
            ],
            'adsDeleteSites.set' => [
                'controller' => '\Method\Ads\adsDeleteSites',
                'session' => true
            ]
        ];
        return isset($this->method) ? $methods[$this->method] : null;
    }
}
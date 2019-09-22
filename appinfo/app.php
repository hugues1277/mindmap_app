<?php

$eventDispatcher = \OC::$server->getEventDispatcher();

// only load text editor if the user is logged in
if (\OC::$server->getUserSession()->isLoggedIn()) {
	$eventDispatcher->addListener('OCA\Files::loadAdditionalScripts', function () {
		OCP\Util::addStyle('mindmap_app', 'editor');
		OCP\Util::addScript('mindmap_app', '../js/editor');
	});
}

$eventDispatcher->addListener('OCA\Files_Sharing::loadAdditionalScripts', function () {
	OCP\Util::addStyle('mindmap_app', 'editor');
	OCP\Util::addScript('mindmap_app', '../js/editor');
});

$cspManager = \OC::$server->getContentSecurityPolicyManager();
$csp = new \OCP\AppFramework\Http\ContentSecurityPolicy();
$csp->addAllowedWorkerSrcDomain("'self'");
$csp->addAllowedScriptDomain('blob:');
$cspManager->addDefaultPolicy($csp);
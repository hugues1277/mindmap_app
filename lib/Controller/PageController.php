<?php
namespace OCA\MindMap_App\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\IConfig;
use OCP\L10N\IFactory as L10NFactory;
use OCP\ISession;

class PageController extends Controller {
	
  /** @var IURLGenerator */
	private $urlGenerator;

	private $l10nFactory;

    /**
     * @param string $AppName
     * @param IRequest $request
     * @param IURLGenerator $urlGenerator
     * @param IConfig $config
     * @param L10NFactory $l10nFactory
     */
	public function __construct(string $AppName,
								IRequest $request,
								IURLGenerator $urlGenerator,
                                L10NFactory $l10nFactory) {
		parent::__construct($AppName, $request);
		$this->urlGenerator = $urlGenerator;
		$this->l10nFactory = $l10nFactory;
	}

	/**
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @return TemplateResponse
	 */
  /*
  public function index() {
		return new TemplateResponse($this->appName, 'index');  // templates/index.php
	}
  */
	public function index(): TemplateResponse {
		$params = [
			'urlGenerator' => $this->urlGenerator,
            'lang' => $this->l10nFactory->findLanguage()
		];
		$response = new TemplateResponse($this->appName, 'index', $params, 1);
		
        $policy = new ContentSecurityPolicy();
        $policy->addAllowedFrameDomain('\'self\'');
        $policy->addAllowedFrameDomain('data:');
        $policy->addAllowedFrameDomain('blob:');
        $policy->addAllowedObjectDomain('\'self\'');
        $policy->addAllowedObjectDomain('blob:');
        $policy->addAllowedFontDomain('data:');
        $policy->addAllowedImageDomain('*');
        $policy->addAllowedConnectDomain('data:');
        $policy->allowEvalScript(true);
        $response->setContentSecurityPolicy($policy);

        return $response;
	}

}

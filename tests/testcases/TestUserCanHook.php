<?php
require_once 'PHPUnit/Framework.php';

class TestUserCanHookSuite extends PHPUnit_Framework_TestSuite
{
	public static function suite() {
		return new TestUserCanHookSuite('TestUserCanHook');
	}
	
	protected function setUp() {
    	User::createNew("U1");
    	User::createNew("U2");
        User::createNew("U3");
        User::idFromName("U1");  
        User::idFromName("U2");  
        User::idFromName("U3");  
    	Skin::getSkinNames();
        
   		global $wgUser;
    	$wgUser = User::newFromName("U1");
    	
        $this->initArticleContent();
    	$this->createArticles();
	}
	
	protected function tearDown() {
        $this->removeArticles();
	}

	private function createArticle($title, $content) {
	
		$title = Title::newFromText($title);
		$article = new Article($title);
		// Set the article's content
		
		$success = $article->doEdit($content, 'Created for test case', 
		                            $article->exists() ? EDIT_UPDATE : EDIT_NEW);
		if (!$success) {
			echo "Creating article ".$title->getFullText()." failed\n";
		}
	}
    
	private function initArticleContent() {
		$this->mOrderOfArticleCreation = array(
			'Category:ACL/Group',
			'Category:ACL/Right',
			'Category:ACL/ACL',
			'ACL:Whitelist',
			'ACL:Page/A',
			'ACL:Page/Whitelist',
			'ACL:Category/B',
			'ACL:Category/D',
			'ACL:Namespace/User',
			'ACL:Group/G1'
		);
		
		$this->mArticles = array(
//------------------------------------------------------------------------------		
			'Category:ACL/Group' =>
<<<ACL
This is the category for groups.
ACL
,
//------------------------------------------------------------------------------		
			'Category:ACL/Right' =>
<<<ACL
This is the category for rights.
ACL
,
//------------------------------------------------------------------------------		
			'Category:ACL/ACL' =>
<<<ACL
This is the category for security descriptors.
ACL
,
			
//------------------------------------------------------------------------------		

			'ACL:Page/A' =>
<<<ACL
{{#manage rights: assigned to=User:U1}}

{{#access:
 assigned to=User:U1
|actions=*
|description= Page/A: Allow * access for U1
}}

[[Category:ACL/ACL]]

ACL
,
//------------------------------------------------------------------------------		

			'ACL:Page/Whitelist' =>
<<<ACL
{{#manage rights: assigned to=User:U1}}

{{#access:
 assigned to=User:U1
|actions=*
|description= Page/Whitelist: Allow * access for U1
}}

[[Category:ACL/ACL]]

ACL
,
//------------------------------------------------------------------------------		
			'ACL:Category/B' =>
<<<ACL
{{#manage rights: assigned to=User:U1}}

{{#access:
 assigned to=*
|actions=read
|description= Category/B: Allow read access for anonymous users
}}

[[Category:ACL/ACL]]

ACL
,
//------------------------------------------------------------------------------		
			'ACL:Category/D' =>
<<<ACL
{{#manage rights: assigned to=User:U1}}

{{#access:
 assigned to=User:U2
|actions=edit
|description= Category/D: Allow edit access for U2
}}

[[Category:ACL/ACL]]

ACL
,		
//------------------------------------------------------------------------------		
			'ACL:Whitelist' =>
<<<ACL
This is the whitelist.

{{#whitelist: pages=Whitelist}}

ACL
,
//------------------------------------------------------------------------------		

			'ACL:Namespace/User' =>
<<<ACL
{{#manage rights: assigned to=User:U1}}

{{#access:
 assigned to=User:U1
|actions=*
|description= Namespace/User: Allow * access for U1
}}

[[Category:ACL/ACL]]

ACL
,
//------------------------------------------------------------------------------		
			'ACL:Group/G1' =>
<<<ACL
{{#manage group: assigned to=User:U1}}
{{#member:members=User:U1}}

[[Category:ACL/Group]]

ACL
,
			
		);
	}

    private function createArticles() {
    	global $wgUser;
    	$wgUser = User::newFromName("U1");
    	
    	$file = __FILE__;
    	try {
	    	foreach ($this->mOrderOfArticleCreation as $title) {
	    		$pf = HACLParserFunctions::getInstance();
	    		$pf->reset();
				self::createArticle($title, $this->mArticles[$title]);
	    	}
    	} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::createArticles():".$e->getMessage());
		}
    	
    }
 
    
	private function removeArticles() {
		
		$articles = array(
			'ACL:Whitelist',
			'ACL:Page/A',
			'ACL:Category/B',
			'ACL:Category/D',
			'ACL:Page/Whitelist',
			'ACL:Namespace/User',
			'ACL:Group/G1'
			
		);
		
		foreach ($articles as $a) {
		    $t = Title::newFromText($a);
	    	$article = new Article($t);
			$article->doDelete("Testing");
		}
		
	}
	
	
}

class TestUserCanHook extends PHPUnit_Framework_TestCase {

	private $mArticles;
	private $mOrderOfArticleCreation;
	protected $backupGlobals = FALSE;
	
    function setUp() {
    }

    function tearDown() {
    }

    function testArticleAccess() {
    	$file = __FILE__;
    	try {
			$checkRights = array(
				array('A', 'U1', 'read', true),
				array('A', 'U2', 'read', false),
			);
			$this->doCheckRights("testArticleAccess", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testArticleAccess():".$e->getMessage());
		}
    }
    
    function testNamespace() {
    	$file = __FILE__;
    	try {
			$checkRights = array(
				array('User:U1', 'U1', 'read', true),
				array('User:U1', 'U2', 'read', false),
			);
			$this->doCheckRights("testNamespace", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testNamespace():".$e->getMessage());
		}
	}
    
    function testCategory() {
    	$file = __FILE__;
    	try {
			$checkRights = array(
				array('B', '*', 'read', true),
				array('B', 'U1', 'read', false),
				array('B', 'U2', 'edit', false),
				
				array('C', '*', 'read', true),
				array('C', 'U1', 'read', false),
				array('C', 'U2', 'edit', true),
				);
			$this->doCheckRights("testCategory", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testCategory():".$e->getMessage());
		}
    }
    
    function testWhitelist() {
    	$file = __FILE__;
    	try {
			$checkRights = array(
				array('Whitelist', 'U1', 'read', true),
				array('Whitelist', 'U1', 'edit', true),
				array('Whitelist', 'U2', 'read', true),
				array('Whitelist', 'U2', 'edit', false),
			);
			$this->doCheckRights("testWhitelist", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testWhitelist():".$e->getMessage());
		}
    }
    
    function testModifyGroup() {
    	$file = __FILE__;
    	try {
			$checkRights = array(
				array('ACL:Group/G1', 'U42', 'read', false),
				array('ACL:Group/G1', '*', 'read', false),
				array('ACL:Group/G1', 'U1', 'read', true),
				array('ACL:Group/G1', 'U2', 'read', true),
				array('ACL:Group/G1', 'U1', 'edit', true),
				array('ACL:Group/G1', 'WikiSysop', 'edit', true),
				array('ACL:Group/G1', 'U2', 'edit', false),
			);
			$this->doCheckRights("testModifyGroup", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testModifyGroup():".$e->getMessage());
		}
    }
    
    function testModifySD() {
   		$file = __FILE__;
    	try {
			$checkRights = array(
				array('ACL:Page/A', '*', 'read', false),
				array('ACL:Page/A', 'U1', 'read', true),
				array('ACL:Page/A', 'U2', 'read', true),
				array('ACL:Page/A', 'U1', 'edit', true),
				array('ACL:Page/A', 'WikiSysop', 'edit', true),
				array('ACL:Page/A', 'U2', 'edit', false),
			);
			$this->doCheckRights("testModifySD", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testModifySD():".$e->getMessage());
		}
    }
    
    function testModifyWhitelist() {
   		$file = __FILE__;
    	try {
			$checkRights = array(
				array('ACL:Whitelist', '*', 'read', false),
				array('ACL:Whitelist', 'U1', 'read', true),
				array('ACL:Whitelist', 'WikiSysop', 'read', true),
				array('ACL:Whitelist', 'U1', 'edit', false),
				array('ACL:Whitelist', 'WikiSysop', 'edit', true),
			);
			$this->doCheckRights("testModifyWhitelist", $checkRights);
		} catch (Exception $e) {
			$this->assertTrue(false, "Unexpected exception while testing ".basename($file)."::testModifyWhitelist():".$e->getMessage());
		}
    }
    
    
	private function doCheckRights($testcase, $expectedResults) {
		foreach ($expectedResults as $er) {
			$articleName = $er[0];
			$user = $username = $er[1];
			$action = $er[2];
			$res = $er[3];
			
			$etc = haclfDisableTitlePatch();			
			$article = Title::newFromText($articleName);
			haclfRestoreTitlePatch($etc);			
			
			$user = $user == '*' ? new User() : User::newFromName($user);
			unset($result);
			HACLEvaluator::userCan($article, $user, $action, $result);
			
			$this->assertEquals($res, $result, "Test of rights failed for: $article, $username, $action (Testcase: $testcase)\n");
			
		}
	}
	
}
?>
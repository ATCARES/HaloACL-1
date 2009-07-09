<?php
/*  Copyright 2009, ontoprise GmbH
*  This file is part of the HaloACL-Extension.
*
*   The HaloACL-Extension is free software; you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation; either version 3 of the License, or
*   (at your option) any later version.
*
*   The HaloACL-Extension is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * This file contains a filter for query results.
 * 
 * @author Thomas Schweitzer
 * Date: 16.06.2009
 * 
 */
if ( !defined( 'MEDIAWIKI' ) ) {
	die( "This file is part of the HaloACL extension. It is not a valid entry point.\n" );
}

 //--- Includes ---
 global $haclgIP;
//require_once("$haclgIP/...");

/**
 * This class filters protected pages from a query result.
 * 
 * @author Thomas Schweitzer
 * 
 */
class  HACLResultFilter  {
	
	//--- Constants ---
//	const XY= 0;		// the result has been added since the last time
		
	//--- Private fields ---
	private $mXY;    		//string: comment
	
	/**
	 * Constructor for  HACLResultFilter
	 *
	 * @param type $param
	 * 		Name of the notification
	 */		
	function __construct() {
//		$this->mXY = $xy;
	}
	

	//--- getter/setter ---
//	public function getXY()           {return $this->mXY;}

//	public function setXY($xy)               {$this->mXY = $xy;}
	
	//--- Public methods ---
	
	
	/**
	 * This callback function for the parser hook "FilterQueryResults" removes
	 * all protected pages from a query result.
	 *
	 * @param SMWQueryResult $qr
	 * 		The query result that is modified
	 */
	public static function filterResult(SMWQueryResult &$qr) {
		$msgAdded = false;
		$newqr = SMWQueryResult::newFromQueryResult($qr);
        while ( $row = $qr->getNext() ) {
			$newRow = array();
			$firstField = true;
            foreach ($row as $field) {
                $pr = $field->getPrintRequest();
                $values = array();
                $fieldEmpty = true;
                while ( ($object = $field->getNextObject()) !== false ) {
                	$allowed = true;
                	if ($object->getTypeID() == '_wpg') {
	                	// Link to another page which might be protected
	                	global $wgUser;
	                	wfRunHooks('userCan',
				                	array($object->getTitle(),
				                		  &$wgUser, "read", &$allowed));
	                }
	                if ($allowed) {
	                	$values[] = $object;
	                	$fieldEmpty = false;
	                } else {
	                	if (!$msgAdded) {
	                		$newqr->addErrors(array(wfMsgForContent('hacl_sp_results_removed')));
	                		$msgAdded = true;
	                	}
	                }
                }
                if ($fieldEmpty && $firstField) {
                	// The first field (subject) of the row is empty 
                	// => skip the complete row
                	break;
                }
	            $newRow[] = new SMWResultArray($values, $pr);
				$firstField = false;
            }
            if (!empty($newRow)) {
            	$newqr->addRow($newRow);
            }
        }
        $qr = $newqr;
                	
		return true;
	}
	//--- Private methods ---
}
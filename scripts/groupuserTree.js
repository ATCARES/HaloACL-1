
//var clickedTreeNodes = [];


function dump(arr,level) {
    var dumped_text = "";
    if(!level) level = 0;

    //The padding given at the beginning of the line.
    var level_padding = "";
    for(var j=0;j<level+1;j++) level_padding += "    ";

    if(typeof(arr) == 'object') { //Array/Hashes/Objects
        for(var item in arr) {
            var value = arr[item];

            if(typeof(value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value,level+1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
    }
    return dumped_text;
}


// defining customnode
YAHOO.widget.CustomNode = function(oData, oParent, expanded, checked) {
    YAHOO.widget.CustomNode.superclass.constructor.call(this,oData,oParent,expanded);
    this.setUpCheck(checked || oData.checked);

};

// impl of customnode; extending textnode
YAHOO.extend(YAHOO.widget.CustomNode, YAHOO.widget.TextNode, {

    /**
     * True if checkstate is 1 (some children checked) or 2 (all children checked),
     * false if 0.
     * @type boolean
     */
    checked: false,

    /**
     * checkState
     * 0=unchecked, 1=some children checked, 2=all children checked
     * @type int
     */
    checkState: 0,

    /**
     * id of contained acl group
     * @type int
     */
    groupId: 0,


    /**
     * tree type
     * rw=read/write, r=read
     * @type string
     */
    treeType: "rw",

    /**
     * The node type
     * @property _type
     * @private
     * @type string
     * @default "TextNode"
     */
    _type: "CustomNode",

    customNodeParentChange: function() {
    //this.updateParent();
    },

    // function called from constructor
    //  -> creates/registers events
    setUpCheck: function(checked) {
        // if this node is checked by default, run the check code to update
        // the parent's display state
        if (checked && checked === true) {
            this.check();
        // otherwise the parent needs to be updated only if its checkstate
        // needs to change from fully selected to partially selected
        } else if (this.parent && 2 === this.parent.checkState) {
            this.updateParent();
        }

        // set up the custom event on the tree for checkClick

        if (this.tree && !this.tree.hasEvent("checkClick")) {
            this.tree.createEvent("checkClick", this.tree);
        }
        this.tree.subscribe('clickEvent',this.checkClick);
				
        this.subscribe("parentChange", this.customNodeParentChange);
       
    },


    /**
     * set group id
     * @newGroupId int
     */
    setGroupId: function(newGroupId) {
        this.groupId = newGroupId;
    },

    /**
     * get group id
     */
    getGroupId: function() {
        return this.groupId;
    },

    /**
     * The id of the check element
     * @for YAHOO.widget.CustomNode
     * @type string
     */
    getCheckElId: function() { 
        return "ygtvcheck" + this.index; 
    },

    /**
     * Returns the check box element
     * @return the check html element (img)
     */
    getCheckEl: function() { 
        return document.getElementById(this.getCheckElId()); 
    },

    /**
     * The style of the check element, derived from its current state
     * @return {string} the css style for the current check state
     */
    getCheckStyle: function() { 
        return "ygtvcheck" + this.checkState;
    },


    /**
     * Invoked when the user clicks the check box
     */
    checkClick: function(oArgs) {
        var node = oArgs.node;
        var target = YAHOO.util.Event.getTarget(oArgs.event);
        if (YAHOO.util.Dom.hasClass(target,'ygtvspacer')) {
            if (node.checkState === 0) {
                node.check();
            } else {
                node.uncheck();
            }

            node.onCheckClick(node);
            this.fireEvent("checkClick", node);
            return false;
        }

    },

    


    /**
     * Override to get the check click event
     */
    onCheckClick: function() { 
    },

    /**
     * Refresh the state of this node's parent, and cascade up.
     */
    updateParent: function() { 
        var p = this.parent;

        if (!p || !p.updateParent) {
            return;
        }

        var somethingChecked = false;
        var somethingNotChecked = false;

        for (var i=0, l=p.children.length;i<l;i=i+1) {

            var n = p.children[i];

            if ("checked" in n) {
                if (n.checked) {
                    somethingChecked = true;
                    // checkState will be 1 if the child node has unchecked children
                    if (n.checkState === 1) {
                        somethingNotChecked = true;
                    }
                } else {
                    somethingNotChecked = true;
                }
            }
        }

        if (somethingChecked) {
            p.setCheckState( (somethingNotChecked) ? 1 : 2 );
        } else {
            p.setCheckState(0);
        }

        p.updateCheckHtml();
        p.updateParent();
    },

    /**
     * If the node has been rendered, update the html to reflect the current
     * state of the node.
     */
    updateCheckHtml: function() { 
        if (this.parent && this.parent.childrenRendered) {
            this.getCheckEl().className = this.getCheckStyle();
        }
    },

    /**
     * Updates the state.  The checked property is true if the state is 1 or 2
     * 
     * @param the new check state
     */
    setCheckState: function(state) { 
        this.checkState = state;
        this.checked = (state > 0);
        //this.tree.clickedTreeNodes[this.groupId] = this.checked;
        // this.tree.clickedHandler.add(this.groupId);
        YAHOO.haloacl.clickedArray[this.tree.panelid][this.groupId] = this.checked;

        // update usertable
        YAHOO.haloacl.checkAlreadySelectedUsersInDatatable(this.tree.panelid);

    },

    /**
     * Updates the state.  The checked property is true if the state is 1 or 2
     *
     * @param the new check state
     */
    getLabelElId: function() {
        return this.labelElId;
    },

    /**
     * Check this node
     */
    check: function() {
        this.setCheckState(2);
        for (var i=0, l=this.children.length; i<l; i=i+1) {
            var c = this.children[i];
            if (c.check) {
                c.check();
            }
        }
        this.updateCheckHtml();
        this.updateParent();
    },

    /**
     * Uncheck this node
     */
    uncheck: function() { 
        this.setCheckState(0);
        for (var i=0, l=this.children.length; i<l; i=i+1) {
            var c = this.children[i];
            if (c.uncheck) {
                c.uncheck();
            }
        }
        this.updateCheckHtml();
        this.updateParent();
    },
    
    setTreeType: function(newTreeType) { 
        this.treeType = newTreeType
    },


    // Overrides YAHOO.widget.TextNode
    getContentHtml: function() {                                                                                                                                           
        var sb = [];

        if (this.treeType=="rw") {
            sb[sb.length] = '<td';
            sb[sb.length] = ' id="' + this.getCheckElId() + '"';
            sb[sb.length] = ' class="' + this.getCheckStyle() + '"';
            sb[sb.length] = '>';
            sb[sb.length] = '<div class="ygtvspacer"></div></td>';

            sb[sb.length] = '<td><span';
            sb[sb.length] = ' id="' + this.labelElId + '"';
            if (this.title) {
                sb[sb.length] = ' title="' + this.title + '"';
            }
            sb[sb.length] = ' class="' + this.labelStyle  + '"';
            sb[sb.length] = ' >';
            sb[sb.length] = "<a href='javascript:"+this.tree.labelClickAction+"(\""+this.label+"\");'>"+this.label+"</a>";

            sb[sb.length] = '</span></td>';

        } else {
            sb[sb.length] = '<td>';
            sb[sb.length] = '<div class="ygtvspacer"></div></td>';

            sb[sb.length] = '<td><span';
            sb[sb.length] = ' id="' + this.labelElId + '"';
            if (this.title) {
                sb[sb.length] = ' title="' + this.title + '"';
            }
            sb[sb.length] = ' class="' + this.labelStyle  + '"';
            sb[sb.length] = ' >';
            sb[sb.length] = "<a href='javascript:"+this.tree.labelClickAction+"(\""+this.label+"\");'>"+this.label+"</a>";

            sb[sb.length] = '</span></td>';
            
            sb[sb.length] = '<td';
            sb[sb.length] = ' id="' + this.getCheckElId() + '"';
            sb[sb.length] = ' class="' + this.getCheckStyle() + '"';
            sb[sb.length] = '>';
            sb[sb.length] = '<div class="ygtvspacer"></div></td>';


        }

        
        return sb.join("");                                                                                                                                                
    }  
});



/*
 * treeview-dataconnect
 * @param mediawiki / rs-action
 * @param list (object) of parameters to be added
 * @param callback for asyncRequest
 */
YAHOO.haloacl.treeviewDataConnect = function(action,parameterlist,callback){
    var url= "?action=ajax";
    var appendedParams = '';
    appendedParams = '&rs='+action;
    var temparray = new Array();
    for(param in parameterlist){
        temparray.push(parameterlist[param]);
    }
    appendedParams = appendedParams + "&rsargs="+ temparray;
    YAHOO.util.Connect.asyncRequest('POST', url, callback,appendedParams);
};

/*
 * function for dynamic node-loading
 * @param node
 * @parm callback on complete
 */
YAHOO.haloacl.loadNodeData = function(node, fnLoadComplete)  {

    var nodeLabel = encodeURI(node.label);


    //prepare our callback object
    var callback = {
        panelid:"",

        //if our XHR call is successful, we want to make use
        //of the returned data and create child nodes.
        success: function(oResponse) {
            YAHOO.haloacl.buildNodesFromData(node,YAHOO.lang.JSON.parse(oResponse.responseText,panelid));
            oResponse.argument.fnLoadComplete();
        },

        failure: function(oResponse) {
            oResponse.argument.fnLoadComplete();
        },
        argument: {
            "node": node,
            "fnLoadComplete": fnLoadComplete
        },
        timeout: 7000
    };
    YAHOO.haloacl.treeviewDataConnect('getGroupsForRightPanel',{
        query:nodeLabel
    },callback);

};





/*
 * function to build nodes from data
 * @param parent node / root
 * @param data
 */
YAHOO.haloacl.buildNodesFromData = function(parentNode,data,panelid){

    for(var i= 0, len = data.length; i<len; ++i){
        var element = data[i];
        var tmpNode = new YAHOO.widget.CustomNode(element.name, parentNode,false);
        
        //tmpNode.setGroupId(element.id);
        // using name instead of id
        tmpNode.setGroupId(element.name);

        // check checkbox if during this js-session it has been checked
        if(panelid){
            //if (YAHOO.haloacl.clickedArray[panelid][element.id]) tmpNode.check();
            //also using name instead of id
            if (YAHOO.haloacl.clickedArray[panelid][element.name]) tmpNode.check();
        }
    };
    YAHOO.haloacl.checkAlreadySelectedUsersInDatatable(panelid);

};


/*
 * filter tree
 * @param parent node / root
 * @param filter String
 */
YAHOO.haloacl.filterNodes = function(parentNode,filter){

    var nodes;
    nodes = parentNode.children;

    for(var i=0, l=nodes.length; i<l; i=i+1) {
        var n = nodes[i];

        if (n.label.indexOf(filter) < 0) {
            document.getElementById(n.getLabelElId()).parentNode.parentNode.style.display = "none";
        } else {
            document.getElementById(n.getLabelElId()).parentNode.parentNode.style.display = "inline";
        }
        
    /*
        if (n.checkState > 0) {
            var tmpNode = new YAHOO.widget.CustomNode(n.label, rwTree.getRoot(),false);
            tmpNode.setCheckState(n.checkState);
            tmpNode.setTreeType("r");
        }
        */

    }

};

/*
 * function to build user tree and add labelClickAction
 * @param tree
 * @param data
 * @param labelClickAction (name)
 */
YAHOO.haloacl.buildUserTree = function(tree,data) {

    YAHOO.haloacl.buildNodesFromData(tree.getRoot(),data,tree.panelid);

    //using custom loadNodeDataHandler
    var loadNodeData = function(node, fnLoadComplete)  {
        var nodeLabel = encodeURI(node.label);
        //prepare our callback object
        var callback = {
            panelid:"",
            success: function(oResponse) {
                YAHOO.haloacl.buildNodesFromData(node,YAHOO.lang.JSON.parse(oResponse.responseText,tree.panelid));
                oResponse.argument.fnLoadComplete();
            },
            failure: function(oResponse) {
                oResponse.argument.fnLoadComplete();
            },
            argument: {
                "node": node,
                "fnLoadComplete": fnLoadComplete
            },
            timeout: 7000
        };
        YAHOO.haloacl.treeviewDataConnect('getGroupsForRightPanel',{
            query:nodeLabel
        },callback);

    };



    tree.setDynamicLoad(loadNodeData);
    tree.draw();

};


/*
 * builds mirrored, read only user tree for "assigned" panel from existing r/w user tree in "select" panel
 * @param tree
 * @param rwTree
 */
YAHOO.haloacl.buildUserTreeRO = function(tree,rwTree) {

    var nodes;
    nodes = tree.getRoot().children;

    for(var i=0, l=nodes.length; i<l; i=i+1) {
        var n = nodes[i];

        if (n.checkState > 0) {
            var tmpNode = new YAHOO.widget.CustomNode(n.label, rwTree.getRoot(),false);
            tmpNode.setCheckState(n.checkState);
            tmpNode.setTreeType("r");
        }

    }

    rwTree.draw();

};


/*
 * function to be called from outside to init a tree
 * @param tree-instance
 */
YAHOO.haloacl.buildTreeFirstLevelFromJson = function(tree){
    var callback = {
        success: function(oResponse) {
            var data = YAHOO.lang.JSON.parse(oResponse.responseText);
            YAHOO.haloacl.buildUserTree(tree,data);
        },
        failure: function(oResponse) {
        }
    };
    YAHOO.haloacl.treeviewDataConnect('getGroupsForRightPanel',{
        query:'all'
    },callback);
};

/*
 * returns checked nodes
 * USE ONE OF BOTH PARAMS, so ONE HAS TO BE NULL
 *
 * @param tree
 * @param nodes
 */
YAHOO.haloacl.getCheckedNodesFromTree = function(tree, nodes){
    if(nodes == null){
        nodes = tree.getRoot().children;
    }
    checkedNodes = [];
    for(var i=0, l=nodes.length; i<l; i=i+1) {
        var n = nodes[i];
        //if (n.checkState > 0) { // if we were interested in the nodes that have some but not all children checked
        if (n.checkState === 2) {
            checkedNodes.push(n.label); // just using label for simplicity
        }

        if (n.hasChildren()) {
            checkedNodes = checkedNodes.concat(YAHOO.haloacl.getCheckedNodesFromTree(null, n.children));
        }
    }

    return checkedNodes;
};


/**
 * returns a new treeinstance
 */
YAHOO.haloacl.getNewTreeview = function(divname,panelid){
    var instance = new YAHOO.widget.TreeView(divname);
    instance.panelid = panelid;
    if(!YAHOO.haloacl.clickedArray[panelid]){
        YAHOO.haloacl.clickedArray[panelid] = new Array();
    }
    return instance;
};


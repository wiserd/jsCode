/**
 * This is the MPM Search page for IPR
 * It captures hash routes at /#mpm
 * and renders the html view found in
 * views/scripts/html/mpmpage.phtml
 */
/*global portal*/
/*jslint jquery:true,browser:true*/
portal.registerComponent({
    type: "view",
    module: "ipr",
    name: "ESSearchPage",
    nav: true,
    unique: true,
    hash: "search",
    title: "CTaM Search",
    templateData: {},
    templateSettings: { variable: "data" },
    page: 1,
    pageSize: 10,
    sort: ["_score"],
    searchTerms: "",
    facets: {
        type: [],
        source: [],
        status: [],
        characterType: [],
        titleType: [],
        worldType: []
    },
    facetFields: {
        source: "owner_business_unit",
        status: "status",
        characterType: ipr.ipType.character.filter + ".type_id",
        titleType: ipr.ipType.title.filter + ".type_id",
        worldType: ipr.ipType.world.filter + ".type_id"
    },
    defaultTypeFilter: ipr.searchableTypes.map(function (type) { return type.filter; }),
    initialize: function () { },
    preRender: function () {
        $("body").addClass("noresults");
        $("header .searchForm").hide();
    },
    isExpressionIPID: function (term) {
        var IPIDregex = /^IP[0-9]{16}$/;
        term = term.trim();

        if (IPIDregex.test(term))  // if we have a single ipid
        {                          // then we test to see if it is an expression ID. If so, we forward people to the expression page
            $.ajax("/services/v1/expression/" + term, 
            {
                method: "get",
                global: false, // to repress errors, or else titles and characters will throw errors
                success: function (response) 
                {
                  location.replace("#" + ipr.ipType.expression.page + "/" + term);
                  return true;
                },
                error: function (xhr, status, message)
                {
                    //tested IPID is not an expression. It might be a title or character. This commented out code will also take someone to 
                    // the title or character pages if IPIDs for those are entered. 
                    /*
                    var dsl =
                    {
                        "query": 
                        {
                            "multi_match":
                            {
                                    "query": term,
                                    "fields": ["ipid"]
                            }
                        }
                    };
                   
                    $.ajax("/services/v1/es/ipr/search/" , 
                    {
                        method: "post",
                        global: false, // to repress errors, or else titles and characters will throw their 404 errors to the UI
                        data: JSON.stringify(dsl),
                        contentType: "application/json",
                        success: function (response) {

                            if (response.hits.hits)
                            {
                                location.replace("#" + response.hits.hits[0]._type.slice(4) + "/" + term);
                                return true;
                            }
                            
                        },
                        error: function (xhr, status, message) {}//"No results returned for relevant IPID. This is a check, not an actual error"
                    });
                    */
                }

            });
   
       

        }
    },

    postRender: function () {

        // some refineSearchElements in factes have incorrect classes. Icons/Logos, Base Character, etc.
        var view = this;
        portal.getView("ipr", "PreFilters", { el: this.$(".preFilter") }).render();
        var $facets = this.$(".facets"); // was just facets, no $. Make sure no errors due to failing to update after this correction. 8/13/2014
        var $facetsContainer = this.$("#facetsContainer");  
        var $mouseoutBackground = $("#mouseoutDiv"); 
 		var $facetsButton = this.$("#facetsButton");
        var $refineSearchElement;// declared when it is added to the dom after timeout
        var $currentFilters = $("#currentFilters");

           setTimeout(function(){ // we cannot interact with refineSearchElements without this timeout 
                $refineSearchElement =  $(".refineSearchElement");
                $refineSearchElement.off("mouseup", null).on( "mouseup", null, null, function ()
                { 
                    facetRefineClick(this);
                });

                $refineSearchElement.filter(".selected").each( function(index, value)
                {
                    var end = $(value).text().indexOf(" (");
                    var className = $(value).text().substr(0, end).replace("/", "").replace(/ /g,'').replace(" ",'').trim();
                    className = className.replace("&nbsp;", "");
                    $currentFilters.append("<div class=\"currentFiltersListed "+  className +"\">"+ $(value).text() );
                    $(".currentFiltersListed").on("mouseup"+"." +className, null, this, function (){
                        currentFiltersRemove(this);
                    });
                });
            }, 3000);

           function facetRefineClick(e){
                
                var end = $(e).text().indexOf(" (");
                var className = $(e).text().substr(0, end).replace("/", "").replace(/ /g,'').replace(" ",'').trim();
                className = className.replace("&nbsp;", "");
        
                // add or remove 'currentfilters' bubbles
                if (!$(e).hasClass("selected") )
                {
                    $currentFilters.append("<div class=\"currentFiltersListed "+  className +"\">"+ $(e).text() );
                    $(".currentFiltersListed").on("mouseup"+"." +className, null, this, function (){
                        currentFiltersRemove(this);
                    });
                }else{

                    $currentFiltersListed = $("#currentFilters .currentFiltersListed");
                    $currentFiltersListed.filter("." +className).remove();
                }
           }

           function currentFiltersRemove( _this){
                var end = $(_this).text().indexOf(" (");
                var classRemoved = $(_this).text().substr(0, end);
                classRemoved = classRemoved.trim();
                classRemoved = classRemoved.replace("\n", "");
                classRemoved = classRemoved.replace("/", "");
                classRemoved = classRemoved.replace(/ /g, "");
                var classMarkerForRemoval = "."+ classRemoved;
                var $currentFiltersListed = $("#currentFilters .currentFiltersListed");

                var filtered= $currentFiltersListed.filter( classMarkerForRemoval );
                filtered.remove();

               $(".refineSearchElement").filter( classMarkerForRemoval ).find("input:checkbox").prop({checked: false});
                view.submitSearch();

           }

  

        // open and close the 'refine this search' menu

        var ongoing = false;
		$facetsContainer.mouseenter( 
                function() { 
                    if (!ongoing) 
                    { 
                        ongoing = true; 
                        $facets.slideDown( 600, function(){ ongoing =false;}); 
                        $mouseoutBackground.slideDown(600, function(){ ongoing =false;}); 
                        $facetsButton.html("REFINE THIS SEARCH &#9660;"); 
                        $facetsButton.clearQueue(); $mouseoutBackground.clearQueue(); 
                    }  
                });
        $mouseoutBackground.mouseenter( function() 
        { 
            if (!ongoing) 
            {
                ongoing = true; 
                $facets.slideUp( 600, function(){ ongoing =false;}); 
                $mouseoutBackground.slideUp(600, function(){ ongoing =false;}); 
                $facetsButton.html("REFINE THIS SEARCH &#9660;"); 
                $facetsButton.clearQueue(); 
                $mouseoutBackground.clearQueue(); 
            }
        });  
           
            
		//end 'refine this search' code
        portal.getView("ipr", "Facet", {
            el: "#menuColumn3",
            templateData: { facet: "Type", literalName: "Character Filter" },
            filters: [ipr.ipType.character]
        }).render();

        portal.getView("ipr", "Facet", {
            el: "#menuColumn4",
            templateData: { facet: "Type", literalName: "Title Filter" },
            filters: [ipr.ipType.title]
        }).render();

        portal.getView("ipr", "Facet", {
            el: "#menuColumn2",
            templateData: { facet: "Type", literalName: "World Filter" },
            filters: [ipr.ipType.world]
        }).render();



        portal.getView("ipr", "Facet", {
            el: "#menuColumn2",
            templateData: { facet: "Status", literalName: "Status Filter" },
            filters: ipr.status.slice(1).map(function (s) {
                return {
                    facet: "status",
                    filter: s,
                    name: s
                };
            })
        }).render();




        this.$(".searchButton").click(function (e) {
            e.preventDefault();
            view.submitSearch();
            $("#content").addClass('.hasResults');
          
        });


              
                $(".facets [type=checkbox]").on( "click", function (e) {

                    view.submitSearch();
                });


                $("#Status").remove();// remove the placeholder
                $("#Source").remove();// remove the placeholder

        this.$("input[name=q]").val(this.searchTerms).keyup(function (e) {
            if (e.keyCode == 13) {
                view.submitSearch();
            }
        }).change(function (e) {

if (window.console){ 

                     
                    console.log("##change on button push" );  

                }//.filter( classMarkerForRemoval ).html()
               


            var value = this.value;
            view.$(".preFilter a").each(function () {
                var link = "#search";
                var qs = [];
                var filter = $(this).data("filter");
                if (filter) {
                    qs.push("type=" + filter);
                }
                if (value) {
                    qs.push("q=" + ipr.encodeQuerystringValue(value));
                }
                if (qs.length) {
                    link += "?" + qs.join("&");
                }
                this.href = link;
            });
        });
        portal.getView("ipr", "Footer", { el: view.el }).render();
    },
    submitSearch: function () {
        if (window.console){console.log("in submit search");}
        var view = this;
        this.searchTerms = this.$("input[name=q]").val().replace(/^\s+|\s+$/g, "");
        var qs = [
            "q=" + ipr.encodeQuerystringValue(this.searchTerms)
        ];

        this.facets = { type: [], source: [], status: [], characterType: [], titleType: [], worldType: [] };
        this.$(".facets :checked").each(function () {
            view.facets[this.name].push(this.value);
        });
        $.each(this.facets, function (key, value) {
            if (value.length) {
                qs.push(key + "=" + value.map(ipr.encodeQuerystringValue).join(","));
            }
        });
        portal.navigate(this.hash + "?" + qs.join("&"));
    },
    parseQuerystring: function () {
        var qs = { q: [""], type: [], source: [], status: [], page: [1] };
        location.hash.split(/[?&]/).slice(1).forEach(function (item) {
            var parts = item.split("=");
            qs[parts.shift()] = parts.shift().split(",").map(ipr.decodeQuerystringValue);
        });
        this.searchTerms = qs.q.join(" ");
        this.facets = {
            type: qs.type || [],
            source: qs.source || [],
            status: qs.status || [],
            characterType: qs.characterType || [],
            worldType: qs.worldType || [],
            titleType: qs.titleType || []
        };
        this.page = +qs.page.join(" ");
    },
    setFormValues: function () {

        var view = this;
        $("body").toggleClass("noresults", !this.searchTerms);
        $(".searchForm, .search").find("input[name=q]").val(this.searchTerms);
       
        this.$(".facets [type=checkbox]").each(function () {
  
            this.checked = view.facets[this.name].indexOf(this.value) > -1;
            $(this).parent().toggleClass("selected", this.checked);













        });
        $(".preFilter a").not("[data-filter]").toggleClass("selected", view.facets.type.length % 4 === 0);
        var typeLinks = $(".preFilter a[data-filter]").removeClass("selected");
        if (view.facets.type.length % 4) {
            typeLinks.filter(function () {
                return view.facets.type.indexOf($(this).data("filter")) > -1;
            }).addClass("selected");
        }
    },
    createTermsFilter: function (facetName) {
        var terms = this.facets[facetName];
        if (!terms.length) {
            return null;
        }
        var filter = { terms: {} };
        filter.terms[this.facetFields[facetName]] = terms;
        return filter;
    },
    createTypeFilter: function () {
        var types = this.facets.type;
        if (!types.length) {
            types = this.defaultTypeFilter;
        }
        return {
            bool: {
                should: types.map(function (type) {
                    return { type: { value: type } };
                })
            }
        };
    },
    addDSLFilter: function (filters, facetName) {
        var filter = this.createTermsFilter(facetName);
        if (filter) {
            filters.forEach(function (f) {
                f.bool.must.push(filter);
            });
        }
    },
    search: function () {

        var view = this;
        this.parseQuerystring();
        this.setFormValues();
        if (!this.searchTerms) {
            return;
        }
        var fields;
        try {
            fields = JSON.parse($("#ipr_search_fields").val());
        }
        catch (err) {
            fields = null;
        }
        fields = fields || ["name.whole_name^3", "full_name.whole_name^2", "full_name^2", "name^2", "description^1.5", "ipid"];
        var typeFilter = this.createTypeFilter();

        var dsl = {
            query: {
                boosting: {
                    positive: {
                        query_string: {
                            query: this.searchTerms,
                            fields: fields
                        }
                    },
                    negative: { terms: { type: ["MPM Character"] } },
                    negative_boost: 0.2
                }
            },
            indices_boost: ipr.indicesBoost,
            filter: { bool: { must: [typeFilter] } },
            facets: {
                type: {
                    terms: { field: "_type" },
                    facet_filter: { bool: { must: [] } }
                },
                source: {
                    terms: { field: this.facetFields.source },
                    facet_filter: { bool: { must: [typeFilter] } }
                },
                status: {
                    terms: { field: this.facetFields.status },
                    facet_filter: { bool: { must: [typeFilter] } }
                },
                characterType: {
                    terms: { field: this.facetFields.characterType },
                    facet_filter: { bool: { must: [typeFilter] } }
                },
                titleType: {
                    terms: { field: this.facetFields.titleType },
                    facet_filter: { bool: { must: [typeFilter] } }
                },
                worldType: {
                    terms: { field: this.facetFields.worldType },
                    facet_filter: { bool: { must: [typeFilter] } }
                }
            },
            size: this.pageSize,
            from: (this.page - 1) * this.pageSize,
            sort: this.sort
        };

       
        this.addDSLFilter([dsl.filter, dsl.facets.type.facet_filter, dsl.facets.status.facet_filter, dsl.facets.characterType.facet_filter, dsl.facets.titleType.facet_filter, dsl.facets.worldType.facet_filter], "source");
        this.addDSLFilter([dsl.filter, dsl.facets.type.facet_filter, dsl.facets.source.facet_filter, dsl.facets.characterType.facet_filter, dsl.facets.titleType.facet_filter, dsl.facets.worldType.facet_filter], "status");
        this.addDSLFilter([dsl.filter, dsl.facets.type.facet_filter, dsl.facets.status.facet_filter, dsl.facets.source.facet_filter, dsl.facets.titleType.facet_filter, dsl.facets.worldType.facet_filter], "characterType");
        this.addDSLFilter([dsl.filter, dsl.facets.type.facet_filter, dsl.facets.status.facet_filter, dsl.facets.source.facet_filter, dsl.facets.characterType.facet_filter, dsl.facets.worldType.facet_filter], "titleType");
        this.addDSLFilter([dsl.filter, dsl.facets.type.facet_filter, dsl.facets.status.facet_filter, dsl.facets.source.facet_filter, dsl.facets.characterType.facet_filter], "worldType");

        if (dsl.facets.type.facet_filter.bool.must.length === 0) {
            delete dsl.facets.type.facet_filter;
        }

        if (this.isExpressionIPID(this.searchTerms)) { return;}//if the only search term is an IPID for an expression, the page is navigated to that expression, over-riding the search


        $.ajax("/services/v1/es/ipr/search", {
            method: "post",
            contentType: "application/json",
            data: JSON.stringify(dsl),
            success: function (response) {
                view.$(".totalResults").text("SHOWING 10 (of " + response.hits.total + ") RESULTS");
                view.$(".searchResults,.paging .pageNumbers").empty();
                response.hits.hits.forEach(function (hit) {
                    var ipItem = hit._source;
                    ipItem.ipType = ipr.ipTypeList.filter(function (type) { return type.filter == hit._type; })[0];
                    ipItem.source = hit._source.owner_business_unit || hit._source.business_unit || "";
                    ipItem.parent = ipr.getParent(ipItem.related_characters || ipItem.related_titles);
                    portal.getView("ipr", "SearchResult", {
                        el: $("<div>").appendTo(view.$(".searchResults")),
                        templateData: hit._source
                    }).render();
                });



         
                var checkboxes = view.$(":checkbox");
                checkboxes.siblings(".count").text(0).parent().addClass("unavailable");

                $.each(response.facets, function (name, facet) {
                    var facetCheckboxes = checkboxes.filter("[name=" + name + "]");
                    facet.terms.forEach(function (item) {
                        facetCheckboxes.filter("[value='" + item.term + "']").siblings(".count").text(item.count).parent().removeClass("unavailable");
                    });
                });

                //end test

                var paging = view.$(".paging");
                var pageNumbers = paging.find(".pageNumbers");
                var pageLink = location.hash.replace(/&page=[^&]*/, "") + "&page=";
                var lastPage = Math.ceil(response.hits.total / view.pageSize);
                var firstPageNumber = Math.max(1, Math.min(view.page - 5, lastPage - 10));
                var lastPageNumber = Math.min(Math.max(view.page + 5, 10), lastPage);
                paging.find(".first").toggle(firstPageNumber > 1).find("a").prop({ href: pageLink + "1" }).next(".elipsis").toggle(firstPageNumber > 2);
                paging.find(".last").toggle(lastPage > lastPageNumber).find("a").prop({ href: pageLink + lastPage }).text(lastPage).prev(".elipsis").toggle(lastPage > lastPageNumber + 1);
                if (lastPage > 1) {
                    for (var i = firstPageNumber; i <= lastPageNumber; i++) {
                        pageNumbers.append($("<a>", { href: pageLink + i }).toggleClass("current", view.page == i).text(i), " ");
                    }
                }
            }
        });

        //this.isExpressionIPID(this.searchTerms);//if the only search term is an IPID for an expression, the page is navigated to that expression, over-riding the search
    }// search fxn. 
});
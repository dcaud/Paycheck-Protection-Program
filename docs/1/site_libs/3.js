
function is_downlevel_browser() {
  if (bowser.isUnsupportedBrowser({ msie: "12", msedge: "16"},
                                  window.navigator.userAgent)) {
    return true;
  } else {
    return window.load_distill_framework === undefined;
  }
}

// show body when load is complete
function on_load_complete() {
  
  // add anchors
  if (window.anchors) {
    window.anchors.options.placement = 'left';
    window.anchors.add('d-article > h2, d-article > h3, d-article > h4, d-article > h5');
  }
  
  
  // set body to visible
  document.body.style.visibility = 'visible';
  
  // force redraw for leaflet widgets
  if (window.HTMLWidgets) {
    var maps = window.HTMLWidgets.findAll(".leaflet");
    $.each(maps, function(i, el) {
      var map = this.getMap();
      map.invalidateSize();
      map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer)
          layer.redraw();
      });
    });
  }
  
  // trigger 'shown' so htmlwidgets resize
  $('d-article').trigger('shown');
}

function init_distill() {
  
  init_common();
  
  // create front matter
  var front_matter = $('<d-front-matter></d-front-matter>');
  $('#distill-front-matter').wrap(front_matter);
  
  // create d-title
  $('.d-title').changeElementType('d-title');
  
  // create d-byline
  var byline = $('<d-byline></d-byline>');
  $('.d-byline').replaceWith(byline);
  
  // create d-article
  var article = $('<d-article></d-article>');
  $('.d-article').wrap(article).children().unwrap();
  
  // move posts container into article
  $('.posts-container').appendTo($('d-article'));
  
  // create d-appendix
  $('.d-appendix').changeElementType('d-appendix');
  
  // flag indicating that we have appendix items
  var appendix = $('.appendix-bottom').children('h3').length > 0;
  
  // replace footnotes with <d-footnote>
    $('.footnote-ref').each(function(i, val) {
      appendix = true;
      var href = $(this).attr('href');
      var id = href.replace('#', '');
      var fn = $('#' + id);
      var fn_p = $('#' + id + '>p');
      fn_p.find('.footnote-back').remove();
      var text = fn_p.html();
      var dtfn = $('<d-footnote></d-footnote>');
      dtfn.html(text);
      $(this).replaceWith(dtfn);
    });
  // remove footnotes
  $('.footnotes').remove();
  
  // move refs into #references-listing
  $('#references-listing').replaceWith($('#refs'));
  
  $('h1.appendix, h2.appendix').each(function(i, val) {
    $(this).changeElementType('h3');
  });
  $('h3.appendix').each(function(i, val) {
    var id = $(this).attr('id');
    $('.d-contents a[href="#' + id + '"]').parent().remove();
    appendix = true;
    $(this).nextUntil($('h1, h2, h3')).addBack().appendTo($('d-appendix'));
  });
  
  // show d-appendix if we have appendix content
  $("d-appendix").css('display', appendix ? 'grid' : 'none');
  
  // localize layout chunks to just output
  $('.layout-chunk').each(function(i, val) {
    
    // capture layout
    var layout = $(this).attr('data-layout');
    
    // apply layout to markdown level block elements
    var elements = $(this).children().not('div.sourceCode, pre, script');
    elements.each(function(i, el) {
      var layout_div = $('<div class="' + layout + '"></div>');
      if (layout_div.hasClass('shaded')) {
        var shaded_content = $('<div class="shaded-content"></div>');
        $(this).wrap(shaded_content);
        $(this).parent().wrap(layout_div);
      } else {
        $(this).wrap(layout_div);
      }
    });
    
    
    // unwrap the layout-chunk div
    $(this).children().unwrap();
  });
  
  // remove code block used to force  highlighting css
  $('.distill-force-highlighting-css').parent().remove();
  
  // remove empty line numbers inserted by pandoc when using a
  // custom syntax highlighting theme
  $('code.sourceCode a:empty').remove();
  
  // load distill framework
  load_distill_framework();
  
  // wait for window.distillRunlevel == 4 to do post processing
  function distill_post_process() {
    
    if (!window.distillRunlevel || window.distillRunlevel < 4)
      return;
    
    // hide author/affiliations entirely if we have no authors
    var front_matter = JSON.parse($("#distill-front-matter").html());
    var have_authors = front_matter.authors && front_matter.authors.length > 0;
    if (!have_authors)
      $('d-byline').addClass('hidden');
    
    // article with toc class
    $('.d-contents').parent().addClass('d-article-with-toc');
    
    // strip links that point to #
    $('.authors-affiliations').find('a[href="#"]').removeAttr('href');
    
    // add orcid ids
    $('.authors-affiliations').find('.author').each(function(i, el) {
      var orcid_id = front_matter.authors[i].orcidID;
      if (orcid_id) {
        var a = $('<a></a>');
        a.attr('href', 'https://orcid.org/' + orcid_id);
        var img = $('<img></img>');
        img.addClass('orcid-id');
        img.attr('alt', 'ORCID ID');
        img.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1N0NEMjA4MDI1MjA2ODExOTk0QzkzNTEzRjZEQTg1NyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozM0NDOEJGNEZGNTcxMUUxODdBOEVCODg2RjdCQ0QwOSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozM0NDOEJGM0ZGNTcxMUUxODdBOEVCODg2RjdCQ0QwOSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkZDN0YxMTc0MDcyMDY4MTE5NUZFRDc5MUM2MUUwNEREIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjU3Q0QyMDgwMjUyMDY4MTE5OTRDOTM1MTNGNkRBODU3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+84NovQAAAR1JREFUeNpiZEADy85ZJgCpeCB2QJM6AMQLo4yOL0AWZETSqACk1gOxAQN+cAGIA4EGPQBxmJA0nwdpjjQ8xqArmczw5tMHXAaALDgP1QMxAGqzAAPxQACqh4ER6uf5MBlkm0X4EGayMfMw/Pr7Bd2gRBZogMFBrv01hisv5jLsv9nLAPIOMnjy8RDDyYctyAbFM2EJbRQw+aAWw/LzVgx7b+cwCHKqMhjJFCBLOzAR6+lXX84xnHjYyqAo5IUizkRCwIENQQckGSDGY4TVgAPEaraQr2a4/24bSuoExcJCfAEJihXkWDj3ZAKy9EJGaEo8T0QSxkjSwORsCAuDQCD+QILmD1A9kECEZgxDaEZhICIzGcIyEyOl2RkgwAAhkmC+eAm0TAAAAABJRU5ErkJggg==');
        a.append(img);
        $(this).append(a);
      }
    });
    
    // hide elements of author/affiliations grid that have no value
    function hide_byline_column(caption) {
      $('d-byline').find('h3:contains("' + caption + '")').parent().css('visibility', 'hidden');
    }
    
    // affiliations
    var have_affiliations = false;
    for (var i = 0; i<front_matter.authors.length; ++i) {
      var author = front_matter.authors[i];
      if (author.affiliation !== "&nbsp;") {
        have_affiliations = true;
        break;
      }
    }
    if (!have_affiliations)
      $('d-byline').find('h3:contains("Affiliations")').css('visibility', 'hidden');
    
    // published date
    if (!front_matter.publishedDate)
      hide_byline_column("Published");
    
    // document object identifier
    var doi = $('d-byline').find('h3:contains("DOI")');
    var doi_p = doi.next().empty();
    if (!front_matter.doi) {
      // if we have a citation and valid citationText then link to that
      if ($('#citation').length > 0 && front_matter.citationText) {
        doi.html('Citation');
        $('<a href="#citation"></a>')
        .text(front_matter.citationText)
        .appendTo(doi_p);
      } else {
        hide_byline_column("DOI");
      }
    } else {
      $('<a></a>')
      .attr('href', "https://doi.org/" + front_matter.doi)
      .html(front_matter.doi)
      .appendTo(doi_p);
    }
    
    // change plural form of authors/affiliations
    if (front_matter.authors.length === 1) {
      var grid = $('.authors-affiliations');
      grid.children('h3:contains("Authors")').text('Author');
      grid.children('h3:contains("Affiliations")').text('Affiliation');
    }
    
    // remove d-appendix and d-footnote-list local styles
    $('d-appendix > style:first-child').remove();
    $('d-footnote-list > style:first-child').remove();
    
    // move appendix-bottom entries to the bottom
    $('.appendix-bottom').appendTo('d-appendix').children().unwrap();
    $('.appendix-bottom').remove();
    
    // clear polling timer
    clearInterval(tid);
    
    // show body now that everything is ready
    on_load_complete();
  }
  
  var tid = setInterval(distill_post_process, 50);
  distill_post_process();
  
}

function init_downlevel() {
  
  init_common();
  
  // insert hr after d-title
  $('.d-title').after($('<hr class="section-separator"/>'));
  
  // check if we have authors
  var front_matter = JSON.parse($("#distill-front-matter").html());
  var have_authors = front_matter.authors && front_matter.authors.length > 0;
  
  // manage byline/border
  if (!have_authors)
    $('.d-byline').remove();
  $('.d-byline').after($('<hr class="section-separator"/>'));
  $('.d-byline a').remove();
  
  // remove toc
  $('.d-contents').remove();
  
  // move appendix elements
  $('h1.appendix, h2.appendix').each(function(i, val) {
    $(this).changeElementType('h3');
  });
  $('h3.appendix').each(function(i, val) {
    $(this).nextUntil($('h1, h2, h3')).addBack().appendTo($('.d-appendix'));
  });
  
  
  // inject headers into references and footnotes
  var refs_header = $('<h3></h3>');
  refs_header.text('References');
  $('#refs').prepend(refs_header);
  
  var footnotes_header = $('<h3></h3');
  footnotes_header.text('Footnotes');
  $('.footnotes').children('hr').first().replaceWith(footnotes_header);
  
  // move appendix-bottom entries to the bottom
  $('.appendix-bottom').appendTo('.d-appendix').children().unwrap();
  $('.appendix-bottom').remove();
  
  // remove appendix if it's empty
    if ($('.d-appendix').children().length === 0)
      $('.d-appendix').remove();
  
    // prepend separator above appendix
    $('.d-appendix').before($('<hr class="section-separator" style="clear: both"/>'));
  
    // trim code
    $('pre>code').each(function(i, val) {
      $(this).html($.trim($(this).html()));
    });
  
    // move posts-container right before article
    $('.posts-container').insertBefore($('.d-article'));
  
    $('body').addClass('downlevel');
  
    on_load_complete();
  }
  
  
  function init_common() {
  
    // jquery plugin to change element types
    (function($) {
      $.fn.changeElementType = function(newType) {
        var attrs = {};
  
        $.each(this[0].attributes, function(idx, attr) {
          attrs[attr.nodeName] = attr.nodeValue;
        });
  
        this.replaceWith(function() {
          return $("<" + newType + "/>", attrs).append($(this).contents());
        });
      };
    })(jQuery);
  
    // prevent underline for linked images
    $('a > img').parent().css({'border-bottom' : 'none'});
  
    // mark non-body figures created by knitr chunks as 100% width
    $('.layout-chunk').each(function(i, val) {
      var figures = $(this).find('img, .html-widget');
      if ($(this).attr('data-layout') !== "l-body") {
        figures.css('width', '100%');
      } else {
        figures.css('max-width', '100%');
        figures.filter("[width]").each(function(i, val) {
          var fig = $(this);
          fig.css('width', fig.attr('width') + 'px');
        });
  
      }
    });
  
    // auto-append index.html to post-preview links in file: protocol
    // and in rstudio ide preview
    $('.post-preview').each(function(i, val) {
      if (window.location.protocol === "file:")
        $(this).attr('href', $(this).attr('href') + "index.html");
    });
  
    // get rid of index.html references in header
    if (window.location.protocol !== "file:") {
      $('.distill-site-header a[href]').each(function(i,val) {
        $(this).attr('href', $(this).attr('href').replace("index.html", "./"));
      });
    }
  
    // add class to pandoc style tables
    $('tr.header').parent('thead').parent('table').addClass('pandoc-table');
    $('.kable-table').children('table').addClass('pandoc-table');
  
    // add figcaption style to table captions
    $('caption').parent('table').addClass("figcaption");
  
    // initialize posts list
    if (window.init_posts_list)
      window.init_posts_list();
  
    // implmement disqus comment link
    $('.disqus-comment-count').click(function() {
      window.headroom_prevent_pin = true;
      $('#disqus_thread').toggleClass('hidden');
  if (!$('#disqus_thread').hasClass('hidden')) {
    var offset = $(this).offset();
    $(window).resize();
    $('html, body').animate({
      scrollTop: offset.top - 35
    });
  }
});
}

document.addEventListener('DOMContentLoaded', function() {
  if (is_downlevel_browser())
    init_downlevel();
  else
    window.addEventListener('WebComponentsReady', init_distill);
});
(function($) {
    "use strict";
    $(document).ready(function() {

/* Tabs */
$('.shortcode_tabs').each(function(index) {
    var i = 1;
    $('.shortcode_tab_item_title').each(function(
        index) {
        $(this).addClass('it' + i);
        $(this).attr('whatopen', 'body' + i);
        $(this).addClass('head' + i);
        $(this).parents('.shortcode_tabs').find(
            '.all_heads_cont').append(this);
        i++;
    });
    var i = 1;
    $('.shortcode_tab_item_body').each(function(
        index) {
        $(this).addClass('body' + i);
        $(this).addClass('it' + i);
        $(this).parents('.shortcode_tabs').find(
            '.all_body_cont').append(this);
        i++;
    });
});
$('.shortcode_tabs .all_body_cont div:first-child')
    .addClass('active');
$(
    '.shortcode_tabs .all_heads_cont div:first-child').addClass(
    'active');

$('.shortcode_tab_item_title').on('click', function() {
    $(this).parents('.shortcode_tabs').find(
        '.shortcode_tab_item_body').removeClass('active');
    $(this).parents('.shortcode_tabs').find(
        '.shortcode_tab_item_title').removeClass('active');
    var whatopen = $(this).attr('data-open');
    $(this).parents('.shortcode_tabs').find('.' +
        whatopen).addClass('active');
    $(this).addClass('active');
});
/* Tabs */

/* Tooltip  */
$(function($) {
    $('.tooltip_s').tooltip()
});
/* Tooltip  */

/* Testimonials */
$('.bxslider').bxSlider({
    mode: 'fade',
    touchEnabled: true,
    oneToOneTouch: true,
    pagerCustom: '.bx-pager',
    nextSelector: '.bx-next',
    prevSelector: '.bx-prev',
    auto: true
});

/* Testimonials */

/* Video Parallax */
    $('a').nivoLightbox();
/* Video Parallax */

/* Portfolio & Portfolio Filter */
$(window).on('load',function() {
    $('.grid').isotope({
        itemSelector: '.grid-item',
    });

    var $container = $('.js-isotope');
    $container.isotope({
        filter: '*',
        layoutMode: 'sloppyMasonry',
    });
    $('.filter-button-group div').on('click', function() {
        $('.filter-button-group .cbp-filter-item-active').removeClass('cbp-filter-item-active');
        $(this).addClass('cbp-filter-item-active');
        var selector = $(this).attr('data-filter');
        $container.isotope({
            filter: selector,
            animationOptions: {
                duration: 750,
                easing: 'linear',
                queue: false
            }
        });
        return false;
    });
});
/* Portfolio & Portfolio Filter */
            });
})(jQuery);
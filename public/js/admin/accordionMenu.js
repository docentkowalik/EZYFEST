var accordionMenu = function() {

    var body    = $('body');
    var header  = $('header');

    /* Initialization UI Code */
    var accordionHide = function () {
        // Toggle Side content
        $('#toggle-side-content').click(function(){ body.toggleClass('hide-side-content'); });
    };

    /* Primary navigation functionality */
    var primaryNav = function () {
        var upSpeed         = 250;
        var downSpeed       = 300;

        // Get all primary and sub navigation links
        var menuLinks       = $('.menu-link');
        var submenuLinks    = $('.submenu-link');

        // Initialize number indicators on menu links
        menuLinks.each(function(n, e){
            $(e).append('<span>' + $(e).next('ul').find('a').not('.submenu-link').length + '</span>');
        });

        // Initialize number indicators on submenu links
        submenuLinks.each(function(n, e){
            $(e).append('<span>' + $(e).next('ul').children().length + '</span>');
        });

        // Primary Accordion functionality
        menuLinks.click(function(){
            var link = $(this);

            if (link.parent().hasClass('active') !== true) {
                if (link.hasClass('open')) {
                    link.removeClass('open').next().slideUp(upSpeed);
                }
                else {
                    $('.menu-link.open').removeClass('open').next().slideUp(upSpeed);
                    link.addClass('open').next().slideDown(downSpeed);
                }
            }

            return false;
        });

        // Submenu Accordion functionality
        submenuLinks.click(function(){
            var link = $(this);

            if (link.parent().hasClass('active') !== true) {
                if (link.hasClass('open')) {
                    link.removeClass('open').next().slideUp(upSpeed);
                }
                else {
                    link.closest('ul').find('.submenu-link.open').removeClass('open').next().slideUp(upSpeed);
                    link.addClass('open').next().slideDown(downSpeed);
                }
            }

            return false;
        });
    };

   
    return {
        init: function () {
            accordionHide(); 
            primaryNav(); 
        }
    };
}();


 


/* Initialize Accordion Menu when page loads */
$(function(){ accordionMenu.init(); });



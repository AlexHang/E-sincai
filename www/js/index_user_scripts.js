/*jshint browser:true */
/*global $ */(function()
{
 "use strict";
 /*
   hook up event handlers 
 */
 function register_event_handlers()
 {
    
    
     /* button  Acasa */
    
    
        /* button  Acasa */
    
    
        /* button  Acasa */
    
    
        /* button  Acasa */
    
    
        /* button  Acasa */
    
    
        /* button  Orar */
    $(document).on("click", ".uib_w_13", function(evt)
    {
         /*global activate_page */
         activate_page("#Orar"); 
         return false;
    });
    
        /* button  Acasa */
    $(document).on("click", ".uib_w_11", function(evt)
    {
         /*global activate_page */
         activate_page("#mainpage"); 
         return false;
    });
    
        /* button  Button */
    $(document).on("click", ".uib_w_9", function(evt)
    {
        /* your code goes here */ 
         return false;
    });
    
        /* button  Button */
    $(document).on("click", ".uib_w_9", function(evt)
    {
         /*global activate_page */
         activate_page("#mainpage"); 
         return false;
    });
    
        /* button  Catalog */
    $(document).on("click", ".uib_w_7", function(evt)
    {
         /*global activate_page */
         activate_page("#Catalog"); 
         return false;
    });
    
        /* button  Button */
    $(document).on("click", ".uib_w_15", function(evt)
    {
         /*global activate_page */
         activate_page("#mainpage"); 
         return false;
    });
    
        /* button  Despre Noi */
    $(document).on("click", ".uib_w_12", function(evt)
    {
         /*global activate_page */
         activate_page("#despre_noi"); 
         return false;
    });
    
    }
 document.addEventListener("app.Ready", register_event_handlers, false);
})();

$(function(){
  $('#uploadForm').submit(function() {
   $("#status").empty().text("File is uploading...");
     $(this).ajaxSubmit({

        error: function(xhr) {
          console.log(xhr);
        },
        success: function(response) {
         $("#status").empty().text(response);
            console.log(response);
          }
        });
      return false;
    });
});

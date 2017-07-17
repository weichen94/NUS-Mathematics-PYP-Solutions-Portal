$(".deleteAnswer_all").on('click', function(e){
    e.preventDefault();
    var deleteId = $(this).data('delete');
    $.ajax({
        url: '/allanswers/delete/'+ deleteId,
        type: 'delete',
        success: function(result){
            console.log(result);
        },
        error: function(error){
          console.log(error);
        }
    });
    window.location = '/allanswers/';
});

$(".deleteAnswer_my").on('click', function(e){
    e.preventDefault();
    var deleteId = $(this).data('delete');
    $.ajax({
        url: '/myanswers/delete/'+ deleteId,
        type: 'delete',
        success: function(result){
            console.log(result);
        },
        error: function(error){
          console.log(error);
        }
    });
    window.location = '/myanswers/';
});

$(".deleteModule").on('click', function(e){
    e.preventDefault();
    var deleteId = $(this).data('delete'); // here use this instead of  using id #deleteModule
    $.ajax({
        url: '/modules/delete/'+ deleteId,
        type: 'delete',
        success: function(result){
            console.log(result);
        },
        error: function(error){
          console.log(error);
        }
    });
    window.location = '/modules/';
});

function openModules(evt, Module) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(Module).style.display = "block";
    evt.currentTarget.className += " active";
}

function answer_toggle() {
    var x = document.getElementById('answer-details');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}

$.ajaxSetup({ async: false });

function returnName() {
  return "customer";
}

function checkTheLogin(un, pw) {
  var result = "";
  $.post("/checkTheLogin", { username: un, password: pw }).done(function (
    data
  ) {
    // say what the account type is
    //alert( "Data Loaded: " + data );

    result = data;
  });

  return result;
}

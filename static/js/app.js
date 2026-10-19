document.addEventListener("DOMContentLoaded", function () {
  var mensajes = document.querySelectorAll(".mensajes-django li");
  if (!mensajes.length) {
    return;
  }
  window.setTimeout(function () {
    mensajes.forEach(function (item) {
      item.style.opacity = "0";
    });
  }, 4000);
});

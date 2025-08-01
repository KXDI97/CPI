window.addEventListener("DOMContentLoaded", () => {
  showLoader();
});

window.addEventListener("load", () => {
  setTimeout(() => {
    hideLoader();
    window.location.href = "../Main/Dashboard.html";
  }, 2000);
});

const loader = document.getElementById("loaderPagina");
const showLoader = () => {
  loader.classList.add("show_loader");
};
const hideLoader = () => {
  loader.classList.remove("show_loader");
};

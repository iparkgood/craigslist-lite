import { isLoggedIn, renderLogInOutBtn, updateUserObj } from "./auth.js";
import { getPosts, renderPosts } from "./post.js";
import { renderMessages } from "./message.js";

export const BASE_URL = "https://strangers-things.herokuapp.com";
export const FIRST_PATH = "/api";
export const COHORT_NAME = "/2101-VPI-RM-WEB-PT";

window.authState = {
  currentUserObj: updateUserObj(),
  currentUser: isLoggedIn() ? localStorage.getItem("username") : null,
  currentState: isLoggedIn() ? "login" : "logout",
  currentError: null,
};

export let searchState = {
  allPosts: [],
  searchTerm: "",
};

initApp();

export function initApp() {
  renderLogInOutBtn();

  getPosts().then(function (result) {
    searchState.allPosts = result.data.posts;
    renderPosts(searchState.allPosts);
  });

  renderMessages();
}

$("#init").click(function () {
  $("#search-form").trigger("reset");
  initApp();
});

$(".close").click(function () {
  $(".modal-form").trigger("reset");
  $("#error-message").removeClass("active");
  $("#error-message").text("");
  $(".modal").removeClass("open");
});

$("#message-tab").click(function () {
  $("#post-tab").removeClass("selected");
  $("#post-tab").addClass("not-selected");
  $("#message-tab").addClass("selected");
  $("#message-tab").removeClass("not-selected");
  $("#all-messages").removeClass("hidden");
  $("#post-form").addClass("hidden");
});

$("#post-tab").click(function () {
  $("#message-tab").removeClass("selected");
  $("#message-tab").addClass("not-selected");
  $("#post-tab").addClass("selected");
  $("#post-tab").removeClass("not-selected");
  $("#post-form").removeClass("hidden");
  $("#all-messages").addClass("hidden");
});

$("#search-form").on("submit", function (event) {
  event.preventDefault();

  searchState.searchTerm = $("#search").val();

  const searchTerms = searchState.searchTerm.toLowerCase().split(" ");

  if (!searchTerms) {
    renderPosts(searchState.allPosts);
    return;
  }

  let filteredPosts = [];

  searchTerms.forEach(function (term) {
    searchState.allPosts.forEach(function (post) {
      if (
        post.title.toLowerCase().includes(term) ||
        post.description.toLowerCase().includes(term) ||
        post.author.username.toLowerCase().includes(term) ||
        post.price.toLowerCase().includes(term) ||
        post.location.toLowerCase().includes(term)
      ) {
        filteredPosts.push(post);
      }
    });
  });

  if (filteredPosts.length === 0) {
    alert("No result");
    initApp();
    return;
  }
  renderPosts(filteredPosts);
});

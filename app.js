import {
  isLoggedIn,
  renderLogInOutBtn,
  updateUserObj,
  fetchMe,
} from "./auth.js";

export const BASE_URL = "https://strangers-things.herokuapp.com";
export const FIRST_PATH = "/api";
export const COHORT_NAME = "/2101-VPI-RM-WEB-PT";

window.authState = {
  currentUserObj: updateUserObj(),
  currentUser: isLoggedIn() ? localStorage.getItem("username") : null,
  currentState: isLoggedIn() ? "login" : "logout",
  currentError: null,
};

let searchState = {
  allPosts: [],
  searchTerm: "",
};

let postId = null;

initApp();

export function initApp() {
  renderLogInOutBtn();

  getPosts().then(function (result) {
    searchState.allPosts = result.data.posts;
    renderPosts(searchState.allPosts);
  });

  renderMessages();
}

$("#init").click(function() {
  initApp();
})

$(".close").click(function () {
  $(".modal-form").trigger("reset");
  $("#error-message").removeClass("active");
  $("#error-message").text("");
  $(".modal").removeClass("open");
});

async function getPosts() {
  const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/posts`;

  try {
    const response = await fetch(
      url,
      localStorage.getItem("token")
        ? {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        : {}
    );

    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

function buildPost(post) {
  const postEl = $("<div class='post'>");

  postEl
    .html(
      `
    <h3>${post.title}</h3>
    <p>Author: ${post.author.username}</p>
    <p id="post-desc">${post.description}</p>
    <p>Price: ${post.price}</p>
    <p>${post.location}</p>
    ${post.willDeliver ? `<p>I will deliver!</p>` : ""}
    <span class='created'>${post.createdAt}</span>
    `
    )
    .data("post", post);

  const postBtn = $(`<p id="post-buttons">`);

  if (isLoggedIn() && !post.isAuthor) {
    const MessageBtn = $(`<button id="send-message">Message</button>`);

    postBtn.append(MessageBtn);

    postBtn.find("#send-message").click(function () {
      $("#message-modal").addClass("open");

      const postEl = $(this).closest(".post");
      const postData = postEl.data("post");
      postId = postData["_id"];

      $("#to-who").text(`To: ${postData.author.username}`);

      $("#submit-message")
        .off()
        .click(async function (event) {
          event.preventDefault();

          const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/posts/${postId}/messages`;
          const token = localStorage.getItem("token");
          const msgContent = $("#message-content").val();

          try {
            const response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                message: {
                  content: `${msgContent}`,
                },
              }),
            });
            const result = await response.json();

            updateUserObj();

            $("#message-form").trigger("reset");

            $("#message-modal").removeClass("open");

            postId = null;

            return result;
          } catch (error) {
            console.error(error);
          }
        });
    });
  }

  if (post.isAuthor) {
    const EditDeleteBtn = $(`      
      <button id="edit">Edit</button>
      <button id="delete">Delete</button>
      <button id="view-message">Message</button>
    `);
    postBtn.append(EditDeleteBtn);

    postBtn.find("#delete").click(async function () {
      const postEl = $(this).closest(".post");
      const postData = postEl.data("post");
      postId = postData["_id"];
      const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/posts/${postId}`;
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        updateUserObj();
        postEl.slideUp();
        postId = null;

        return result;
      } catch (error) {
        console.error(error);
      }
    });
  }

  postBtn.find("#view-message").click(function () {
    $("#view-message-modal").addClass("open");
    $("#message-list").empty();

    const postEl = $(this).closest(".post");
    const postData = postEl.data("post");

    if (postData.messages.length === 0) {
      $("#message-list").text("No Message");
      return;
    }

    postData.messages.forEach(function (msg) {
      $("#message-list").append(buildMsg(msg));
    });
  });

  postBtn.find("#edit").click(async function () {
    const postEl = $(this).closest(".post");
    const postData = postEl.data("post");
    postId = postData["_id"];
    $("#post-form").data({ postData, postEl });

    $("#title").val(postData.title);
    $("#description").val(postData.description);
    $("#price").val(postData.price);
    $("#location").val(postData.location);

    postData.willDeliver
      ? $("#willDeliver option[value=true]").prop("selected", true)
      : $("#willDeliver option[value=false]").prop("selected", true);

    // const updatedPostObj = {
    //   title: $("title").val(),
    //   description: $("#description").val(),
    //   price: $("#price").val(),
    //   location: $("#location").val(),
    //   willDeliver: $("#willDeliver").val(),
    // };
    // const result = await patchPost(updatedPostObj);
    // const resultEl = buildPost(result.data);
    // console.log(resultEl)
    // postEl.replaceWith(resultEl);

    // $("#post-form").data({});
    // $("#post-form").trigger("reset");
  });

  postEl.append(postBtn);

  return postEl;
}

async function patchPost(postObj) {
  const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/posts/${postId}`;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({post:postObj}),
    });

    updateUserObj();
    postId = null;

    return response.json();
  } catch (error) {
    console.error(error);
  }
}

function renderPosts(posts) {
  $("#post-list").empty();

  posts.forEach(function (post) {
    $("#post-list").prepend(buildPost(post));
  });
}

async function createPost(postObj) {
  const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/posts`;
  let token = null;

  if (isLoggedIn()) {
    token = localStorage.getItem("token");
  } else {
    alert("Log in is required!");
    return "";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({post: postObj}),
    });

    updateUserObj();

    // $("#post-list").prepend(buildPost(result.data.post));

    return response.json();
  } catch (error) {
    console.error(error);
  }
}

$("#submit-button").on("click", async function (event) {
  event.preventDefault();

  const { postData, postEl } = $("#post-form").data(); //patch

  const postObj = {
    title: $("#title").val(),
    description: $("#description").val(),
    price: $("#price").val(),
    location: $("#location").val() ? $("#location").val() : "[On Request]",
    willDeliver: $("#willDeliver").val()
  }

  try { 
    if (postData) { //patch
      const result = await patchPost(postObj);

      const resultEl = buildPost(result.data.post);
      postEl.replaceWith(resultEl);

      $("#post-form").data({postData: null, postEl: null});
      $("#post-form").trigger("reset");
    } else { //post
      $("#post-form").trigger("reset");

      const result = await createPost(postObj);
      $("#post-list").prepend(buildPost(result.data.post));
    }
  } catch (error) {
    console.error(error);
  }
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

function renderMessages() {
  if (!isLoggedIn()) {
    $("#all-messages").text("Log in is required!");
    return;
  }
  $("#all-messages").empty();

  fetchMe(localStorage.getItem("token")).then(function (obj) {
    obj.messages.forEach(function (msg) {
      if (msg.fromUser.username !== localStorage.getItem("username")) {
        $("#all-messages").append(buildMsg(msg));
      }
    });
  });
}

function buildMsg(msg) {
  const msgEl = $("<div class='message'>");

  msgEl
    .html(
      `
    <h4 class="message-header">From: ${msg.fromUser.username}</h5>
    <p class="message-content">${msg.content}</p>
  `
    )
    .data("message", msg);

  return msgEl;
}

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

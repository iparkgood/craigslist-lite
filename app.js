import {
  registerUser,
  loginUser,
  isLoggedIn,
  renderLogInOutBtn,
  updateUserObj,
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

renderLogInOutBtn();
renderPosts();

$(".close").click(function () {
  $(".modal-form").trigger("reset");
  $(".modal").removeClass("open");
});

$("#modal-button").on("click", async function (event) {
  event.preventDefault();

  const username = $("#username").val();
  const password = $("#password").val();

  if ($("#modal-button").text() === "Sign up") {
    registerUser({ username, password });
  } else {
    loginUser({ username, password });
  }

  $("#log-form").trigger("reset");

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

    MessageBtn.click(function () {
      $("#message-modal").addClass("open");
      $("#to-who").text(`To: ${post.author.username}`);

      submitMsg(post["_id"]);
    });
  }

  if (post.isAuthor) {
    const EditDeleteBtn = $(`      
      <button id="edit">Edit</button>
      <button id="delete">Delete</button>
    `);
    postBtn.append(EditDeleteBtn);

    postBtn.find("#delete").click(async function () {
      const postEl = $(this).closest(".post");
      const post = postEl.data("post");
      const postId = post["_id"];
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

        return result;
      } catch (error) {
        console.error(error);
      }
    });
  }
  postEl.append(postBtn);

  return postEl;
}

export function renderPosts() {
  let posts = [];

  getPosts().then(function (result) {
    posts = result.data.posts;

    $("#post-list").empty();

    posts.forEach(function (post) {
      $("#post-list").prepend(buildPost(post));
    });
  });
}

async function createPost({
  title,
  description,
  price,
  location,
  willDeliver,
}) {
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
      body: JSON.stringify({
        post: {
          title,
          description,
          price,
          location,
          willDeliver,
        },
      }),
    });
    const result = await response.json();

    updateUserObj();

    $("#post-list").prepend(buildPost(result.data.post));

    return result;
  } catch (error) {
    console.error(error);
  }
}

$("#submit-button").on("click", function (event) {
  event.preventDefault();

  const title = $("#title").val();
  const description = $("#description").val();
  const price = $("#price").val();
  const location = $("#location").val() ? $("#location").val() : "[On Request]";
  const willDeliver = $("#willDeliver").val();

  $("#post-form").trigger("reset");

  createPost({ title, description, price, location, willDeliver });
});

$("#message-tab").click(function () {
  $("#post-tab").removeClass("selected");
  $("#post-tab").addClass("not-selected");
  $("#message-tab").addClass("selected");
  $("#message-tab").removeClass("not-selected");
  $("#message").removeClass("hidden");
  $("#post-form").addClass("hidden");
});

$("#post-tab").click(function () {
  $("#message-tab").removeClass("selected");
  $("#message-tab").addClass("not-selected");
  $("#post-tab").addClass("selected");
  $("#post-tab").removeClass("not-selected");
  $("#post-form").removeClass("hidden");
  $("#message").addClass("hidden");
});

function submitMsg(postId) {
  $("#submit-message").on("click", async function (event) {
    event.preventDefault();
  

    const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/posts/${postId}/messages`;
    const token = localStorage.getItem("token");
    const msgContent = $("#message-content").val();
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type" : "application/json",
          "Authorization" : `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: {
            content: `${msgContent}`
          }
        })
      });
      const result = await response.json();

      updateUserObj();

      $("#message-form").trigger("reset");
  
      $("#message-modal").removeClass("open");
  
      return result;
    } catch (error) {
      console.error(error);
    }
  });
  
}
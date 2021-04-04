import { BASE_URL, FIRST_PATH, COHORT_NAME, initApp } from "./app.js";
import { updateUserObj, isLoggedIn } from "./auth.js";
import { buildMsg } from "./message.js";

let postId = null;

export async function getPosts() {
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

  //append a message button to send a message in posts that a user is not an author of the post
  if (isLoggedIn() && !post.isAuthor) {
    const MessageBtn = $(`<button id="send-message">Message</button>`);

    postBtn.append(MessageBtn);

    //open modal window to display message input form.
    postBtn.find("#send-message").click(function () {
      $("#message-modal").addClass("open");

      const postEl = $(this).closest(".post");
      const postData = postEl.data("post");
      postId = postData["_id"];

      $("#to-who").text(`To: ${postData.author.username}`);

      //send a message
      //I have to add off() because a message was sent multiple times with one click.
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

  //append edit/delete/message(to view received messages) in posts that a user is an author of the post
  if (post.isAuthor) {
    const EditDeleteBtn = $(`      
        <button id="edit">Edit</button>
        <button id="delete">Delete</button>
        <button id="view-message">Message</button>
      `);

    postBtn.append(EditDeleteBtn);

    //click the delete button to delete a post.
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

  //click the message button to view received messages
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

  //click the edit button to re-fill the create-post form inputs.
  postBtn.find("#edit").click(function () {
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
  });

  postEl.append(postBtn);

  return postEl;
}

export function renderPosts(posts) {
  $("#post-list").empty();

  posts.forEach(function (post) {
    $("#post-list").prepend(buildPost(post));
  });
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
      body: JSON.stringify({ post: postObj }),
    });

    updateUserObj();
    postId = null;

    return response.json();
  } catch (error) {
    console.error(error);
  }
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
      body: JSON.stringify({ post: postObj }),
    });

    updateUserObj();

    return response.json();
  } catch (error) {
    console.error(error);
  }
}

//click the submit button in the create-post form
$("#submit-button").on("click", async function (event) {
  event.preventDefault();

  const { postData, postEl } = $("#post-form").data();

  const postObj = {
    title: $("#title").val(),
    description: $("#description").val(),
    price: $("#price").val(),
    location: $("#location").val() ? $("#location").val() : "[On Request]",
    willDeliver: $("#willDeliver").val(),
  };

  try {
    if (postData) {
      //update a post
      const result = await patchPost(postObj);

      const resultEl = buildPost(result.data.post);

      postEl.replaceWith(resultEl);

      $("#post-form").data({ postData: null, postEl: null });
      $("#post-form").trigger("reset");
      /*
        After editing a post, all recieved messages are not displayed, because the message array in the return object of the patchPost()
        only offers each message's id for some reason. But, after refreshing the page, a user is able to see all received messages again. 
      */
     initApp(); //for the reason I mention above I added initApp() here.
    } else {
      //create a post
      $("#post-form").trigger("reset");

      const result = await createPost(postObj);

      $("#post-list").prepend(buildPost(result.data.post));
    }
  } catch (error) {
    console.error(error);
  }
});

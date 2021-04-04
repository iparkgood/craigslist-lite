import { fetchMe, isLoggedIn } from "./auth.js";

export function renderMessages() {
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

export function buildMsg(msg) {
  const msgEl = $("<div class='message'>");

  msgEl
    .html(
      `
      <h4 class="message-header">From: ${msg.fromUser.username}</h5>
      <p class="message-content">${msg.content}</p>
    `
    );

  return msgEl;
}

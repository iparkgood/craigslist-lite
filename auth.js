import { BASE_URL, FIRST_PATH, COHORT_NAME, renderPosts } from "./app.js";

export async function registerUser({ username, password }) {
  const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/users/register`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          username,
          password,
        },
      }),
    });
    const result = await response.json();

    if (result.error) {
      window.authState.currentError = result.error.message;
      return;
    }

    localStorage.setItem("token", result.data.token);
    localStorage.setItem("username", username);

    window.authState.currentUser = username;
    window.authState.currentState = "login";
    window.authState.currentUserObj = updateUserObj();

    renderLogInOutBtn();
    renderPosts();

    return result;
  } catch (error) {
    console.error(error);
  }
}

export async function loginUser({ username, password }) {
  const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/users/login`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          username,
          password,
        },
      }),
    });
    const result = await response.json();

    if (result.error) {
      window.authState.currentError = result.error.message;
      return;
    }

    localStorage.setItem("token", result.data.token);
    localStorage.setItem("username", username);

    window.authState.currentUser = username;
    window.authState.currentState = "login";
    updateUserObj();

    renderLogInOutBtn();
    renderPosts();

    return result;
  } catch (error) {
    console.error(error);
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem("token");

  if (token === null) {
    return false;
  }

  return token;
}

export function renderLogInOutBtn() {
  $("#header-button").empty();

  if (window.authState.currentState === "login") {
    const btnEl = `<button id="log-out">LOG OUT</button>`;
    $("#header-button").append(btnEl);

    $("#header-button")
      .find("#log-out")
      .click(function () {
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        window.authState.currentState = "logout";
        window.authState.currentUser = null;
        window.authState.currentUserObj = updateUserObj();
        window.authState.currentError = null;

        renderLogInOutBtn();
        renderPosts();
      });
  } else if (window.authState.currentState === "logout") {
    const btnEl = `<button id="log-in">LOG IN</button><button id="sign-up">SIGN UP</button>`;
    $("#header-button").append(btnEl);

    $("#log-in").click(function () {
      $("#log-modal-title").text("Log in");
      $("#log-modal").addClass("open");
      $("#modal-button").text("Log in");
    });
    
    $("#sign-up").click(function () {
      $("#log-modal-title").text("Sign up");
      $("#log-modal").addClass("open");
      $("#modal-button").text("Sign up");
    });
  }
}

async function fetchMe(token) {
  try {
    const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/users/me`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();

    return result.data;
  } catch (error) {
    console.log(error);
  }
}

export function updateUserObj() {
  if (isLoggedIn()) {
    fetchMe(localStorage.getItem("token")).then(function (obj) {
      window.authState.currentUserObj = obj;
    });
  }

  return null;
}
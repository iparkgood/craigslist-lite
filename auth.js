import { BASE_URL, FIRST_PATH, COHORT_NAME, initApp } from "./app.js";

async function registerUser({ username, password }) {
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
      throw Error(result.error.message);
    }

    localStorage.setItem("token", result.data.token);
    localStorage.setItem("username", username);

    window.authState.currentUser = username;
    window.authState.currentState = "login";
    window.authState.currentError = null;
    updateUserObj();

    initApp();

    return result;
  } catch (error) {
    $("#error-message").addClass("active");
    $("#error-message").text(error);
    return false;
  }
}

async function loginUser({ username, password }) {
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
      throw Error(result.error.message);
    }

    localStorage.setItem("token", result.data.token);
    localStorage.setItem("username", username);

    window.authState.currentUser = username;
    window.authState.currentState = "login";
    window.authState.currentError = null;
    updateUserObj();

    initApp();

    return result;
  } catch (error) {
    $("#error-message").addClass("active");
    $("#error-message").text(error);
    return false;
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

  if (isLoggedIn()) {
    //when log in, create a log-out button
    const btnEl = `<button id="log-out">LOG OUT</button>`;
    $("#header-button").append(btnEl);

    $("#header-button")
      .find("#log-out")
      .click(function () {
        //when the log-out button is clicked
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        window.authState.currentState = "logout";
        window.authState.currentUser = null;
        window.authState.currentUserObj = updateUserObj();
        window.authState.currentError = null;

        initApp();
      });
  } else if (!isLoggedIn()) {
    //when log out, create log-in and sign-up buttons
    const btnEl = `<button id="log-in">LOG IN</button><button id="sign-up">SIGN UP</button>`;
    $("#header-button").append(btnEl);

    $("#log-in").click(function () {
      //when the log-in button is clicked
      $("#log-modal-title").text("Log in");
      $("#log-modal").addClass("open");
      $("#modal-button").text("Log in");

      $("#modal-button")
        .off()
        .on("click", async function (event) {
          //log in
          event.preventDefault();

          const username = $("#username").val();
          const password = $("#password").val();

          const result = await loginUser({ username, password });

          $("#log-form").trigger("reset");

          if (result) {
            $(".modal").removeClass("open");
          }
        });
    });

    $("#sign-up").click(function () {
      //when the sign-up button is clicked
      $("#log-modal-title").text("Sign up");
      $("#log-modal").addClass("open");
      $("#modal-button").text("Sign up");

      $("#modal-button")
        .off()
        .on("click", async function (event) {
          //sign up
          event.preventDefault();

          const username = $("#username").val();
          const password = $("#password").val();

          const result = await registerUser({ username, password });

          $("#log-form").trigger("reset");

          if (result) {
            $(".modal").removeClass("open");
          }
        });
    });
  }
}

export async function fetchMe(token) {
  try {
    const url = `${BASE_URL}${FIRST_PATH}${COHORT_NAME}/users/me`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    return result.data;
  } catch (error) {
    console.error(error);
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
